"""나의코드(포털 accessCode) 생성·검증 — YY(2자리 연도) + 숫자(3자리~, 2~9만)."""
from __future__ import annotations

import random
import re
from datetime import datetime, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION
from firebase_init import get_firestore

NUMERIC_CHARS = "23456789"
SYSTEM_META_COLLECTION = "system_meta"
MY_CODE_CONFIG_DOC = "my_code_generation"

MY_CODE_RE = re.compile(rf"^\d{{2}}[{NUMERIC_CHARS}]{{3,}}$")

MAX_TRIES_PER_LENGTH = 150
MAX_NUMERIC_LENGTH = 24
MAX_BUMP_STEPS = 26


def normalize_my_code(raw: str) -> str:
    """숫자만 추출 (나의코드 입력 정규화)."""
    return "".join(c for c in (raw or "").strip() if c.isdigit())


def is_valid_my_code(code: str) -> bool:
    if not code:
        return False
    return bool(MY_CODE_RE.match(code))


def _random_numeric(n: int) -> str:
    return "".join(random.choices(NUMERIC_CHARS, k=n))


def _year_prefix() -> str:
    return f"{datetime.now(timezone.utc).year % 100:02d}"


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
    """Firestore 전역 유일 나의코드 (YY + 숫자 3자리~)."""
    db = get_firestore()
    yy = _year_prefix()

    for _ in range(MAX_BUMP_STEPS):
        n = _get_numeric_length(db)
        for _ in range(MAX_TRIES_PER_LENGTH):
            candidate = yy + _random_numeric(n)
            if not _my_code_exists(db, candidate):
                return candidate
        _bump_numeric_length(db, n)

    raise RuntimeError("Could not generate unique my code; check MAX_NUMERIC_LENGTH")
