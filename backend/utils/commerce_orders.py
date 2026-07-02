# 결제 주문 (Firestore commerceOrders)
from __future__ import annotations

import secrets
import time

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import COMMERCE_ORDERS_COLLECTION
from data.commerce_products import CommerceProduct


def generate_order_id(buyer_uid: str) -> str:
    suffix = secrets.token_hex(4)
    ts = int(time.time())
    uid_part = (buyer_uid or "x")[:8]
    return f"wiz_{uid_part}_{ts}_{suffix}"


def create_pending_order(
    db,
    *,
    buyer_uid: str,
    product: CommerceProduct,
    channel: str | None = None,
) -> dict:
    ch = channel or product.channel or "b2b2c"
    order_id = generate_order_id(buyer_uid)
    ref = db.collection(COMMERCE_ORDERS_COLLECTION).document(order_id)
    payload = {
        "orderId": order_id,
        "buyerUid": buyer_uid,
        "counselorUid": buyer_uid if ch == "b2b2c" else "",
        "channel": ch,
        "productId": product.id,
        "productName": product.name,
        "amount": product.amount,
        "credits": product.credits,
        "entitlementTier": product.entitlement_tier,
        "productType": product.product_type,
        "planId": product.plan_id,
        "status": "pending",
        "tossPaymentKey": "",
        "createdAt": SERVER_TIMESTAMP,
        "paidAt": None,
    }
    ref.set(payload)
    return {"orderId": order_id, "amount": product.amount, "orderName": product.name}


def get_order(db, order_id: str) -> dict | None:
    doc = db.collection(COMMERCE_ORDERS_COLLECTION).document(order_id).get()
    if not doc.exists:
        return None
    d = doc.to_dict() or {}
    d["id"] = doc.id
    return d


def order_buyer_uid(order: dict) -> str:
    return (order.get("buyerUid") or order.get("counselorUid") or "").strip()


def mark_order_paid(
    db,
    order_id: str,
    *,
    toss_payment_key: str = "",
    payment_method: str = "",
) -> dict | None:
    ref = db.collection(COMMERCE_ORDERS_COLLECTION).document(order_id)
    doc = ref.get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    if data.get("status") == "paid":
        return data
    ref.update(
        {
            "status": "paid",
            "tossPaymentKey": toss_payment_key or data.get("tossPaymentKey") or "",
            "paymentMethod": payment_method,
            "paidAt": SERVER_TIMESTAMP,
        }
    )
    updated = ref.get().to_dict() or {}
    updated["id"] = order_id
    return updated
