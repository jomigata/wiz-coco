# 4자리 숫자 비밀번호 생성 및 bcrypt 해싱
import random
import bcrypt


def generate_four_digit_password() -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(4))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False
