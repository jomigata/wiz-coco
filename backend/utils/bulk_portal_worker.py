"""검사코드 대량 발급 — Firestore job + 배치 처리."""
from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from typing import Callable

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    ASSESSMENTS_COLLECTION,
    BULK_PORTAL_BATCH_SIZE,
    BULK_PORTAL_JOBS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    NOTIFICATION_QUEUE_COLLECTION,
)
from utils.access_code import generate_unique_access_code, generate_unique_portal_access_code
from utils.password import generate_four_digit_password, hash_password
from utils.phone_format import normalize_recipient_phone

CREATED_ROWS_SUBCOLLECTION = "createdRows"


def _job_created_rows_ref(db, job_id: str):
    return (
        db.collection(BULK_PORTAL_JOBS_COLLECTION)
        .document(job_id)
        .collection(CREATED_ROWS_SUBCOLLECTION)
    )


def prepare_bulk_assessment(
    db,
    *,
    counselor_uid: str,
    title: str,
    welcome_message: str,
    usage_end_date: str,
    test_list: list,
    existing_assessment_id: str,
    cohort_id: str,
    cohort_name: str = "",
) -> tuple[str, str, str]:
    """Returns (assessment_id, join_access_code, cohort_id)."""
    if existing_assessment_id:
        assessment_doc = db.collection(ASSESSMENTS_COLLECTION).document(existing_assessment_id).get()
        if not assessment_doc.exists:
            raise ValueError("선택한 검사코드를 찾을 수 없습니다.")
        ass_data = assessment_doc.to_dict() or {}
        if ass_data.get("counselorId") != counselor_uid:
            raise PermissionError("선택한 검사코드에 접근할 수 없습니다.")
        if (ass_data.get("status") or "active") != "active":
            raise ValueError("비활성화된 검사코드입니다.")
        if (ass_data.get("issueType") or "individual") != "individual":
            raise ValueError("검사코드(개별 발급) 검사만 선택할 수 있습니다.")
        join_access_code = ass_data.get("accessCode", "")
        cohort_id = ass_data.get("clientPortalCohortId") or cohort_id
        return existing_assessment_id, join_access_code, cohort_id

    if not test_list:
        raise ValueError("포함할 검사(testList)가 필요합니다.")

    join_access_code = generate_unique_access_code()
    assessment_ref = db.collection(ASSESSMENTS_COLLECTION).document()
    assessment_ref.set(
        {
            "accessCode": join_access_code,
            "counselorId": counselor_uid,
            "title": title,
            "issueType": "individual",
            "targetAudience": "그룹",
            "welcomeMessage": welcome_message,
            "usageEndDate": usage_end_date,
            "testList": test_list,
            "createdAt": SERVER_TIMESTAMP,
            "status": "active",
            "clientPortalCohortId": cohort_id,
            "cohortName": cohort_name,
        }
    )
    return assessment_ref.id, join_access_code, cohort_id


def _enqueue_portal_notification(
    notify_queue,
    *,
    portal_id: str,
    email: str,
    phone: str,
    portal_access_code: str,
    join_access_code: str,
    pin: str,
    magic_path: str,
    display_name: str,
    counselor_uid: str,
    scheduled_at_iso: str,
    bulk_job_id: str = "",
    cohort_id: str = "",
) -> None:
    payload = {
        "type": "portal_credentials",
        "portalId": portal_id,
        "email": email,
        "phone": phone,
        "accessCode": portal_access_code,
        "joinAccessCode": join_access_code,
        "pin": pin,
        "magicPath": magic_path,
        "displayName": display_name,
        "status": "pending",
        "createdAt": SERVER_TIMESTAMP,
        "counselorId": counselor_uid,
    }
    if scheduled_at_iso:
        payload["scheduledAt"] = scheduled_at_iso
    if bulk_job_id:
        payload["bulkJobId"] = bulk_job_id
    if cohort_id:
        payload["cohortId"] = cohort_id
    notify_queue.add(payload)


