"""상담사 role 동기화 — 승인 신청·부트스트랩 이메일."""
from config import (
    BOOTSTRAP_ADMIN_EMAILS,
    BOOTSTRAP_COUNSELOR_EMAILS,
    COUNSELOR_APPLICATIONS_COLLECTION,
    USERS_COLLECTION,
)
from firebase_init import get_firestore


def normalize_email(email: str | None) -> str | None:
    if not email:
        return None
    e = email.strip().lower()
    return e if e and "@" in e else None


def bootstrap_role_for_email(email: str | None) -> str | None:
    e = normalize_email(email)
    if not e:
        return None
    if e in BOOTSTRAP_ADMIN_EMAILS:
        return "admin"
    if e in BOOTSTRAP_COUNSELOR_EMAILS:
        return "counselor"
    return None


def has_approved_counselor_application(db, uid: str) -> bool:
    try:
        for snap in (
            db.collection(COUNSELOR_APPLICATIONS_COLLECTION)
            .where("applicantUid", "==", uid)
            .limit(12)
            .stream()
        ):
            data = snap.to_dict() or {}
            if (data.get("status") or "").strip() == "approved":
                return True
    except Exception:
        return False
    return False


def persist_user_role(uid: str, role: str, email: str | None = None) -> bool:
    if role not in ("admin", "counselor", "user", "org_admin"):
        return False
    try:
        db = get_firestore()
        payload: dict[str, str] = {"role": role}
        normalized = normalize_email(email)
        if normalized:
            payload["email"] = normalized
        db.collection(USERS_COLLECTION).document(uid).set(payload, merge=True)
        return True
    except Exception:
        return False


def resolve_counselor_access_role(uid: str, email: str | None, stored_role: str | None) -> str | None:
    """
    API 접근 가능 role(admin/counselor) 결정.
    Firestore 저장은 best-effort; 실패해도 부트스트랩 이메일이면 API 허용.
    """
    role = (stored_role or "").strip() or None
    normalized = normalize_email(email)

    if role in ("admin", "counselor"):
        return role

    desired = bootstrap_role_for_email(normalized)
    if desired:
        persist_user_role(uid, desired, normalized)
        return desired

    try:
        db = get_firestore()
        if has_approved_counselor_application(db, uid):
            if persist_user_role(uid, "counselor", normalized):
                return "counselor"
            return "counselor"
    except Exception:
        pass

    return None
