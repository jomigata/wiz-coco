"""내담자 포털 — 상담코드 이동 후 완료된 레거시 검사 분류·중지 검사 정리."""
from __future__ import annotations

from datetime import datetime, timezone

from firebase_admin import firestore
from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, TEST_RESULTS_COLLECTION


def _iso_timestamp(value) -> str | None:
    if not value:
        return None
    if isinstance(value, str):
        return value
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass
    if hasattr(value, "timestamp"):
        try:
            return datetime.fromtimestamp(value.timestamp(), tz=timezone.utc).isoformat()
        except Exception:
            pass
    return None


def _is_completed(data: dict) -> bool:
    return (data.get("status") or "").strip() == "completed"


def _load_assessment_meta(db, assessment_id: str) -> dict:
    aid = (assessment_id or "").strip()
    if not aid:
        return {"assessmentId": "", "title": "이전 상담", "accessCode": "", "testList": []}
    doc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
    if not doc.exists:
        return {"assessmentId": aid, "title": "이전 상담", "accessCode": "", "testList": []}
    data = doc.to_dict() or {}
    return {
        "assessmentId": aid,
        "title": (data.get("title") or "").strip() or "이전 상담",
        "accessCode": (data.get("accessCode") or "").strip(),
        "testList": data.get("testList") or [],
    }


def _test_name_from_meta(meta: dict, test_id: str) -> str:
    for item in meta.get("testList") or []:
        if str(item.get("testId") or "") == test_id:
            return (item.get("name") or "").strip() or test_id
    return test_id


def _result_item(doc, data: dict, *, test_name: str = "") -> dict:
    tid = str(data.get("testId") or "").strip()
    return {
        "resultId": doc.id,
        "testId": tid,
        "testName": test_name or tid,
        "status": data.get("status"),
        "completedAt": _iso_timestamp(data.get("completedAt")),
        "submittedAt": _iso_timestamp(data.get("submittedAt") or data.get("completedAt")),
        "updatedAt": _iso_timestamp(data.get("updatedAt")),
        "accessCode": (data.get("accessCode") or "").strip(),
        "assessmentId": (data.get("assessmentId") or "").strip(),
        "originAssessmentId": (data.get("originAssessmentId") or data.get("assessmentId") or "").strip(),
        "originAssessmentTitle": (data.get("originAssessmentTitle") or "").strip(),
        "originAccessCode": (data.get("originAccessCode") or data.get("accessCode") or "").strip(),
        "isShared": bool(data.get("isShared")),
    }


def _should_purge_stopped_result(data: dict) -> bool:
    """완료되지 않은 중지·진행 중 검사 — 표시·관리 대상에서 제외."""
    if _is_completed(data):
        return False
    legacy_tab = (data.get("portalLegacyTab") or "").strip()
    if legacy_tab == "materials":
        return True
    status = (data.get("status") or "").strip()
    return status == "in_progress" or legacy_tab == "materials"


def purge_stopped_portal_test_results(db, portal_id: str) -> int:
    """포털에 남아 있는 미완료(중지) 검사 결과 삭제."""
    portal_id = (portal_id or "").strip()
    if not portal_id:
        return 0
    deleted = 0
    for doc in db.collection(TEST_RESULTS_COLLECTION).where("portalId", "==", portal_id).stream():
        data = doc.to_dict() or {}
        if _should_purge_stopped_result(data):
            try:
                doc.reference.delete()
                deleted += 1
            except Exception:
                pass
    return deleted


