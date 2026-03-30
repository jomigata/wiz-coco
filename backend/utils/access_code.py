# 검사코드(accessCode) 생성·검증
# 신규: CVC(자음-모음-자음, L/I/O/0/1 제외) + 숫자(2~9만), 숫자 자릿수는 3부터 시작.
# 충돌이 잦으면 Firestore system_meta에 numeric_length를 올려 4자리·5자리… 로 확장.
# 구형: 기존 6자리 영숫자 코드 호환.
import random
import re

from firebase_admin.firestore import SERVER_TIMESTAMP

from firebase_init import get_firestore
from config import ASSESSMENTS_COLLECTION

# 자음 20(L 제외), 모음 A/E/U(I,O 제외)
CONSONANTS = "BCDFGHJKMNPQRSTVWXYZ"
VOWELS = "AEU"
NUMERIC_CHARS = "23456789"

SYSTEM_META_COLLECTION = "system_meta"
ACCESS_CODE_CONFIG_DOC = "access_code_generation"

NEW_CODE_RE = re.compile(
    rf"^[{CONSONANTS}][{VOWELS}][{CONSONANTS}][{NUMERIC_CHARS}]{{3,}}$"
)
OLD_CODE_RE = re.compile(r"^[0-9A-Z]{6}$")

MAX_TRIES_PER_LENGTH = 150
MAX_NUMERIC_LENGTH = 24
MAX_BUMP_STEPS = 26  # 3 .. 28 근방까지 시도


def normalize_access_code(raw: str) -> str:
    """하이픈·공백 제거 후 대문자 영숫자만."""
    return "".join(c for c in (raw or "").strip().upper() if c.isalnum())


def is_valid_access_code(code: str) -> bool:
    if not code:
        return False
    if OLD_CODE_RE.match(code):
        return True
    return bool(NEW_CODE_RE.match(code))


def _random_cvc() -> str:
    return random.choice(CONSONANTS) + random.choice(VOWELS) + random.choice(CONSONANTS)


def _random_numeric(n: int) -> str:
    return "".join(random.choices(NUMERIC_CHARS, k=n))


def _get_numeric_length(db) -> int:
    doc = db.collection(SYSTEM_META_COLLECTION).document(ACCESS_CODE_CONFIG_DOC).get()
    if doc.exists:
        n = doc.to_dict().get("numeric_length")
        if isinstance(n, int) and n >= 3:
            return min(n, MAX_NUMERIC_LENGTH)
    return 3


def _bump_numeric_length(db, current: int) -> int:
    new_n = min(current + 1, MAX_NUMERIC_LENGTH)
    db.collection(SYSTEM_META_COLLECTION).document(ACCESS_CODE_CONFIG_DOC).set(
        {"numeric_length": new_n, "updatedAt": SERVER_TIMESTAMP},
        merge=True,
    )
    return new_n


def generate_unique_access_code() -> str:
    """Firestore에 없는 accessCode 생성 (신규 규칙)."""
    db = get_firestore()
    coll = db.collection(ASSESSMENTS_COLLECTION)

    for _ in range(MAX_BUMP_STEPS):
        n = _get_numeric_length(db)
        for _ in range(MAX_TRIES_PER_LENGTH):
            candidate = _random_cvc() + _random_numeric(n)
            refs = coll.where("accessCode", "==", candidate).limit(1).get()
            if not refs:
                return candidate
        _bump_numeric_length(db, n)

    raise RuntimeError("Could not generate unique access code; check MAX_NUMERIC_LENGTH")
