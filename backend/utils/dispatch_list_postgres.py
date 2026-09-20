"""Dispatch list read path from Postgres (TASK-072)."""
from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)


def _database_url() -> str:
    return (os.getenv("DATABASE_URL") or "").strip()


def try_get_dispatch_from_postgres(
    *,
    assessment_id: str,
    counselor_uid: str | None,
    limit: int | None,
    cursor: str | None,
    expand_tests: bool,
    assessment_meta: dict[str, Any],
) -> dict[str, Any] | None:
    url = _database_url()
    if not url:
        return None
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
    except ImportError:
        logger.warning("DATABASE_URL set but psycopg2 not installed; skip postgres dispatch")
        return None

    page_limit = max(1, min(int(limit or 50), 200))
    cursor_id = (cursor or "").strip() or None
    uid = (counselor_uid or "").strip()

    conn = psycopg2.connect(url)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if cursor_id:
                cur.execute(
                    """
                    SELECT portal_id, display_name, notify_status, test_status,
                           completed_count, required_count
                    FROM dispatch_recipients
                    WHERE assessment_id = %s AND counselor_uid = %s
                      AND portal_id > %s
                    ORDER BY display_name NULLS LAST, portal_id
                    LIMIT %s
                    """,
                    (assessment_id, uid, cursor_id, page_limit + 1),
                )
            else:
                cur.execute(
                    """
                    SELECT portal_id, display_name, notify_status, test_status,
                           completed_count, required_count
                    FROM dispatch_recipients
                    WHERE assessment_id = %s AND counselor_uid = %s
                    ORDER BY display_name NULLS LAST, portal_id
                    LIMIT %s
                    """,
                    (assessment_id, uid, page_limit + 1),
                )
            rows = cur.fetchall()
            cur.execute(
                """
                SELECT COUNT(*) AS c FROM dispatch_recipients
                WHERE assessment_id = %s AND counselor_uid = %s
                """,
                (assessment_id, uid),
            )
            total_row = cur.fetchone() or {}
            total = int(total_row.get("c") or 0)
    finally:
        conn.close()

    has_more = len(rows) > page_limit
    page = rows[:page_limit]
    next_cursor = page[-1]["portal_id"] if has_more and page else None

    recipients = []
    join_code = assessment_meta.get("joinAccessCode") or ""
    for row in page:
        recipients.append(
            {
                "portalId": row["portal_id"],
                "displayName": row.get("display_name") or "",
                "email": "",
                "phone": "",
                "myCode": "",
                "joinAccessCode": join_code,
                "notifyStatus": row.get("notify_status") or "not_sent",
                "notifyError": "",
                "notifyAt": None,
                "tests": [] if not expand_tests else [],
                "testStatus": row.get("test_status") or "not_started",
                "completedCount": int(row.get("completed_count") or 0),
                "requiredCount": int(row.get("required_count") or 0),
            }
        )

    payload = {
        "assessmentId": assessment_id,
        "title": assessment_meta.get("title") or "",
        "cohortName": assessment_meta.get("cohortName") or "",
        "joinAccessCode": join_code,
        "testList": assessment_meta.get("testList") or [],
        "recipients": recipients,
        "totalRecipientCount": total,
        "nextCursor": next_cursor,
        "source": "postgres",
    }
    logger.info(
        "dispatch_list_postgres assessment=%s rows=%s total=%s",
        assessment_id,
        len(recipients),
        total,
    )
    return payload
