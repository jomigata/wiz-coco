"""포털 케어 일기 → dailyRecords 동기화 · 상담사 조회 (T-2-09)."""
from __future__ import annotations

from datetime import datetime, timezone

from config import DAILY_RECORDS_COLLECTION
from utils.care_assignment_schema import CareAssignmentValidationError


def _iso_timestamp(value) -> str | None:
    if not value:
        return None
    if isinstance(value, str):
        return value
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass
    if hasattr(value, "timestamp"):
        try:
            return datetime.fromtimestamp(value.timestamp(), tz=timezone.utc).isoformat()
        except Exception:
            pass
    return None


def _record_type_from_kind(kind: str) -> str:
    if kind == "check_in":
        return "daily_mood"
    if kind == "journal":
        return "emotion_diary"
    return "emotion_diary"


def sync_portal_care_daily_record(
    db,
    *,
    portal_id: str,
    portal_display_name: str,
    counselor_id: str,
    assignment_id: str,
    assignment_title: str,
    entry: dict,
) -> str | None:
    """careProgress journal/check_in/note → dailyRecords 동기화."""
    kind = (entry.get("kind") or "").strip()
    if kind not in ("journal", "check_in", "note"):
        return None

    content = (entry.get("content") or "").strip()
    if not content and entry.get("moodScore") is None:
        return None

    progress_entry_id = (entry.get("id") or "").strip()
    if progress_entry_id:
        existing = (
            db.collection(DAILY_RECORDS_COLLECTION)
            .where("progressEntryId", "==", progress_entry_id)
            .where("assignmentId", "==", assignment_id)
            .limit(1)
            .get()
        )
        if existing:
            return existing[0].id

    ref = db.collection(DAILY_RECORDS_COLLECTION).document()
    ref.set(
        {
            "source": "portal_care",
            "portalId": portal_id,
            "portalDisplayName": (portal_display_name or "").strip() or None,
            "clientId": "",
            "counselorId": counselor_id,
            "assignmentId": assignment_id,
            "assignmentTitle": (assignment_title or "").strip() or "일기·기록",
            "progressEntryId": progress_entry_id or None,
            "recordType": _record_type_from_kind(kind),
            "content": content,
            "moodScore": entry.get("moodScore"),
            "stressLevel": entry.get("stressLevel"),
            "energyLevel": entry.get("energyLevel"),
            "recordedAt": entry.get("completedAt")
            or datetime.now(timezone.utc).isoformat(),
            "isShared": True,
        }
    )
    return ref.id


def list_counselor_daily_records(
    db,
    counselor_uid: str,
    *,
    portal_id: str | None = None,
    limit: int = 50,
) -> dict:
    """상담사 — 포털·마이페이지 공유 일상 기록 목록."""
    limit = max(1, min(int(limit or 50), 200))
    query = db.collection(DAILY_RECORDS_COLLECTION).where("counselorId", "==", counselor_uid)
    if portal_id:
        query = query.where("portalId", "==", portal_id.strip())

    rows: list[tuple[str, dict]] = []
    for doc in query.stream():
        data = doc.to_dict() or {}
        source = (data.get("source") or "").strip()
        if source == "portal_care":
            include = True
        elif data.get("isShared"):
            include = True
        else:
            continue
        recorded = _iso_timestamp(data.get("recordedAt")) or ""
        item = {
            "id": doc.id,
            **data,
            "recordedAt": recorded or data.get("recordedAt"),
        }
        rows.append((recorded, item))

    rows.sort(key=lambda x: x[0], reverse=True)
    items = [row[1] for row in rows[:limit]]

    portal_count = sum(1 for _, row in rows if (row.get("source") or "") == "portal_care")
    shared_count = len(rows) - portal_count

    return {
        "items": items,
        "total": len(rows),
        "summary": {
            "portalCare": portal_count,
            "mypageShared": shared_count,
        },
    }


def update_counselor_daily_record_notes(
    db,
    counselor_uid: str,
    record_id: str,
    counselor_notes: str,
) -> dict:
    record_id = (record_id or "").strip()
    if not record_id:
        raise CareAssignmentValidationError("recordId가 필요합니다.")

    ref = db.collection(DAILY_RECORDS_COLLECTION).document(record_id)
    snap = ref.get()
    if not snap.exists:
        raise CareAssignmentValidationError("기록을 찾을 수 없습니다.")

    data = snap.to_dict() or {}
    if (data.get("counselorId") or "") != counselor_uid:
        raise CareAssignmentValidationError("접근 권한이 없습니다.")

    notes = (counselor_notes or "").strip()
    ref.update({"counselorNotes": notes or None})
    return {"id": record_id, "counselorNotes": notes or None}
