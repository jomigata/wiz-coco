# 그룹(cohort) 미완료 자동 리마인더 (T-5-02)
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    COHORT_REMINDER_MIN_HOURS,
    PUBLIC_SITE_URL,
)
from utils.assessment_dispatch import (
    _pending_tests_from_rows,
    _test_detail_rows,
    _test_status_for_portal,
)
from utils.notification_worker import deliver_test_reminder
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


def process_cohort_incomplete_reminders(
    db,
    *,
    limit: int = 40,
    min_hours: int | None = None,
) -> dict:
    """기관 cohort 내 미완료 내담자에게 검사 독려 알림 발송."""
    min_hours = max(24, min_hours if min_hours is not None else COHORT_REMINDER_MIN_HOURS)
    limit = max(1, min(limit, 100))

    sent = skipped = failed = 0
    details: list[dict] = []

    ass_snaps = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("status", "==", "active")
        .limit(200)
        .stream()
    )

    candidates: list[tuple[str, dict]] = []
    for doc in ass_snaps:
        a = doc.to_dict() or {}
        if not (a.get("organizationId") or "").strip():
            continue
        if not (a.get("clientPortalCohortId") or "").strip():
            continue
        candidates.append((doc.id, a))

    for assessment_id, ass in candidates:
        if sent + failed >= limit:
            break

        counselor_uid = (ass.get("counselorId") or "").strip()
        cohort_id = (ass.get("clientPortalCohortId") or "").strip()
        test_list = ass.get("testList") or []
        required = {
            str(t.get("testId") or "").strip()
            for t in test_list
            if t and str(t.get("testId") or "").strip()
        }
        if not counselor_uid or not required:
            continue

        portal_snaps = (
            db.collection(CLIENT_PORTALS_COLLECTION)
            .where("cohortId", "==", cohort_id)
            .limit(150)
            .stream()
        )

        for pdoc in portal_snaps:
            if sent + failed >= limit:
                break
            pdata = pdoc.to_dict() or {}
            if (pdata.get("status") or "active") != "active":
                continue
            if pdata.get("counselorId") != counselor_uid:
                continue
            assigned = list(pdata.get("assignedAssessmentIds") or [])
            if assessment_id not in assigned:
                continue

            pid = pdoc.id
            test_info = _test_status_for_portal(db, pid, assessment_id, required)
            if test_info.get("testStatus") == "completed":
                skipped += 1
                continue

            last_hours = _hours_since(pdata.get("lastCohortReminderAt"))
            if last_hours is not None and last_hours < min_hours:
                skipped += 1
                continue

            email = (pdata.get("email") or "").strip().lower()
            phone = (pdata.get("phone") or "").strip()
            if not email and not phone:
                skipped += 1
                details.append({"portalId": pid, "status": "skipped", "message": "no_contact"})
                continue

            test_rows = _test_detail_rows(db, pid, assessment_id, test_list)
            pending = _pending_tests_from_rows(test_rows)
            if not pending:
                skipped += 1
                continue

            portal_access_code = (pdata.get("accessCode") or "").strip()
            magic = create_portal_magic_link_token(pid, portal_access_code)
            magic_path = f"/go?t={magic}"

            result = deliver_test_reminder(
                email=email,
                phone=phone,
                display_name=pdata.get("displayName") or "",
                assessment_title=(ass.get("title") or "").strip(),
                join_access_code=(ass.get("accessCode") or "").strip(),
                my_code=portal_access_code,
                pending_tests=pending,
                completed_count=test_info.get("completedCount") or 0,
                required_count=test_info.get("requiredCount") or len(required),
                magic_path=magic_path,
            )

            status = result.get("status") or "failed"
            if status == "sent":
                sent += 1
                db.collection(CLIENT_PORTALS_COLLECTION).document(pid).set(
                    {"lastCohortReminderAt": SERVER_TIMESTAMP},
                    merge=True,
                )
            elif status == "skipped":
                skipped += 1
            else:
                failed += 1

            details.append(
                {
                    "portalId": pid,
                    "assessmentId": assessment_id,
                    "cohortId": cohort_id,
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
