"""내담자 포털 세션 토큰 검증 (Authorization: Portal …)."""
from flask import request
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from config import SECRET_KEY, PORTAL_SESSION_REMEMBER_MAX_AGE


def verify_portal_token(token: str):
    raw = (token or "").strip()
    if raw.lower().startswith("portal "):
        raw = raw[7:].strip()
    if not raw:
        return None
    try:
        serializer = URLSafeTimedSerializer(SECRET_KEY, salt="portal-session")
        return serializer.loads(raw, max_age=PORTAL_SESSION_REMEMBER_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None


def get_portal_session_from_request():
    """Authorization 헤더에서 포털 세션 payload 반환. 없거나 만료 시 None."""
    auth = (request.headers.get("Authorization") or "").strip()
    if not auth:
        return None
    if auth.lower().startswith("portal "):
        return verify_portal_token(auth)
    if auth.lower().startswith("bearer "):
        # Bearer 뒤에 포털 토큰이 올 수 있음(레거시 클라이언트)
        return verify_portal_token(auth[7:].strip())
    return verify_portal_token(auth)
