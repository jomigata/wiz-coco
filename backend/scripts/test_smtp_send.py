#!/usr/bin/env python3
"""SMTP 테스트 발송 — backend/.env.smtp.local 설정 사용."""
from __future__ import annotations

import os
import smtplib
import sys
from email.mime.text import MIMEText
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".env.smtp.local", override=True)

from config import MAIL_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER, is_email_configured


def main() -> int:
    to_addr = (os.getenv("SMTP_TEST_TO") or "jomigata@gmail.com").strip().lower()
    if not is_email_configured():
        print("SMTP not configured — check backend/.env.smtp.local")
        return 1

    subject = "[WizCoCo] SMTP local test"
    body = (
        "WizCoCo 로컬 SMTP 테스트 메일입니다.\n\n"
        f"From: {MAIL_FROM}\n"
        f"SMTP_USER: {SMTP_USER}\n"
        "나의코드 전달·내담자 발송 이메일 채널 확인용입니다."
    )
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = MAIL_FROM
    msg["To"] = to_addr

    print(f"Sending test email From={MAIL_FROM} To={to_addr} via {SMTP_HOST}:{SMTP_PORT}...")
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM, [to_addr], msg.as_string())
    print("OK — check inbox (and spam).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
