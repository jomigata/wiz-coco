"""나의코드(배정된 primary 상담코드)에 검사만 추가 — 신규 상담코드 문서 생성 없음."""
from __future__ import annotations

from datetime import datetime, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION
from utils.assessment_dispatch import _iso_timestamp
from utils.portal_assessment_push import _normalize_test_list, _notify_portal_push, _verify_push_assessment


PRIMARY_ADDITIONAL_FIELD = "primaryAdditionalTests"


def normalize_primary_additional_entries(raw: list | None) -> list[dict]:
    out: list[dict] = []
    for row in raw or []:
        if not isinstance(row, dict):
            continue
        primary = str(row.get("primaryAssessmentId") or "").strip()
        test_id = str(row.get("testId") or "").strip()
        name = str(row.get("name") or "").strip() or test_id
        if not primary or not test_id:
            continue
        added = _iso_timestamp(row.get("addedAt")) or ""
        out.append(
            {
                "primaryAssessmentId": primary,
                "testId": test_id,
                "name": name,
                "addedAt": added,
            }
        )
    return out


def merged_test_list_for_portal_assessment(
    base_test_list: list | None,
    portal_pdata: dict | None,
    primary_assessment_id: str,
) -> list[dict]:
    """상담(코드) 기본 testList + 해당 포털·primary에 추가된 검사."""
    aid = (primary_assessment_id or "").strip()
    base = _normalize_test_list(base_test_list)
    if not aid:
        return base
    base_ids = {str(t.get("testId") or "").strip() for t in base if str(t.get("testId") or "").strip()}
    merged = list(base)
    for entry in normalize_primary_additional_entries((portal_pdata or {}).get(PRIMARY_ADDITIONAL_FIELD)):
        if entry["primaryAssessmentId"] != aid:
            continue
        tid = entry["testId"]
        if tid in base_ids:
            continue
        base_ids.add(tid)
        merged.append({"testId": tid, "name": entry["name"]})
    return merged


def primary_additional_tests_for_api(portal_pdata: dict | None) -> list[dict]:
    return normalize_primary_additional_entries((portal_pdata or {}).get(PRIMARY_ADDITIONAL_FIELD))


def _baseline_test_ids(assessment_test_list: list | None) -> set[str]:
    return {
        str(t.get("testId") or "").strip()
        for t in (assessment_test_list or [])
        if t and str(t.get("testId") or "").strip()
    }


def _existing_additional_ids(entries: list[dict], primary_assessment_id: str) -> set[str]:
    aid = (primary_assessment_id or "").strip()
    return {
        e["testId"]
        for e in entries
        if e.get("primaryAssessmentId") == aid and e.get("testId")
    }


