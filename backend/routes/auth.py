# 인증/권한 부트스트랩·레거시 데이터 연결
from flask import Blueprint, jsonify
from firebase_admin.firestore import SERVER_TIMESTAMP

from firebase_init import get_firestore
from auth_middleware import get_bearer_uid, get_bearer_email_optional
from config import (
    USERS_COLLECTION,
    TEST_RESULTS_COLLECTION,
    BOOTSTRAP_ADMIN_EMAILS,
    BOOTSTRAP_COUNSELOR_EMAILS,
)

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _desired_bootstrap_role(email: str | None) -> str | None:
    if not email:
        return None
    e = email.strip().lower()
    if e in BOOTSTRAP_ADMIN_EMAILS:
        return "admin"
    if e in BOOTSTRAP_COUNSELOR_EMAILS:
        return "counselor"
    return None


@bp.route("/bootstrap-role", methods=["POST"])
def bootstrap_role():
    """
    로그인 사용자의 Firestore users/{uid}.role 부트스트랩.
    - 부트스트랩 이메일이면 admin/counselor로 승격(기존 user여도 갱신)
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

    desired = _desired_bootstrap_role(email)
    if desired and role != desired:
        ref.set(
            {"role": desired, **({"email": email} if email else {})},
            merge=True,
        )
        return jsonify({"uid": uid, "role": desired, "upgraded": True}), 200

    if role in ("admin", "counselor", "user"):
        return jsonify({"uid": uid, "role": role}), 200

    bootstrap_role_value = desired or "user"
    ref.set(
        {"role": bootstrap_role_value, **({"email": email} if email else {})},
        merge=True,
    )
    return jsonify({"uid": uid, "role": bootstrap_role_value}), 200


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

    # users 컬렉션에 같은 이메일로 남아 있는 예전 uid 문서 기준 연결
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

    # users 컬렉션: 동일 이메일 다른 uid 프로필에 연결 힌트 저장(관리용)
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

