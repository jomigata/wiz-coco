# B2B2C · B2C 상품 정의
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from utils.points_display import product_credits_to_points, WON_PER_POINT

ProductType = Literal["one_time", "subscription", "b2c_tier"]
ProductChannel = Literal["b2b2c", "b2c", "b2b"]


@dataclass(frozen=True)
class CommerceProduct:
    id: str
    name: str
    amount: int
    credits: int
    product_type: ProductType
    channel: ProductChannel = "b2b2c"
    plan_id: str | None = None
    overage_per_credit: int | None = None
    entitlement_tier: str | None = None


COMMERCE_PRODUCTS: dict[str, CommerceProduct] = {
    "b2c-basic": CommerceProduct(
        id="b2c-basic",
        name="Basic 리포트",
        amount=5_000,
        credits=0,
        product_type="b2c_tier",
        channel="b2c",
        entitlement_tier="basic",
    ),
    "b2c-premium": CommerceProduct(
        id="b2c-premium",
        name="Premium 심층 리포트",
        amount=15_000,
        credits=0,
        product_type="b2c_tier",
        channel="b2c",
        entitlement_tier="premium",
    ),
    "b2c-pro": CommerceProduct(
        id="b2c-pro",
        name="Pro + 상담 연결",
        amount=50_000,
        credits=0,
        product_type="b2c_tier",
        channel="b2c",
        entitlement_tier="pro",
    ),
}


def get_product(product_id: str) -> CommerceProduct | None:
    return COMMERCE_PRODUCTS.get((product_id or "").strip())


def product_to_public_dict(p: CommerceProduct) -> dict:
    points = product_credits_to_points(p.credits)
    return {
        "id": p.id,
        "name": p.name,
        "amount": p.amount,
        "credits": p.credits,
        "points": points,
        "type": p.product_type,
        "channel": p.channel,
        "planId": p.plan_id,
        "overagePerCredit": p.overage_per_credit,
        "entitlementTier": p.entitlement_tier,
        "wonPerPoint": WON_PER_POINT,
    }


def public_catalog(channel: str | None = None) -> list[dict]:
    rows = [product_to_public_dict(p) for p in COMMERCE_PRODUCTS.values()]
    if channel:
        rows = [r for r in rows if r.get("channel") == channel]
    return rows
