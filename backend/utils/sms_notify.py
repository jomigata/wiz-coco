"""SMS 발송 (Twilio 우선, 미설정 시 Solapi SMS 대안)."""
import logging
import os

from config import PUBLIC_SITE_URL

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")


def is_twilio_configured() -> bool:
    return bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER)


def is_sms_configured() -> bool:
    from utils.solapi_sms import is_solapi_sms_configured

    return is_twilio_configured() or is_solapi_sms_configured()


def _send_sms_body(*, to_phone: str, body: str) -> tuple[bool, str, str]:
    phone = (to_phone or "").strip()
    if not phone:
        return False, "no_phone", ""
    if not body.strip():
        return False, "empty_text", ""

    if is_twilio_configured():
        try:
            from twilio.rest import Client

            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            client.messages.create(body=body, from_=TWILIO_FROM_NUMBER, to=phone)
            return True, "", ""
        except ImportError:
            logger.warning("twilio package not installed")
        except Exception as exc:
            logger.exception("Twilio SMS send failed")
            return False, str(exc)[:200], ""

    from utils.solapi_sms import send_solapi_sms

    return send_solapi_sms(to_phone=phone, text=body)


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
) -> tuple[bool, str, str]:
    phone = (to_phone or "").strip()
    if not phone:
        return False, "no_phone"
    if not is_sms_configured():
        logger.info("SMS skipped (no provider configured) for %s", phone[:4] + "****")
        return False, "sms_not_configured"

    name = (display_name or "").strip() or "내담자"
    join_code = (join_access_code or "").strip().upper()
    my_code = (access_code or "").strip().upper()
    pin_display = _format_pin_display(pin)
    login_url = f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"

    parts = [f"[WizCoCo] {name}님 검사시작"]
    if join_code:
        parts.append(f"상담(코드) {join_code}")
    parts.append(f"나의코드 {my_code} 비밀번호 {pin_display}")
    parts.append(login_url)
    parts.append(magic_url)
    body = "\n".join(parts)

    return _send_sms_body(to_phone=phone, body=body)


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
) -> tuple[bool, str, str]:
    phone = (to_phone or "").strip()
    if not phone:
        return False, "no_phone"
    if not is_sms_configured():
        logger.info("SMS skipped (no provider configured) for %s", phone[:4] + "****")
        return False, "sms_not_configured"

    name = (display_name or "").strip() or "내담자"
    join_code = (join_access_code or "").strip().upper()
    portal_code = (my_code or "").strip().upper()
    login_url = f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"

    parts = [f"[WizCoCo] {name}님 검사시작"]
    parts.append("아직 완료하지 않은 검사가 있습니다. 검사를 진행해 주세요.")
    if join_code:
        parts.append(f"상담(코드) {join_code}")
    if portal_code:
        parts.append(f"나의코드 {portal_code} 비밀번호 (최초 발송 안내 참고)")
    parts.append(login_url)
    parts.append(magic_url)
    body = "\n".join(parts)

    return _send_sms_body(to_phone=phone, body=body)


def send_care_assignment_sms(
    *,
    to_phone: str,
    display_name: str = "",
    assignment_title: str = "",
    portal_access_code: str = "",
    magic_url: str,
) -> tuple[bool, str, str]:
    phone = (to_phone or "").strip()
    if not phone:
        return False, "no_phone"
    if not is_sms_configured():
        logger.info("SMS skipped (no provider configured) for %s", phone[:4] + "****")
        return False, "sms_not_configured"

    name = (display_name or "").strip() or "내담자"
    title = (assignment_title or "").strip() or "새 치료·과제"
    my_code = (portal_access_code or "").strip().upper()
    login_url = f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"

    parts = [f"[WizCoCo] {name}님 치료·과제 안내"]
    parts.append(title)
    if my_code:
        parts.append(f"나의코드 {my_code}")
    parts.append(login_url)
    parts.append(magic_url)
    body = "\n".join(parts)

    return _send_sms_body(to_phone=phone, body=body)


def send_portal_invite_sms(*, to_phone: str, access_code: str, magic_url: str) -> tuple[bool, str, str]:
    phone = (to_phone or "").strip()
    if not phone:
        return False, "no_phone"
    if not is_sms_configured():
        logger.info("SMS skipped (no provider configured) for %s", phone[:4] + "****")
        return False, "sms_not_configured"

    body = (
        f"[WizCoCo] 심리검사 안내\n"
        f"상담(코드): {access_code}\n"
        f"바로 시작: {magic_url}"
    )

    return _send_sms_body(to_phone=phone, body=body)
