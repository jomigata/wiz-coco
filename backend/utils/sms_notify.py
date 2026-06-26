"""SMS 발송 (Twilio 등 설정 시). 미설정 시 no-op."""
import logging
import os

from config import PUBLIC_SITE_URL

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")


def is_sms_configured() -> bool:
    return bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER)


def _format_pin_display(pin: str) -> str:
    digits = "".join(c for c in str(pin or "") if c.isdigit())
    return digits.zfill(4)[-4:] if digits else str(pin or "")


def send_portal_credentials_sms(
    *,
    to_phone: str,
    access_code: str,
    pin: str,
    magic_url: str,
    join_access_code: str = "",
    display_name: str = "",
) -> tuple[bool, str]:
    phone = (to_phone or "").strip()
    if not phone:
        return False, "no_phone"
    if not is_sms_configured():
        logger.info("SMS skipped (Twilio not configured) for %s", phone[:4] + "****")
        return False, "sms_not_configured"

    name = (display_name or "").strip() or "내담자"
    join_code = (join_access_code or "").strip().upper()
    my_code = (access_code or "").strip().upper()
    pin_display = _format_pin_display(pin)
    login_url = f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"

    parts = [f"[WizCoCo] {name}님 검사시작"]
    if join_code:
        parts.append(f"검사코드 {join_code}")
    parts.append(f"나의코드 {my_code} 비밀번호 {pin_display}")
    parts.append(login_url)
    parts.append(magic_url)
    body = "\n".join(parts)

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


def send_test_reminder_sms(
    *,
    to_phone: str,
    display_name: str = "",
    assessment_title: str = "",
    join_access_code: str = "",
    my_code: str = "",
    pending_tests: list[dict] | None = None,
    completed_count: int = 0,
    required_count: int = 0,
    magic_url: str,
) -> tuple[bool, str]:
    phone = (to_phone or "").strip()
    if not phone:
        return False, "no_phone"
    if not is_sms_configured():
        logger.info("SMS skipped (Twilio not configured) for %s", phone[:4] + "****")
        return False, "sms_not_configured"

    name = (display_name or "").strip() or "내담자"
    title = (assessment_title or "").strip() or "심리검사"
    join_code = (join_access_code or "").strip().upper()
    portal_code = (my_code or "").strip().upper()
    login_url = f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"

    pending_names: list[str] = []
    for item in pending_tests or []:
        test_name = (item.get("testName") or item.get("testId") or "검사").strip()
        status = (item.get("status") or "not_started").strip()
        if status == "in_progress":
            pending_names.append(f"{test_name}(진행중)")
        else:
            pending_names.append(f"{test_name}(미실시)")

    progress = (
        f"{completed_count}/{required_count}"
        if required_count > 0
        else "진행중"
    )

    parts = [f"[WizCoCo] {name}님 미완료 검사 안내"]
    parts.append(title)
    parts.append(f"진행 {progress}")
    if pending_names:
        parts.append("미완료: " + ", ".join(pending_names))
    if join_code:
        parts.append(f"검사코드 {join_code}")
    if portal_code:
        parts.append(f"나의코드 {portal_code}")
    parts.append(login_url)
    parts.append(magic_url)
    body = "\n".join(parts)

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
