"""무료 검사코드(공개 claim) — @/utils/points_display 재export."""
from __future__ import annotations

from utils.points_display import (
    POINT_COST_PUBLIC_CLAIM_EMAIL,
    POINT_COST_PUBLIC_CLAIM_PHONE,
    PUBLIC_CLAIM_EMAIL_CREDIT_COST,
    PUBLIC_CLAIM_PHONE_CREDIT_COST,
    assessment_credits_to_points,
)

PUBLIC_CLAIM_CHANNEL_PHONE = "phone"
PUBLIC_CLAIM_CHANNEL_EMAIL = "email"
VALID_PUBLIC_CLAIM_CHANNELS = frozenset({PUBLIC_CLAIM_CHANNEL_PHONE, PUBLIC_CLAIM_CHANNEL_EMAIL})

PUBLIC_CLAIM_PHONE_POINT_COST = POINT_COST_PUBLIC_CLAIM_PHONE
PUBLIC_CLAIM_PHONE_POINTS = POINT_COST_PUBLIC_CLAIM_PHONE

credits_to_points = assessment_credits_to_points


def normalize_public_claim_channel(raw: str | None) -> str:
    value = (raw or "").strip().lower()
    if value in VALID_PUBLIC_CLAIM_CHANNELS:
        return value
    return PUBLIC_CLAIM_CHANNEL_PHONE


def resolve_effective_public_claim_channel(
    configured_channel: str,
    *,
    counselor_balance: int,
    credits_enforce: bool,
) -> tuple[str, bool]:
    """Returns (effective_channel, forced_to_email)."""
    channel = normalize_public_claim_channel(configured_channel)
    if (
        channel == PUBLIC_CLAIM_CHANNEL_PHONE
        and credits_enforce
        and assessment_credits_to_points(counselor_balance) < POINT_COST_PUBLIC_CLAIM_PHONE
    ):
        return PUBLIC_CLAIM_CHANNEL_EMAIL, True
    return channel, False
