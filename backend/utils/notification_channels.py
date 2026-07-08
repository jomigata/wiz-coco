# Wave 6 — 알림 채널 상태 집계 (T-6-01)
from __future__ import annotations

from config import (
    SOLAPI_API_KEY,
    SOLAPI_API_SECRET,
    SOLAPI_KAKAO_PF_ID,
    SOLAPI_KAKAO_TEMPLATE_CARE,
    SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS,
    SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER,
    SOLAPI_SENDER,
    is_email_configured,
)
from utils.kakao_alimtalk import get_alimtalk_setup_info, is_alimtalk_configured
from utils.sms_notify import is_sms_configured
from utils.solapi_sms import is_solapi_sms_configured


def get_notification_channel_status() -> dict:
    """이메일·SMS·카카오 알림톡 채널 설정 여부."""
    solapi_sms = is_solapi_sms_configured()
    alimtalk_setup = get_alimtalk_setup_info()
    return {
        "email": {
            "configured": is_email_configured(),
            "provider": "smtp",
        },
        "sms": {
            "configured": is_sms_configured() or solapi_sms,
            "providers": [
                p
                for p, ok in (
                    ("twilio", is_sms_configured()),
                    ("solapi", solapi_sms),
                )
                if ok
            ],
        },
        "kakaoAlimtalk": {
            "configured": is_alimtalk_configured(),
            "provider": "solapi" if is_alimtalk_configured() else None,
            "templates": {
                "testReminder": bool(SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER),
                "careAssignment": bool(SOLAPI_KAKAO_TEMPLATE_CARE),
                "portalCredentials": bool(SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS),
            },
            "pfId": bool(SOLAPI_KAKAO_PF_ID),
            "sender": bool(SOLAPI_SENDER),
            "setup": alimtalk_setup,
        },
        "cron": {
            "notificationWorker": "*/5 * * * *",
            "cohortReminders": "0 0 * * *",
            "individualReminders": "0 3 * * 1",
            "careReminders": "0 4 * * *",
        },
    }