def add_primary_additional_tests_to_portals(
    db,
    *,
    counselor_uid: str,
    portal_ids: list[str],
    primary_assessment_id: str,
    test_list: list | None,
    notify: bool = True,
    notify_channels: list[str] | None = None,
    scheduled_at_iso: str | None = None,
) -> dict:
    primary = (primary_assessment_id or "").strip()
    normalized_tests = _normalize_test_list(test_list)
    if not primary:
        raise ValueError("primaryAssessmentId(assessmentId)가 필요합니다.")
    if not normalized_tests:
        raise ValueError("추가할 검사(testList)가 필요합니다.")

    assessment = _verify_push_assessment(db, primary, counselor_uid)
    baseline_ids = _baseline_test_ids(assessment.get("testList"))

    normalized_portal_ids = [str(pid).strip() for pid in (portal_ids or []) if str(pid).strip()]
    if not normalized_portal_ids:
        raise ValueError("portalIds가 필요합니다.")

    assigned_count = 0
    skipped = 0
    failed = 0
    details: list[dict] = []
    notify_sent = 0
    notify_failed = 0
    notify_skipped = 0

    for pid in normalized_portal_ids:
        pref = db.collection(CLIENT_PORTALS_COLLECTION).document(pid)
        pdoc = pref.get()
        if not pdoc.exists:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "not_found"})
            continue
        pdata = pdoc.to_dict() or {}
        if pdata.get("counselorId") != counselor_uid:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "forbidden"})
            continue
        if (pdata.get("status") or "active") != "active":
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "archived"})
            continue

        assigned = [str(x).strip() for x in (pdata.get("assignedAssessmentIds") or [])]
        if primary not in assigned:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "primary_not_assigned"})
            continue

        existing = normalize_primary_additional_entries(pdata.get(PRIMARY_ADDITIONAL_FIELD))
        extra_ids = _existing_additional_ids(existing, primary)
        to_add: list[dict] = []
        added_at_iso = datetime.now(timezone.utc).isoformat()
        for t in normalized_tests:
            tid = str(t.get("testId") or "").strip()
            if not tid:
                continue
            if tid in baseline_ids or tid in extra_ids:
                continue
            to_add.append(
                {
                    "primaryAssessmentId": primary,
                    "testId": tid,
                    "name": str(t.get("name") or "").strip() or tid,
                    "addedAt": added_at_iso,
                }
            )
            extra_ids.add(tid)

        if not to_add:
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "already_present"})
            continue

        pref.update(
            {
                PRIMARY_ADDITIONAL_FIELD: existing + to_add,
                "lastPrimaryTestAddAt": SERVER_TIMESTAMP,
                "updatedAt": SERVER_TIMESTAMP,
            }
        )
        assigned_count += 1
        detail: dict = {
            "portalId": pid,
            "status": "added",
            "addedTestIds": [t["testId"] for t in to_add],
            "displayName": pdata.get("displayName") or "",
        }

        if notify:
            notify_assessment = {
                **assessment,
                "testList": to_add,
            }
            notify_result = _notify_portal_push(
                db,
                portal_id=pid,
                pdata=pdata,
                assessment=notify_assessment,
                notify_channels=notify_channels,
                scheduled_at_iso=scheduled_at_iso,
            )
            detail["notify"] = notify_result
            nstatus = notify_result.get("status")
            if nstatus in ("sent", "pending"):
                notify_sent += 1
            elif nstatus == "skipped":
                notify_skipped += 1
            else:
                notify_failed += 1
        else:
            detail["notify"] = {"status": "skipped", "message": "notify_disabled"}

        details.append(detail)

    return {
        "assessmentId": primary,
        "assessmentTitle": assessment.get("title") or "",
        "joinAccessCode": assessment.get("joinAccessCode") or "",
        "mode": "primary_additional",
        "assigned": assigned_count,
        "skipped": skipped,
        "failed": failed,
        "notify": {
            "sent": notify_sent,
            "failed": notify_failed,
            "skipped": notify_skipped,
        },
        "details": details,
    }


def revoke_primary_additional_test_on_portal(
    db,
    *,
    portal_id: str,
    primary_assessment_id: str,
    test_id: str,
) -> bool:
    """primaryAdditionalTests에서 미실시 추가 검사 1건 제거. 성공 시 True."""
    pid = (portal_id or "").strip()
    primary = (primary_assessment_id or "").strip()
    tid = (test_id or "").strip()
    if not pid or not primary or not tid:
        return False

    pref = db.collection(CLIENT_PORTALS_COLLECTION).document(pid)
    pdoc = pref.get()
    if not pdoc.exists:
        return False
    pdata = pdoc.to_dict() or {}
    existing = normalize_primary_additional_entries(pdata.get(PRIMARY_ADDITIONAL_FIELD))
    next_entries = [
        e
        for e in existing
        if not (e.get("primaryAssessmentId") == primary and e.get("testId") == tid)
    ]
    if len(next_entries) == len(existing):
        return False
    pref.update(
        {
            PRIMARY_ADDITIONAL_FIELD: next_entries,
            "updatedAt": SERVER_TIMESTAMP,
        }
    )
    return True
