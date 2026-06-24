"""내 검사실 — 다중 나의코드 연결·검사 결과 공유."""
from __future__ import annotations

from datetime import datetime, timezone

from firebase_admin.firestore import ArrayUnion, SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION, TEST_RESULTS_COLLECTION
from utils.access_code import normalize_access_code
from utils.my_code import normalize_my_code, is_valid_my_code
from utils.password import verify_password
from utils.portal_assessment_access import find_active_assessment_by_code, get_portal_doc


def _portal_data(portal_doc) -> dict:
    return portal_doc.to_dict() or {} if portal_doc else {}


def get_linked_portal_ids(db, portal_id: str) -> list[str]:
    portal_doc = get_portal_doc(db, portal_id)
    if not portal_doc:
        return []
    return list(_portal_data(portal_doc).get("linkedPortalIds") or [])


def get_portal_ecosystem_ids(db, portal_id: str) -> set[str]:
    ids = {portal_id}
    ids.update(get_linked_portal_ids(db, portal_id))
    return ids


def _find_portal_by_my_code(db, my_code: str):
    code = normalize_my_code(my_code or "")
    if not is_valid_my_code(code):
        return None
    refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("accessCode", "==", code)
        .where("status", "==", "active")
        .limit(1)
        .get()
    )
    return refs[0] if refs else None


def portal_ecosystem_can_use_assessment(db, portal_id: str, access_code: str):
    """연결된 나의코드 포함 — 해당 검사코드 사용 가능 여부."""
    code = normalize_access_code(access_code or "")
    if not code or not portal_id:
        return None

    ass_doc = find_active_assessment_by_code(db, code)
    if not ass_doc:
        return None

    ass_data = ass_doc.to_dict() or {}
    ass_cohort = str(ass_data.get("clientPortalCohortId") or "").strip()

    # legacy:assessmentId 포털 (내 검사실 /me 호환)
    if str(portal_id).startswith("legacy:"):
        legacy_aid = portal_id.split(":", 1)[1].strip()
        if legacy_aid and legacy_aid == ass_doc.id:
            return ass_doc
        return None

    seen_aids: set[str] = set()
    for pid in get_portal_ecosystem_ids(db, portal_id):
        if str(pid).startswith("legacy:"):
            legacy_aid = pid.split(":", 1)[1].strip()
            if legacy_aid and legacy_aid == ass_doc.id:
                return ass_doc
            continue

        portal_doc = get_portal_doc(db, pid)
        if not portal_doc:
            continue
        pdata = _portal_data(portal_doc)

        if ass_cohort and str(pdata.get("cohortId") or "").strip() == ass_cohort:
            return ass_doc

        assigned = list(pdata.get("assignedAssessmentIds") or [])
        linked = list(pdata.get("linkedAssessmentIds") or [])
        for aid in dict.fromkeys(assigned + linked):
            aid = str(aid or "").strip()
            if not aid or aid in seen_aids:
                continue
            seen_aids.add(aid)
            if aid == ass_doc.id:
                return ass_doc
            adoc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
            if not adoc.exists:
                continue
            ad = adoc.to_dict() or {}
            if (ad.get("status") or "active") != "active":
                continue
            if normalize_access_code(ad.get("accessCode") or "") == code:
                return ass_doc

    return None


def result_visible_to_portal_ecosystem(db, portal_id: str, result_data: dict) -> bool:
    return _result_visible_to_ecosystem(db, portal_id, result_data)


def _result_visible_to_ecosystem(db, portal_id: str, result_data: dict) -> bool:
    ecosystem = get_portal_ecosystem_ids(db, portal_id)
    result_portal = str(result_data.get("portalId") or "").strip()
    if result_portal and result_portal in ecosystem:
        return True

    shared_by = str(result_data.get("sharedByPortalId") or "").strip()
    if shared_by and shared_by in ecosystem:
        return True

    participant_id = str(result_data.get("participantId") or "").strip()
    if participant_id:
        for pid in ecosystem:
            pdoc = get_portal_doc(db, pid)
            if not pdoc:
                continue
            if str(_portal_data(pdoc).get("joinParticipantId") or "").strip() == participant_id:
                return True
    return False


