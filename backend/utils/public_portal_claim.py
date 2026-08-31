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

    created_row, _, _, _ = create_portal_for_row(
        db,
        row={"displayName": name, "email": email_norm, "phone": phone_norm},
        counselor_uid=counselor_uid,
        cohort_id=cohort_id,
        cohort_name=cohort_name,
        assessment_ref_id=ass_doc.id,
        join_access_code=code,
        queue_notify=False,
        scheduled_at_iso="",
        bulk_job_id="",
        create_magic_link=create_portal_magic_link_token,
        immediate_notify=False,
        assessment_title=title,
        welcome_message=welcome_message,
    )

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

    my_code = created_row.get("accessCode") or created_row.get("myCode") or ""
    pin = created_row.get("pin") or ""
    return {
        "ok": True,
        "accessCode": my_code,
        "myCode": my_code,
        "pin": pin,
        "displayName": name,
        "assessmentId": ass_doc.id,
        "joinAccessCode": code,
        "message": "나의코드가 발급되었습니다. 아래 정보를 저장한 뒤 검사 시작에 사용해 주세요.",
    }
