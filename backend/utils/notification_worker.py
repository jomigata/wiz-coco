"""notificationQueue pending 항목 처리 — 이메일/SMS 발송."""
from datetime import datetime, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import NOTIFICATION_QUEUE_COLLECTION, PUBLIC_SITE_URL, is_email_configured
from firebase_init import get_firestore
from utils.email_notify import (
    send_portal_invite_email,
    send_portal_credentials_email,
    send_test_reminder_email,
    send_care_assignment_email,
)
from utils.sms_notify import (
    send_portal_invite_sms,
    send_portal_credentials_sms,
    send_test_reminder_sms,
    send_care_assignment_sms,
)
from utils.kakao_alimtalk import (
    send_care_assignment_alimtalk,
    send_portal_credentials_alimtalk,
    send_test_reminder_alimtalk,
)
from utils.portal_magic import create_portal_magic_link_token


def _finalize_multi_channel_delivery(
    *,
    email: str,
    phone: str,
    email_ok: bool,
    alimtalk_ok: bool,
    sms_ok: bool,
    errors: list[str],
) -> dict:
    """이메일·휴대폰(알림톡→SMS)을 각각 독립 발송한 뒤 종합 상태 반환."""
    phone_ok = alimtalk_ok or sms_ok

    sent_via_parts: list[str] = []
    if email_ok:
        sent_via_parts.append("email")
    if alimtalk_ok:
        sent_via_parts.append("kakao_alimtalk")
    elif sms_ok:
        sent_via_parts.append("sms")
    sent_via = ",".join(sent_via_parts) if sent_via_parts else None

    if not email and not phone:
        return {"status": "skipped", "errors": [*errors, "no_recipient"], "sentVia": sent_via}

    channel_results: list[bool] = []
    if email:
        channel_results.append(email_ok)
    if phone:
        channel_results.append(phone_ok)

    if all(channel_results):
        status = "sent"
    elif any(channel_results):
        status = "partial"
        if email and not email_ok and "email_send_failed" not in errors:
            errors.append("email_send_failed")
        if phone and not phone_ok and "phone_send_failed" not in errors:
            errors.append("phone_send_failed")
    elif errors:
        status = "failed"
    else:
        status = "skipped"

    return {"status": status, "errors": errors, "sentVia": sent_via}


def deliver_portal_credentials(
    *,
    email: str = "",
    phone: str = "",
    access_code: str,
    pin: str,
    magic_path: str = "",
    display_name: str = "",
    join_access_code: str = "",
) -> dict:
    """나의코드·PIN 등 포털 접속 정보를 이메일·문자로 즉시 발송."""
    email = (email or "").strip().lower()
    phone = (phone or "").strip()
    magic_url = f"{PUBLIC_SITE_URL.rstrip('/')}{magic_path}" if magic_path else PUBLIC_SITE_URL

    email_ok = False
    sms_ok = False
    alimtalk_ok = False
    errors = []

    if email:
        if is_email_configured():
            email_ok = send_portal_credentials_email(
                to_email=email,
                access_code=access_code,
                pin=pin,
                magic_url=magic_url,
                display_name=display_name,
                join_access_code=join_access_code,
            )
            if not email_ok:
                errors.append("email_send_failed")
        else:
            errors.append("smtp_not_configured")

    if phone:
        alimtalk_ok, alimtalk_err = send_portal_credentials_alimtalk(
            to_phone=phone,
            display_name=display_name,
            access_code=access_code,
            pin=pin,
            join_access_code=join_access_code,
            magic_url=magic_url,
        )
        if alimtalk_err and alimtalk_err != "alimtalk_not_configured":
            errors.append(alimtalk_err)

    if phone and not alimtalk_ok:
        sms_ok, sms_err = send_portal_credentials_sms(
            to_phone=phone,
            access_code=access_code,
            pin=pin,
            magic_url=magic_url,
            join_access_code=join_access_code,
            display_name=display_name,
        )
        if sms_err:
            errors.append(sms_err)

    return _finalize_multi_channel_delivery(
        email=email,
        phone=phone,
        email_ok=email_ok,
        alimtalk_ok=alimtalk_ok,
        sms_ok=sms_ok,
        errors=errors,
    )