def create_portal_for_row(
    db,
    *,
    row: dict,
    counselor_uid: str,
    cohort_id: str,
    cohort_name: str,
    assessment_ref_id: str,
    join_access_code: str,
    queue_notify: bool,
    scheduled_at_iso: str,
    bulk_job_id: str,
    create_magic_link: Callable[[str, str], str],
    immediate_notify: bool = False,
) -> tuple[dict, bool, int, int]:
    """Returns (created_row_dict, notify_queued, notify_sent, notify_failed)."""
    display_name = (row.get("displayName") or row.get("name") or "").strip() or "내담자"
    email = (row.get("email") or "").strip().lower()
    phone = normalize_recipient_phone((row.get("phone") or "").strip())

    portal_access_code = generate_unique_portal_access_code()
    pin = generate_four_digit_password()
    pin_hash = hash_password(pin)

    portal_ref = db.collection(CLIENT_PORTALS_COLLECTION).document()
    portal_ref.set(
        {
            "accessCode": portal_access_code,
            "pinHash": pin_hash,
            "counselorId": counselor_uid,
            "displayName": display_name,
            "email": email,
            "phone": phone,
            "cohortId": cohort_id,
            "cohortName": cohort_name,
            "assignedAssessmentIds": [assessment_ref_id],
            "status": "active",
            "createdAt": SERVER_TIMESTAMP,
            "bulkJobId": bulk_job_id or None,
        }
    )

    magic = create_magic_link(portal_ref.id, portal_access_code)
    magic_path = f"/go?t={magic}"
    from config import PUBLIC_SITE_URL

    magic_url = f"{PUBLIC_SITE_URL.rstrip('/')}{magic_path}"

    notify_queued = False
    notify_sent = 0
    notify_failed = 0
    if queue_notify and (email or phone):
        if immediate_notify and not scheduled_at_iso:
            from utils.notification_worker import deliver_portal_credentials

            result = deliver_portal_credentials(
                email=email,
                phone=phone,
                access_code=portal_access_code,
                pin=pin,
                magic_path=magic_path,
                display_name=display_name,
                join_access_code=join_access_code,
            )
            status = result.get("status") or "failed"
            portal_ref.update({"lastNotifyStatus": status, "lastNotifyAt": SERVER_TIMESTAMP})
            if status == "sent":
                notify_sent = 1
            else:
                notify_failed = 1
        else:
            _enqueue_portal_notification(
                db.collection(NOTIFICATION_QUEUE_COLLECTION),
                portal_id=portal_ref.id,
                email=email,
                phone=phone,
                portal_access_code=portal_access_code,
                join_access_code=join_access_code,
                pin=pin,
                magic_path=magic_path,
                display_name=display_name,
                counselor_uid=counselor_uid,
                scheduled_at_iso=scheduled_at_iso,
                bulk_job_id=bulk_job_id,
                cohort_id=cohort_id,
            )
            notify_queued = True

    created = {
        "portalId": portal_ref.id,
        "displayName": display_name,
        "email": email,
        "phone": phone,
        "joinAccessCode": join_access_code,
        "accessCode": portal_access_code,
        "myCode": portal_access_code,
        "pin": pin,
        "magicPath": magic_path,
        "magicUrl": magic_url,
        "assessmentId": assessment_ref_id,
    }
    return created, notify_queued, notify_sent, notify_failed


def create_bulk_job(
    db,
    *,
    counselor_uid: str,
    cohort_name: str,
    cohort_id: str,
    assessment_id: str,
    join_access_code: str,
    rows: list,
    queue_notify: bool,
    scheduled_at_iso: str,
) -> str:
    job_ref = db.collection(BULK_PORTAL_JOBS_COLLECTION).document()
    job_ref.set(
        {
            "counselorId": counselor_uid,
            "status": "pending",
            "totalRows": len(rows),
            "processedRows": 0,
            "createdCount": 0,
            "notifyQueued": 0,
            "cohortId": cohort_id,
            "cohortName": cohort_name,
            "assessmentId": assessment_id,
            "joinAccessCode": join_access_code,
            "queueNotify": queue_notify,
            "scheduledAt": scheduled_at_iso or None,
            "inputRows": rows,
            "error": None,
            "createdAt": SERVER_TIMESTAMP,
            "updatedAt": SERVER_TIMESTAMP,
        }
    )
    return job_ref.id


def _job_to_status(job_id: str, data: dict) -> dict:
    total = int(data.get("totalRows") or 0)
    processed = int(data.get("processedRows") or 0)
    progress_pct = round((processed / total) * 100) if total > 0 else 0
    return {
        "jobId": job_id,
        "status": data.get("status") or "pending",
        "totalRows": total,
        "processedRows": processed,
        "createdCount": int(data.get("createdCount") or 0),
        "notifyQueued": int(data.get("notifyQueued") or 0),
        "progressPct": progress_pct,
        "cohortId": data.get("cohortId"),
        "cohortName": data.get("cohortName"),
        "assessmentId": data.get("assessmentId"),
        "joinAccessCode": data.get("joinAccessCode"),
        "queueNotify": bool(data.get("queueNotify")),
        "scheduledAt": data.get("scheduledAt"),
        "error": data.get("error"),
        "completedAt": data.get("completedAt"),
    }


