"""케어 할당 생성·조회 (T-2-04)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from firebase_admin.firestore import ArrayUnion, SERVER_TIMESTAMP

from config import (
    CARE_ASSIGNMENTS_COLLECTION,
    CARE_PROGRESS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    NOTIFICATION_QUEUE_COLLECTION,
)
from utils.care_assignment_schema import (
    CareAssignmentValidationError,
    build_care_assignment_doc,
    build_care_progress_doc,
    validate_create_care_assignment_payload,
)
from utils.care_program_catalog import validate_care_program_id
from utils.portal_assessment_access import get_portal_doc


def _iso_timestamp(value) -> str | None:
    if not value:
        return None
    if isinstance(value, str):
        return value
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass
    if hasattr(value, "timestamp"):
        try:
            return datetime.fromtimestamp(value.timestamp(), tz=timezone.utc).isoformat()
        except Exception:
            pass
    return None


def _default_due_at(program: dict | None) -> str | None:
    if not program:
        return None
    days = int(program.get("defaultDueDays") or 0)
    if days <= 0:
        return None
    return (datetime.now(timezone.utc) + timedelta(days=days)).date().isoformat()


def _enqueue_care_assignment_notify(
    db,
    *,
    portal_id: str,
    assignment_id: str,
    counselor_uid: str,
    email: str,
    phone: str,
    display_name: str,
    title: str,
    portal_access_code: str,
) -> str:
    """T-2-08 전까지 큐에 적재만 — 워커 확장 시 발송."""
    db.collection(NOTIFICATION_QUEUE_COLLECTION).add(
        {
            "type": "care_assignment",
            "status": "pending",
            "portalId": portal_id,
            "assignmentId": assignment_id,
            "counselorId": counselor_uid,
            "email": email,
            "phone": phone,
            "displayName": display_name,
            "payload": {
                "title": title,
                "portalAccessCode": portal_access_code,
            },
            "createdAt": SERVER_TIMESTAMP,
        }
    )
    return "pending"


def create_care_assignments(db, counselor_uid: str, body: dict) -> dict:
    payload = validate_create_care_assignment_payload(body)
    program = None
    if payload["type"] == "treatment_program":
        program = validate_care_program_id(payload["programId"])

    due_at = payload.get("dueAt") or _default_due_at(program)
    title = payload["title"] or (program.get("title") if program else "") or "케어 할당"

    assigned = 0
    skipped = 0
    failed = 0
    notify_sent = 0
    notify_failed = 0
    notify_skipped = 0
    assignments_out: list[dict] = []
    details: list[dict] = []

    for portal_id in payload["portalIds"]:
        try:
            portal_snap = get_portal_doc(db, portal_id)
            if not portal_snap:
                failed += 1
                details.append(
                    {"portalId": portal_id, "status": "failed", "message": "포털을 찾을 수 없습니다."}
                )
                continue

            pdata = portal_snap.to_dict() or {}
            if (pdata.get("counselorId") or "") != counselor_uid:
                failed += 1
                details.append(
                    {"portalId": portal_id, "status": "failed", "message": "접근 권한이 없습니다."}
                )
                continue

            if (pdata.get("status") or "active") != "active":
                skipped += 1
                details.append(
                    {"portalId": portal_id, "status": "skipped", "message": "비활성 포털입니다."}
                )
                continue

            display_name = (pdata.get("displayName") or "").strip()
            doc_payload = {
                **payload,
                "title": title,
                "dueAt": due_at,
            }
            ass_ref = db.collection(CARE_ASSIGNMENTS_COLLECTION).document()
            ass_data = build_care_assignment_doc(
                counselor_uid=counselor_uid,
                portal_id=portal_id,
                portal_display_name=display_name,
                payload=doc_payload,
            )
            ass_data["createdAt"] = SERVER_TIMESTAMP
            ass_data["updatedAt"] = SERVER_TIMESTAMP
            ass_ref.set(ass_data)

            prog_ref = db.collection(CARE_PROGRESS_COLLECTION).document()
            prog_data = build_care_progress_doc(
                assignment_id=ass_ref.id,
                portal_id=portal_id,
                counselor_uid=counselor_uid,
                assignment_type=payload["type"],
            )
            prog_data["createdAt"] = SERVER_TIMESTAMP
            prog_data["updatedAt"] = SERVER_TIMESTAMP
            prog_ref.set(prog_data)

            portal_snap.reference.update(
                {
                    "careAssignmentIds": ArrayUnion([ass_ref.id]),
                    "updatedAt": SERVER_TIMESTAMP,
                }
            )

            notify_status = "skipped"
            notify_error = None
            if payload.get("notifyOnAssign"):
                email = (pdata.get("email") or "").strip().lower()
                phone = (pdata.get("phone") or "").strip()
                access_code = (pdata.get("accessCode") or "").strip()
                if email or phone:
                    try:
                        notify_status = _enqueue_care_assignment_notify(
                            db,
                            portal_id=portal_id,
                            assignment_id=ass_ref.id,
                            counselor_uid=counselor_uid,
                            email=email,
                            phone=phone,
                            display_name=display_name,
                            title=title,
                            portal_access_code=access_code,
                        )
                        notify_sent += 1
                    except Exception as exc:
                        notify_status = "failed"
                        notify_error = str(exc)
                        notify_failed += 1
                else:
                    notify_status = "skipped"
                    notify_error = "no_contact"
                    notify_skipped += 1
            else:
                notify_skipped += 1

            ass_ref.update(
                {
                    "notifyStatus": notify_status,
                    "notifyError": notify_error,
                    "notifyAt": SERVER_TIMESTAMP if notify_status == "pending" else None,
                    "updatedAt": SERVER_TIMESTAMP,
                }
            )

            assigned += 1
            item = {
                "id": ass_ref.id,
                **ass_data,
                "createdAt": None,
                "updatedAt": None,
            }
            assignments_out.append(item)
            details.append(
                {
                    "portalId": portal_id,
                    "assignmentId": ass_ref.id,
                    "status": "assigned",
                }
            )
        except Exception as exc:
            failed += 1
            details.append(
                {"portalId": portal_id, "status": "failed", "message": str(exc)}
            )

    return {
        "schemaVersion": 1,
        "assigned": assigned,
        "skipped": skipped,
        "failed": failed,
        "notify": {
            "sent": notify_sent,
            "failed": notify_failed,
            "skipped": notify_skipped,
        },
        "assignments": assignments_out,
        "details": details,
    }


def _progress_for_assignment(db, assignment_id: str) -> dict | None:
    refs = (
        db.collection(CARE_PROGRESS_COLLECTION)
        .where("assignmentId", "==", assignment_id)
        .limit(1)
        .get()
    )
    if not refs:
        return None
    doc = refs[0]
    data = doc.to_dict() or {}
    entries = data.get("entries") or []
    return {
        "progressId": doc.id,
        "status": data.get("status") or "not_started",
        "progressPercent": int(data.get("progressPercent") or 0),
        "entryCount": len(entries),
        "lastActivityAt": _iso_timestamp(data.get("lastActivityAt")),
        "completedAt": _iso_timestamp(data.get("completedAt")),
    }


def list_counselor_care_assignments(
    db,
    counselor_uid: str,
    *,
    portal_id: str | None = None,
    status: str | None = None,
    assignment_type: str | None = None,
    limit: int = 50,
) -> dict:
    limit = max(1, min(int(limit or 50), 200))
    status_filter = (status or "").strip()
    if status_filter == "all":
        status_filter = ""

    query = db.collection(CARE_ASSIGNMENTS_COLLECTION).where("counselorId", "==", counselor_uid)
    if portal_id:
        query = query.where("portalId", "==", portal_id.strip())
    if status_filter:
        query = query.where("status", "==", status_filter)
    if assignment_type:
        query = query.where("type", "==", assignment_type.strip())

    rows: list[tuple[float, dict]] = []
    for doc in query.stream():
        data = doc.to_dict() or {}
        created = data.get("createdAt")
        ts = 0.0
        if created is not None and hasattr(created, "timestamp"):
            ts = float(created.timestamp())
        item = {
            "id": doc.id,
            **data,
            "createdAt": _iso_timestamp(created),
            "updatedAt": _iso_timestamp(data.get("updatedAt")),
            "completedAt": _iso_timestamp(data.get("completedAt")),
            "notifyAt": _iso_timestamp(data.get("notifyAt")),
            "progress": _progress_for_assignment(db, doc.id),
        }
        rows.append((ts, item))

    rows.sort(key=lambda x: x[0], reverse=True)
    items = [row[1] for row in rows[:limit]]

    summary = {"active": 0, "completed": 0, "cancelled": 0, "expired": 0}
    for _, row in rows:
        st = (row.get("status") or "").strip()
        if st in summary:
            summary[st] += 1

    return {
        "items": items,
        "total": len(rows),
        "summary": summary,
    }
