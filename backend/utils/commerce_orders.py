# 결제 주문 (Firestore commerceOrders)
from __future__ import annotations

import secrets
import time

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import COMMERCE_ORDERS_COLLECTION
from data.commerce_products import get_product, CommerceProduct


def generate_order_id(counselor_uid: str) -> str:
    suffix = secrets.token_hex(4)
    ts = int(time.time())
    uid_part = (counselor_uid or "x")[:8]
    return f"wiz_{uid_part}_{ts}_{suffix}"


def create_pending_order(
    db,
    *,
    counselor_uid: str,
    product: CommerceProduct,
) -> dict:
    order_id = generate_order_id(counselor_uid)
    ref = db.collection(COMMERCE_ORDERS_COLLECTION).document(order_id)
    payload = {
        "orderId": order_id,
        "counselorUid": counselor_uid,
        "productId": product.id,
        "productName": product.name,
        "amount": product.amount,
        "credits": product.credits,
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


def find_paid_order_by_payment_key(db, payment_key: str) -> dict | None:
    if not payment_key:
        return None
    snaps = (
        db.collection(COMMERCE_ORDERS_COLLECTION)
        .where("tossPaymentKey", "==", payment_key)
        .limit(1)
        .stream()
    )
    for snap in snaps:
        d = snap.to_dict() or {}
        d["id"] = snap.id
        return d
    return None
