"""내담자 포털 알림 채널 정책 — 발송용 이메일 비활성(기본), 휴대(알림톡·SMS)만."""
from __future__ import annotations

import os

from utils.phone_format import is_valid_kr_mobile_phone, normalize_recipient_phone

# true 로 두면 legacy: 이메일+휴대 발송 채널 복구 (롤백용)
_CLIENT_PORTAL_NOTIFY_EMAIL = os.getenv("CLIENT_PORTAL_NOTIFY_EMAIL", "false").lower() in (
    "1",
    "true",
    "yes",
)


def client_portal_email_notify_enabled() -> bool:
    return _CLIENT_PORTAL_NOTIFY_EMAIL


def _parse_notify_channel_list(raw) -> list[str] | None:
    if raw is None:
        return None
    if isinstance(raw, str):
        items = [raw]
    elif isinstance(raw, list):
        items = raw
    else:
        return None
    out: list[str] = []
    for item in items:
        value = str(item or "").strip().lower()
        if value in ("email", "phone", "app") and value not in out:
            out.append(value)
    return out or None


def portal_notify_uses_app_channel(notify_channels: list[str] | None) -> bool:
    norm = normalize_portal_notify_channels(notify_channels)
    return bool(norm and "app" in norm)


def portal_notify_uses_phone_channel(notify_channels: list[str] | None) -> bool:
    norm = normalize_portal_notify_channels(notify_channels)
    if not norm:
        return True
    return "phone" in norm


def normalize_portal_notify_channels(raw) -> list[str] | None:
    """API·큐용 notifyChannels — 기본 off 시 phone만."""
    parsed = _parse_notify_channel_list(raw)
    if client_portal_email_notify_enabled():
        return parsed
    if parsed is None:
        return ["phone"]
    filtered = [c for c in parsed if c != "email"]
    return filtered if filtered else []


def apply_portal_notify_contact(
    email: str,
    phone: str,
    notify_channels: list[str] | None,
) -> tuple[str, str]:
    email = (email or "").strip().lower()
    phone = (phone or "").strip()
    if not client_portal_email_notify_enabled():
        email = ""
    channels = normalize_portal_notify_channels(notify_channels)
    if channels is None and client_portal_email_notify_enabled():
        return email, phone
    allowed = set(channels or [])
    if "email" not in allowed:
        email = ""
    if "phone" not in allowed:
        phone = ""
    return email, phone


def validate_portal_notify_channels_for_send(notify_channels: list[str] | None) -> str | None:
    """발송 요청 시 채널 검증 — 오류 메시지 또는 None."""
    if client_portal_email_notify_enabled():
        return None
    norm = normalize_portal_notify_channels(notify_channels)
    if not norm:
        return "내담자 발송 채널을 선택해 주세요."
    if "app" in norm:
        return None
    if "phone" not in norm:
        return "내담자 발송은 휴대폰(알림톡·문자) 또는 내 검사실 앱 알림이 가능합니다."
    return None


def validate_immediate_notify_phone(phone: str) -> str | None:
    """즉시 발송(queueNotify) 시 휴대 필수."""
    if client_portal_email_notify_enabled():
        return None
    norm = normalize_recipient_phone((phone or "").strip())
    if not is_valid_kr_mobile_phone(norm):
        return "즉시 발송 시 휴대폰 번호(11자리)가 필요합니다."
    from utils.solapi_client import recipient_conflicts_with_sender

    if recipient_conflicts_with_sender(norm):
        return (
            "등록된 Solapi 발신번호와 같은 번호로는 알림톡·문자를 받을 수 없습니다. "
            "다른 휴대폰 번호를 등록해 주세요."
        )
    return None


def validate_recipient_contact_row(
    *,
    phone: str,
    email: str,
    queue_notify: bool,
) -> str | None:
    """일괄/단건 등록 행 검증."""
    phone_norm = normalize_recipient_phone((phone or "").strip())
    email = (email or "").strip()
    if queue_notify:
        return validate_immediate_notify_phone(phone_norm)
    if not phone_norm and not email:
        return "휴대폰 또는 이메일 중 하나는 필요합니다."
    if phone_norm and not is_valid_kr_mobile_phone(phone_norm):
        return "휴대폰 번호 형식(11자리)을 확인해 주세요."
    return None
