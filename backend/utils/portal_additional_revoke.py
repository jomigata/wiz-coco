"""미실시 추가 검사(push)·숙제 취소."""
from __future__ import annotations

from firebase_admin.firestore import ArrayRemove, SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION, TEST_RESULTS_COLLECTION
from utils.assessment_dispatch import _bulk_completed_tests_by_portal_assessment


def _verify_portal_counselor(db, portal_id: str, counselor_uid: str) -> dict:
    pref = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id)
    pdoc = pref.get()
    if not pdoc.exists:
        raise ValueError("내담자를 찾을 수 없습니다.")
    pdata = pdoc.to_dict() or {}
    if (pdata.get("counselorId") or "").strip() != (counselor_uid or "").strip():
        raise PermissionError("접근 권한이 없습니다.")
    if (pdata.get("status") or "active") != "active":
        raise ValueError("비활성 내담자입니다.")
    return pdata


def revoke_portal_additional_test(
    db,
    counselor_uid: str,
    *,
    portal_id: str,
    primary_assessment_id: str,
    test_id: str,
) -> dict:
    """push 등으로 붙은 미완료 검사 1종 — 해당 상담(코드) 배정 해제."""
    pid = (portal_id or "").strip()
    tid = (test_id or "").strip()
    primary = (primary_assessment_id or "").strip()
    if not pid or not tid:
        raise ValueError("portalId와 testId가 필요합니다.")

    pdata = _verify_portal_counselor(db, pid, counselor_uid)
    assigned = [str(x).strip() for x in (pdata.get("assignedAssessmentIds") or []) if str(x).strip()]

    completion_map = _bulk_completed_tests_by_portal_assessment(db, [pid], set(assigned))
    removed_aids: list[str] = []

    for aid in assigned:
        if primary and aid == primary:
            continue
        adoc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
        if not adoc.exists:
            continue
        a = adoc.to_dict() or {}
        if (a.get("counselorId") or "").strip() != (counselor_uid or "").strip():
            continue
        test_list = a.get("testList") or []
        test_ids = {
            str(t.get("testId") or "").strip()
            for t in test_list
            if t and str(t.get("testId") or "").strip()
        }
        if tid not in test_ids:
            continue
        completed = completion_map.get((pid, aid), set())
        if tid in completed:
            raise ValueError("이미 완료된 검사는 삭제할 수 없습니다.")
        push_source = (a.get("pushSource") or "").strip()
        if not push_source and len(test_ids) > 1:
            continue
        if not push_source and primary:
            primary_doc = db.collection(ASSESSMENTS_COLLECTION).document(primary).get()
            if primary_doc.exists:
                primary_tests = {
                    str(t.get("testId") or "").strip()
                    for t in (primary_doc.to_dict() or {}).get("testList") or []
                    if t and str(t.get("testId") or "").strip()
                }
                if tid in primary_tests:
                    continue
        removed_aids.append(aid)

    if not removed_aids:
        raise ValueError("삭제할 추가 검사를 찾을 수 없습니다.")

    pref = db.collection(CLIENT_PORTALS_COLLECTION).document(pid)
    pref.update(
        {
            "assignedAssessmentIds": ArrayRemove(removed_aids),
            "updatedAt": SERVER_TIMESTAMP,
        }
    )
    return {"portalId": pid, "testId": tid, "removedAssessmentIds": removed_aids}


def cancel_portal_care_assignment(
    db,
    counselor_uid: str,
    *,
    portal_id: str,
    assignment_id: str,
) -> dict:
    from config import CARE_ASSIGNMENTS_COLLECTION

    pid = (portal_id or "").strip()
    aid = (assignment_id or "").strip()
    if not pid or not aid:
        raise ValueError("portalId와 assignmentId가 필요합니다.")

    _verify_portal_counselor(db, pid, counselor_uid)
    ref = db.collection(CARE_ASSIGNMENTS_COLLECTION).document(aid)
    doc = ref.get()
    if not doc.exists:
        raise ValueError("숙제를 찾을 수 없습니다.")
    data = doc.to_dict() or {}
    if (data.get("portalId") or "").strip() != pid:
        raise ValueError("해당 내담자의 숙제가 아닙니다.")
    if (data.get("counselorId") or "").strip() != (counselor_uid or "").strip():
        raise PermissionError("접근 권한이 없습니다.")
    status = (data.get("status") or "").strip()
    if status == "completed":
        raise ValueError("완료된 숙제는 삭제할 수 없습니다.")
    if status == "cancelled":
        return {"assignmentId": aid, "status": "cancelled"}

    progress_status = ""
    prog = data.get("progress")
    if isinstance(prog, dict):
        progress_status = (prog.get("status") or "").strip()
    if not progress_status:
        progress_status = (data.get("progressStatus") or "").strip()
    if progress_status in ("completed", "in_progress"):
        raise ValueError("이미 진행·완료된 숙제는 삭제할 수 없습니다.")

    ref.update({"status": "cancelled", "updatedAt": SERVER_TIMESTAMP})
    return {"assignmentId": aid, "status": "cancelled"}
