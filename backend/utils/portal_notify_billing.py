"""포털 알림(나의코드·미실시) 발송 포인트 — 1회 무료 재전송, 실패 환불."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

CHANNEL_SENT = "sent"
CHANNEL_FAILED = "failed"


def portal_needs_initial_credential_charge(pdata: dict) -> bool:
    if pdata.get("initialDispatchPointsCharged"):
        return False
    status = (pdata.get("lastNotifyStatus") or "not_sent").strip()
    return status not in ("sent", "partial")


def resolve_notify_kind_for_credentials(pdata: dict) -> str:
    return "initial" if portal_needs_initial_credential_charge(pdata) else "resend"


def notify_resend_success_count(pdata: dict) -> int:
    try:
        return max(0, int(pdata.get("notifyResendSuccessCount") or 0))
    except (TypeError, ValueError):
        return 0


def delivery_had_channel_success(
    *,
    email: str,
    phone: str,
    email_channel: str,
    phone_channel: str,
    status: str,
) -> bool:
    if status not in ("sent", "partial"):
        return False
    if email and email_channel == CHANNEL_SENT:
        return True
    if phone and phone_channel == CHANNEL_SENT:
        return True
    return False


def all_configured_channels_failed(
    *,
    email: str,
    phone: str,
    email_channel: str,
    phone_channel: str,
    status: str,
) -> bool:
    if status != "failed":
        return False
    checks: list[bool] = []
    if email:
        checks.append(email_channel == CHANNEL_FAILED)
    if phone:
        checks.append(phone_channel == CHANNEL_FAILED)
    return bool(checks) and all(checks)


def estimate_max_points_for_credential_resend(pdata: dict) -> int:
    from utils.points_display import POINT_COST_INITIAL_RECIPIENT_DISPATCH, POINT_COST_RESEND_PHONE

    if portal_needs_initial_credential_charge(pdata):
        return POINT_COST_INITIAL_RECIPIENT_DISPATCH
    if notify_resend_success_count(pdata) >= 1:
        return POINT_COST_RESEND_PHONE
    return 0


def estimate_max_points_for_remind(pdata: dict) -> int:
    from utils.points_display import POINT_COST_RESEND_PHONE

    if notify_resend_success_count(pdata) >= 1:
        return POINT_COST_RESEND_PHONE
    return 0


def ensure_portal_notify_credits(
    db,
    counselor_uid: str | None,
    portal_payloads: list[dict],
    *,
    mode: str,
) -> None:
    """발송 전 잔액 검증 — mode: credential_resend | remind."""
    from config import COMMERCE_CREDITS_ENFORCE
    from utils.counselor_credits import get_points_available

    if not COMMERCE_CREDITS_ENFORCE or not counselor_uid or not portal_payloads:
        return
    total = 0
    for pdata in portal_payloads:
        if mode == "credential_resend":
            total += estimate_max_points_for_credential_resend(pdata)
        elif mode == "remind":
            total += estimate_max_points_for_remind(pdata)
    if total <= 0:
        return
    points_balance = get_points_available(db, counselor_uid)
    if points_balance < total:
        raise ValueError(
            f"검사 포인트가 부족합니다. (보유 {points_balance}포인트, 필요 {total}포인트)"
        )


def apply_portal_notify_billing(
    portal_ref,
    *,
    email: str,
    phone: str,
    email_channel: str,
    phone_channel: str,
    status: str,
    notify_kind: str,
    previous_status: str = "",
) -> None:
    if status == "sending" or portal_ref is None:
        return
    try:
        from firebase_init import get_firestore
        from utils.counselor_credits import (
            charge_initial_dispatch_success,
            consume_portal_points,
            refund_portal_points,
        )
        from utils.points_display import POINT_COST_RESEND_PHONE

        db = get_firestore()
        snap = portal_ref.get()
        if not snap.exists:
            return
        pdata = snap.to_dict() or {}
        counselor_uid = (pdata.get("counselorId") or "").strip()
        if not counselor_uid:
            return
        assigned = list(pdata.get("assignedAssessmentIds") or [])
        assessment_id = str(assigned[0]).strip() if assigned else ""
        portal_id = snap.id
        meta = {"portalId": portal_id, "assessmentId": assessment_id or None}

        if all_configured_channels_failed(
            email=email,
            phone=phone,
            email_channel=email_channel,
            phone_channel=phone_channel,
            status=status,
        ):
            pending = int(pdata.get("notifyLastDeliveryPointsCharged") or 0)
            if pending > 0:
                refund_portal_points(
                    db,
                    counselor_uid,
                    pending,
                    reason="notify_delivery_refund",
                    actor_uid=counselor_uid,
                    metadata={**meta, "notifyKind": notify_kind},
                )
                portal_ref.set({"notifyLastDeliveryPointsCharged": 0}, merge=True)
            return

        if not delivery_had_channel_success(
            email=email,
            phone=phone,
            email_channel=email_channel,
            phone_channel=phone_channel,
            status=status,
        ):
            return

        kind = (notify_kind or "initial").strip()
        points_charged = 0

        if kind == "initial":
            result = charge_initial_dispatch_success(
                db,
                counselor_uid=counselor_uid,
                portal_id=portal_id,
                assessment_id=assessment_id,
                actor_uid=counselor_uid,
            )
            if result and result.get("trial"):
                points_charged = 0
            elif result and result.get("skipped"):
                points_charged = 0
            elif result:
                points_charged = int(result.get("pointsConsumed") or 0)
            else:
                points_charged = 0
            portal_ref.set({"notifyLastDeliveryPointsCharged": points_charged}, merge=True)
            return

        if kind in ("resend", "remind"):
            prev = (previous_status or "").strip()
            if prev in ("sent", "partial") and status in ("sent", "partial"):
                return
            prior = notify_resend_success_count(pdata)
            reason = "dispatch_remind_phone" if kind == "remind" else "notify_resend"
            if prior >= 1:
                consume_portal_points(
                    db,
                    counselor_uid,
                    POINT_COST_RESEND_PHONE,
                    reason=reason,
                    actor_uid=counselor_uid,
                    metadata=meta,
                )
                points_charged = POINT_COST_RESEND_PHONE
            portal_ref.set(
                {
                    "notifyResendSuccessCount": prior + 1,
                    "notifyLastDeliveryPointsCharged": points_charged,
                },
                merge=True,
            )
    except Exception:
        logger.debug("portal notify billing skipped portal=%s", portal_ref.id, exc_info=True)
