"""내담자 포털을 다른 상담(코드)로 완전 이동 — 기존 코드에서 제거, 검사 결과 reassignment."""
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    TEST_RESULTS_COLLECTION,
)


def _verify_move_target(db, assessment_id: str, counselor_uid: str) -> dict:
    ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    ass_doc = ass_ref.get()
    if not ass_doc.exists:
        raise ValueError("상담(코드)를 찾을 수 없습니다.")
    ass = ass_doc.to_dict() or {}
    if ass.get("counselorId") != counselor_uid:
        raise PermissionError("선택한 상담(코드)에 접근할 수 없습니다.")
    if (ass.get("status") or "active") != "active":
        raise ValueError("비활성화된 상담(코드)로는 이동할 수 없습니다.")
    return {
        "assessmentId": assessment_id,
        "accessCode": (ass.get("accessCode") or "").strip(),
        "title": (ass.get("title") or "").strip() or "상담(코드)",
    }


def _reassign_test_results(
    db,
    *,
    portal_id: str,
    from_assessment_id: str,
    to_assessment: dict,
) -> int:
    to_aid = to_assessment["assessmentId"]
    to_code = to_assessment["accessCode"]
    updated = 0
    refs = (
        db.collection(TEST_RESULTS_COLLECTION)
        .where("portalId", "==", portal_id)
        .where("assessmentId", "==", from_assessment_id)
        .stream()
    )
    for doc in refs:
        patch: dict = {"assessmentId": to_aid, "updatedAt": SERVER_TIMESTAMP}
        if to_code:
            patch["accessCode"] = to_code
        doc.reference.update(patch)
        updated += 1
    return updated


def move_portals_to_assessment(
    db,
    *,
    counselor_uid: str,
    portal_ids: list[str],
    target_assessment_id: str,
    source_assessment_id: str | None = None,
) -> dict:
    """내담자를 source 상담(코드)에서 target으로 완전 이동 (알림 없음)."""
    target = _verify_move_target(db, target_assessment_id.strip(), counselor_uid)
    to_aid = target["assessmentId"]

    moved = 0
    skipped = 0
    failed = 0
    results_updated = 0
    details: list[dict] = []

    for raw_pid in portal_ids:
        pid = (raw_pid or "").strip()
        if not pid:
            continue
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

        assigned = [str(x).strip() for x in (pdata.get("assignedAssessmentIds") or []) if str(x).strip()]
        from_aid = (source_assessment_id or "").strip()
        if not from_aid:
            from_aid = assigned[0] if assigned else ""
        if not from_aid:
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "no_source_assessment"})
            continue
        if from_aid == to_aid:
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "same_assessment"})
            continue
        if from_aid not in assigned:
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "not_on_source"})
            continue

        new_assigned = [aid for aid in assigned if aid != from_aid]
        if to_aid not in new_assigned:
            new_assigned.append(to_aid)

        pref.update(
            {
                "assignedAssessmentIds": new_assigned,
                "updatedAt": SERVER_TIMESTAMP,
                "lastAssessmentMoveAt": SERVER_TIMESTAMP,
                "lastAssessmentMoveFrom": from_aid,
                "lastAssessmentMoveTo": to_aid,
            }
        )
        n = _reassign_test_results(
            db,
            portal_id=pid,
            from_assessment_id=from_aid,
            to_assessment=target,
        )
        results_updated += n
        moved += 1
        details.append(
            {
                "portalId": pid,
                "status": "moved",
                "fromAssessmentId": from_aid,
                "toAssessmentId": to_aid,
                "resultsUpdated": n,
                "displayName": pdata.get("displayName") or "",
            }
        )

    return {
        "targetAssessmentId": to_aid,
        "targetAssessmentTitle": target["title"],
        "moved": moved,
        "skipped": skipped,
        "failed": failed,
        "resultsUpdated": results_updated,
        "details": details,
    }
