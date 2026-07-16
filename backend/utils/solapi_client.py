# Solapi REST 클라이언트 (SMS·카카오 알림톡 공통)
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from urllib import error, request

from config import SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER

logger = logging.getLogger(__name__)

SOLAPI_API_BASE = "https://api.solapi.com"
KAKAO_GROUP_POLL_INTERVAL_SEC = 1.0
KAKAO_GROUP_POLL_TIMEOUT_SEC = 8.0


def is_solapi_configured() -> bool:
    return bool(SOLAPI_API_KEY and SOLAPI_API_SECRET)


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


def phones_match(a: str, b: str) -> bool:
    left = normalize_kr_phone(a)
    right = normalize_kr_phone(b)
    return bool(left and right and left == right)


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


def _solapi_get_json(path: str) -> tuple[int, dict | None, str]:
    req = request.Request(
        f"{SOLAPI_API_BASE}{path}",
        headers=solapi_headers(),
        method="GET",
    )
    try:
        with request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return resp.status, body, ""
    except error.HTTPError as exc:
        try:
            detail = exc.read().decode("utf-8")[:400]
        except Exception:
            detail = str(exc)
        return exc.code, None, detail
    except Exception as exc:
        return 0, None, str(exc)[:200]


def _extract_group_id(body: dict | None) -> str:
    if not body:
        return ""
    return str(body.get("groupId") or body.get("_id") or "").strip()


def _wait_kakao_group_delivery(group_id: str) -> tuple[bool, str]:
    """알림톡은 send-many 직후 200이어도 비동기 실패할 수 있어 그룹 상태를 확인."""
    if not group_id:
        return True, ""

    deadline = time.monotonic() + KAKAO_GROUP_POLL_TIMEOUT_SEC
    last_status = ""
    while time.monotonic() < deadline:
        _, body, err = _solapi_get_json(f"/messages/v4/groups/{group_id}")
        if err or not body:
            time.sleep(KAKAO_GROUP_POLL_INTERVAL_SEC)
            continue

        status = str(body.get("status") or "").upper()
        counts = body.get("count") or {}
        sent_failed = int(counts.get("sentFailed") or 0)
        sent_success = int(counts.get("sentSuccess") or 0)
        sent_total = int(counts.get("sentTotal") or 0)
        last_status = status

        if status in ("COMPLETE", "FAILED") or (sent_total and sent_failed + sent_success >= sent_total):
            if sent_failed > 0 and sent_success == 0:
                reason = _first_failed_message_reason(group_id)
                return False, reason or "alimtalk_delivery_failed"
            if sent_success > 0:
                return True, ""
            if sent_failed > 0:
                reason = _first_failed_message_reason(group_id)
                return False, reason or "alimtalk_delivery_failed"
            return False, "alimtalk_delivery_failed"

        time.sleep(KAKAO_GROUP_POLL_INTERVAL_SEC)

    logger.warning("Solapi kakao group poll timeout: %s status=%s", group_id, last_status)
    return True, ""


def _first_failed_message_reason(group_id: str) -> str:
    _, body, _ = _solapi_get_json(
        f"/messages/v4/list?groupId={group_id}&limit=1"
    )
    if not body:
        return ""
    message_list = body.get("messageList") or {}
    if isinstance(message_list, dict) and message_list:
        first = next(iter(message_list.values()))
    elif isinstance(message_list, list) and message_list:
        first = message_list[0]
    else:
        return ""

    reason = str(first.get("reason") or "").strip()
    for entry in reversed(first.get("log") or []):
        msg = str(entry.get("message") or "")
        if "실패" in msg or "3027" in msg:
            return msg[:200]
    if reason:
        return reason[:200]
    status_code = str(first.get("statusCode") or "").strip()
    return f"alimtalk_status_{status_code}" if status_code else ""


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

    has_kakao = any(isinstance(m, dict) and m.get("kakaoOptions") for m in messages)
    if has_kakao:
        group_id = _extract_group_id(body)
        ok, poll_err = _wait_kakao_group_delivery(group_id)
        if not ok:
            return False, poll_err, body

    return True, "", body


def recipient_conflicts_with_sender(to_phone: str) -> bool:
    """발신번호와 수신번호가 같으면 알림톡·SMS 테스트가 실패할 수 있음."""
    return phones_match(to_phone, SOLAPI_SENDER)
