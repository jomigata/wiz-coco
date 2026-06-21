"""SMS 발송 (Twilio 등 설정 시). 미설정 시 no-op."""
import logging
import os

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")


def is_sms_configured() -> bool:
    return bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER)


def send_portal_credentials_sms(
    *, to_phone: str, access_code: str, pin: str, magic_url: str, join_access_code: str = ""
) -> tuple[bool, str]:
    phone = (to_phone or "").strip()
    if not phone:
        return False, "no_phone"
    if not is_sms_configured():
        logger.info("SMS skipped (Twilio not configured) for %s", phone[:4] + "****")
        return False, "sms_not_configured"

    join_code = (join_access_code or "").strip()
    if join_code:
        body = (
            f"[WizCoCo] 심리검사 안내\n"
            f"검사코드: {join_code}\n"
            f"나의코드: {access_code} PIN: {pin}\n"
            f"바로가기: {magic_url}"
        )
    else:
        body = (
            f"[WizCoCo] 내 검사실\n"
            f"나의코드: {access_code} PIN: {pin}\n"
            f"바로가기: {magic_url}"
        )

    try:
        from twilio.rest import Client

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(body=body, from_=TWILIO_FROM_NUMBER, to=phone)
        return True, ""
    except ImportError:
        logger.warning("twilio package not installed")
        return False, "twilio_not_installed"
    except Exception as exc:
        logger.exception("SMS send failed")
        return False, str(exc)[:200]


def send_portal_invite_sms(*, to_phone: str, access_code: str, magic_url: str) -> tuple[bool, str]:
    phone = (to_phone or "").strip()
    if not phone:
        return False, "no_phone"
    if not is_sms_configured():
        logger.info("SMS skipped (Twilio not configured) for %s", phone[:4] + "****")
        return False, "sms_not_configured"

    body = (
        f"[WizCoCo] 심리검사 안내\n"
        f"검사코드: {access_code}\n"
        f"바로 시작: {magic_url}"
    )

    try:
        from twilio.rest import Client

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(body=body, from_=TWILIO_FROM_NUMBER, to=phone)
        return True, ""
    except ImportError:
        logger.warning("twilio package not installed")
        return False, "twilio_not_installed"
    except Exception as exc:
        logger.exception("SMS send failed")
        return False, str(exc)[:200]