def deliver_test_reminder(
    *,
    email: str = "",
    phone: str = "",
    display_name: str = "",
    assessment_title: str = "",
    join_access_code: str = "",
    my_code: str = "",
    pending_tests: list[dict] | None = None,
    completed_count: int = 0,
    required_count: int = 0,
    magic_path: str = "",
) -> dict:
    """미실시·미완료 검사 현황과 검사 연결 링크를 이메일·문자로 즉시 발송."""
    email = (email or "").strip().lower()
    phone = (phone or "").strip()
    magic_url = f"{PUBLIC_SITE_URL.rstrip('/')}{magic_path}" if magic_path else PUBLIC_SITE_URL

    email_ok = False
    sms_ok = False
    alimtalk_ok = False
    errors = []

    pending_summary = ", ".join(
        (item.get("testName") or item.get("testId") or "검사").strip()
        for item in (pending_tests or [])[:5]
    )

    if email:
        if is_email_configured():
            email_ok = send_test_reminder_email(
                to_email=email,
                display_name=display_name,
                assessment_title=assessment_title,
                join_access_code=join_access_code,
                my_code=my_code,
                pending_tests=pending_tests,
                completed_count=completed_count,
                required_count=required_count,
                magic_url=magic_url,
            )
            if not email_ok:
                errors.append("email_send_failed")
        else:
            errors.append("smtp_not_configured")

    if phone:
        alimtalk_ok, alimtalk_err = send_test_reminder_alimtalk(
            to_phone=phone,
            display_name=display_name,
            assessment_title=assessment_title,
            magic_url=magic_url,
            pending_summary=pending_summary,
        )
        if alimtalk_err and alimtalk_err != "alimtalk_not_configured":
            errors.append(alimtalk_err)

    if phone and not alimtalk_ok:
        sms_ok, sms_err = send_test_reminder_sms(
            to_phone=phone,
            display_name=display_name,
            assessment_title=assessment_title,
            join_access_code=join_access_code,
            my_code=my_code,
            pending_tests=pending_tests,
            completed_count=completed_count,
            required_count=required_count,
            magic_url=magic_url,
        )
        if sms_err:
            errors.append(sms_err)

    return _finalize_multi_channel_delivery(
        email=email,
        phone=phone,
        email_ok=email_ok,
        alimtalk_ok=alimtalk_ok,
        sms_ok=sms_ok,
        errors=errors,
    )


def deliver_care_assignment(
    *,
    email: str = "",
    phone: str = "",
    display_name: str = "",
    assignment_title: str = "",
    portal_access_code: str = "",
    magic_path: str = "",
) -> dict:
    """치료·과제 할당 안내를 이메일·문자로 즉시 발송."""
    email = (email or "").strip().lower()
    phone = (phone or "").strip()
    magic_url = f"{PUBLIC_SITE_URL.rstrip('/')}{magic_path}" if magic_path else PUBLIC_SITE_URL

    email_ok = False
    sms_ok = False
    alimtalk_ok = False
    errors = []

    if email:
        if is_email_configured():
            email_ok = send_care_assignment_email(
                to_email=email,
                display_name=display_name,
                assignment_title=assignment_title,
                portal_access_code=portal_access_code,
                magic_url=magic_url,
            )
            if not email_ok:
                errors.append("email_send_failed")
        else:
            errors.append("smtp_not_configured")

    if phone:
        alimtalk_ok, alimtalk_err = send_care_assignment_alimtalk(
            to_phone=phone,
            display_name=display_name,
            assignment_title=assignment_title,
            magic_url=magic_url,
        )
        if alimtalk_err and alimtalk_err != "alimtalk_not_configured":
            errors.append(alimtalk_err)

    if phone and not alimtalk_ok:
        sms_ok, sms_err = send_care_assignment_sms(
            to_phone=phone,
            display_name=display_name,
            assignment_title=assignment_title,
            portal_access_code=portal_access_code,
            magic_url=magic_url,
        )
        if sms_err:
            errors.append(sms_err)

    return _finalize_multi_channel_delivery(
        email=email,
        phone=phone,
        email_ok=email_ok,
        alimtalk_ok=alimtalk_ok,
        sms_ok=sms_ok,
        errors=errors,
    )


