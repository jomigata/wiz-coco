"""관리자 알림 이메일 (SMTP 설정 시 발송)."""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from utils.phone_format import format_phone_display

from config import (
    COUNSELOR_ADMIN_NOTIFY_EMAIL,
    MAIL_FROM,
    PUBLIC_SITE_URL,
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
전화: {format_phone_display(phone) if phone else '-'}
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


def _format_pin_display(pin: str) -> str:
    digits = "".join(c for c in str(pin or "") if c.isdigit())
    return digits.zfill(4)[-4:] if digits else str(pin or "")


def send_portal_credentials_email(
    *,
    to_email: str,
    access_code: str,
    pin: str,
    magic_url: str,
    display_name: str = "",
    join_access_code: str = "",
) -> bool:
    """검사시작 접속 정보(검사코드·나의코드·비밀번호·링크) 발송."""
    if not is_email_configured():
        return False

    email = (to_email or "").strip().lower()
    if not email or "@" not in email:
        return False

    name = (display_name or "").strip() or "내담자"
    join_code = (join_access_code or "").strip().upper()
    my_code = (access_code or "").strip().upper()
    pin_display = _format_pin_display(pin)
    login_url = f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"

    cred_lines = [f"나의코드: {my_code}  비밀번호: {pin_display}"]
    if join_code:
        cred_lines.insert(0, f"검사코드: {join_code}")

    body = f"""안녕하세요, {name}님.

WizCoCo 심리검사 접속 정보입니다.

{chr(10).join(cred_lines)}

▶ 검사시작
{login_url}

▶ 바로 시작 (추천)
{magic_url}

링크는 72시간 동안 유효합니다.

WizCoCo
"""

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = email
    msg["Subject"] = f"[WizCoCo] 검사시작 접속 안내 ({name})"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM, [email], msg.as_string())

    return True


def send_test_reminder_email(
    *,
    to_email: str,
    display_name: str = "",
    assessment_title: str = "",
    join_access_code: str = "",
    my_code: str = "",
    pending_tests: list[dict] | None = None,
    completed_count: int = 0,
    required_count: int = 0,
    magic_url: str,
) -> bool:
    """미실시·미완료 검사 현황과 검사 연결 링크 안내."""
    if not is_email_configured():
        return False

    email = (to_email or "").strip().lower()
    if not email or "@" not in email:
        return False

    name = (display_name or "").strip() or "내담자"
    title = (assessment_title or "").strip() or "심리검사"
    join_code = (join_access_code or "").strip().upper()
    portal_code = (my_code or "").strip().upper()
    login_url = f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"

    pending_lines: list[str] = []
    for item in pending_tests or []:
        test_name = (item.get("testName") or item.get("testId") or "검사").strip()
        status = (item.get("status") or "not_started").strip()
        if status == "in_progress":
            pending_lines.append(f"- {test_name} (진행 중)")
        else:
            pending_lines.append(f"- {test_name} (미실시)")

    if not pending_lines:
        pending_lines.append("- 미완료 검사 없음")

    cred_lines: list[str] = []
    if join_code:
        cred_lines.append(f"검사코드: {join_code}")
    if portal_code:
        cred_lines.append(f"나의코드: {portal_code}")

    progress = (
        f"{completed_count}/{required_count} 완료"
        if required_count > 0
        else "진행 중"
    )

    body = f"""안녕하세요, {name}님.

WizCoCo 심리검사 미완료 안내입니다.

검사명: {title}
진행 현황: {progress}

▶ 미완료 검사
{chr(10).join(pending_lines)}

"""
    if cred_lines:
        body += f"""▶ 접속 정보
{chr(10).join(cred_lines)}

"""

    body += f"""▶ 검사시작
{login_url}

▶ 바로 시작 (추천)
{magic_url}

링크는 72시간 동안 유효합니다.

WizCoCo
"""

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = email
    msg["Subject"] = f"[WizCoCo] 미실시 알림 ({name})"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM, [email], msg.as_string())

    return True


def send_care_assignment_email(
    *,
    to_email: str,
    display_name: str = "",
    assignment_title: str = "",
    portal_access_code: str = "",
    magic_url: str,
) -> bool:
    """치료·과제 할당 안내 — 포털 치료 탭 바로가기 링크."""
    if not is_email_configured():
        return False

    email = (to_email or "").strip().lower()
    if not email or "@" not in email:
        return False

    name = (display_name or "").strip() or "내담자"
    title = (assignment_title or "").strip() or "새 치료·과제"
    my_code = (portal_access_code or "").strip().upper()
    login_url = f"{PUBLIC_SITE_URL.rstrip('/')}/portal/login/"
    care_url = f"{PUBLIC_SITE_URL.rstrip('/')}/portal/?tab=care"

    body = f"""안녕하세요, {name}님.

담당 전문가가 WizCoCo에 새 치료·과제를 할당했습니다.

▶ 과제명
{title}

"""
    if my_code:
        body += f"""▶ 나의코드
{my_code}

"""

    body += f"""▶ 치료·과제 바로 보기 (추천)
{magic_url}

▶ 검사실 로그인 후 「추가 과제·치료」 탭
{care_url}

▶ 검사시작 로그인
{login_url}

링크는 72시간 동안 유효합니다.

WizCoCo
"""

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = email
    msg["Subject"] = f"[WizCoCo] 치료·과제 안내 ({name})"
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
