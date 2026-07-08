# 치료·과제 마감 리마인더 (Wave 6 — T-6-04)
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    CARE_ASSIGNMENTS_COLLECTION,
    CARE_PROGRESS_COLLECTION,
    CARE_REMINDER_MIN_HOURS,
    CLIENT_PORTALS_COLLECTION,
)
from utils.notification_worker import deliver_care_assignment
from utils.portal_magic import create_portal_magic_link_token


def _hours_since(ts) -> float | None:
    if not ts:
        return None
    if hasattr(ts, "timestamp"):
        dt = datetime.fromtimestamp(ts.timestamp(), tz=timezone.utc)
    elif isinstance(ts, str):
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    else:
        return None
    return (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0


def _parse_due_at(value: str | None) -> datetime | None:
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def process_care_due_reminders(
    db,
    *,
    limit: int = 30,
    min_hours: int | None = None,
) -> dict:
    """마감일(dueAt) 경과·임박 active 케어 할당 리마인더."""
    min_hours = max(12, min_hours if min_hours is not None else CARE_REMINDER_MIN_HOURS)
    limit = max(1, min(limit, 80))
    now = datetime.now(timezone.utc)

    sent = skipped = failed = 0
    details: list[dict] = []

    for doc in (
        db.collection(CARE_ASSIGNMENTS_COLLECTION)
        .where("status", "==", "active")
        .limit(150)
        .stream()
    ):
        if sent + failed >= limit:
            break

        data = doc.to_dict() or {}
        due_at = _parse_due_at(data.get("dueAt"))
        if not due_at:
            continue
        if due_at > now + timedelta(hours=24):
            continue

        assignment_id = doc.id
        portal_id = (data.get("portalId") or "").strip()
        if not portal_id:
            continue

        progress_doc = (
            db.collection(CARE_PROGRESS_COLLECTION)
            .where("assignmentId", "==", assignment_id)
            .limit(1)
            .stream()
        )
        progress_status = "not_started"
        for pdoc in progress_doc:
            progress_status = (pdoc.to_dict() or {}).get("status") or "not_started"
            break
        if progress_status == "completed":
            skipped += 1
            continue

        last_hours = _hours_since(data.get("lastCareReminderAt"))
        if last_hours is not None and last_hours < min_hours:
            skipped += 1
            continue

        portal_snap = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).get()
        if not portal_snap.exists:
            skipped += 1
            continue
        pdata = portal_snap.to_dict() or {}
        if (pdata.get("status") or "active") != "active":
            skipped += 1
            continue

        email = (pdata.get("email") or "").strip().lower()
        phone = (pdata.get("phone") or "").strip()
        if not email and not phone:
            skipped += 1
            details.append({"assignmentId": assignment_id, "status": "skipped", "message": "no_contact"})
            continue

        portal_access_code = (pdata.get("accessCode") or "").strip()
        magic = create_portal_magic_link_token(portal_id, portal_access_code)
        magic_path = f"/go?t={magic}&tab=care"

        result = deliver_care_assignment(
            email=email,
            phone=phone,
            display_name=pdata.get("displayName") or data.get("portalDisplayName") or "",
            assignment_title=(data.get("title") or "").strip(),
            portal_access_code=portal_access_code,
            magic_path=magic_path,
        )

        status = result.get("status") or "failed"
        if status == "sent":
            sent += 1
            db.collection(CARE_ASSIGNMENTS_COLLECTION).document(assignment_id).set(
                {"lastCareReminderAt": SERVER_TIMESTAMP},
                merge=True,
            )
        elif status == "skipped":
            skipped += 1
        else:
            failed += 1

        details.append(
            {
                "assignmentId": assignment_id,
                "portalId": portal_id,
                "status": status,
                "sentVia": result.get("sentVia"),
                "errors": result.get("errors"),
            }
        )

    return {
        "sent": sent,
        "skipped": skipped,
        "failed": failed,
        "minHoursBetween": min_hours,
        "details": details[:50],
    }
