# 6자리 검사 코드 생성 (중복 방지)
import random
import string

from firebase_init import get_firestore
from config import ASSESSMENTS_COLLECTION


def _generate_code() -> str:
    """0-9, A-Z(대문자만) 6자리 코드 생성."""
    chars = string.digits + string.ascii_uppercase
    return "".join(random.choices(chars, k=6))


def generate_unique_access_code() -> str:
    """Firestore에 없는 6자리 accessCode 생성."""
    db = get_firestore()
    coll = db.collection(ASSESSMENTS_COLLECTION)
    for _ in range(50):
        code = _generate_code()
        refs = coll.where("accessCode", "==", code).limit(1).get()
        if not refs:
            return code
    raise RuntimeError("Could not generate unique access code after 50 attempts")
