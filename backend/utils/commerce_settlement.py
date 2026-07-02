# 협회 정산 집계
from __future__ import annotations

from collections import defaultdict
from datetime import datetime


def _parse_month(month_str: str) -> tuple[datetime, datetime]:
    """YYYY-MM → [start, end) UTC naive for filtering ISO strings."""
    start = datetime.strptime(month_str.strip(), "%Y-%m")
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def _in_month(iso_str: str | None, start: datetime, end: datetime) -> bool:
    if not iso_str:
        return False
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        if dt.tzinfo:
            dt = dt.replace(tzinfo=None)
    except ValueError:
        return False
    return start <= dt < end


def build_settlement_summary(
    payments: list[dict],
    *,
    month: str,
    platform_fee_rate: float,
) -> dict:
    start, end = _parse_month(month)
    filtered = [p for p in payments if _in_month(p.get("createdAt"), start, end)]

    total_amount = 0
    total_credits = 0
    by_product: dict[str, dict] = defaultdict(lambda: {"count": 0, "amount": 0, "credits": 0})

    for p in filtered:
        amount = int(p.get("amount") or 0)
        credits = int(p.get("creditsGranted") or 0)
        pid = str(p.get("productId") or "unknown")
        total_amount += amount
        total_credits += credits
        by_product[pid]["count"] += 1
        by_product[pid]["amount"] += amount
        by_product[pid]["credits"] += credits

    platform_fee = int(total_amount * platform_fee_rate)
    net_to_association = total_amount - platform_fee

    return {
        "month": month,
        "paymentCount": len(filtered),
        "totalAmount": total_amount,
        "totalCreditsGranted": total_credits,
        "platformFeeRate": platform_fee_rate,
        "platformFeeAmount": platform_fee,
        "netAssociationAmount": net_to_association,
        "byProduct": dict(by_product),
        "payments": filtered,
    }