def process_notification_queue(*, limit: int = 50) -> dict:
    db = get_firestore()
    refs = (
        db.collection(NOTIFICATION_QUEUE_COLLECTION)
        .where("status", "==", "pending")
        .limit(limit)
        .stream()
    )

    processed = 0
    sent = 0
    failed = 0
    skipped = 0
    details = []

    for doc in refs:
        processed += 1
        data = doc.to_dict() or {}
        scheduled_raw = (data.get("scheduledAt") or "").strip()
        if scheduled_raw:
            try:
                sched = datetime.fromisoformat(scheduled_raw.replace("Z", "+00:00"))
                if sched.tzinfo is None:
                    sched = sched.replace(tzinfo=timezone.utc)
                if sched > datetime.now(timezone.utc):
                    details.append({"id": doc.id, "status": "pending", "reason": "scheduled"})
                    continue
            except Exception:
                pass

        item_type = data.get("type") or ""
        email = (data.get("email") or "").strip().lower()
        phone = (data.get("phone") or "").strip()
        access_code = data.get("accessCode") or ""
        magic_path = data.get("magicPath") or ""
        magic_url = f"{PUBLIC_SITE_URL.rstrip('/')}{magic_path}" if magic_path else PUBLIC_SITE_URL

        try:
            if item_type == "portal_credentials":
                pin = str(data.get("pin") or "")
                join_code = str(data.get("joinAccessCode") or "")
                result = deliver_portal_credentials(
                    email=email,
                    phone=phone,
                    access_code=access_code,
                    pin=pin,
                    magic_path=magic_path,
                    display_name=data.get("displayName") or "",
                    join_access_code=join_code,
                )
                status = result["status"]
                errors = result["errors"]
                sent_via = result.get("sentVia") or ""

                if status == "sent":
                    sent += 1
                elif status in ("failed", "partial"):
                    failed += 1
                elif status == "skipped":
                    skipped += 1

                update_payload = {"status": status, "processedAt": SERVER_TIMESTAMP}
                if errors:
                    update_payload["error"] = "; ".join(errors)
                if sent_via:
                    update_payload["sentVia"] = sent_via
                doc.reference.update(update_payload)
                details.append({"id": doc.id, "status": status, "errors": errors})
                continue

            if item_type == "care_assignment":
                payload = data.get("payload") or {}
                assignment_title = (payload.get("title") or "").strip() or "새 치료·과제"
                portal_access_code = (
                    (payload.get("portalAccessCode") or data.get("accessCode") or "").strip()
                )
                portal_id = (data.get("portalId") or "").strip()
                magic_path = (data.get("magicPath") or "").strip()
                if not magic_path and portal_id and portal_access_code:
                    magic = create_portal_magic_link_token(portal_id, portal_access_code)
                    magic_path = f"/go?t={magic}&tab=care"

                result = deliver_care_assignment(
                    email=email,
                    phone=phone,
                    display_name=data.get("displayName") or "",
                    assignment_title=assignment_title,
                    portal_access_code=portal_access_code,
                    magic_path=magic_path,
                )
                status = result["status"]
                errors = result["errors"]
                sent_via = result.get("sentVia") or ""

                if status == "sent":
                    sent += 1
                elif status in ("failed", "partial"):
                    failed += 1
                elif status == "skipped":
                    skipped += 1

                update_payload = {"status": status, "processedAt": SERVER_TIMESTAMP}
                if errors:
                    update_payload["error"] = "; ".join(errors)
                if sent_via:
                    update_payload["sentVia"] = sent_via
                if magic_path:
                    update_payload["magicPath"] = magic_path
                doc.reference.update(update_payload)
                details.append({"id": doc.id, "status": status, "errors": errors})
                continue

            if item_type != "portal_invite":
                doc.reference.update(
                    {
                        "status": "skipped",
                        "processedAt": SERVER_TIMESTAMP,
                        "error": f"unsupported type: {item_type}",
                    }
                )
                skipped += 1
                details.append({"id": doc.id, "status": "skipped", "reason": item_type})
                continue

            email_ok = False
            sms_ok = False
            errors = []

            if email:
                if is_email_configured():
                    email_ok = send_portal_invite_email(
                        to_email=email,
                        access_code=access_code,
                        magic_url=magic_url,
                    )
                    if not email_ok:
                        errors.append("email_send_failed")
                else:
                    errors.append("smtp_not_configured")

            if phone:
                sms_ok, sms_err = send_portal_invite_sms(
                    to_phone=phone,
                    access_code=access_code,
                    magic_url=magic_url,
                )
                if sms_err:
                    errors.append(sms_err)

            if email and email_ok:
                status = "sent"
                sent += 1
            elif phone and sms_ok:
                status = "sent"
                sent += 1
            elif not email and not phone:
                status = "skipped"
                skipped += 1
                errors.append("no_recipient")
            elif errors:
                status = "failed"
                failed += 1
            else:
                status = "skipped"
                skipped += 1

            update_payload = {
                    "status": status,
                    "processedAt": SERVER_TIMESTAMP,
                }
            if errors:
                update_payload["error"] = "; ".join(errors)
            if email_ok:
                update_payload["sentVia"] = "email"
            elif sms_ok:
                update_payload["sentVia"] = "sms"
            doc.reference.update(update_payload)
            details.append({"id": doc.id, "status": status, "errors": errors})
        except Exception as exc:
            failed += 1
            doc.reference.update(
                {
                    "status": "failed",
                    "processedAt": SERVER_TIMESTAMP,
                    "error": str(exc)[:500],
                }
            )
            details.append({"id": doc.id, "status": "failed", "error": str(exc)[:200]})

    return {
        "processed": processed,
        "sent": sent,
        "failed": failed,
        "skipped": skipped,
        "at": datetime.now(timezone.utc).isoformat(),
        "details": details[:20],
    }
