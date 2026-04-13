# 인증/권한 부트스트랩
from flask import Blueprint, jsonify

from firebase_init import get_firestore
from auth_middleware import get_bearer_uid, get_bearer_email_optional
from config import USERS_COLLECTION, BOOTSTRAP_ADMIN_EMAILS, BOOTSTRAP_COUNSELOR_EMAILS

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/bootstrap-role", methods=["POST"])
def bootstrap_role():
    """
    로그인 사용자의 Firestore users/{uid}.role 부트스트랩.
    - 이미 role이 있으면 그대로 반환
    - role이 없고 email이 부트스트랩 목록에 있으면 admin/counselor로 설정
    """
    uid = get_bearer_uid()
    if not uid:
        return jsonify({"error": "Unauthorized", "message": "Valid Firebase ID token required"}), 401

    email = (get_bearer_email_optional() or "").strip().lower()
    db = get_firestore()
    ref = db.collection(USERS_COLLECTION).document(uid)
    doc = ref.get()
    existing = (doc.to_dict() or {}) if doc.exists else {}
    role = existing.get("role")
    if role in ("admin", "counselor", "user"):
        return jsonify({"uid": uid, "role": role}), 200

    bootstrap_role_value = None
    if email and email in BOOTSTRAP_ADMIN_EMAILS:
        bootstrap_role_value = "admin"
    elif email and email in BOOTSTRAP_COUNSELOR_EMAILS:
        bootstrap_role_value = "counselor"

    if bootstrap_role_value:
        ref.set({"role": bootstrap_role_value, "email": email}, merge=True)
        return jsonify({"uid": uid, "role": bootstrap_role_value}), 200

    # 기본값: user (role이 없으면 클라이언트에서 생성하지만, 여기서도 안전하게 보장)
    ref.set({"role": "user", **({"email": email} if email else {})}, merge=True)
    return jsonify({"uid": uid, "role": "user"}), 200

