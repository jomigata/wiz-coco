"""내담자 포털(앱) 인앱 알림 — 추천 검사·숙제 등 SMS/알림톡 대신 내 검사실에 표시."""
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP, Increment

from config import CLIENT_PORTALS_COLLECTION

PORTAL_APP_NOTIFICATIONS_SUBCOL = "appNotifications"


def _notifications_col(db, portal_id: str):
    return (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .document(portal_id)
        .collection(PORTAL_APP_NOTIFICATIONS_SUBCOL)
    )


def deliver_portal_app_notification(
    db,
    *,
    portal_id: str,
    kind: str,
    title: str,
    body: str,
    action_path: str = "/portal/",
    metadata: dict | None = None,
) -> dict:
    pid = (portal_id or "").strip()
    if not pid:
        return {"status": "failed", "message": "missing_portal_id"}

    ref = _notifications_col(db, pid).document()
    ref.set(
        {
            "kind": (kind or "general").strip() or "general",
            "title": (title or "").strip() or "새 안내",
            "body": (body or "").strip(),
            "actionPath": (action_path or "/portal/").strip() or "/portal/",
            "metadata": metadata or {},
            "read": False,
            "createdAt": SERVER_TIMESTAMP,
        }
    )
    db.collection(CLIENT_PORTALS_COLLECTION).document(pid).set(
        {
            "appNotifyUnreadCount": Increment(1),
            "lastAppNotifyAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )
    return {
        "status": "sent",
        "sentVia": "app",
        "notificationId": ref.id,
    }


def list_portal_app_notifications(db, portal_id: str, *, limit: int = 40) -> dict:
    pid = (portal_id or "").strip()
    if not pid:
        return {"items": [], "unreadCount": 0}

    portal_doc = db.collection(CLIENT_PORTALS_COLLECTION).document(pid).get()
    unread = 0
    if portal_doc.exists:
        unread = int((portal_doc.to_dict() or {}).get("appNotifyUnreadCount") or 0)

    snaps = (
        _notifications_col(db, pid)
        .order_by("createdAt", direction="DESCENDING")
        .limit(max(1, min(limit, 100)))
        .stream()
    )
    items: list[dict] = []
    for snap in snaps:
        data = snap.to_dict() or {}
        created = data.get("createdAt")
        created_iso = None
        if hasattr(created, "isoformat"):
            try:
                created_iso = created.isoformat()
            except Exception:
                created_iso = None
        elif hasattr(created, "timestamp"):
            try:
                from datetime import datetime, timezone

                created_iso = datetime.fromtimestamp(
                    created.timestamp(), tz=timezone.utc
                ).isoformat()
            except Exception:
                created_iso = None
        items.append(
            {
                "id": snap.id,
                "kind": data.get("kind") or "general",
                "title": data.get("title") or "",
                "body": data.get("body") or "",
                "actionPath": data.get("actionPath") or "/portal/",
                "metadata": data.get("metadata") or {},
                "read": bool(data.get("read")),
                "createdAt": created_iso,
            }
        )
    return {"items": items, "unreadCount": unread}


def mark_portal_app_notifications_read(
    db,
    portal_id: str,
    *,
    notification_ids: list[str] | None = None,
    mark_all: bool = False,
) -> dict:
    pid = (portal_id or "").strip()
    if not pid:
        return {"updated": 0, "unreadCount": 0}

    col = _notifications_col(db, pid)
    updated = 0

    if mark_all:
        for snap in col.where("read", "==", False).stream():
            snap.reference.update({"read": True})
            updated += 1
    elif notification_ids:
        for nid in notification_ids:
            nid = (nid or "").strip()
            if not nid:
                continue
            ref = col.document(nid)
            doc = ref.get()
            if doc.exists and not (doc.to_dict() or {}).get("read"):
                ref.update({"read": True})
                updated += 1

    portal_ref = db.collection(CLIENT_PORTALS_COLLECTION).document(pid)
    portal_doc = portal_ref.get()
    unread = 0
    if portal_doc.exists:
        current = int((portal_doc.to_dict() or {}).get("appNotifyUnreadCount") or 0)
        unread = max(0, current - updated)
        portal_ref.update({"appNotifyUnreadCount": unread})
    return {"updated": updated, "unreadCount": unread}
