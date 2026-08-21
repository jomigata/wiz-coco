"""상담사 UID 조회 — 이메일·Firestore users 기준."""
from __future__ import annotations

from config import USERS_COLLECTION


def resolve_counselor_by_email(db, email: str) -> tuple[str, str, dict] | None:
    """이메일로 counselor/admin 사용자를 찾으면 (uid, role, user_data) 반환."""
    normalized = (email or "").strip().lower()
    if not normalized:
        return None

    for udoc in db.collection(USERS_COLLECTION).where("email", "==", normalized).limit(20).stream():
        data = udoc.to_dict() or {}
        role = data.get("role")
        if role in ("counselor", "admin"):
            return udoc.id, role or "counselor", data
    return None


def counselor_display_name(user_data: dict | None) -> str:
    data = user_data or {}
    for key in ("displayName", "name", "fullName", "nickname"):
        value = (data.get(key) or "").strip()
        if value:
            return value
    email = (data.get("email") or "").strip()
    if email and "@" in email:
        return email.split("@", 1)[0]
    return "담당 상담사"