def link_my_code_to_portal(db, primary_portal_id: str, my_code: str, pin: str) -> tuple[bool, str]:
    pin_digits = "".join(c for c in str(pin or "") if c.isdigit())[:4]
    if len(pin_digits) != 4:
        return False, "비밀번호 4자리를 입력해 주세요."

    secondary = _find_portal_by_my_code(db, my_code)
    if not secondary:
        return False, "나의코드를 찾을 수 없습니다."

    if secondary.id == primary_portal_id:
        return False, "현재 로그인한 나의코드와 동일합니다."

    sec_data = _portal_data(secondary)
    pin_hash = sec_data.get("pinHash") or ""
    if not pin_hash or not verify_password(pin_digits, pin_hash):
        return False, "나의코드 또는 비밀번호를 확인해 주세요."

    primary_doc = get_portal_doc(db, primary_portal_id)
    if not primary_doc:
        return False, "포털을 찾을 수 없습니다."

    linked = list(_portal_data(primary_doc).get("linkedPortalIds") or [])
    if secondary.id in linked:
        return True, "이미 연결된 나의코드입니다."

    meta = {
        "portalId": secondary.id,
        "accessCode": sec_data.get("accessCode", ""),
        "displayName": sec_data.get("displayName", ""),
        "linkedAt": datetime.now(timezone.utc).isoformat(),
    }
    primary_doc.reference.update(
        {
            "linkedPortalIds": ArrayUnion([secondary.id]),
            "linkedPortalMeta": ArrayUnion([meta]),
        }
    )
    label = sec_data.get("displayName") or sec_data.get("accessCode") or "나의코드"
    return True, f"「{label}」 나의코드가 연결되었습니다."


def share_result_to_assessment(
    db,
    primary_portal_id: str,
    result_id: str,
    target_access_code: str,
) -> tuple[bool, str]:
    result_ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    result_doc = result_ref.get()
    if not result_doc.exists:
        return False, "검사 결과를 찾을 수 없습니다."

    result_data = result_doc.to_dict() or {}
    if result_data.get("status") != "completed":
        return False, "완료된 검사만 공유할 수 있습니다."

    if not _result_visible_to_ecosystem(db, primary_portal_id, result_data):
        return False, "이 검사 결과에 접근할 수 없습니다."

    target_ass = portal_ecosystem_can_use_assessment(db, primary_portal_id, target_access_code)
    if not target_ass:
        return False, "공유할 검사코드를 찾을 수 없거나 연결·배정되지 않았습니다."

    target_data = target_ass.to_dict() or {}
    target_id = target_ass.id
    source_test_id = str(result_data.get("testId") or "").strip()
    target_tests = {str(t.get("testId") or "") for t in (target_data.get("testList") or []) if t}
    if source_test_id not in target_tests:
        return False, "동일한 검사 항목이 대상 검사코드에 포함되어 있지 않습니다."

    if target_id == str(result_data.get("assessmentId") or ""):
        return False, "같은 검사코드에는 공유할 필요가 없습니다."

    shared_ids = list(result_data.get("sharedToAssessmentIds") or [])
    if target_id in shared_ids:
        return True, "이미 해당 검사코드에 공유된 결과입니다."

    target_code = target_data.get("accessCode", "")
    share_entry = {
        "assessmentId": target_id,
        "accessCode": target_code,
        "sharedAt": datetime.now(timezone.utc).isoformat(),
        "sharedByPortalId": primary_portal_id,
    }
    result_ref.update(
        {
            "sharedToAssessmentIds": ArrayUnion([target_id]),
            "sharedToAssessments": ArrayUnion([share_entry]),
            "sharedByPortalId": primary_portal_id,
        }
    )
    return True, f"검사 결과가 검사코드 {target_code}에 공유되었습니다. 담당 상담사도 확인할 수 있습니다."


def list_linked_portal_summaries(db, portal_id: str) -> list[dict]:
    portal_doc = get_portal_doc(db, portal_id)
    if not portal_doc:
        return []
    pdata = _portal_data(portal_doc)
    meta_list = list(pdata.get("linkedPortalMeta") or [])
    linked_ids = list(pdata.get("linkedPortalIds") or [])
    summaries = []
    seen = set()
    for meta in meta_list:
        pid = str(meta.get("portalId") or "").strip()
        if not pid or pid in seen:
            continue
        seen.add(pid)
        summaries.append(
            {
                "portalId": pid,
                "accessCode": meta.get("accessCode", ""),
                "displayName": meta.get("displayName", ""),
            }
        )
    for pid in linked_ids:
        if pid in seen:
            continue
        pdoc = get_portal_doc(db, pid)
        if not pdoc:
            continue
        pd = _portal_data(pdoc)
        summaries.append(
            {
                "portalId": pid,
                "accessCode": pd.get("accessCode", ""),
                "displayName": pd.get("displayName", ""),
            }
        )
    return summaries
