# 주문 이행 — 크레딧·구독·B2C 이용권
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import SUBSCRIPTIONS_COLLECTION, COMMERCE_ORDERS_COLLECTION
from data.commerce_products import get_product
from utils.counselor_credits import grant_credits
from utils.b2c_entitlements import grant_b2c_tier
from utils.payment_history import record_payment
from utils.commerce_orders import order_buyer_uid


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
    order_id = order.get("orderId") or order.get("id") or ""
    buyer_uid = order_buyer_uid(order)
    product_id = order.get("productId") or ""
    amount = int(order.get("amount") or 0)
    credits = int(order.get("credits") or 0)
    channel = (order.get("channel") or "b2b2c").strip()

    if order.get("status") != "paid":
        raise ValueError("order is not paid")

    if order.get("fulfilledAt"):
        return {
            "orderId": order_id,
            "alreadyFulfilled": True,
            "channel": channel,
            "paymentHistoryId": order.get("paymentHistoryId"),
        }

    product = get_product(product_id)
    tier_granted = None
    grant_result = {"balance": None}

    if channel == "b2c" or (product and product.product_type == "b2c_tier"):
        tier = (order.get("entitlementTier") or (product.entitlement_tier if product else "") or "basic")
        tier_result = grant_b2c_tier(
            db,
            buyer_uid,
            tier=tier,
            product_id=product_id,
            order_id=order_id,
        )
        tier_granted = tier_result.get("tierGranted")
    else:
        grant_result = grant_credits(
            db,
            buyer_uid,
            credits,
            reason=f"purchase_{product_id}",
            actor_uid=actor_uid or buyer_uid,
            metadata={"orderId": order_id, "productId": product_id},
        )
        if product and product.product_type == "subscription" and product.plan_id:
            upsert_subscription(
                db,
                counselor_uid=buyer_uid,
                plan_id=product.plan_id,
                credits_per_month=product.credits,
                overage_per_credit=product.overage_per_credit,
            )

    payment_id = record_payment(
        db,
        uid=buyer_uid,
        order_id=order_id,
        product_id=product_id,
        amount=amount,
        credits_granted=credits if channel != "b2c" else 0,
        payment_key=payment_key,
        payment_method=payment_method,
        provider=provider,
        metadata={"planId": order.get("planId"), "channel": channel, "tier": tier_granted},
    )

    db.collection(COMMERCE_ORDERS_COLLECTION).document(order_id).update(
        {
            "fulfilledAt": SERVER_TIMESTAMP,
            "paymentHistoryId": payment_id,
        }
    )

    return {
        "orderId": order_id,
        "channel": channel,
        "creditsGranted": credits if channel != "b2c" else 0,
        "tierGranted": tier_granted,
        "balance": grant_result.get("balance"),
        "paymentHistoryId": payment_id,
        "subscriptionPlanId": product.plan_id if product and channel != "b2c" else None,
    }
