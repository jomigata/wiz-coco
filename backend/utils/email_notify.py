"""관리자 알림 이메일 (SMTP 설정 시 발송)."""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import (
    COUNSELOR_ADMIN_NOTIFY_EMAIL,
    MAIL_FROM,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USER,
    is_email_configured,
)


def send_counselor_application_admin_email(
    *,
    application_id: str,
    applicant_name: str,
    applicant_email: str,
    phone: str = "",
    specialization: list | None = None,
    practice_type: str = "",
    organization_name: str = "",
) -> bool:
    if not is_email_configured():
        return False

    specs = ", ".join(specialization or []) or "-"
    org = organization_name or "-"
    body = f"""WizCoCo 상담사 전환 승인 요청

신청 ID: {application_id}
이름: {applicant_name}
이메일: {applicant_email}
전화: {phone or '-'}
운영 형태: {practice_type or '-'}
기관명: {org}
전문 분야: {specs}

관리자 페이지에서 승인·반려를 진행해 주세요.
https://wizcoco.com/admin/counselor-verification/
"""

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = COUNSELOR_ADMIN_NOTIFY_EMAIL
    msg["Subject"] = f"[WizCoCo] 상담사 전환 승인 요청 — {applicant_name}"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM, [COUNSELOR_ADMIN_NOTIFY_EMAIL], msg.as_string())

    return True


def send_counselor_application_result_email(
    *,
    applicant_email: str,
    applicant_name: str,
    approved: bool,
    review_notes: str = "",
) -> bool:
    """신청자에게 승인/거부 결과 이메일 발송."""
    if not is_email_configured():
        return False

    email = (applicant_email or "").strip()
    if not email or "@" not in email:
        return False

    name = applicant_name or "신청자"
    memo = (review_notes or "").strip()
    if approved:
        subject = f"[WizCoCo] 상담사 전환 승인 안내 — {name}"
        body = f"""안녕하세요, {name}님.

WizCoCo 상담사 전환 신청이 승인되었습니다.
이제 상담사 메뉴와 내담자 연결 기능을 이용하실 수 있습니다.

"""
        if memo:
            body += f"관리자 안내:\n{memo}\n\n"
        body += """마이페이지 > 설정에서 상담사 계정 정보를 확인하실 수 있습니다.
https://wizcoco.com/mypage/settings

감사합니다.
WizCoCo 팀
"""
    else:
        subject = f"[WizCoCo] 상담사 전환 신청 결과 안내 — {name}"
        body = f"""안녕하세요, {name}님.

WizCoCo 상담사 전환 신청이 반려되었습니다.
아래 안내를 참고하여 내용을 수정한 뒤 다시 신청해 주세요.

"""
        if memo:
            body += f"관리자 안내:\n{memo}\n\n"
        else:
            body += "자세한 사유는 마이페이지 > 설정 > 상담사 계정에서 확인해 주세요.\n\n"
        body += """https://wizcoco.com/mypage/settings

감사합니다.
WizCoCo 팀
"""

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM, [email], msg.as_string())

    return True