def get_bulk_job_status(db, job_id: str, *, counselor_uid: str | None = None) -> dict | None:
    doc = db.collection(BULK_PORTAL_JOBS_COLLECTION).document(job_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    if counselor_uid and data.get("counselorId") != counselor_uid:
        return None
    return _job_to_status(job_id, data)


def load_bulk_job_created_rows(db, job_id: str, *, counselor_uid: str) -> list[dict]:
    job = db.collection(BULK_PORTAL_JOBS_COLLECTION).document(job_id).get()
    if not job.exists:
        return []
    data = job.to_dict() or {}
    if data.get("counselorId") != counselor_uid:
        return []
    rows = []
    for doc in _job_created_rows_ref(db, job_id).stream():
        row = doc.to_dict() or {}
        row["portalId"] = doc.id
        rows.append(row)
    rows.sort(key=lambda r: (r.get("displayName") or "", r.get("portalId") or ""))
    return rows


def process_bulk_job_batch(
    db,
    job_id: str,
    *,
    batch_size: int = BULK_PORTAL_BATCH_SIZE,
    max_seconds: float = 25.0,
    create_magic_link: Callable[[str, str], str],
) -> dict:
    """한 job에서 batch_size만큼(또는 max_seconds까지) 처리."""
    job_ref = db.collection(BULK_PORTAL_JOBS_COLLECTION).document(job_id)
    job_doc = job_ref.get()
    if not job_doc.exists:
        return {"jobId": job_id, "processed": 0, "reason": "not_found"}

    data = job_doc.to_dict() or {}
    status = data.get("status") or "pending"
    if status in ("completed", "failed"):
        return {"jobId": job_id, "processed": 0, "reason": status}

    input_rows = list(data.get("inputRows") or [])
    total = len(input_rows)
    start_index = int(data.get("processedRows") or 0)
    if start_index >= total:
        job_ref.update(
            {
                "status": "completed",
                "completedAt": datetime.now(timezone.utc).isoformat(),
                "updatedAt": SERVER_TIMESTAMP,
            }
        )
        return {"jobId": job_id, "processed": 0, "reason": "already_complete"}

    job_ref.update({"status": "running", "updatedAt": SERVER_TIMESTAMP})

    counselor_uid = data.get("counselorId") or ""
    cohort_id = data.get("cohortId") or ""
    cohort_name = data.get("cohortName") or ""
    assessment_id = data.get("assessmentId") or ""
    join_access_code = data.get("joinAccessCode") or ""
    queue_notify = bool(data.get("queueNotify"))
    scheduled_at_iso = (data.get("scheduledAt") or "").strip()

    processed_now = 0
    notify_queued_now = 0
    created_count_now = 0
    deadline = time.monotonic() + max_seconds

    try:
        end_index = min(start_index + batch_size, total)
        for idx in range(start_index, end_index):
            if time.monotonic() >= deadline:
                end_index = idx
                break

            row = input_rows[idx]
            created, queued, sent, failed = create_portal_for_row(
                db,
                row=row,
                counselor_uid=counselor_uid,
                cohort_id=cohort_id,
                cohort_name=cohort_name,
                assessment_ref_id=assessment_id,
                join_access_code=join_access_code,
                queue_notify=queue_notify,
                scheduled_at_iso=scheduled_at_iso,
                bulk_job_id=job_id,
                create_magic_link=create_magic_link,
                immediate_notify=False,
            )
            _job_created_rows_ref(db, job_id).document(created["portalId"]).set(created)
            processed_now += 1
            created_count_now += 1
            if queued:
                notify_queued_now += 1

        new_processed = start_index + processed_now
        update_payload = {
            "processedRows": new_processed,
            "createdCount": int(data.get("createdCount") or 0) + created_count_now,
            "notifyQueued": int(data.get("notifyQueued") or 0) + notify_queued_now,
            "updatedAt": SERVER_TIMESTAMP,
        }
        if new_processed >= total:
            update_payload["status"] = "completed"
            update_payload["completedAt"] = datetime.now(timezone.utc).isoformat()
        else:
            update_payload["status"] = "running"
        job_ref.update(update_payload)

        return {
            "jobId": job_id,
            "processed": processed_now,
            "processedRows": new_processed,
            "totalRows": total,
            "status": update_payload["status"],
        }
    except Exception as exc:
        job_ref.update(
            {
                "status": "failed",
                "error": str(exc)[:500],
                "updatedAt": SERVER_TIMESTAMP,
            }
        )
        return {"jobId": job_id, "processed": processed_now, "status": "failed", "error": str(exc)[:200]}


def process_pending_bulk_jobs(
    db,
    *,
    limit: int = 3,
    batch_size: int = BULK_PORTAL_BATCH_SIZE,
    max_seconds: float = 25.0,
    create_magic_link: Callable[[str, str], str],
) -> dict:
    """Cron: pending/running job 여러 건 배치 처리."""
    refs = (
        db.collection(BULK_PORTAL_JOBS_COLLECTION)
        .where("status", "in", ["pending", "running"])
        .limit(limit)
        .stream()
    )
    jobs = list(refs)
    details = []
    for doc in jobs:
        result = process_bulk_job_batch(
            db,
            doc.id,
            batch_size=batch_size,
            max_seconds=max_seconds,
            create_magic_link=create_magic_link,
        )
        details.append(result)
    return {"jobs": len(jobs), "details": details}


def resend_job_notifications(db, job_id: str, *, counselor_uid: str) -> dict:
    """실패한 알림 재시도 또는 createdRows 기준 재등록."""
    job_doc = db.collection(BULK_PORTAL_JOBS_COLLECTION).document(job_id).get()
    if not job_doc.exists:
        raise ValueError("작업을 찾을 수 없습니다.")
    data = job_doc.to_dict() or {}
    if data.get("counselorId") != counselor_uid:
        raise PermissionError("권한이 없습니다.")

    return _resend_notifications_for_job(db, job_id, data, counselor_uid)


def resend_cohort_notifications(db, cohort_id: str, *, counselor_uid: str) -> dict:
    notify_coll = db.collection(NOTIFICATION_QUEUE_COLLECTION)
    failed_refs = list(notify_coll.where("cohortId", "==", cohort_id).stream())
    failed = [
        doc
        for doc in failed_refs
        if (doc.to_dict() or {}).get("counselorId") == counselor_uid
        and (doc.to_dict() or {}).get("status") == "failed"
    ]
    reset = 0
    for doc in failed:
        doc.reference.update(
            {
                "status": "pending",
                "error": None,
                "processedAt": None,
            }
        )
        reset += 1
    return {"resetFailed": reset, "requeued": 0, "cohortId": cohort_id}


def _resend_notifications_for_job(db, job_id: str, data: dict, counselor_uid: str) -> dict:
    reset = 0
    requeued = 0
    notify_coll = db.collection(NOTIFICATION_QUEUE_COLLECTION)

    failed_refs = list(notify_coll.where("bulkJobId", "==", job_id).stream())
    for doc in failed_refs:
        item = doc.to_dict() or {}
        if item.get("status") != "failed":
            continue
        doc.reference.update(
            {
                "status": "pending",
                "error": None,
                "processedAt": None,
            }
        )
        reset += 1

    if reset == 0 and bool(data.get("queueNotify")):
        join_access_code = data.get("joinAccessCode") or ""
        scheduled_at_iso = (data.get("scheduledAt") or "").strip()
        cohort_id = data.get("cohortId") or ""
        for row_doc in _job_created_rows_ref(db, job_id).stream():
            row = row_doc.to_dict() or {}
            email = (row.get("email") or "").strip().lower()
            phone = normalize_recipient_phone((row.get("phone") or "").strip())
            if not email and not phone:
                continue
            _enqueue_portal_notification(
                notify_coll,
                portal_id=row_doc.id,
                email=email,
                phone=phone,
                portal_access_code=row.get("accessCode") or row.get("myCode") or "",
                join_access_code=join_access_code,
                pin=str(row.get("pin") or ""),
                magic_path=row.get("magicPath") or "",
                display_name=row.get("displayName") or "",
                counselor_uid=counselor_uid,
                scheduled_at_iso=scheduled_at_iso,
                bulk_job_id=job_id,
                cohort_id=cohort_id,
            )
            requeued += 1

    return {"resetFailed": reset, "requeued": requeued}


def new_cohort_id() -> str:
    return str(uuid.uuid4())
