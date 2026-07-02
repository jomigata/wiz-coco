# paymentHistory 기록 (Admin SDK)
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import PAYMENT_HISTORY_COLLECTION


def record_payment(
    db,
    *,
    uid: str,
    order_id: str,
    product_id: str,
    amount: int,
    credits_granted: int,
    payment_key: str = "",
    payment_method: str = "",
    provider: str = "toss",
    metadata: dict | None = None,
) -> str:
    """Idempotent by paymentKey when provided."""
    if payment_key:
        existing = (
            db.collection(PAYMENT_HISTORY_COLLECTION)
            .where("paymentKey", "==", payment_key)
            .limit(1)
            .stream()
        )
        for snap in existing:
            return snap.id

    payload = {
        "uid": uid,
        "orderId": order_id,
        "productId": product_id,
        "amount": amount,
        "creditsGranted": credits_granted,
        "paymentKey": payment_key or None,
        "paymentMethod": payment_method or None,
        "provider": provider,
        "status": "completed",
        "createdAt": SERVER_TIMESTAMP,
    }
    if metadata:
        payload["metadata"] = metadata

    _ref = db.collection(PAYMENT_HISTORY_COLLECTION).add(payload)
    return _ref[1].id


def list_payments(db, *, limit: int = 100, uid: str | None = None) -> list[dict]:
    limit = max(1, min(limit, 500))
    coll = db.collection(PAYMENT_HISTORY_COLLECTION)
    if uid:
        snaps = coll.where("uid", "==", uid).limit(limit).stream()
    else:
        snaps = coll.limit(min(limit * 3, 500)).stream()

    rows = []
    for snap in snaps:
        d = snap.to_dict() or {}
        d["id"] = snap.id
        created = d.get("createdAt")
        if created and hasattr(created, "isoformat"):
            d["createdAt"] = created.isoformat()
        elif created and hasattr(created, "timestamp"):
            from datetime import datetime

            d["createdAt"] = datetime.utcfromtimestamp(created.timestamp()).isoformat() + "Z"
        rows.append(d)
    rows.sort(key=lambda x: x.get("createdAt") or "", reverse=True)
    return rows[:limit]
