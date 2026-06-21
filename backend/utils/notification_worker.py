"""notificationQueue pending 항목 처리 — 이메일/SMS 발송."""
from datetime import datetime, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import NOTIFICATION_QUEUE_COLLECTION, PUBLIC_SITE_URL, is_email_configured
from firebase_init import get_firestore
from utils.email_notify import send_portal_invite_email, send_portal_credentials_email
from utils.sms_notify import send_portal_invite_sms, send_portal_credentials_sms


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
                email_ok = False
                sms_ok = False
                errors = []

                if email:
                    if is_email_configured():
                        email_ok = send_portal_credentials_email(
                            to_email=email,
                            access_code=access_code,
                            pin=pin,
                            magic_url=magic_url,
                            display_name=data.get("displayName") or "",
                            join_access_code=join_code,
                        )
                        if not email_ok:
                            errors.append("email_send_failed")
                    else:
                        errors.append("smtp_not_configured")

                if phone:
                    sms_ok, sms_err = send_portal_credentials_sms(
                        to_phone=phone,
                        access_code=access_code,
                        pin=pin,
                        magic_url=magic_url,
                        join_access_code=join_code,
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

                update_payload = {"status": status, "processedAt": SERVER_TIMESTAMP}
                if errors:
                    update_payload["error"] = "; ".join(errors)
                if email_ok:
                    update_payload["sentVia"] = "email"
                elif sms_ok:
                    update_payload["sentVia"] = "sms"
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
