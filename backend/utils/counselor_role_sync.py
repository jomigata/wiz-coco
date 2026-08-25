"""상담사 role 동기화 — 승인 신청·부트스트랩 이메일·기존 users 문서."""
from config import (
    BOOTSTRAP_ADMIN_EMAILS,
    BOOTSTRAP_COUNSELOR_EMAILS,
    COUNSELOR_APPLICATIONS_COLLECTION,
    USERS_COLLECTION,
)
from firebase_init import get_firestore

COUNSELORS_COLLECTION = "counselors"


def normalize_email(email: str | None) -> str | None:
    if not email:
        return None
    e = str(email).strip().lower()
    return e if e and "@" in e else None


def coerce_role(value) -> str | None:
    if value is None:
        return None
    role = str(value).strip().lower()
    if role in ("admin", "counselor", "user", "org_admin"):
        return role
    return None


def bootstrap_role_for_email(email: str | None) -> str | None:
    e = normalize_email(email)
    if not e:
        return None
    if e in BOOTSTRAP_ADMIN_EMAILS:
        return "admin"
    if e in BOOTSTRAP_COUNSELOR_EMAILS:
        return "counselor"
    return None


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


def _has_approved_counselor_application(db, uid: str, email: str | None) -> bool:
    try:
        for snap in (
            db.collection(COUNSELOR_APPLICATIONS_COLLECTION)
            .where("applicantUid", "==", uid)
            .limit(20)
            .stream()
        ):
            data = snap.to_dict() or {}
            if (data.get("status") or "").strip() == "approved":
                return True
    except Exception:
        pass

    normalized = normalize_email(email)
    if not normalized:
        return False
    try:
        for snap in (
            db.collection(COUNSELOR_APPLICATIONS_COLLECTION)
            .where("personalInfo.email", "==", normalized)
            .limit(20)
            .stream()
        ):
            data = snap.to_dict() or {}
            if (data.get("status") or "").strip() == "approved":
                return True
    except Exception:
        pass
    return False


def _role_from_email_user_docs(db, uid: str, email: str | None) -> str | None:
    normalized = normalize_email(email)
    if not normalized:
        return None
    try:
        for snap in db.collection(USERS_COLLECTION).where("email", "==", normalized).limit(20).stream():
            role = coerce_role((snap.to_dict() or {}).get("role"))
            if role in ("admin", "counselor"):
                if snap.id != uid:
                    persist_user_role(uid, role, normalized)
                return role
    except Exception:
        return None
    return None


def _has_counselors_profile(db, uid: str) -> bool:
    try:
        doc = db.collection(COUNSELORS_COLLECTION).document(uid).get()
        return bool(doc.exists)
    except Exception:
        return False


def resolve_counselor_access_role(uid: str, email: str | None, stored_role: str | None) -> str | None:
    """
    API 접근 가능 role(admin/counselor) 결정.
    Firestore 저장은 best-effort. 실패해도 부트스트랩 이메일이면 허용.
    """
    role = coerce_role(stored_role)
    normalized = normalize_email(email)

    if role in ("admin", "counselor"):
        return role

    desired = bootstrap_role_for_email(normalized)
    if desired:
        persist_user_role(uid, desired, normalized)
        return desired

    try:
        db = get_firestore()
        email_role = _role_from_email_user_docs(db, uid, normalized)
        if email_role in ("admin", "counselor"):
            return email_role
        if _has_approved_counselor_application(db, uid, normalized):
            persist_user_role(uid, "counselor", normalized)
            return "counselor"
        if _has_counselors_profile(db, uid):
            persist_user_role(uid, "counselor", normalized)
            return "counselor"
    except Exception:
        pass

    return None
