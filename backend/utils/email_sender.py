# 결과 제출 시 이메일 발송 (비밀번호·결과 요약)
# 이메일 정책: 요약(summary)만 포함하고, 상세 결과(resultData 전체)는 이메일에 넣지 않음.
# 상세 결과는 상담사와 논의하도록 안내만 포함.
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config import (
    is_email_configured,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    MAIL_FROM,
)

logger = logging.getLogger(__name__)


def send_result_email(to_email: str, four_digit_password: str, test_name: str, summary: str = "") -> bool:
    """내담자에게 4자리 비밀번호와 결과 요약만 발송. 상세 결과는 이메일에 포함하지 않음. SMTP 미설정 시 False."""
    if not is_email_configured():
        logger.warning(
            "Result email skipped: SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASSWORD on the server). to=%s",
            to_email,
        )
        return False
    subject = f"[WizCoCo] 검사 결과 안내 - {test_name}"
    body = f"""
안녕하세요, WizCoCo입니다.

검사 '{test_name}' 제출이 완료되었습니다.

· 결과 확인/수정용 비밀번호: {four_digit_password}
· 상세 결과는 상담사와 논의하세요.
"""
    if summary:
        body += f"\n\n요약:\n{summary}\n"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = MAIL_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(body.strip(), "plain", "utf-8"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(MAIL_FROM, [to_email], msg.as_string())
        return True
    except Exception:
        logger.exception("Result email send failed to=%s host=%s", to_email, SMTP_HOST)
        return False
