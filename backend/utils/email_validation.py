"""내담자·발송용 이메일 형식 (RFC 5321 거부 패턴 방지)."""
from __future__ import annotations

import re

_MAX_LEN = 254
_SIMPLE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def normalize_recipient_email(raw: str | None) -> str:
    return (raw or "").strip().lower()


def is_valid_recipient_email(raw: str | None) -> bool:
    email = normalize_recipient_email(raw)
    if not email:
        return True
    if len(email) > _MAX_LEN or ".." in email:
        return False
    if not _SIMPLE.match(email):
        return False
    local, _, domain = email.partition("@")
    if not local or not domain:
        return False
    if local.startswith(".") or local.endswith("."):
        return False
    if domain.startswith(".") or domain.endswith("."):
        return False
    labels = domain.split(".")
    if len(labels) < 2 or any(not label for label in labels):
        return False
    return True


def validate_recipient_email_or_raise(raw: str | None) -> str:
    email = normalize_recipient_email(raw)
    if email and not is_valid_recipient_email(email):
        raise ValueError(f"이메일 형식이 올바르지 않습니다: {email}")
    return email
