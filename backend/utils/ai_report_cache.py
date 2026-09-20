# AI report cache lookup (TASK-051) — mirrors Cloud Functions findCachedAiReport
from __future__ import annotations

import logging

from config import AI_REPORTS_COLLECTION

logger = logging.getLogger(__name__)


def find_cached_ai_report(
    db,
    counselor_uid: str,
    result_id: str,
    feature: str,
) -> dict | None:
    counselor_uid = (counselor_uid or "").strip()
    result_id = (result_id or "").strip()
    feature = (feature or "").strip()
    if not counselor_uid or not result_id or not feature:
        return None
    q = (
        db.collection(AI_REPORTS_COLLECTION)
        .where("counselorUid", "==", counselor_uid)
        .where("resultId", "==", result_id)
        .where("feature", "==", feature)
        .limit(1)
    )
    for snap in q.stream():
        row = snap.to_dict() or {}
        row["id"] = snap.id
        logger.info(
            "ai_report_cache_hit counselor=%s result=%s feature=%s",
            counselor_uid,
            result_id,
            feature,
        )
        return row
    return None
