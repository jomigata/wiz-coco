# 상담사 인증: Firebase ID 토큰 검증
import re
from functools import wraps
from flask import request, jsonify

from firebase_init import verify_id_token


def get_bearer_uid():
    """Authorization: Bearer <token> 에서 uid 반환. 없거나 실패 시 None."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth[7:].strip()
    if not token:
        return None
    try:
        return verify_id_token(token)
    except Exception:
        return None


def require_counselor(f):
    """상담사 전용 라우트: ID 토큰 검증 후 uid를 g.counselor_uid에 설정."""
    @wraps(f)
    def decorated(*args, **kwargs):
        uid = get_bearer_uid()
        if not uid:
            return jsonify({"error": "Unauthorized", "message": "Valid Firebase ID token required"}), 401
        from flask import g
        g.counselor_uid = uid
        return f(*args, **kwargs)
    return decorated
