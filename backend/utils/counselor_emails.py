"""상담사 UID → 이메일 일괄 조회 (관리자 목록용)."""
from __future__ import annotations

from config import USERS_COLLECTION


def resolve_counselor_emails(db, counselor_ids: set[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for uid in counselor_ids:
        u = (uid or "").strip()
        if not u or u in out:
            continue
        doc = db.collection(USERS_COLLECTION).document(u).get()
        if doc.exists:
            out[u] = ((doc.to_dict() or {}).get("email") or "").strip()
        else:
            out[u] = ""
    return out


def attach_counselor_emails(
    db,
    items: list[dict],
    *,
    id_key: str = "counselorId",
    email_key: str = "counselorEmail",
) -> None:
    ids = {(item.get(id_key) or "").strip() for item in items if (item.get(id_key) or "").strip()}
    if not ids:
        return
    emails = resolve_counselor_emails(db, ids)
    for item in items:
        uid = (item.get(id_key) or "").strip()
        if uid:
            item[email_key] = emails.get(uid, "")
