"""나의코드(포털 accessCode) 생성·검증 — 연도 알파벳(2026=A) + 숫자(3자리~, 2~9만)."""
from __future__ import annotations

import random
import re
from datetime import datetime, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION
from firebase_init import get_firestore

NUMERIC_CHARS = "23456789"
YEAR_BASE = 2026
# 숫자와 혼동되는 알파벳 제외: I/L↔1, O↔0, S↔5, Z↔2, B↔8, G↔6, Q↔9
CONFUSABLE_LETTERS = frozenset("ILOSZBGQ")
YEAR_ALPHABET = "".join(c for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" if c not in CONFUSABLE_LETTERS)
YEAR_BASE_RADIX = len(YEAR_ALPHABET)  # 18

SYSTEM_META_COLLECTION = "system_meta"
MY_CODE_CONFIG_DOC = "my_code_generation"

MY_CODE_RE = re.compile(rf"^[{YEAR_ALPHABET}]+[{NUMERIC_CHARS}]{{3,}}$")

MAX_TRIES_PER_LENGTH = 150
MAX_NUMERIC_LENGTH = 24
MAX_BUMP_STEPS = 26


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


def is_valid_my_code(code: str) -> bool:
    if not code:
        return False
    normalized = normalize_my_code(code)
    if not MY_CODE_RE.match(normalized):
        return False
    i = 0
    while i < len(normalized) and normalized[i] in YEAR_ALPHABET:
        i += 1
    return i >= 1 and (len(normalized) - i) >= 3


def _random_numeric(n: int) -> str:
    return "".join(random.choices(NUMERIC_CHARS, k=n))


def _get_numeric_length(db) -> int:
    doc = db.collection(SYSTEM_META_COLLECTION).document(MY_CODE_CONFIG_DOC).get()
    if doc.exists:
        n = doc.to_dict().get("numeric_length")
        if isinstance(n, int) and n >= 3:
            return min(n, MAX_NUMERIC_LENGTH)
    return 3


def _bump_numeric_length(db, current: int) -> int:
    new_n = min(current + 1, MAX_NUMERIC_LENGTH)
    db.collection(SYSTEM_META_COLLECTION).document(MY_CODE_CONFIG_DOC).set(
        {"numeric_length": new_n, "updatedAt": SERVER_TIMESTAMP},
        merge=True,
    )
    return new_n


def reset_my_code_generation_meta(db, *, dry_run: bool = False) -> bool:
    """나의코드 순번 자릿수를 3자리로 초기화."""
    if dry_run:
        return True
    db.collection(SYSTEM_META_COLLECTION).document(MY_CODE_CONFIG_DOC).set(
        {"numeric_length": 3, "updatedAt": SERVER_TIMESTAMP},
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
    """Firestore 전역 유일 나의코드 (연도 알파벳 + 숫자 3자리~)."""
    db = get_firestore()
    prefix = year_prefix_for()

    for _ in range(MAX_BUMP_STEPS):
        n = _get_numeric_length(db)
        for _ in range(MAX_TRIES_PER_LENGTH):
            candidate = prefix + _random_numeric(n)
            if not _my_code_exists(db, candidate):
                return candidate
        _bump_numeric_length(db, n)

    raise RuntimeError("Could not generate unique my code; check MAX_NUMERIC_LENGTH")
