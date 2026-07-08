# AI 리포트 캐시 조회 (T-3-05)
from __future__ import annotations

from config import AI_REPORTS_COLLECTION


def list_ai_reports_for_result(
    db,
    counselor_uid: str,
    result_id: str,
    *,
    limit: int = 5,
) -> list[dict]:
    limit = max(1, min(limit, 20))
    snaps = (
        db.collection(AI_REPORTS_COLLECTION)
        .where("counselorUid", "==", counselor_uid)
        .where("resultId", "==", result_id)
        .limit(limit)
        .stream()
    )
    rows = []
    for snap in snaps:
        d = snap.to_dict() or {}
        d["id"] = snap.id
        for key in ("createdAt", "updatedAt"):
            val = d.get(key)
            if val and hasattr(val, "isoformat"):
                d[key] = val.isoformat()
            elif val and hasattr(val, "timestamp"):
                from datetime import datetime

                d[key] = datetime.utcfromtimestamp(val.timestamp()).isoformat() + "Z"
        rows.append(d)
    rows.sort(key=lambda x: x.get("createdAt") or "", reverse=True)
    return rows[:limit]


def get_ai_report(db, counselor_uid: str, report_id: str) -> dict | None:
    ref = db.collection(AI_REPORTS_COLLECTION).document(report_id)
    doc = ref.get()
    if not doc.exists:
        return None
    d = doc.to_dict() or {}
    if d.get("counselorUid") != counselor_uid:
        return None
    d["id"] = doc.id
    for key in ("createdAt", "updatedAt"):
        val = d.get(key)
        if val and hasattr(val, "isoformat"):
            d[key] = val.isoformat()
        elif val and hasattr(val, "timestamp"):
            from datetime import datetime

            d[key] = datetime.utcfromtimestamp(val.timestamp()).isoformat() + "Z"
    return d
