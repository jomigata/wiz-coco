# 토스페이먼츠 결제 확인·웹훅
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging

import urllib.error
import urllib.request

from config import TOSS_SECRET_KEY, TOSS_WEBHOOK_SECRET, TOSS_API_BASE

logger = logging.getLogger(__name__)


def is_toss_configured() -> bool:
    return bool(TOSS_SECRET_KEY)


def _basic_auth_header() -> str:
    token = base64.b64encode(f"{TOSS_SECRET_KEY}:".encode()).decode()
    return f"Basic {token}"


def confirm_payment(*, payment_key: str, order_id: str, amount: int) -> dict:
    """POST /v1/payments/confirm — raises on HTTP/API error."""
    if not is_toss_configured():
        raise RuntimeError("TOSS_SECRET_KEY is not configured")

    url = f"{TOSS_API_BASE}/v1/payments/confirm"
    body = json.dumps(
        {"paymentKey": payment_key, "orderId": order_id, "amount": amount}
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": _basic_auth_header(),
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(err_body)
        except json.JSONDecodeError:
            parsed = {"message": err_body}
        code = parsed.get("code") or "HTTP_ERROR"
        message = parsed.get("message") or str(exc)
        raise RuntimeError(f"Toss confirm failed ({code}): {message}") from exc


def verify_webhook_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """HMAC-SHA256 — TOSS_WEBHOOK_SECRET 미설정 시 개발 환경에서만 통과."""
    if not TOSS_WEBHOOK_SECRET:
        logger.warning("TOSS_WEBHOOK_SECRET not set — webhook signature skipped")
        return True
    if not signature_header:
        return False
    expected = hmac.new(
        TOSS_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header.strip())


def parse_webhook_event(payload: dict) -> dict:
    """Normalize Toss webhook body."""
    event_type = payload.get("eventType") or payload.get("type") or ""
    data = payload.get("data") or payload
    return {
        "eventType": event_type,
        "orderId": data.get("orderId") or "",
        "paymentKey": data.get("paymentKey") or "",
        "status": data.get("status") or "",
        "totalAmount": data.get("totalAmount") or data.get("amount") or 0,
        "method": data.get("method") or "",
        "raw": data,
    }
