"""관리자 알림 이메일 (SMTP 설정 시 발송)."""
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email import encoders

from utils.phone_format import format_phone_display

from config import (
    COUNSELOR_ADMIN_NOTIFY_EMAIL,
    MAIL_FROM,
    PORTAL_MAGIC_LINK_MAX_AGE,
    PUBLIC_SITE_URL,
    PURCHASE_INQUIRY_NOTIFY_EMAILS,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USER,
    is_email_configured,
)

_KST = timezone(timedelta(hours=9))


def _format_dt_kst(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(_KST).strftime("%Y년 %m월 %d일 %H:%M")


def _magic_link_expiry_label(issued_at: datetime | None = None) -> str:
    issued = issued_at or datetime.now(timezone.utc)
    if issued.tzinfo is None:
        issued = issued.replace(tzinfo=timezone.utc)
    expires = issued + timedelta(seconds=PORTAL_MAGIC_LINK_MAX_AGE)
    hours = max(1, PORTAL_MAGIC_LINK_MAX_AGE // 3600)
    return f"유효기한: {_format_dt_kst(expires)}까지 (발송 후 {hours}시간)"


def _attach_email_bodies(msg: MIMEMultipart, plain: str, html: str) -> None:
    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(plain, "plain", "utf-8"))
    alt.attach(MIMEText(html, "html", "utf-8"))
    msg.attach(alt)


def _portal_access_html_email(
    *,
    greeting: str,
    intro: str,
    my_code: str,
    pin_display: str,
    login_url: str,
    magic_url: str,
    magic_expiry_label: str,
    extra_sections: list[tuple[str, str]] | None = None,
) -> str:
    extra_html = ""
    for title, content in extra_sections or []:
        extra_html += f"""
        <tr><td style="padding:0 0 16px 0">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b">{title}</p>
          <div style="font-size:14px;line-height:1.65;color:#cbd5e1;white-space:pre-line">{content}</div>
        </td></tr>"""

    return f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto">
    <tr><td style="padding:0 0 16px 0">
      <div style="border-radius:16px 16px 0 0;background:linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%);padding:22px 24px">
        <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.82)">WizCoCo</p>
        <h1 style="margin:8px 0 0;font-size:22px;line-height:1.35;font-weight:700;color:#ffffff">검사 접속 정보</h1>
      </div>
    </td></tr>
    <tr><td style="padding:0">
      <div style="border:1px solid #1e293b;border-top:none;border-radius:0 0 16px 16px;background:#111827;padding:24px">
        <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#f8fafc">{greeting}</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#94a3b8">{intro}</p>
        {extra_html}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px 0;border:1px solid #1e3a5f;border-radius:12px;background:#0f172a">
          <tr><td style="padding:16px 18px">
            <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b">접속 정보</p>
            <p style="margin:0 0 6px;font-size:15px;color:#e2e8f0"><span style="color:#94a3b8">나의코드</span> <strong style="color:#67e8f9;font-family:Consolas,Monaco,monospace">{my_code}</strong></p>
            <p style="margin:0;font-size:15px;color:#e2e8f0"><span style="color:#94a3b8">비밀번호</span> <strong style="color:#fde68a;font-family:Consolas,Monaco,monospace">{pin_display}</strong></p>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px 0">
          <tr><td style="padding:0 0 10px 0">
            <a href="{login_url}" style="display:block;text-align:center;padding:13px 16px;border-radius:10px;background:#334155;color:#f8fafc;text-decoration:none;font-size:14px;font-weight:600">검사시작 로그인</a>
          </td></tr>
          <tr><td style="padding:0">
            <a href="{magic_url}" style="display:block;text-align:center;padding:14px 16px;border-radius:10px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700">바로 시작 (추천)</a>
          </td></tr>
        </table>
        <p style="margin:0 0 18px;font-size:12px;line-height:1.6;color:#64748b;text-align:center">{magic_expiry_label}</p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#475569;text-align:center">본 메일은 검사 안내 목적으로 발송되었습니다.</p>
      </div>
    </td></tr>
  </table>
