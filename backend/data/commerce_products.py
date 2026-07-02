# B2B2C 상품 정의 — monetizationCatalog.ts 와 동기화
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ProductType = Literal["one_time", "subscription"]


@dataclass(frozen=True)
class CommerceProduct:
    id: str
    name: str
    amount: int  # KRW
    credits: int
    product_type: ProductType
    plan_id: str | None = None
    overage_per_credit: int | None = None
    platform_fee_rate: float = 0.0  # 협회 직판 시 0, 리셀 추적용 확장


COMMERCE_PRODUCTS: dict[str, CommerceProduct] = {
    "counselor-starter": CommerceProduct(
        id="counselor-starter",
        name="스타터 월 구독",
        amount=150_000,
        credits=20,
        product_type="subscription",
        plan_id="starter",
        overage_per_credit=7_500,
    ),
    "counselor-pro": CommerceProduct(
        id="counselor-pro",
        name="프로 월 구독",
        amount=250_000,
        credits=50,
        product_type="subscription",
        plan_id="pro",
        overage_per_credit=6_000,
    ),
    "credit-pack-10": CommerceProduct(
        id="credit-pack-10",
        name="크레딧 10팩",
        amount=75_000,
        credits=10,
        product_type="one_time",
    ),
    "credit-pack-50": CommerceProduct(
        id="credit-pack-50",
        name="크레딧 50팩",
        amount=300_000,
        credits=50,
        product_type="one_time",
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
        "planId": p.plan_id,
        "overagePerCredit": p.overage_per_credit,
    }


def public_catalog() -> list[dict]:
    return [product_to_public_dict(p) for p in COMMERCE_PRODUCTS.values()]
