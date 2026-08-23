"""내 검사실 ↔ 담당 상담사 1:1 문의 채팅."""
from __future__ import annotations

from datetime import datetime, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import CLIENT_PORTALS_COLLECTION, PORTAL_CHAT_MESSAGES_COLLECTION, USERS_COLLECTION
from utils.client_portal_list import get_counselor_client_portal_detail, list_counselor_client_portals


def _iso_timestamp(value) -> str | None:
    if value is None:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _message_json(doc) -> dict:
    d = doc.to_dict() or {}
    return {
        "messageId": doc.id,
        "portalId": d.get("portalId", ""),
        "counselorId": d.get("counselorId", ""),
        "senderRole": d.get("senderRole", ""),
        "message": d.get("message", ""),
        "createdAt": _iso_timestamp(d.get("createdAt")),
        "readByPortal": bool(d.get("readByPortal")),
        "readByCounselor": bool(d.get("readByCounselor")),
    }


def _get_portal_counselor_id(db, portal_id: str) -> tuple[str | None, dict | None]:
    pid = (portal_id or "").strip()
    if not pid or pid.startswith("legacy:"):
        return None, None
    pref = db.collection(CLIENT_PORTALS_COLLECTION).document(pid)
    pdoc = pref.get()
    if not pdoc.exists:
        return None, None
    pdata = pdoc.to_dict() or {}
    return (pdata.get("counselorId") or "").strip() or None, pdata


def list_portal_chat_messages(db, portal_id: str, *, limit: int = 100) -> list[dict]:
    pid = (portal_id or "").strip()
    if not pid:
        return []
    cap = max(1, min(int(limit or 100), 200))
    docs = list(
        db.collection(PORTAL_CHAT_MESSAGES_COLLECTION)
        .where("portalId", "==", pid)
        .limit(cap)
        .stream()
    )
    items = [_message_json(doc) for doc in docs]
    items.sort(key=lambda m: m.get("createdAt") or "")
    return items[-cap:]


def send_portal_chat_message(
    db,
    *,
    portal_id: str,
    counselor_id: str,
    sender_role: str,
    message: str,
) -> dict:
    text = (message or "").strip()
    if not text:
        raise ValueError("message required")
    if sender_role not in ("portal", "counselor"):
        raise ValueError("invalid sender role")
    pid = (portal_id or "").strip()
    cid = (counselor_id or "").strip()
    if not pid or not cid:
        raise ValueError("portalId and counselorId required")

    data = {
        "portalId": pid,
        "counselorId": cid,
        "senderRole": sender_role,
        "message": text[:4000],
        "createdAt": SERVER_TIMESTAMP,
        "readByPortal": sender_role == "portal",
        "readByCounselor": sender_role == "counselor",
    }
    ref = db.collection(PORTAL_CHAT_MESSAGES_COLLECTION).document()
    ref.set(data)
    snap = ref.get()
    return _message_json(snap)


def mark_portal_chat_read(db, portal_id: str, *, reader_role: str) -> None:
    pid = (portal_id or "").strip()
    if not pid:
        return
    field = "readByPortal" if reader_role == "portal" else "readByCounselor"
    docs = (
        db.collection(PORTAL_CHAT_MESSAGES_COLLECTION)
        .where("portalId", "==", pid)
        .where(field, "==", False)
        .limit(200)
        .stream()
    )
    batch = db.batch()
    count = 0
    for doc in docs:
        batch.update(doc.reference, {field: True})
        count += 1
        if count >= 200:
            break
    if count:
        batch.commit()


def list_counselor_chat_threads(db, counselor_uid: str | None) -> list[dict]:
    """상담사용 — 내담자별 최근 메시지 스레드."""
    portal_result = list_counselor_client_portals(db, counselor_uid, status="active")
    portal_items = portal_result.get("items") or []

    query = db.collection(PORTAL_CHAT_MESSAGES_COLLECTION)
    if counselor_uid:
        query = query.where("counselorId", "==", counselor_uid)
    docs = list(query.limit(2000).stream())

    meta_by_portal: dict[str, dict] = {}
    for doc in docs:
        d = doc.to_dict() or {}
        pid = (d.get("portalId") or "").strip()
        if not pid:
            continue
        created = _iso_timestamp(d.get("createdAt")) or ""
        msg_preview = (d.get("message") or "").strip()
        sender = d.get("senderRole", "")
        unread = sender == "portal" and not bool(d.get("readByCounselor"))
        entry = meta_by_portal.get(pid)
        if not entry:
            meta_by_portal[pid] = {
                "lastMessage": msg_preview,
                "lastMessageAt": created,
                "unreadCount": 1 if unread else 0,
            }
            continue
        if created >= (entry.get("lastMessageAt") or ""):
            entry["lastMessage"] = msg_preview
            entry["lastMessageAt"] = created
        if unread:
            entry["unreadCount"] = int(entry.get("unreadCount") or 0) + 1

    threads: list[dict] = []
    for item in portal_items:
        pid = (item.get("portalId") or "").strip()
        if not pid:
            continue
        meta = meta_by_portal.get(pid) or {}
        threads.append(
            {
                "portalId": pid,
                "displayName": item.get("displayName") or "내담자",
                "accessCode": item.get("accessCode") or "",
                "cohortName": item.get("cohortName") or "",
                "lastMessage": meta.get("lastMessage") or "",
                "lastMessageAt": meta.get("lastMessageAt"),
                "unreadCount": int(meta.get("unreadCount") or 0),
            }
        )

    threads.sort(
        key=lambda t: (t.get("lastMessageAt") or "", t.get("displayName") or ""),
        reverse=True,
    )
    return threads


def assert_counselor_can_access_portal(db, counselor_uid: str | None, portal_id: str) -> dict:
    detail = get_counselor_client_portal_detail(db, counselor_uid, portal_id)
    if not detail:
        raise PermissionError("forbidden")
    counselor_id, _ = _get_portal_counselor_id(db, portal_id)
    if not counselor_id:
        raise PermissionError("forbidden")
    portal = detail.get("portal") or {}
    return {**portal, "counselorId": counselor_id}


def assert_portal_session(db, portal_id: str) -> tuple[str, dict]:
    cid, pdata = _get_portal_counselor_id(db, portal_id)
    if not cid or not pdata:
        raise LookupError("portal not found")
    return cid, pdata
