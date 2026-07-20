# Wave 6 — 카카오 알림톡 (Solapi REST API)
from __future__ import annotations

import logging

from config import (
    PUBLIC_SITE_URL,
    SOLAPI_KAKAO_PF_ID,
    SOLAPI_KAKAO_TEMPLATE_CARE,
    SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS,
    SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER,
    SOLAPI_SENDER,
)
from utils.solapi_client import (
    is_solapi_configured,
    normalize_kr_phone,
    recipient_conflicts_with_sender,
    solapi_send_messages,
    extract_solapi_group_id,
)

logger = logging.getLogger(__name__)

# Solapi 콘솔 템플릿 등록 시 아래 변수명을 그대로 사용하세요.
ALIMTALK_TEMPLATE_SPECS = {
    "testReminder": {
        "templateIdEnv": "SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER",
        "variables": ["#{name}", "#{title}", "#{pending}", "#{link}"],
        "sampleBody": (
            "안녕하세요 #{name}님,\n"
            "고객님께서 접수하신 WizCoCo 심리검사가 아직 완료되지 않았습니다.\n\n"
            "검사명: #{title}\n"
            "미완료: #{pending}\n\n"
            "이어서 진행: #{link}"
        ),
    },
    "careAssignment": {
        "templateIdEnv": "SOLAPI_KAKAO_TEMPLATE_CARE",
        "variables": ["#{name}", "#{title}", "#{link}"],
        "sampleBody": (
            "안녕하세요 #{name}님,\n"
            "WizCoCo 상담·검사 서비스 이용을 접수하신 고객님께 안내드립니다.\n"
            "담당 전문상담사가 등록한 치료·과제 안내입니다.\n\n"
            "치료·과제명: #{title}\n\n"
            "바로 보기: #{link}"
        ),
    },
    "portalCredentials": {
        "templateIdEnv": "SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS",
        "variables": ["#{name}", "#{mycode}", "#{pin}", "#{joincode}", "#{link}"],
        "sampleBody": (
            "안녕하세요 #{name}님,\n"
            "고객님께서 접수하신 WizCoCo 심리검사 참여에 대한 접속 정보입니다.\n\n"
            "검사코드: #{joincode}\n"
            "나의코드: #{mycode}\n"
            "비밀번호: #{pin}\n\n"
            "바로 시작: #{link}"
        ),
    },
}


def is_alimtalk_configured() -> bool:
    return bool(
        is_solapi_configured()
        and SOLAPI_SENDER
        and SOLAPI_KAKAO_PF_ID
        and (
            SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER
            or SOLAPI_KAKAO_TEMPLATE_CARE
            or SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS
        )
    )


def get_alimtalk_setup_info() -> dict:
    """관리자용 템플릿 등록 가이드 (비밀값 미포함)."""
    return {
        "provider": "solapi",
        "pfIdConfigured": bool(SOLAPI_KAKAO_PF_ID),
        "senderConfigured": bool(SOLAPI_SENDER),
        "templates": {
            key: {
                "configured": bool(
                    (key == "testReminder" and SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER)
                    or (key == "careAssignment" and SOLAPI_KAKAO_TEMPLATE_CARE)
                    or (key == "portalCredentials" and SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS)
                ),
                "templateIdEnv": spec["templateIdEnv"],
                "variables": spec["variables"],
                "sampleBody": spec["sampleBody"],
            }
            for key, spec in ALIMTALK_TEMPLATE_SPECS.items()
        },
    }


def _format_pin_display(pin: str) -> str:
    digits = "".join(c for c in str(pin or "") if c.isdigit())
    return digits.zfill(4)[-4:] if digits else str(pin or "")


def _send_alimtalk(
    *,
    to_phone: str,
    template_id: str,
    variables: dict[str, str],
    fallback_text: str,
) -> tuple[bool, str, str]:
    phone = normalize_kr_phone(to_phone)
    if not phone:
        return False, "no_phone", ""
    if recipient_conflicts_with_sender(to_phone):
        return (
            False,
            "alimtalk_sender_equals_recipient",
            "",
        )
    if not template_id:
        return False, "template_not_configured", ""
    if not is_alimtalk_configured():
        return False, "alimtalk_not_configured", ""

    ok, err, resp = solapi_send_messages(
        [
            {
                "to": phone,
                "from": SOLAPI_SENDER,
                "text": (fallback_text or "WizCoCo 알림")[:2000],
                "kakaoOptions": {
                    "pfId": SOLAPI_KAKAO_PF_ID,
                    "templateId": template_id,
                    "variables": variables,
                    "disableSms": False,
                },
            }
        ]
    )
    if ok:
        return True, "", ""
    if err == "alimtalk_not_configured":
        return False, err, ""
    if err == "solapi_delivery_pending":
        return False, err, extract_solapi_group_id(resp)
    return False, err or "alimtalk_send_failed", ""


def send_test_reminder_alimtalk(
    *,
    to_phone: str,
    display_name: str = "",
    assessment_title: str = "",
    magic_url: str = "",
    pending_summary: str = "",
) -> tuple[bool, str]:
    name = (display_name or "").strip() or "내담자"
    title = (assessment_title or "").strip() or "심리검사"
    link = magic_url or f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"
    variables = {
        "#{name}": name[:20],
        "#{title}": title[:40],
        "#{pending}": (pending_summary or "미완료 검사")[:80],
        "#{link}": link,
    }
    fallback = f"[WizCoCo] {name}님, 접수하신 검사 미완료. {link}"
    ok, err, _gid = _send_alimtalk(
        to_phone=to_phone,
        template_id=SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER,
        variables=variables,
        fallback_text=fallback,
    )
    return ok, err


def send_care_assignment_alimtalk(
    *,
    to_phone: str,
    display_name: str = "",
    assignment_title: str = "",
    magic_url: str = "",
) -> tuple[bool, str]:
    name = (display_name or "").strip() or "내담자"
    title = (assignment_title or "").strip() or "치료·과제"
    link = magic_url or f"{PUBLIC_SITE_URL.rstrip('/')}/portal/?tab=care"
    variables = {
        "#{name}": name[:20],
        "#{title}": title[:40],
        "#{link}": link,
    }
    fallback = f"[WizCoCo] {name}님, 접수하신 상담 서비스 치료·과제 안내. {link}"
    ok, err, _gid = _send_alimtalk(
        to_phone=to_phone,
        template_id=SOLAPI_KAKAO_TEMPLATE_CARE,
        variables=variables,
        fallback_text=fallback,
    )
    return ok, err


def send_portal_credentials_alimtalk(
    *,
    to_phone: str,
    display_name: str = "",
    access_code: str = "",
    pin: str = "",
    join_access_code: str = "",
    magic_url: str = "",
) -> tuple[bool, str, str]:
    name = (display_name or "").strip() or "내담자"
    my_code = (access_code or "").strip().upper()
    join_code = (join_access_code or "").strip().upper() or "-"
    pin_display = _format_pin_display(pin)
    link = magic_url or f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"
    variables = {
        "#{name}": name[:20],
        "#{mycode}": my_code or "-",
        "#{pin}": pin_display,
        "#{joincode}": join_code,
        "#{link}": link,
    }
    fallback = f"[WizCoCo] {name}님, 접수하신 검사 접속 정보. 나의코드 {my_code} 비밀번호 {pin_display} {link}"
    return _send_alimtalk(
        to_phone=to_phone,
        template_id=SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS,
        variables=variables,
        fallback_text=fallback,
    )
