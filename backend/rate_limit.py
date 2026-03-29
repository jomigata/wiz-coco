# 간단 Rate limiting (검사 코드 입력·비밀번호 API)
from collections import defaultdict
from time import time
from threading import Lock
from functools import wraps
from flask import request, jsonify

from config import RATE_LIMIT_ACCESS_CODE, RATE_LIMIT_PASSWORD_API

_store = defaultdict(list)
_lock = Lock()


def _is_over_limit(key: str, limit_per_minute: int) -> bool:
    if limit_per_minute <= 0:
        return False
    now = time()
    with _lock:
        store = _store[key]
        # 1분 이전 기록 제거
        store[:] = [t for t in store if now - t < 60]
        if len(store) >= limit_per_minute:
            return True
        store.append(now)
    return False


def _client_key():
    return request.remote_addr or "unknown"


def limit_access_code(f):
    """검사 코드 관련 API (공개 코드 조회 등) 제한."""
    @wraps(f)
    def decorated(*args, **kwargs):
        key = f"access_code:{_client_key()}"
        if _is_over_limit(key, RATE_LIMIT_ACCESS_CODE):
            return jsonify({"error": "Too Many Requests", "message": "Rate limit exceeded"}), 429
        return f(*args, **kwargs)
    return decorated


def limit_password_api(f):
    """비밀번호 확인 API (PUT/DELETE results) 제한."""
    @wraps(f)
    def decorated(*args, **kwargs):
        key = f"password_api:{_client_key()}"
        if _is_over_limit(key, RATE_LIMIT_PASSWORD_API):
            return jsonify({"error": "Too Many Requests", "message": "Rate limit exceeded"}), 429
        return f(*args, **kwargs)
    return decorated