</body></html>"""


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
    """검사시작 접속 정보(상담(코드)·나의코드·비밀번호·링크) 발송."""
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
    magic_expiry_label = _magic_link_expiry_label()

    body = f"""안녕하세요, {name}님.

WizCoCo 검사 접속 정보입니다.

{chr(10).join(cred_lines)}

▶ 검사시작
{login_url}

▶ 바로 시작 (추천)
{magic_url}

{magic_expiry_label}

WizCoCo
"""

    html = _portal_access_html_email(
        greeting=f"안녕하세요, {name}님",
        intro="WizCoCo 검사 접속 정보입니다. 아래 나의코드·비밀번호 또는 바로 시작 링크로 검사를 진행해 주세요.",
        my_code=my_code,
        pin_display=pin_display,
        login_url=login_url,
        magic_url=magic_url,
        magic_expiry_label=magic_expiry_label,
    )

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = email
    msg["Subject"] = f"[WizCoCo] 검사시작 접속 안내 ({name})"
    _attach_email_bodies(msg, body, html)

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

    magic_expiry_label = _magic_link_expiry_label()
    body += f"""▶ 검사시작
{login_url}

▶ 바로 시작 (추천)
{magic_url}

{magic_expiry_label}

WizCoCo
"""

    extra_sections: list[tuple[str, str]] = [
        ("검사명", title),
        ("진행 현황", progress),
        ("미완료 검사", "\n".join(pending_lines)),
    ]
    if cred_lines:
        extra_sections.insert(2, ("접속 정보", "\n".join(cred_lines)))

    html = _portal_access_html_email(
        greeting=f"안녕하세요, {name}님",
        intro="WizCoCo 심리검사 미완료 안내입니다. 아래 검사를 이어서 진행해 주세요.",
        my_code=portal_code or "—",
        pin_display="(이메일·문자 안내 참고)",
        login_url=login_url,
        magic_url=magic_url,
        magic_expiry_label=magic_expiry_label,
        extra_sections=extra_sections,
    )

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = email
    msg["Subject"] = f"[WizCoCo] 미실시 알림 ({name})"
    _attach_email_bodies(msg, body, html)

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
    """내담자 포털 초대 — 상담(코드)·매직 링크 안내."""
    if not is_email_configured():
        return False

    email = (to_email or "").strip().lower()
    if not email or "@" not in email:
        return False

    body = f"""안녕하세요.

담당 전문가가 WizCoCo 심리검사를 안내드립니다.

▶ 바로 시작 (추천)
{magic_url}

▶ 상담(코드)로 직접 접속
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


def send_personal_purchase_inquiry_email(
    *,
    name: str,
    email: str,
    phone: str = "",
    package_interest: str = "",
    message: str = "",
    attachments: list[tuple[str, bytes, str]] | None = None,
) -> bool:
    """개인 상담(코드) 구매 문의 — 관리자 수신 목록으로 SMTP 발송."""
    if not is_email_configured():
        return False

    recipients = PURCHASE_INQUIRY_NOTIFY_EMAILS or [COUNSELOR_ADMIN_NOTIFY_EMAIL]
    pkg = package_interest or "(미선택)"
    phone_display = format_phone_display(phone) if phone else "(미입력)"
    body = f"""WizCoCo 개인 상담(코드) 구매 문의

이름: {name}
이메일: {email}
휴대폰: {phone_display}
관심 패키지: {pkg}

문의 내용:
{message or '(내용 없음)'}

---
회신 시 문의자 이메일({email})로 답장해 주세요.
"""

    msg = MIMEMultipart()
    msg["From"] = MAIL_FROM
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = f"[WizCoCo] 개인 상담(코드) 구매 문의 — {name}"
    msg["Reply-To"] = email
    msg.attach(MIMEText(body, "plain", "utf-8"))

    for filename, payload, content_type in attachments or []:
        if not filename or not payload:
            continue
        main_type, sub_type = (
            content_type.split("/", 1) if "/" in content_type else ("application", "octet-stream")
        )
        part = MIMEBase(main_type, sub_type)
        part.set_payload(payload)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(part)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM, recipients, msg.as_string())

    return True
