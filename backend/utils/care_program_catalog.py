"""치료프로그램 카탈로그 — T-2-02 (프론트 careProgramCatalog.ts 와 programId 동기화)."""
from __future__ import annotations

CATALOG_VERSION = 1

_CATEGORY_LABELS = {
    "relaxation": "이완·호흡",
    "cbt": "인지행동(CBT)",
    "mindfulness": "마음챙김",
    "journaling": "일기·기록",
    "behavioral": "행동 활성화",
    "psychoeducation": "심리교육",
}

_DIFFICULTY_LABELS = {
    "beginner": "입문",
    "intermediate": "중급",
    "advanced": "심화",
}

# 세션 본문은 프론트 카탈로그에 상세 정의. 백엔드는 검증·메타·기본값 제공.
_PROGRAMS: list[dict] = [
    {
        "programId": "breathing_relaxation_v1",
        "version": "1.0",
        "title": "4주 호흡·이완 프로그램",
        "subtitle": "복식호흡과 4-7-8 호흡으로 불안·긴장 완화",
        "category": "relaxation",
        "description": "불안·스트레스 시 신체 긴장을 낮추기 위한 단계별 호흡·이완 연습입니다.",
        "durationWeeks": 4,
        "sessionsPerWeek": 3,
        "totalSessions": 12,
        "difficulty": "beginner",
        "tags": ["호흡", "이완", "불안", "수면"],
        "defaultDueDays": 28,
        "isActive": True,
    },
    {
        "programId": "progressive_muscle_relaxation_v1",
        "version": "1.0",
        "title": "2주 점진적 근이완(PMR)",
        "subtitle": "군부위 순차 이완으로 신체 긴장 완화",
        "category": "relaxation",
        "description": "손·팔·어깨·얼굴·복부·다리 순으로 긴장 후 이완을 반복하는 PMR 프로그램입니다.",
        "durationWeeks": 2,
        "sessionsPerWeek": 3,
        "totalSessions": 6,
        "difficulty": "beginner",
        "tags": ["PMR", "근이완", "긴장"],
        "defaultDueDays": 14,
        "isActive": True,
    },
    {
        "programId": "cbt_thought_record_v1",
        "version": "1.0",
        "title": "4주 CBT 생각 기록",
        "subtitle": "자동적 사고 포착·균형 잡힌 대안 사고",
        "category": "cbt",
        "description": "상황-생각-감정-행동을 기록하고 왜곡된 사고를 점검하는 CBT 핵심 과제입니다.",
        "durationWeeks": 4,
        "sessionsPerWeek": 2,
        "totalSessions": 8,
        "difficulty": "intermediate",
        "tags": ["CBT", "인지", "사고기록"],
        "defaultDueDays": 28,
        "isActive": True,
    },
    {
        "programId": "mood_diary_v1",
        "version": "1.0",
        "title": "2주 기분 일기",
        "subtitle": "매일 기분·에너지·수면 추적",
        "category": "journaling",
        "description": "짧은 일일 기록으로 기분 변화 패턴을 파악합니다.",
        "durationWeeks": 2,
        "sessionsPerWeek": 7,
        "totalSessions": 14,
        "difficulty": "beginner",
        "tags": ["일기", "기분", "모니터링"],
        "defaultDueDays": 14,
        "isActive": True,
    },
    {
        "programId": "mindfulness_breath_v1",
        "version": "1.0",
        "title": "3주 마음챙김 호흡",
        "subtitle": "호흡에 주의를 두는 10분 명상",
        "category": "mindfulness",
        "description": "호흡 감각에 집중하며 떠오르는 생각을 관찰하는 마음챙김 입문 프로그램입니다.",
        "durationWeeks": 3,
        "sessionsPerWeek": 3,
        "totalSessions": 9,
        "difficulty": "beginner",
        "tags": ["마음챙김", "명상", "호흡"],
        "defaultDueDays": 21,
        "isActive": True,
    },
    {
        "programId": "behavioral_activation_v1",
        "version": "1.0",
        "title": "4주 행동 활성화",
        "subtitle": "작은 활동 계획으로 기분·에너지 회복",
        "category": "behavioral",
        "description": "즐거움·성취 활동을 계획·실행하며 우울 악순환을 끊는 프로그램입니다.",
        "durationWeeks": 4,
        "sessionsPerWeek": 2,
        "totalSessions": 8,
        "difficulty": "intermediate",
        "tags": ["행동활성화", "우울", "활동계획"],
        "defaultDueDays": 28,
        "isActive": True,
    },
    {
        "programId": "sleep_hygiene_v1",
        "version": "1.0",
        "title": "2주 수면 위생",
        "subtitle": "취침 루틴·자극 조절로 수면 질 개선",
        "category": "psychoeducation",
        "description": "수면 일기와 위생 규칙 적용으로 수면 패턴을 개선합니다.",
        "durationWeeks": 2,
        "sessionsPerWeek": 3,
        "totalSessions": 6,
        "difficulty": "beginner",
        "tags": ["수면", "불면", "위생"],
        "defaultDueDays": 14,
        "isActive": True,
    },
    {
        "programId": "gratitude_journal_v1",
        "version": "1.0",
        "title": "2주 감사 일기",
        "subtitle": "매일 감사한 일 3가지 기록",
        "category": "journaling",
        "description": "긍정 경험에 주의를 기울이는 짧은 일기 프로그램입니다.",
        "durationWeeks": 2,
        "sessionsPerWeek": 7,
        "totalSessions": 14,
        "difficulty": "beginner",
        "tags": ["감사", "일기", "긍정"],
        "defaultDueDays": 14,
        "isActive": True,
    },
]

_PROGRAM_MAP = {p["programId"]: p for p in _PROGRAMS}


class CareProgramNotFoundError(ValueError):
    """알 수 없거나 비활성 programId."""


def _enrich_summary(program: dict) -> dict:
    category = program.get("category") or ""
    difficulty = program.get("difficulty") or ""
    return {
        **program,
        "categoryLabel": _CATEGORY_LABELS.get(category, category),
        "difficultyLabel": _DIFFICULTY_LABELS.get(difficulty, difficulty),
    }


def list_care_programs(*, category: str | None = None, active_only: bool = True) -> list[dict]:
    items = _PROGRAMS
    if active_only:
        items = [p for p in items if p.get("isActive")]
    if category:
        cat = category.strip()
        items = [p for p in items if (p.get("category") or "") == cat]
    return [_enrich_summary(p) for p in items]


def get_care_program(program_id: str) -> dict:
    pid = (program_id or "").strip()
    program = _PROGRAM_MAP.get(pid)
    if not program or not program.get("isActive"):
        raise CareProgramNotFoundError(f"프로그램을 찾을 수 없습니다: {pid}")
    return _enrich_summary(program)


def validate_care_program_id(program_id: str) -> dict:
    """programId 검증 후 프로그램 메타 반환."""
    return get_care_program(program_id)


def get_care_program_catalog_meta() -> dict:
    programs = list_care_programs()
    counts: dict[str, int] = {}
    for p in programs:
        cat = p.get("category") or ""
        counts[cat] = counts.get(cat, 0) + 1
    categories = [
        {"id": cid, "label": label, "count": counts.get(cid, 0)}
        for cid, label in _CATEGORY_LABELS.items()
        if counts.get(cid, 0) > 0
    ]
    return {
        "catalogVersion": CATALOG_VERSION,
        "programs": programs,
        "categories": categories,
    }
