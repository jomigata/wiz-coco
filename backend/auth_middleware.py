# 상담사 인증: Firebase ID 토큰 검증
import re
from functools import wraps
from flask import request, jsonify

from firebase_init import verify_id_token, verify_id_token_claims
from firebase_init import get_firestore
from config import USERS_COLLECTION


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


def get_bearer_claims():
    """Authorization: Bearer <token> 에서 디코딩된 claims(dict) 반환. 실패 시 None."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:].strip()
    if not token:
        return None
    try:
        return verify_id_token_claims(token)
    except Exception:
        return None


def get_bearer_email_optional():
    """Bearer 토큰의 email 클레임(선택). 없으면 None."""
    claims = get_bearer_claims()
    if not claims:
        return None
    email = (claims.get("email") or "").strip().lower()
    return email if email and "@" in email else None


def require_counselor(f):
    """상담사 전용 라우트: ID 토큰 검증 후 uid를 g.counselor_uid에 설정. (role: counselor/admin)"""
    @wraps(f)
    def decorated(*args, **kwargs):
        uid = get_bearer_uid()
        if not uid:
            return jsonify({"error": "Unauthorized", "message": "Valid Firebase ID token required"}), 401
        # Firestore users/{uid}.role 확인 (admin/counselor만 허용)
        try:
            db = get_firestore()
            doc = db.collection(USERS_COLLECTION).document(uid).get()
            role = (doc.to_dict() or {}).get("role") if doc.exists else None
        except Exception:
            role = None
        if role not in ("admin", "counselor"):
            return jsonify({"error": "Forbidden", "message": "Counselor role required"}), 403
        from flask import g
        g.counselor_uid = uid
        return f(*args, **kwargs)
    return decorated
