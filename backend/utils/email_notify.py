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


def send_portal_credentials_email(
    *,
    to_email: str,
    access_code: str,
    pin: str,
    magic_url: str,
    display_name: str = "",
    join_access_code: str = "",
) -> bool:
    """내 검사실 접속 정보(나의코드+PIN+링크) 발송. 개별 발급 시 join_access_code(검사코드) 포함."""
    if not is_email_configured():
        return False

    email = (to_email or "").strip().lower()
    if not email or "@" not in email:
        return False

    name = (display_name or "").strip() or "내담자"
    join_code = (join_access_code or "").strip()
    if join_code:
        intro = (
            f"WizCoCo 심리검사 안내입니다.\n"
            f"아래 검사코드로 검사를 시작하거나, 나의코드로 내 검사실에 들어가 진행 상황을 확인할 수 있습니다.\n"
        )
    else:
        intro = (
            f"WizCoCo 심리검사를 진행해 주셔서 감사합니다.\n"
            f"아래 정보로 '내 검사실'에 들어가 결과와 진행 상황을 확인하실 수 있습니다.\n"
        )

    body = f"""안녕하세요, {name}님.

{intro}
"""
    if join_code:
        body += f"""▶ 검사 시작 (검사코드)
검사코드: {join_code}
시작: https://wizcoco.com/join/

"""
    body += f"""▶ 바로 들어가기 (추천)
{magic_url}

▶ 나의코드·비밀번호로 접속
나의코드: {access_code}
비밀번호: {pin}
접속: https://wizcoco.com/portal/login/

링크는 72시간 동안 유효합니다.

WizCoCo
"""

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = email
    msg["Subject"] = "[WizCoCo] 내 검사실 접속 안내 (나의코드)"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM, [email], msg.as_string())

    return True


def send_portal_invite_email(*, to_email: str, access_code: str, magic_url: str) -> bool:
    """내담자 포털 초대 — 검사코드·매직 링크 안내."""
    if not is_email_configured():
        return False

    email = (to_email or "").strip().lower()
    if not email or "@" not in email:
        return False

    body = f"""안녕하세요.

담당 전문가가 WizCoCo 심리검사를 안내드립니다.

▶ 바로 시작 (추천)
{magic_url}

▶ 검사코드로 직접 접속
코드: {access_code}
접속: https://wizcoco.com/join/
(비밀번호는 별도 안내됩니다)

링크는 72시간 동안 유효합니다.

WizCoCo
"""

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = email
    msg["Subject"] = "[WizCoCo] 심리검사 안내"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM, [email], msg.as_string())

    return True
