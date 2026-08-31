"""내담자 공개 나의코드 수령 — 상담(코드) + 가명 + 전화번호."""
from __future__ import annotations

from config import ASSESSMENTS_COLLECTION, COMMERCE_CREDITS_ENFORCE
from utils.access_code import is_valid_access_code, normalize_access_code
from utils.bulk_portal_worker import create_portal_for_row
from utils.counselor_credits import InsufficientCreditsError, consume_credits, get_balance
from utils.phone_format import normalize_recipient_phone
from utils.portal_magic import create_portal_magic_link_token

MSG_NOT_FOUND = (
    "요청하신 상담(코드)가 확인되지 않습니다. 상담(코드)를 다시 확인해 주시기 바랍니다."
)
MSG_EXPIRED = "상담(코드) 사용기한이 종료되었습니다. 상담사에게 새 코드 발급을 요청해 주세요."


def _is_assessment_expired(d: dict) -> bool:
    from datetime import datetime, timezone

    usage_end = str(d.get("usageEndDate") or "").strip()
    if not usage_end:
        return False
    try:
        end_date = datetime.strptime(usage_end, "%Y-%m-%d").date()
    except Exception:
        return False
    return datetime.now(timezone.utc).date() > end_date


def _find_active_assessment(db, code: str):
    refs = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("accessCode", "==", code)
        .where("status", "==", "active")
        .limit(1)
        .get()
    )
    return refs[0] if refs else None


def _parse_contact(raw: str) -> tuple[str, str]:
    s = (raw or "").strip()
    if "@" in s:
        email = s.lower()
        return email, ""
    return "", normalize_recipient_phone(s)


def _delivery_success_message(display_name: str, contact_kind: str) -> str:
    if contact_kind == "email":
        return f"{display_name}님, 나의코드와 비밀번호를 이메일로 발송했습니다."
    return f"{display_name}님, 나의코드와 비밀번호를 문자(알림톡)로 발송했습니다."


def claim_my_code_public(
    db,
    *,
    join_access_code: str,
    display_name: str,
    contact: str = "",
    phone: str = "",
    email: str = "",
) -> dict:
    code = normalize_access_code(join_access_code)
    name = (display_name or "").strip()
    raw_contact = (contact or phone or email or "").strip()
    email_norm, phone_norm = _parse_contact(raw_contact)

    if not is_valid_access_code(code):
        return {"ok": False, "error": "invalid_code", "message": MSG_NOT_FOUND}
    if not name or len(name) > 80:
        return {"ok": False, "error": "invalid_name", "message": "가명을 입력해 주세요."}
    if email_norm:
        if "@" not in email_norm or len(email_norm) < 5:
            return {
                "ok": False,
                "error": "invalid_contact",
                "message": "휴대폰 번호 또는 이메일을 입력해 주세요.",
            }
    elif len(phone_norm) < 10:
        return {
            "ok": False,
            "error": "invalid_contact",
            "message": "휴대폰 번호 또는 이메일을 입력해 주세요.",
        }

    ass_doc = _find_active_assessment(db, code)
    if not ass_doc:
        return {"ok": False, "error": "not_found", "message": MSG_NOT_FOUND}
    ass_data = ass_doc.to_dict() or {}
    if _is_assessment_expired(ass_data):
        return {"ok": False, "error": "expired", "message": MSG_EXPIRED}
    if (ass_data.get("issueType") or "individual") != "individual":
        return {
            "ok": False,
            "error": "not_individual",
            "message": "개별 발급 상담(코드)만 이용할 수 있습니다.",
        }

    counselor_uid = (ass_data.get("counselorId") or "").strip()
    if not counselor_uid:
        return {"ok": False, "error": "invalid_assessment", "message": MSG_NOT_FOUND}

    if COMMERCE_CREDITS_ENFORCE and get_balance(db, counselor_uid) < 1:
        return {
            "ok": False,
            "error": "credits_exhausted",
            "message": "현재 코드 발급이 일시 중단되었습니다. 담당 상담사에게 문의해 주세요.",
        }

    cohort_id = ass_data.get("clientPortalCohortId") or ""
    cohort_name = (ass_data.get("cohortName") or ass_data.get("title") or "내담자").strip()
    title = (ass_data.get("title") or cohort_name).strip()
    welcome_message = (ass_data.get("welcomeMessage") or "").strip()
    has_contact = bool(email_norm or phone_norm)
    contact_kind = "email" if email_norm else "phone"

    created_row, notify_queued, notify_sent, notify_failed = create_portal_for_row(
        db,
        row={"displayName": name, "email": email_norm, "phone": phone_norm},
        counselor_uid=counselor_uid,
        cohort_id=cohort_id,
        cohort_name=cohort_name,
        assessment_ref_id=ass_doc.id,
        join_access_code=code,
        queue_notify=has_contact,
        scheduled_at_iso="",
        bulk_job_id="",
        create_magic_link=create_portal_magic_link_token,
        immediate_notify=has_contact,
        assessment_title=title,
        welcome_message=welcome_message,
    )

    if has_contact and notify_failed and notify_sent == 0 and not notify_queued:
        return {
            "ok": False,
            "error": "notify_failed",
            "message": "접속 정보 발송에 실패했습니다. 잠시 후 다시 시도하거나 담당 상담사에게 문의해 주세요.",
        }

    try:
        consume_credits(
            db,
            counselor_uid,
            1,
            reason="public_portal_claim",
            actor_uid=None,
            metadata={"assessmentId": ass_doc.id, "portalId": created_row.get("portalId", "")},
        )
    except InsufficientCreditsError:
        pass

    return {
        "ok": True,
        "displayName": name,
        "assessmentId": ass_doc.id,
        "joinAccessCode": code,
        "contactKind": contact_kind,
        "notifyStatus": "sent" if notify_sent else ("queued" if notify_queued else "skipped"),
        "message": _delivery_success_message(name, contact_kind),
    }
