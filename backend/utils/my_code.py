"""나의코드(포털 accessCode) 생성·검증 — 연도 알파벳(2026=A) + 숫자 블록(4·8·12…) + 구분 알파벳."""
from __future__ import annotations

import random
import re
from datetime import datetime, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION
from firebase_init import get_firestore

NUMERIC_CHARS = "23456789"
DIGIT_SEGMENT = 4
YEAR_BASE = 2026
# 숫자와 혼동되는 알파벳 제외: I/L↔1, O↔0, S↔5, Z↔2, B↔8, G↔6, Q↔9
CONFUSABLE_LETTERS = frozenset("ILOSZBGQ")
YEAR_ALPHABET = "".join(c for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" if c not in CONFUSABLE_LETTERS)
YEAR_BASE_RADIX = len(YEAR_ALPHABET)  # 18

SYSTEM_META_COLLECTION = "system_meta"
MY_CODE_CONFIG_DOC = "my_code_generation"

MAX_TRIES_PER_TIER = 150
MAX_SUFFIX_TIER = 40

# 신규: 9999 | 2222A | 2222A3333 | 2222A3333C4444 …
_NEW_SUFFIX_RE = re.compile(
    rf"^[{NUMERIC_CHARS}]{{{DIGIT_SEGMENT}}}"
    rf"(?:[{YEAR_ALPHABET}](?:[{NUMERIC_CHARS}]{{{DIGIT_SEGMENT}}}(?:[{YEAR_ALPHABET}][{NUMERIC_CHARS}]{{{DIGIT_SEGMENT}}})*)?)?$"
)
_NEW_SUFFIX_ODD_RE = re.compile(
    rf"^[{NUMERIC_CHARS}]{{{DIGIT_SEGMENT}}}(?:[{YEAR_ALPHABET}][{NUMERIC_CHARS}]{{{DIGIT_SEGMENT}}})*[{YEAR_ALPHABET}]$"
)
_LEGACY_SUFFIX_RE = re.compile(rf"^[{NUMERIC_CHARS}]{{3,}}$")


def normalize_my_code(raw: str) -> str:
    """허용 영문·숫자(2~9)만 추출 후 대문자 통일 (대소문자 구분 없음)."""
    out = []
    for c in (raw or "").strip().upper():
        if c in YEAR_ALPHABET:
            out.append(c)
        elif c in NUMERIC_CHARS:
            out.append(c)
    return "".join(out)


def encode_year_offset(offset: int) -> str:
    """
    2026년=0 → A, … 18년 주기 후 2자리(A A…)로 확장.
    연도 알파벳 풀(18자)을 다 쓰면 자릿수를 1씩 늘림.
    """
    if offset < 0:
        offset = 0
    if offset < YEAR_BASE_RADIX:
        return YEAR_ALPHABET[offset]
    length = 2
    base = YEAR_BASE_RADIX
    while offset >= base + (YEAR_BASE_RADIX**length):
        base += YEAR_BASE_RADIX**length
        length += 1
    remaining = offset - base
    chars = []
    for _ in range(length):
        remaining, idx = divmod(remaining, YEAR_BASE_RADIX)
        chars.append(YEAR_ALPHABET[idx])
    return "".join(reversed(chars))


def year_prefix_for(year: int | None = None) -> str:
    y = year if year is not None else datetime.now(timezone.utc).year
    return encode_year_offset(y - YEAR_BASE)


def _is_valid_suffix(body: str) -> bool:
    if not body:
        return False
    if _LEGACY_SUFFIX_RE.fullmatch(body):
        return True
    if _NEW_SUFFIX_RE.fullmatch(body):
        return True
    return bool(_NEW_SUFFIX_ODD_RE.fullmatch(body))


def is_valid_my_code(code: str) -> bool:
    if not code:
        return False
    normalized = normalize_my_code(code)
    if len(normalized) < 4:
        return False
    for prefix_len in range(1, len(normalized)):
        prefix = normalized[:prefix_len]
        body = normalized[prefix_len:]
        if not all(c in YEAR_ALPHABET for c in prefix):
            continue
        if _is_valid_suffix(body):
            return True
    return False


def _random_numeric(n: int) -> str:
    return "".join(random.choices(NUMERIC_CHARS, k=n))


def _random_separator() -> str:
    return random.choice(YEAR_ALPHABET)


def _tier_shape(tier: int) -> tuple[int, int]:
    """Returns (digit_group_count, separator_count) for suffix tier."""
    if tier < 0:
        tier = 0
    digit_groups = (tier // 2) + 1
    if tier % 2 == 0:
        separators = digit_groups - 1
    else:
        separators = digit_groups
    return digit_groups, separators


def _build_suffix_for_tier(tier: int) -> str:
    """
    tier 0: dddd (4자리)
    tier 1: ddddL
    tier 2: ddddLdddd (8자리 + 구분 1)
    tier 3: ddddLddddL
    tier 4: ddddLddddLdddd (12자리 + 구분 2)
    """
    digit_groups, separators = _tier_shape(tier)
    parts: list[str] = []
    for group_idx in range(digit_groups):
        parts.append(_random_numeric(DIGIT_SEGMENT))
        if group_idx < separators:
            parts.append(_random_separator())
    return "".join(parts)


def _get_suffix_tier(db) -> int:
    doc = db.collection(SYSTEM_META_COLLECTION).document(MY_CODE_CONFIG_DOC).get()
    if doc.exists:
        data = doc.to_dict() or {}
        tier = data.get("suffix_tier")
        if isinstance(tier, int) and tier >= 0:
            return min(tier, MAX_SUFFIX_TIER)
        # 구 설정(numeric_length)은 신규 tier 0(4자리)부터 다시 시작
    return 0


def _bump_suffix_tier(db, current: int) -> int:
    new_tier = min(current + 1, MAX_SUFFIX_TIER)
    db.collection(SYSTEM_META_COLLECTION).document(MY_CODE_CONFIG_DOC).set(
        {"suffix_tier": new_tier, "updatedAt": SERVER_TIMESTAMP},
        merge=True,
    )
    return new_tier


def reset_my_code_generation_meta(db, *, dry_run: bool = False) -> bool:
    """나의코드 suffix tier를 0(4자리)으로 초기화."""
    if dry_run:
        return True
    db.collection(SYSTEM_META_COLLECTION).document(MY_CODE_CONFIG_DOC).set(
        {"suffix_tier": 0, "updatedAt": SERVER_TIMESTAMP},
        merge=True,
    )
    return True


def _my_code_exists(db, candidate: str) -> bool:
    if db.collection(CLIENT_PORTALS_COLLECTION).where("accessCode", "==", candidate).limit(1).get():
        return True
    if (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("portalAccessCode", "==", candidate)
        .limit(1)
        .get()
    ):
        return True
    return False


def generate_unique_my_code() -> str:
    """Firestore 전역 유일 나의코드 (연도 알파벳 + 4자리 블록·구분 알파벳 확장)."""
    db = get_firestore()
    prefix = year_prefix_for()

    for _ in range(MAX_SUFFIX_TIER + 1):
        tier = _get_suffix_tier(db)
        for _ in range(MAX_TRIES_PER_TIER):
            candidate = prefix + _build_suffix_for_tier(tier)
            if is_valid_my_code(candidate) and not _my_code_exists(db, candidate):
                return candidate
        _bump_suffix_tier(db, tier)

    raise RuntimeError("Could not generate unique my code; check MAX_SUFFIX_TIER")
