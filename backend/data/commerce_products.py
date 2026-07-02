# B2B2C · B2C 상품 정의
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

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
    "counselor-starter": CommerceProduct(
        id="counselor-starter",
        name="스타터 월 구독",
        amount=150_000,
        credits=20,
        product_type="subscription",
        channel="b2b2c",
        plan_id="starter",
        overage_per_credit=7_500,
    ),
    "counselor-pro": CommerceProduct(
        id="counselor-pro",
        name="프로 월 구독",
        amount=250_000,
        credits=50,
        product_type="subscription",
        channel="b2b2c",
        plan_id="pro",
        overage_per_credit=6_000,
    ),
    "credit-pack-10": CommerceProduct(
        id="credit-pack-10",
        name="크레딧 10팩",
        amount=75_000,
        credits=10,
        product_type="one_time",
        channel="b2b2c",
    ),
    "credit-pack-50": CommerceProduct(
        id="credit-pack-50",
        name="크레딧 50팩",
        amount=300_000,
        credits=50,
        product_type="one_time",
        channel="b2b2c",
    ),
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
    return {
        "id": p.id,
        "name": p.name,
        "amount": p.amount,
        "credits": p.credits,
        "type": p.product_type,
        "channel": p.channel,
        "planId": p.plan_id,
        "overagePerCredit": p.overage_per_credit,
        "entitlementTier": p.entitlement_tier,
    }


def public_catalog(channel: str | None = None) -> list[dict]:
    rows = [product_to_public_dict(p) for p in COMMERCE_PRODUCTS.values()]
    if channel:
        rows = [r for r in rows if r.get("channel") == channel]
    return rows
