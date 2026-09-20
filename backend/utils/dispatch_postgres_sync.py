"""Dual-write dispatch_recipients SQL rows (TASK-073)."""
from __future__ import annotations

import logging

from config import CLIENT_PORTALS_COLLECTION, DATABASE_URL, DISPATCH_SQL_DUAL_WRITE

logger = logging.getLogger(__name__)


def dual_write_enabled() -> bool:
    return bool(DATABASE_URL) and DISPATCH_SQL_DUAL_WRITE


def _connect():
    import psycopg2

    return psycopg2.connect(DATABASE_URL)


def upsert_dispatch_recipient_row(
    *,
    portal_id: str,
    counselor_uid: str,
    assessment_id: str,
    display_name: str,
    notify_status: str,
    test_status: str,
    completed_count: int,
    required_count: int,
) -> None:
    if not dual_write_enabled():
        return
    portal_id = (portal_id or "").strip()
    counselor_uid = (counselor_uid or "").strip()
    assessment_id = (assessment_id or "").strip()
    if not portal_id or not counselor_uid or not assessment_id:
        return
    try:
        conn = _connect()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO dispatch_recipients (
                      portal_id, counselor_uid, assessment_id, display_name,
                      notify_status, test_status, completed_count, required_count, updated_at
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                    ON CONFLICT (portal_id) DO UPDATE SET
                      counselor_uid = EXCLUDED.counselor_uid,
                      assessment_id = EXCLUDED.assessment_id,
                      display_name = EXCLUDED.display_name,
                      notify_status = EXCLUDED.notify_status,
                      test_status = EXCLUDED.test_status,
                      completed_count = EXCLUDED.completed_count,
                      required_count = EXCLUDED.required_count,
                      updated_at = NOW()
                    """,
                    (
                        portal_id,
                        counselor_uid,
                        assessment_id,
                        (display_name or "")[:500],
                        (notify_status or "not_sent")[:32],
                        (test_status or "not_started")[:32],
                        max(0, int(completed_count)),
                        max(0, int(required_count)),
                    ),
                )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        logger.exception(
            "dispatch_postgres upsert failed portal=%s assessment=%s",
            portal_id,
            assessment_id,
        )


def sync_portal_dispatch_to_postgres(
    db,
    portal_id: str,
    *,
    assessment_id: str | None = None,
) -> None:
    """Upsert SQL row(s) from Firestore portal + dispatchSummary."""
    if not dual_write_enabled():
        return
    portal_id = (portal_id or "").strip()
    if not portal_id:
        return
    snap = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).get()
    if not snap.exists:
        return
    pdata = snap.to_dict() or {}
    counselor_uid = (pdata.get("counselorId") or "").strip()
    if not counselor_uid:
        return
    summary = pdata.get("dispatchSummary") or {}
    notify_status = (
        (pdata.get("lastNotifyStatus") or summary.get("notifyStatus") or "not_sent").strip()
    )
    test_status = (summary.get("testStatus") or "not_started").strip()
    completed_count = int(summary.get("completedCount") or 0)
    required_count = int(summary.get("requiredCount") or 0)
    display_name = (pdata.get("displayName") or "").strip()

    aids: list[str] = []
    if assessment_id:
        aids = [assessment_id.strip()]
    else:
        aids = [
            str(x).strip()
            for x in (pdata.get("assignedAssessmentIds") or [])
            if str(x).strip()
        ]
        arch = (pdata.get("archivedFromAssessmentId") or "").strip()
        if arch and arch not in aids:
            aids.append(arch)

    for aid in aids:
        upsert_dispatch_recipient_row(
            portal_id=portal_id,
            counselor_uid=counselor_uid,
            assessment_id=aid,
            display_name=display_name,
            notify_status=notify_status,
            test_status=test_status,
            completed_count=completed_count,
            required_count=required_count,
        )
