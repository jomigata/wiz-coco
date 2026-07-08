# Wave 6 — 카카오 알림톡 (Solapi REST API, T-6-03)
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime, timezone
from urllib import error, request

from config import (
    PUBLIC_SITE_URL,
    SOLAPI_API_KEY,
    SOLAPI_API_SECRET,
    SOLAPI_KAKAO_PF_ID,
    SOLAPI_KAKAO_TEMPLATE_CARE,
    SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER,
)

logger = logging.getLogger(__name__)

SOLAPI_API_BASE = "https://api.solapi.com"


def is_alimtalk_configured() -> bool:
    return bool(
        SOLAPI_API_KEY
        and SOLAPI_API_SECRET
        and SOLAPI_KAKAO_PF_ID
        and (SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER or SOLAPI_KAKAO_TEMPLATE_CARE)
    )


def _solapi_headers() -> dict[str, str]:
    date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    salt = str(uuid.uuid4())
    message = date + salt
    signature = hmac.new(
        SOLAPI_API_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    authorization = (
        f"HMAC-SHA256 ApiKey={SOLAPI_API_KEY}, "
        f"Date={date}, Salt={salt}, Signature={signature}"
    )
    return {
        "Authorization": authorization,
        "Content-Type": "application/json",
    }


def _normalize_phone(phone: str) -> str:
    digits = "".join(c for c in str(phone or "") if c.isdigit())
    if digits.startswith("82"):
        return digits
    if digits.startswith("0"):
        return "82" + digits[1:]
    return digits


def _send_alimtalk(
    *,
    to_phone: str,
    template_id: str,
    variables: dict[str, str],
) -> tuple[bool, str]:
    phone = _normalize_phone(to_phone)
    if not phone:
        return False, "no_phone"
    if not is_alimtalk_configured():
        return False, "alimtalk_not_configured"
    if not template_id:
        return False, "template_not_configured"

    payload = {
        "messages": [
            {
                "to": phone,
                "from": SOLAPI_KAKAO_PF_ID,
                "kakaoOptions": {
                    "pfId": SOLAPI_KAKAO_PF_ID,
                    "templateId": template_id,
                    "variables": variables,
                },
            }
        ]
    }

    req = request.Request(
        f"{SOLAPI_API_BASE}/messages/v4/send-many",
        data=json.dumps(payload).encode("utf-8"),
        headers=_solapi_headers(),
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if body.get("errorCode"):
                return False, str(body.get("errorMessage") or body.get("errorCode"))[:200]
            return True, ""
    except error.HTTPError as exc:
        try:
            detail = exc.read().decode("utf-8")[:200]
        except Exception:
            detail = str(exc)
        logger.warning("Alimtalk HTTP error: %s", detail)
        return False, detail
    except Exception as exc:
        logger.exception("Alimtalk send failed")
        return False, str(exc)[:200]


def send_test_reminder_alimtalk(
    *,
    to_phone: str,
    display_name: str = "",
    assessment_title: str = "",
    magic_url: str = "",
    pending_summary: str = "",
) -> tuple[bool, str]:
    """검사 미완료 리마인더 알림톡."""
    name = (display_name or "").strip() or "내담자"
    title = (assessment_title or "").strip() or "심리검사"
    link = magic_url or f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"
    variables = {
        "#{name}": name,
        "#{title}": title[:40],
        "#{pending}": (pending_summary or "미완료 검사")[:80],
        "#{link}": link,
    }
    return _send_alimtalk(
        to_phone=to_phone,
        template_id=SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER,
        variables=variables,
    )


def send_care_assignment_alimtalk(
    *,
    to_phone: str,
    display_name: str = "",
    assignment_title: str = "",
    magic_url: str = "",
) -> tuple[bool, str]:
    """치료·과제 리마인더 알림톡."""
    name = (display_name or "").strip() or "내담자"
    title = (assignment_title or "").strip() or "치료·과제"
    link = magic_url or f"{PUBLIC_SITE_URL.rstrip('/')}/portal/?tab=care"
    variables = {
        "#{name}": name,
        "#{title}": title[:40],
        "#{link}": link,
    }
    return _send_alimtalk(
        to_phone=to_phone,
        template_id=SOLAPI_KAKAO_TEMPLATE_CARE,
        variables=variables,
    )
