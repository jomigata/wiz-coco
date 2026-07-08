# Solapi REST 클라이언트 (SMS·카카오 알림톡 공통)
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime, timezone
from urllib import error, request

from config import SOLAPI_API_KEY, SOLAPI_API_SECRET

logger = logging.getLogger(__name__)

SOLAPI_API_BASE = "https://api.solapi.com"


def is_solapi_configured() -> bool:
    return bool(SOLAPI_API_KEY and SOLAPI_API_SECRET)


def solapi_headers() -> dict[str, str]:
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


def normalize_kr_phone(phone: str) -> str:
    digits = "".join(c for c in str(phone or "") if c.isdigit())
    if not digits:
        return ""
    if digits.startswith("82"):
        return digits
    if digits.startswith("0"):
        return "82" + digits[1:]
    if len(digits) == 10 or len(digits) == 11:
        return "82" + digits
    return digits


def solapi_send_messages(messages: list[dict]) -> tuple[bool, str, dict | None]:
    """POST /messages/v4/send-many — 성공 여부, 오류 메시지, 응답 본문."""
    if not is_solapi_configured():
        return False, "solapi_not_configured", None
    if not messages:
        return False, "no_messages", None

    payload = {"messages": messages}
    req = request.Request(
        f"{SOLAPI_API_BASE}/messages/v4/send-many",
        data=json.dumps(payload).encode("utf-8"),
        headers=solapi_headers(),
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        try:
            detail = exc.read().decode("utf-8")[:400]
        except Exception:
            detail = str(exc)
        logger.warning("Solapi HTTP error: %s", detail)
        return False, detail, None
    except Exception as exc:
        logger.exception("Solapi request failed")
        return False, str(exc)[:200], None

    if body.get("errorCode"):
        return False, str(body.get("errorMessage") or body.get("errorCode"))[:200], body

    failed = body.get("failedMessageList") or []
    if failed:
        first = failed[0] if isinstance(failed, list) else {}
        err = (
            first.get("statusMessage")
            or first.get("errorMessage")
            or first.get("reason")
            or "solapi_send_failed"
        )
        return False, str(err)[:200], body

    return True, "", body
