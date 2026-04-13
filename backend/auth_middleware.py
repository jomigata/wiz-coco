# 상담사 인증: Firebase ID 토큰 검증
import re
from functools import wraps
from flask import request, jsonify

from firebase_init import verify_id_token, verify_id_token_claims


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


def get_bearer_client_email():
    """
    내담자(검사 코드) API용: Authorization Bearer ID 토큰에서 이메일 추출.
    이메일 로그인·구글 등 토큰에 email 클레임이 있어야 함.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:].strip()
    if not token:
        return None
    claims = verify_id_token_claims(token)
    if not claims:
        return None
    email = (claims.get("email") or "").strip().lower()
    if not email or "@" not in email:
        return None
    return email


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
