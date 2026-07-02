# 상담사 인증: Firebase ID 토큰 검증
import re
import time
from functools import wraps
from flask import request, jsonify

from firebase_init import verify_id_token, verify_id_token_claims
from firebase_init import get_firestore
from config import ORGANIZATIONS_COLLECTION, USERS_COLLECTION, BOOTSTRAP_ADMIN_EMAILS, BOOTSTRAP_COUNSELOR_EMAILS

_ROLE_CACHE: dict[str, tuple[str | None, float]] = {}
_ROLE_CACHE_TTL_SEC = 300


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


def _resolve_counselor_role(uid: str, email: str | None) -> str | None:
    """Firestore users/{uid}.role — 짧은 TTL 메모리 캐시."""
    now = time.time()
    cached = _ROLE_CACHE.get(uid)
    if cached and now - cached[1] < _ROLE_CACHE_TTL_SEC:
        return cached[0]

    role = None
    try:
        db = get_firestore()
        user_ref = db.collection(USERS_COLLECTION).document(uid)
        doc = user_ref.get()
        role = (doc.to_dict() or {}).get("role") if doc.exists else None

        if role not in ("admin", "counselor") and email:
            email_norm = email.strip().lower()
            bootstrap_role = None
            if email_norm in BOOTSTRAP_ADMIN_EMAILS:
                bootstrap_role = "admin"
            elif email_norm in BOOTSTRAP_COUNSELOR_EMAILS:
                bootstrap_role = "counselor"
            if bootstrap_role:
                user_ref.set({"role": bootstrap_role, "email": email_norm}, merge=True)
                role = bootstrap_role
    except Exception:
        role = None

    _ROLE_CACHE[uid] = (role, now)
    return role


def require_counselor(f):
    """상담사 전용 라우트: ID 토큰 검증 후 uid를 g.counselor_uid에 설정. (role: counselor/admin)"""
    @wraps(f)
    def decorated(*args, **kwargs):
        uid = get_bearer_uid()
        if not uid:
            return jsonify({"error": "Unauthorized", "message": "Valid Firebase ID token required"}), 401
        email = get_bearer_email_optional()
        role = _resolve_counselor_role(uid, email)
        if role not in ("admin", "counselor"):
            return jsonify({"error": "Forbidden", "message": "Counselor role required"}), 403
        from flask import g
        g.counselor_uid = uid
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    """관리자 전용 라우트."""
    @wraps(f)
    def decorated(*args, **kwargs):
        uid = get_bearer_uid()
        if not uid:
            return jsonify({"error": "Unauthorized", "message": "Valid Firebase ID token required"}), 401
        try:
            db = get_firestore()
            user_ref = db.collection(USERS_COLLECTION).document(uid)
            doc = user_ref.get()
            role = (doc.to_dict() or {}).get("role") if doc.exists else None

            if role != "admin":
                email = get_bearer_email_optional()
                if email:
                    email = email.strip().lower()
                if email and email in BOOTSTRAP_ADMIN_EMAILS:
                    user_ref.set({"role": "admin", "email": email}, merge=True)
                    role = "admin"
        except Exception:
            role = None
        if role != "admin":
            return jsonify({"error": "Forbidden", "message": "Admin role required"}), 403
        from flask import g
        g.admin_uid = uid
        return f(*args, **kwargs)
    return decorated


def require_auth(f):
    """로그인 사용자 (B2C 결제 등)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        uid = get_bearer_uid()
        if not uid:
            return jsonify({"error": "Unauthorized", "message": "Valid Firebase ID token required"}), 401
        from flask import g
        g.auth_uid = uid
        return f(*args, **kwargs)
    return decorated


def require_org_admin(f):
    """기관 담당자(org_admin) — organizationId·liaisonCounselorUid 설정."""
    @wraps(f)
    def decorated(*args, **kwargs):
        uid = get_bearer_uid()
        if not uid:
            return jsonify({"error": "Unauthorized", "message": "Valid Firebase ID token required"}), 401
        try:
            db = get_firestore()
            user_doc = db.collection(USERS_COLLECTION).document(uid).get()
            data = user_doc.to_dict() or {} if user_doc.exists else {}
            role = data.get("role")
            org_id = (data.get("organizationId") or "").strip()

            if role == "admin" and not org_id:
                org_id = (request.headers.get("X-Organization-Id") or "").strip()

            if role not in ("org_admin", "admin") or not org_id:
                return jsonify({"error": "Forbidden", "message": "Org admin role required"}), 403

            org_doc = db.collection(ORGANIZATIONS_COLLECTION).document(org_id).get()
            if not org_doc.exists:
                return jsonify({"error": "Forbidden", "message": "Organization not found"}), 403
            org_data = org_doc.to_dict() or {}
            liaison = (org_data.get("liaisonCounselorUid") or "").strip()
            if not liaison:
                return jsonify({"error": "Forbidden", "message": "Organization liaison not configured"}), 403
        except Exception:
            return jsonify({"error": "Forbidden", "message": "Org admin check failed"}), 403

        from flask import g
        g.org_admin_uid = uid
        g.organization_id = org_id
        g.liaison_counselor_uid = liaison
        return f(*args, **kwargs)

    return decorated
