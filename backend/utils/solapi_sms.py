# Solapi SMS (Twilio 미설정 시 대안)
from __future__ import annotations

import logging

from config import SOLAPI_SENDER
from utils.solapi_client import is_solapi_configured, normalize_kr_phone, recipient_conflicts_with_sender, solapi_send_messages

logger = logging.getLogger(__name__)


def is_solapi_sms_configured() -> bool:
    return bool(is_solapi_configured() and SOLAPI_SENDER)


def send_solapi_sms(*, to_phone: str, text: str) -> tuple[bool, str]:
    phone = normalize_kr_phone(to_phone)
    if not phone:
        return False, "no_phone"
    if recipient_conflicts_with_sender(to_phone):
        return False, "sms_sender_equals_recipient"
    if not is_solapi_sms_configured():
        return False, "solapi_sms_not_configured"

    body = (text or "").strip()
    if not body:
        return False, "empty_text"

    ok, err, _ = solapi_send_messages(
        [
            {
                "to": phone,
                "from": SOLAPI_SENDER,
                "text": body[:2000],
            }
        ]
    )
    if ok:
        return True, ""
    return False, err or "solapi_sms_failed"
