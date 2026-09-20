"""Denormalized dispatchSummary on clientPortals (TASK-020)."""
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import CLIENT_PORTALS_COLLECTION


def build_dispatch_summary(
    *,
    notify_status: str,
    test_status: str,
    completed_count: int,
    required_count: int,
) -> dict:
    return {
        "notifyStatus": (notify_status or "not_sent").strip() or "not_sent",
        "testStatus": (test_status or "not_started").strip() or "not_started",
        "completedCount": max(0, int(completed_count)),
        "requiredCount": max(0, int(required_count)),
        "updatedAt": SERVER_TIMESTAMP,
    }


def patch_portal_dispatch_summary(db, portal_id: str, summary: dict) -> None:
    portal_id = (portal_id or "").strip()
    if not portal_id or not summary:
        return
    db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).set(
        {"dispatchSummary": summary},
        merge=True,
    )


def refresh_portal_test_summary(
    db,
    *,
    portal_id: str,
    assessment_id: str,
    required_test_ids: set[str],
) -> None:
    """Update dispatchSummary test fields after a test result is submitted."""
    from utils.assessment_dispatch import _bulk_completed_tests_by_portal_assessment, _test_status_from_completed

    portal_id = (portal_id or "").strip()
    assessment_id = (assessment_id or "").strip()
    if not portal_id or not assessment_id:
        return
    portal_snap = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).get()
    pdata = portal_snap.to_dict() or {} if portal_snap.exists else {}
    summary = pdata.get("dispatchSummary") or {}
    notify_status = (pdata.get("lastNotifyStatus") or summary.get("notifyStatus") or "not_sent").strip()
    completion_map = _bulk_completed_tests_by_portal_assessment(db, [portal_id], {assessment_id})
    completed = completion_map.get((portal_id, assessment_id), set())
    test_info = _test_status_from_completed(completed, required_test_ids)
    patch_portal_dispatch_summary(
        db,
        portal_id,
        build_dispatch_summary(
            notify_status=notify_status,
            test_status=test_info.get("testStatus") or "not_started",
            completed_count=test_info.get("completedCount") or 0,
            required_count=test_info.get("requiredCount") or len(required_test_ids),
        ),
    )
