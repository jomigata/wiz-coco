"""Denormalized dispatchSummary on clientPortals (TASK-020)."""
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP


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
    db.collection("clientPortals").document(portal_id).set(
        {"dispatchSummary": summary},
        merge=True,
    )