def load_portal_legacy_archive(
    db,
    portal_id: str,
    assessments: list[dict],
    *,
    repair: bool = True,
) -> dict:
    """포털 /me — 완료된 레거시 검사만 반환 (중지 검사는 정리)."""
    portal_id = (portal_id or "").strip()
    if not portal_id:
        return {"legacyTests": []}

    if repair:
        purge_stopped_portal_test_results(db, portal_id)

    assigned_ids = {str(a.get("assessmentId") or "").strip() for a in assessments}
    assigned_ids.discard("")

    test_ids_by_assessment: dict[str, set[str]] = {}
    meta_cache: dict[str, dict] = {}
    for a in assessments:
        aid = str(a.get("assessmentId") or "").strip()
        if not aid:
            continue
        meta_cache[aid] = a
        test_ids_by_assessment[aid] = {
            str(t.get("testId") or "").strip()
            for t in (a.get("testList") or [])
            if str(t.get("testId") or "").strip()
        }

    legacy_groups: dict[str, dict] = {}

    docs = list(
        db.collection(TEST_RESULTS_COLLECTION).where("portalId", "==", portal_id).stream()
    )

    for doc in docs:
        data = doc.to_dict() or {}
        if not _is_completed(data):
            continue

        aid = str(data.get("assessmentId") or "").strip()
        test_id = str(data.get("testId") or "").strip()
        if not test_id:
            continue

        in_list = aid in test_ids_by_assessment and test_id in test_ids_by_assessment.get(aid, set())
        legacy_tab = (data.get("portalLegacyTab") or "").strip()

        is_legacy = legacy_tab == "tests" or (not in_list and aid in assigned_ids) or aid not in assigned_ids
        if not is_legacy:
            continue

        origin_id = (data.get("originAssessmentId") or aid or "").strip()
        if origin_id not in meta_cache:
            meta_cache[origin_id] = _load_assessment_meta(db, origin_id)
        origin_meta = meta_cache[origin_id]
        test_name = _test_name_from_meta(origin_meta, test_id)

        if repair:
            patch: dict = {
                "portalLegacyTab": "tests",
                "updatedAt": SERVER_TIMESTAMP,
            }
            if not (data.get("originAssessmentId") or "").strip() and origin_id:
                patch["originAssessmentId"] = origin_id
            if not (data.get("originAssessmentTitle") or "").strip():
                patch["originAssessmentTitle"] = origin_meta.get("title") or "이전 상담"
            if not (data.get("originAccessCode") or "").strip():
                patch["originAccessCode"] = (
                    (data.get("accessCode") or "").strip() or origin_meta.get("accessCode") or ""
                )
            if aid in assigned_ids and not in_list:
                origin_code = (patch.get("originAccessCode") or origin_meta.get("accessCode") or "").strip()
                if origin_code and origin_code != (data.get("accessCode") or "").strip():
                    patch["accessCode"] = origin_code
            try:
                doc.reference.update(patch)
            except Exception:
                pass

        item = _result_item(doc, data, test_name=test_name)
        group_key = origin_id or "unknown"
        if group_key not in legacy_groups:
            legacy_groups[group_key] = {
                "originAssessmentId": origin_id,
                "originAssessmentTitle": (
                    (data.get("originAssessmentTitle") or "").strip()
                    or origin_meta.get("title")
                    or "이전 상담"
                ),
                "originAccessCode": (
                    (data.get("originAccessCode") or data.get("accessCode") or "").strip()
                    or origin_meta.get("accessCode")
                    or ""
                ),
                "results": [],
                "testIds": set(),
            }
        legacy_groups[group_key]["results"].append(item)
        legacy_groups[group_key]["testIds"].add(test_id)

    legacy_tests: list[dict] = []
    for group in legacy_groups.values():
        origin_meta = meta_cache.get(group["originAssessmentId"]) or {}
        test_list = [
            {"testId": tid, "name": _test_name_from_meta(origin_meta, tid)}
            for tid in sorted(group["testIds"])
        ]
        legacy_tests.append(
            {
                "originAssessmentId": group["originAssessmentId"],
                "originAssessmentTitle": group["originAssessmentTitle"],
                "originAccessCode": group["originAccessCode"],
                "testList": test_list,
                "results": group["results"],
            }
        )

    legacy_tests.sort(key=lambda g: g.get("originAssessmentTitle") or "")
    return {"legacyTests": legacy_tests}


def clear_legacy_fields_update() -> dict:
    """target testList 매칭 결과 — 레거시 필드 제거."""
    return {
        "portalLegacyTab": firestore.DELETE_FIELD,
        "originAssessmentId": firestore.DELETE_FIELD,
        "originAssessmentTitle": firestore.DELETE_FIELD,
        "originAccessCode": firestore.DELETE_FIELD,
    }
