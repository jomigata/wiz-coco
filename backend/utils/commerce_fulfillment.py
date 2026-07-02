# 주문 이행 — 크레딧 충전·구독 갱신
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import SUBSCRIPTIONS_COLLECTION, COMMERCE_ORDERS_COLLECTION
from data.commerce_products import get_product
from utils.counselor_credits import grant_credits
from utils.payment_history import record_payment


def _subscription_period_end(now: datetime | None = None) -> str:
    base = now or datetime.now(timezone.utc)
    end = base + timedelta(days=30)
    return end.isoformat()


def upsert_subscription(
    db,
    *,
    counselor_uid: str,
    plan_id: str,
    credits_per_month: int,
    overage_per_credit: int | None,
) -> None:
    ref = db.collection(SUBSCRIPTIONS_COLLECTION).document(counselor_uid)
    now = datetime.now(timezone.utc)
    ref.set(
        {
            "uid": counselor_uid,
            "planId": plan_id,
            "status": "active",
            "creditsPerMonth": credits_per_month,
            "overagePerCredit": overage_per_credit,
            "currentPeriodStart": now.isoformat(),
            "currentPeriodEnd": _subscription_period_end(now),
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )


def fulfill_paid_order(
    db,
    order: dict,
    *,
    payment_key: str = "",
    payment_method: str = "",
    provider: str = "toss",
    actor_uid: str | None = None,
) -> dict:
    """
    Idempotent fulfillment for a paid commerce order.
    Returns summary with creditsGranted, paymentHistoryId.
    """
    order_id = order.get("orderId") or order.get("id") or ""
    counselor_uid = order.get("counselorUid") or ""
    product_id = order.get("productId") or ""
    amount = int(order.get("amount") or 0)
    credits = int(order.get("credits") or 0)

    if order.get("status") != "paid":
        raise ValueError("order is not paid")

    if order.get("fulfilledAt"):
        return {
            "orderId": order_id,
            "alreadyFulfilled": True,
            "creditsGranted": 0,
            "paymentHistoryId": order.get("paymentHistoryId"),
        }

    product = get_product(product_id)
    reason = f"purchase_{product_id}"
    grant_result = grant_credits(
        db,
        counselor_uid,
        credits,
        reason=reason,
        actor_uid=actor_uid or counselor_uid,
        metadata={"orderId": order_id, "productId": product_id},
    )

    payment_id = record_payment(
        db,
        uid=counselor_uid,
        order_id=order_id,
        product_id=product_id,
        amount=amount,
        credits_granted=credits,
        payment_key=payment_key,
        payment_method=payment_method,
        provider=provider,
        metadata={"planId": order.get("planId")},
    )

    if product and product.product_type == "subscription" and product.plan_id:
        upsert_subscription(
            db,
            counselor_uid=counselor_uid,
            plan_id=product.plan_id,
            credits_per_month=product.credits,
            overage_per_credit=product.overage_per_credit,
        )

    db.collection(COMMERCE_ORDERS_COLLECTION).document(order_id).update(
        {
            "fulfilledAt": SERVER_TIMESTAMP,
            "paymentHistoryId": payment_id,
        }
    )

    return {
        "orderId": order_id,
        "creditsGranted": credits,
        "balance": grant_result.get("balance"),
        "paymentHistoryId": payment_id,
        "subscriptionPlanId": product.plan_id if product else None,
    }
