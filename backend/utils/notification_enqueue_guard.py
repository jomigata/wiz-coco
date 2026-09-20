"""Duplicate notification enqueue guard + retry backoff helpers (TASK-040)."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from config import NOTIFICATION_DEDUPE_WINDOW_SEC, NOTIFICATION_QUEUE_COLLECTION, NOTIFICATION_RETRY_BACKOFF_BASE_SEC
from firebase_admin.firestore import SERVER_TIMESTAMP

logger = logging.getLogger(__name__)


def _now_ts() -> float:
    return time.time()


def has_recent_queue_item(
    db,
    *,
    portal_id: str,
    notify_kind: str,
    queue_type: str = "portal_credentials",
    window_sec: int | None = None,
) -> bool:
    """Same portal+kind pending/recent enqueue within window — skip duplicate."""
    portal_id = (portal_id or "").strip()
    notify_kind = (notify_kind or "initial").strip() or "initial"
    if not portal_id:
        return False
    window = window_sec if window_sec is not None else NOTIFICATION_DEDUPE_WINDOW_SEC
    cutoff = datetime.fromtimestamp(_now_ts() - window, tz=timezone.utc)
    try:
        q = (
            db.collection(NOTIFICATION_QUEUE_COLLECTION)
            .where("portalId", "==", portal_id)
            .where("type", "==", queue_type)
            .limit(8)
        )
        for doc in q.stream():
            data = doc.to_dict() or {}
            if (data.get("notifyKind") or "initial").strip() != notify_kind:
                continue
            status = (data.get("status") or "").strip()
            if status in ("pending", "sending", "processing"):
                return True
            created = data.get("createdAt")
            if hasattr(created, "timestamp"):
                if created.timestamp() >= cutoff.timestamp():
                    return True
    except Exception:
        logger.exception("has_recent_queue_item failed portal=%s", portal_id)
    return False


def enqueue_with_dedupe(db, notify_queue, payload: dict) -> bool:
    """Returns True if enqueued, False if skipped as duplicate."""
    portal_id = (payload.get("portalId") or "").strip()
    notify_kind = (payload.get("notifyKind") or "initial").strip() or "initial"
    if portal_id and has_recent_queue_item(db, portal_id=portal_id, notify_kind=notify_kind):
        logger.info("skip duplicate notification enqueue portal=%s kind=%s", portal_id, notify_kind)
        return False
    notify_queue.add(payload)
    return True


def compute_retry_delay_sec(attempt: int) -> int:
    """Exponential backoff from base config (attempt 0 → base, 1 → 2x, …)."""
    attempt = max(0, int(attempt))
    return min(3600, NOTIFICATION_RETRY_BACKOFF_BASE_SEC * (2**attempt))


def mark_queue_retry(db, doc_ref, *, attempt: int, last_error: str) -> None:
    delay = compute_retry_delay_sec(attempt)
    doc_ref.update(
        {
            "status": "pending",
            "retryAttempt": attempt + 1,
            "retryAfter": SERVER_TIMESTAMP,
            "retryDelaySec": delay,
            "lastError": (last_error or "")[:500],
        }
    )
