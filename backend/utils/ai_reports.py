# AI 리포트 캐시 조회 (T-3-05)
from __future__ import annotations

from config import AI_REPORTS_COLLECTION


def list_ai_reports_for_result(
    db,
    counselor_uid: str,
    result_id: str,
    *,
    feature: str | None = None,
    limit: int = 5,
) -> list[dict]:
    limit = max(1, min(limit, 20))
    query = (
        db.collection(AI_REPORTS_COLLECTION)
        .where("counselorUid", "==", counselor_uid)
        .where("resultId", "==", result_id)
    )
    if feature:
        query = query.where("feature", "==", feature)
    snaps = query.limit(limit).stream()
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


def update_ai_report_annotations(
    db,
    counselor_uid: str,
    report_id: str,
    *,
    counselor_notes: str | None = None,
    recommended_treatment: str | None = None,
) -> dict | None:
    """T-4-05 — 상담사 코멘트·추천 치료 섹션 저장."""
    from firebase_admin.firestore import SERVER_TIMESTAMP

    ref = db.collection(AI_REPORTS_COLLECTION).document(report_id)
    doc = ref.get()
    if not doc.exists:
        return None
    d = doc.to_dict() or {}
    if d.get("counselorUid") != counselor_uid:
        return None

    metadata = dict(d.get("metadata") or {})
    if counselor_notes is not None:
        metadata["counselorNotes"] = counselor_notes[:4000]
    if recommended_treatment is not None:
        metadata["recommendedTreatment"] = recommended_treatment[:4000]

    ref.set({"metadata": metadata, "updatedAt": SERVER_TIMESTAMP}, merge=True)
    return get_ai_report(db, counselor_uid, report_id)
