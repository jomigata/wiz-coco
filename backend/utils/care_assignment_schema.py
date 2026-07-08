"""careAssignments · careProgress Firestore 스키마 검증 (T-2-01)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from utils.care_program_catalog import CareProgramNotFoundError, validate_care_program_id

SCHEMA_VERSION = 1

CARE_ASSIGNMENT_TYPES = frozenset(
    {
        "additional_assessment",
        "treatment_program",
        "daily_record",
        "custom_task",
    }
)

CARE_ASSIGNMENT_STATUSES = frozenset({"active", "completed", "cancelled", "expired"})

CARE_ASSIGNMENT_SOURCES = frozenset({"manual", "ai_recommendation", "assessment_result"})

CARE_NOTIFY_STATUSES = frozenset({"pending", "sent", "failed", "skipped"})

CARE_PRIORITIES = frozenset({"low", "medium", "high"})

CARE_PROGRESS_STATUSES = frozenset({"not_started", "in_progress", "completed", "skipped"})

CARE_PROGRESS_ENTRY_KINDS = frozenset(
    {"session", "journal", "check_in", "note", "assessment"}
)


class CareAssignmentValidationError(ValueError):
    """케어 할당 페이로드 검증 실패."""


def _strip(value: Any) -> str:
    return str(value or "").strip()


def _normalize_test_list(test_list: list | None) -> list[dict]:
    out: list[dict] = []
    for item in test_list or []:
        if not isinstance(item, dict):
            continue
        test_id = _strip(item.get("testId"))
        if not test_id:
            continue
        out.append({"testId": test_id, "name": _strip(item.get("name")) or test_id})
    return out


def validate_create_care_assignment_payload(body: dict | None) -> dict:
    """POST /api/care-assignments 요청 본문 검증."""
    if not isinstance(body, dict):
        raise CareAssignmentValidationError("요청 본문이 필요합니다.")

    portal_ids = body.get("portalIds")
    if not isinstance(portal_ids, list) or not portal_ids:
        raise CareAssignmentValidationError("portalIds 배열이 필요합니다.")
    portal_ids = [_strip(pid) for pid in portal_ids if _strip(pid)]
    if not portal_ids:
        raise CareAssignmentValidationError("유효한 portalIds가 없습니다.")

    assignment_type = _strip(body.get("type"))
    if assignment_type not in CARE_ASSIGNMENT_TYPES:
        raise CareAssignmentValidationError("유효하지 않은 type입니다.")

    title = _strip(body.get("title"))
    if not title:
        raise CareAssignmentValidationError("title이 필요합니다.")
    if len(title) > 200:
        raise CareAssignmentValidationError("title은 200자 이하여야 합니다.")

    priority = _strip(body.get("priority")) or "medium"
    if priority not in CARE_PRIORITIES:
        raise CareAssignmentValidationError("유효하지 않은 priority입니다.")

    source = _strip(body.get("source")) or "manual"
    if source not in CARE_ASSIGNMENT_SOURCES:
        raise CareAssignmentValidationError("유효하지 않은 source입니다.")

    program_id = _strip(body.get("programId")) or None
    assessment_id = _strip(body.get("assessmentId")) or None
    test_list = _normalize_test_list(body.get("testList"))

    if assignment_type == "treatment_program":
        if not program_id:
            raise CareAssignmentValidationError("treatment_program은 programId가 필요합니다.")
        try:
            validate_care_program_id(program_id)
        except CareProgramNotFoundError as exc:
            raise CareAssignmentValidationError(str(exc)) from exc
    if assignment_type == "additional_assessment" and not assessment_id and not test_list:
        raise CareAssignmentValidationError(
            "additional_assessment은 assessmentId 또는 testList가 필요합니다."
        )

    notify = body.get("notify")
    notify_on_assign = True if notify is None else bool(notify)

    metadata = body.get("metadata")
    if metadata is not None and not isinstance(metadata, dict):
        raise CareAssignmentValidationError("metadata는 객체여야 합니다.")

    return {
        "portalIds": portal_ids,
        "type": assignment_type,
        "title": title,
        "description": _strip(body.get("description")) or None,
        "instructions": _strip(body.get("instructions")) or None,
        "priority": priority,
        "programId": program_id,
        "assessmentId": assessment_id,
        "testList": test_list or None,
        "startAt": _strip(body.get("startAt")) or None,
        "dueAt": _strip(body.get("dueAt")) or None,
        "notifyOnAssign": notify_on_assign,
        "source": source,
        "sourceRefId": _strip(body.get("sourceRefId")) or None,
        "metadata": metadata,
    }


def build_care_assignment_doc(
    *,
    counselor_uid: str,
    portal_id: str,
    portal_display_name: str,
    payload: dict,
    created_by: str | None = None,
) -> dict:
    """careAssignments 문서 초기 필드."""
    notify_on_assign = bool(payload.get("notifyOnAssign", True))
    return {
        "schemaVersion": SCHEMA_VERSION,
        "counselorId": counselor_uid,
        "portalId": portal_id,
        "portalDisplayName": (portal_display_name or "").strip() or None,
        "type": payload["type"],
        "status": "active",
        "title": payload["title"],
        "description": payload.get("description"),
        "instructions": payload.get("instructions"),
        "priority": payload.get("priority") or "medium",
        "programId": payload.get("programId"),
        "assessmentId": payload.get("assessmentId"),
        "testList": payload.get("testList"),
        "startAt": payload.get("startAt"),
        "dueAt": payload.get("dueAt"),
        "completedAt": None,
        "notifyOnAssign": notify_on_assign,
        "notifyStatus": "pending" if notify_on_assign else "skipped",
        "notifyError": None,
        "notifyAt": None,
        "source": payload.get("source") or "manual",
        "sourceRefId": payload.get("sourceRefId"),
        "metadata": payload.get("metadata"),
        "createdBy": created_by or counselor_uid,
    }


def build_care_progress_doc(
    *,
    assignment_id: str,
    portal_id: str,
    counselor_uid: str,
    assignment_type: str,
) -> dict:
    """careProgress 문서 초기 필드 (할당 생성 시 1:1 생성)."""
    return {
        "schemaVersion": SCHEMA_VERSION,
        "assignmentId": assignment_id,
        "portalId": portal_id,
        "counselorId": counselor_uid,
        "assignmentType": assignment_type,
        "status": "not_started",
        "progressPercent": 0,
        "entries": [],
        "lastActivityAt": None,
        "completedAt": None,
    }


def validate_progress_entry(entry: dict | None) -> dict:
    """포털 진행 기록 항목 검증."""
    if not isinstance(entry, dict):
        raise CareAssignmentValidationError("진행 항목이 필요합니다.")
    kind = _strip(entry.get("kind"))
    if kind not in CARE_PROGRESS_ENTRY_KINDS:
        raise CareAssignmentValidationError("유효하지 않은 진행 kind입니다.")
    content = _strip(entry.get("content"))
    title = _strip(entry.get("title")) or None
    mood = entry.get("moodScore")
    if mood is not None:
        try:
            mood = int(mood)
        except (TypeError, ValueError) as exc:
            raise CareAssignmentValidationError("moodScore는 정수여야 합니다.") from exc
        if mood < 1 or mood > 10:
            raise CareAssignmentValidationError("moodScore는 1~10이어야 합니다.")

    def _optional_score(field: str):
        value = entry.get(field)
        if value is None:
            return None
        try:
            value = int(value)
        except (TypeError, ValueError) as exc:
            raise CareAssignmentValidationError(f"{field}는 정수여야 합니다.") from exc
        if value < 1 or value > 10:
            raise CareAssignmentValidationError(f"{field}는 1~10이어야 합니다.")
        return value

    stress = _optional_score("stressLevel")
    energy = _optional_score("energyLevel")

    if kind in ("journal", "note") and not content:
        raise CareAssignmentValidationError("journal/note 항목은 content가 필요합니다.")
    if kind == "check_in" and not content and mood is None:
        raise CareAssignmentValidationError("check_in은 기록 내용 또는 기분 점수가 필요합니다.")
    if kind == "session" and not title:
        raise CareAssignmentValidationError("session 항목은 title이 필요합니다.")

    return {
        "id": _strip(entry.get("id")) or datetime.now(timezone.utc).isoformat(),
        "kind": kind,
        "title": title,
        "content": content or None,
        "moodScore": mood,
        "stressLevel": stress,
        "energyLevel": energy,
        "completedAt": datetime.now(timezone.utc).isoformat(),
        "metadata": entry.get("metadata") if isinstance(entry.get("metadata"), dict) else None,
    }


def assignment_type_label(assignment_type: str) -> str:
    labels = {
        "additional_assessment": "추가 검사",
        "treatment_program": "치료 프로그램",
        "daily_record": "일기·기록",
        "custom_task": "맞춤 과제",
    }
    return labels.get(assignment_type, assignment_type)
