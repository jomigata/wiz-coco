# 인증/권한 부트스트랩·레거시 데이터 연결
from flask import Blueprint, jsonify
from firebase_admin.firestore import SERVER_TIMESTAMP

from firebase_init import get_firestore
from auth_middleware import get_bearer_uid, get_bearer_email_optional, invalidate_role_cache
from utils.counselor_role_sync import coerce_role, persist_user_role, resolve_counselor_access_role
from config import (
    USERS_COLLECTION,
    TEST_RESULTS_COLLECTION,
)

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/bootstrap-role", methods=["POST"])
def bootstrap_role():
    """
    로그인 사용자의 Firestore users/{uid}.role 부트스트랩.
    - 부트스트랩 이메일이면 admin/counselor로 승격
    - 승인된 상담사 신청이 있으면 counselor로 승격
    """
    uid = get_bearer_uid()
    if not uid:
        return jsonify({"error": "Unauthorized", "message": "Valid Firebase ID token required"}), 401

    email = get_bearer_email_optional()
    stored_role = None
    try:
        db = get_firestore()
        ref = db.collection(USERS_COLLECTION).document(uid)
        doc = ref.get()
        existing = (doc.to_dict() or {}) if doc.exists else {}
        stored_role = existing.get("role")
    except Exception:
        stored_role = None

    try:
        resolved = resolve_counselor_access_role(uid, email, stored_role)
        invalidate_role_cache(uid)
        if resolved in ("admin", "counselor"):
            return jsonify(
                {
                    "uid": uid,
                    "role": resolved,
                    "upgraded": resolved != stored_role,
                }
            ), 200

        current = coerce_role(stored_role) or "user"
        if current == "user" and stored_role is not None:
            persist_user_role(uid, current, email)
        return jsonify({"uid": uid, "role": current}), 200
    except Exception:
        fallback = resolve_counselor_access_role(uid, email, stored_role)
        invalidate_role_cache(uid)
        role = fallback if fallback in ("admin", "counselor") else "user"
        return jsonify({"uid": uid, "role": role, "degraded": True}), 200


@bp.route("/link-legacy-data", methods=["POST"])
def link_legacy_data():
    """
    동일 이메일로 저장된 testResults·users 레거시 문서를 현재 Firebase uid에 연결.
    (Google OAuth google_* uid 와 예전 로그인 uid 불일치 복구)
    """
    uid = get_bearer_uid()
    if not uid:
        return jsonify({"error": "Unauthorized", "message": "Valid Firebase ID token required"}), 401

    email = (get_bearer_email_optional() or "").strip().lower()
    if not email:
        return jsonify(
            {
                "uid": uid,
                "linkedTestResults": 0,
                "message": "이메일 클레임이 없어 연결할 레거시 데이터가 없습니다.",
            }
        ), 200

    try:
        db = get_firestore()
        linked = 0
        seen_ids: set[str] = set()

        def _link_snap(snap) -> None:
            nonlocal linked
            if snap.id in seen_ids:
                return
            seen_ids.add(snap.id)
            data = snap.to_dict() or {}
            updates: dict = {}
            if data.get("uid") != uid:
                updates["uid"] = uid
            if data.get("clientUid") != uid:
                updates["clientUid"] = uid
            if updates:
                updates["updatedAt"] = SERVER_TIMESTAMP
                snap.reference.update(updates)
                linked += 1

        for field in ("email", "clientEmail"):
            refs = (
                db.collection(TEST_RESULTS_COLLECTION)
                .where(field, "==", email)
                .limit(500)
                .stream()
            )
            for snap in refs:
                _link_snap(snap)

        for udoc in db.collection(USERS_COLLECTION).where("email", "==", email).limit(20).stream():
            old_uid = udoc.id
            if not old_uid or old_uid == uid:
                continue
            for snap in (
                db.collection(TEST_RESULTS_COLLECTION)
                .where("uid", "==", old_uid)
                .limit(500)
                .stream()
            ):
                _link_snap(snap)

        user_ref = db.collection(USERS_COLLECTION).document(uid)
        user_ref.set(
            {
                "email": email,
                "linkedLegacyAt": SERVER_TIMESTAMP,
            },
            merge=True,
        )

        return jsonify(
            {
                "uid": uid,
                "email": email,
                "linkedTestResults": linked,
            }
        ), 200
    except Exception as exc:
        return jsonify(
            {
                "uid": uid,
                "email": email,
                "linkedTestResults": 0,
                "message": f"레거시 연결을 건너뛰었습니다: {str(exc)[:120]}",
            }
        ), 200
