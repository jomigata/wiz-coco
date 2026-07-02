"""검사코드별 내담자 발송·검사 진행 현황."""
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    NOTIFICATION_QUEUE_COLLECTION,
    PUBLIC_SITE_URL,
    TEST_RESULTS_COLLECTION,
)
from utils.notification_worker import deliver_portal_credentials, deliver_test_reminder
from utils.password import generate_four_digit_password, hash_password
from utils.portal_magic import create_portal_magic_link_token


def _latest_notify_by_portal(db, portal_ids: set[str]) -> dict[str, dict]:
    """포털별 최신 알림 — portalId IN 배치 쿼리 (N+1 방지)."""
    if not portal_ids:
        return {}
    out: dict[str, dict] = {}
    ids_list = list(portal_ids)
    chunk_size = 30
    for i in range(0, len(ids_list), chunk_size):
        chunk = ids_list[i : i + chunk_size]
        refs = (
            db.collection(NOTIFICATION_QUEUE_COLLECTION)
            .where("portalId", "in", chunk)
            .stream()
        )
        for doc in refs:
            data = doc.to_dict() or {}
            pid = (data.get("portalId") or "").strip()
            if not pid:
                continue
            latest = out.get(pid)
            if latest is None:
                out[pid] = {
                    "status": (data.get("status") or "pending").strip(),
                    "error": data.get("error"),
                    "sentVia": data.get("sentVia"),
                    "processedAt": _iso_timestamp(data.get("processedAt")),
                    "createdAt": _iso_timestamp(data.get("createdAt")),
                    "_createdAtRaw": data.get("createdAt"),
                }
                continue
            ca = data.get("createdAt")
            la = latest.get("_createdAtRaw")
            if ca and la and hasattr(ca, "timestamp") and hasattr(la, "timestamp"):
                if ca.timestamp() > la.timestamp():
                    replace = True
                else:
                    replace = False
            elif ca and not la:
                replace = True
            else:
                replace = False
            if replace:
                out[pid] = {
                    "status": (data.get("status") or "pending").strip(),
                    "error": data.get("error"),
                    "sentVia": data.get("sentVia"),
                    "processedAt": _iso_timestamp(data.get("processedAt")),
                    "createdAt": _iso_timestamp(data.get("createdAt")),
                    "_createdAtRaw": ca,
                }
    for pid in list(out.keys()):
        out[pid].pop("_createdAtRaw", None)
    return out


def _bulk_completed_tests_by_portal_assessment(
    db, portal_ids: list[str], assessment_ids: set[str]
) -> dict[tuple[str, str], set[str]]:
    """(portalId, assessmentId) → 완료된 testId 집합 — portalId IN 배치 쿼리."""
    result: dict[tuple[str, str], set[str]] = {}
    if not portal_ids or not assessment_ids:
        return result
    chunk_size = 30
    for i in range(0, len(portal_ids), chunk_size):
        chunk = portal_ids[i : i + chunk_size]
        refs = (
            db.collection(TEST_RESULTS_COLLECTION)
            .where("portalId", "in", chunk)
            .stream()
        )
        for doc in refs:
            d = doc.to_dict() or {}
            if (d.get("status") or "").strip() != "completed":
                continue
            pid = (d.get("portalId") or "").strip()
            aid = (d.get("assessmentId") or "").strip()
            tid = str(d.get("testId") or "").strip()
            if not pid or not aid or not tid or aid not in assessment_ids:
                continue
            key = (pid, aid)
            result.setdefault(key, set()).add(tid)
    return result


def _resolve_notify_at(notify: dict, pdata: dict, status: str) -> str | None:
    processed = notify.get("processedAt")
    if processed:
        return processed
    last_at = pdata.get("lastNotifyAt")
    if last_at:
        return _iso_timestamp(last_at)
    if status in ("pending", "not_sent") and notify.get("createdAt"):
        return notify.get("createdAt")
    return None


def _resolve_notify_status(
    notify: dict, pdata: dict, *, email: str, phone: str
) -> tuple[str, str | None]:
    status = (notify.get("status") or pdata.get("lastNotifyStatus") or "not_sent").strip()
    error = notify.get("error")
    if not email and not phone:
        return "skipped", error or "no_recipient"
    return status, error


def _iso_timestamp(value) -> str | None:
    if not value:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _test_detail_rows(db, portal_id: str, assessment_id: str, test_list: list) -> list[dict]:
    refs = list(
        db.collection(TEST_RESULTS_COLLECTION)
        .where("portalId", "==", portal_id)
        .where("assessmentId", "==", assessment_id)
        .stream()
    )
    by_test: dict[str, dict] = {}
    for doc in refs:
        data = doc.to_dict() or {}
        test_id = str(data.get("testId") or "").strip()
        if not test_id:
            continue
        status = (data.get("status") or "").strip() or "in_progress"
        candidate = {
            "resultId": doc.id,
            "status": status,
            "completedAt": _iso_timestamp(data.get("completedAt")),
        }
        prev = by_test.get(test_id)
        if not prev:
            by_test[test_id] = candidate
            continue
        if candidate["status"] == "completed" and prev.get("status") != "completed":
            by_test[test_id] = candidate
            continue
        if candidate["status"] == "completed" and prev.get("status") == "completed":
            if (candidate.get("completedAt") or "") >= (prev.get("completedAt") or ""):
                by_test[test_id] = candidate

    rows: list[dict] = []
    for item in test_list or []:
        test_id = str(item.get("testId") or "").strip()
        if not test_id:
            continue
        test_name = (item.get("name") or test_id).strip()
        info = by_test.get(test_id)
        if info and info.get("status") == "completed":
            rows.append(
                {
                    "testId": test_id,
                    "testName": test_name,
                    "status": "completed",
                    "completedAt": info.get("completedAt"),
                    "resultId": info.get("resultId"),
                }
            )
        elif info:
            rows.append(
                {
                    "testId": test_id,
                    "testName": test_name,
                    "status": "in_progress",
                    "completedAt": info.get("completedAt"),
                    "resultId": info.get("resultId"),
                }
            )
        else:
            rows.append(
                {
                    "testId": test_id,
                    "testName": test_name,
                    "status": "not_started",
                    "completedAt": None,
                    "resultId": None,
                }
            )
    return rows


def _test_status_for_portal(db, portal_id: str, assessment_id: str, required: set[str]) -> dict:
    if not required:
        return {"testStatus": "not_started", "completedCount": 0, "requiredCount": 0}
    completed: set[str] = set()
    refs = (
        db.collection(TEST_RESULTS_COLLECTION)
        .where("portalId", "==", portal_id)
        .where("assessmentId", "==", assessment_id)
        .stream()
    )
    for doc in refs:
        d = doc.to_dict() or {}
        if (d.get("status") or "").strip() == "completed":
            tid = str(d.get("testId") or "").strip()
            if tid:
                completed.add(tid)
    done = required <= completed if required else False
    partial = bool(completed) and not done
    if done:
        status = "completed"
    elif partial:
        status = "in_progress"
    else:
        status = "not_started"
    return {
        "testStatus": status,
        "completedCount": len(completed & required),
        "requiredCount": len(required),
    }


def aggregate_assessment_list_stats(
    db,
    *,
    counselor_uid: str,
    items: list[dict],
) -> dict[str, dict]:
    """검사코드 목록용 — 포털별 발송·검사 완료 집계."""
    if not items:
        return {}

    stats: dict[str, dict] = {
        x["id"]: {
            "dispatchSentCount": 0,
            "dispatchFailedCount": 0,
            "testCompleteCount": 0,
            "testIncompleteCount": 0,
        }
        for x in items
    }
    required_by_assessment: dict[str, set[str]] = {}
    for x in items:
        aid = x["id"]
        required_by_assessment[aid] = {
            str(t.get("testId") or "").strip()
            for t in (x.get("testList") or [])
            if t and str(t.get("testId") or "").strip()
        }

    portal_rows: list[tuple[str, dict, list]] = []
    portal_refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .stream()
    )
    for doc in portal_refs:
        pdata = doc.to_dict() or {}
        if (pdata.get("status") or "active") != "active":
            continue
        assigned = list(pdata.get("assignedAssessmentIds") or [])
        if not assigned:
            continue
        portal_rows.append((doc.id, pdata, assigned))

    portal_ids = {row[0] for row in portal_rows}
    notify_map = _latest_notify_by_portal(db, portal_ids)
    all_assessment_ids = set(stats.keys())
    portal_id_list = [row[0] for row in portal_rows]
    completion_map = _bulk_completed_tests_by_portal_assessment(
        db, portal_id_list, all_assessment_ids
    )

    for portal_id, pdata, assigned in portal_rows:
        notify = notify_map.get(portal_id) or {}
        email = (pdata.get("email") or "").strip()
        phone = (pdata.get("phone") or "").strip()
        notify_status, _ = _resolve_notify_status(notify, pdata, email=email, phone=phone)

        for aid in assigned:
            if aid not in stats:
                continue
            if notify_status == "sent":
                stats[aid]["dispatchSentCount"] += 1
            elif notify_status == "failed":
                stats[aid]["dispatchFailedCount"] += 1

            required = required_by_assessment.get(aid, set())
            completed = completion_map.get((portal_id, aid), set())
            if required and required <= completed:
                stats[aid]["testCompleteCount"] += 1
            else:
                stats[aid]["testIncompleteCount"] += 1

    return stats


def get_assessment_dispatch_status(db, assessment_id: str, counselor_uid: str) -> dict | None:
    ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    ass_doc = ass_ref.get()
    if not ass_doc.exists:
        return None
    ass = ass_doc.to_dict() or {}
    if ass.get("counselorId") != counselor_uid:
        return None
    if (ass.get("status") or "active") != "active":
        return None

    join_access_code = (ass.get("accessCode") or "").strip()
    test_list = ass.get("testList") or []
    required = {
        str(t.get("testId") or "").strip()
        for t in test_list
        if t and str(t.get("testId") or "").strip()
    }

    portal_refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .stream()
    )
    rows = []
    portal_ids: set[str] = set()
    for doc in portal_refs:
        pdata = doc.to_dict() or {}
        assigned = list(pdata.get("assignedAssessmentIds") or [])
        if assessment_id not in assigned:
            continue
        if (pdata.get("status") or "active") != "active":
            continue
        portal_ids.add(doc.id)
        rows.append((doc.id, pdata))

    notify_map = _latest_notify_by_portal(db, portal_ids)
    recipients = []
    for portal_id, pdata in rows:
        notify = notify_map.get(portal_id) or {}
        email = (pdata.get("email") or "").strip()
        phone = (pdata.get("phone") or "").strip()
        notify_status, notify_error = _resolve_notify_status(
            notify, pdata, email=email, phone=phone
        )
        notify_at = _resolve_notify_at(notify, pdata, notify_status)
        test_info = _test_status_for_portal(db, portal_id, assessment_id, required)
        recipients.append(
            {
                "portalId": portal_id,
                "displayName": pdata.get("displayName") or "",
                "email": email,
                "phone": phone,
                "myCode": pdata.get("accessCode") or "",
                "joinAccessCode": join_access_code,
                "notifyStatus": notify_status,
                "notifyError": notify_error,
                "notifyAt": notify_at,
                "notifySentVia": notify.get("sentVia") or "",
                "tests": _test_detail_rows(db, portal_id, assessment_id, test_list),
                **test_info,
            }
        )

    recipients.sort(key=lambda r: (r.get("displayName") or "", r.get("portalId") or ""))
    return {
        "assessmentId": assessment_id,
        "title": ass.get("title") or "",
        "cohortName": ass.get("cohortName") or "",
        "joinAccessCode": join_access_code,
        "testList": test_list,
        "recipients": recipients,
    }


def resend_portal_credentials(
    db,
    *,
    assessment_id: str,
    counselor_uid: str,
    portal_ids: list[str],
) -> dict:
    ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    ass_doc = ass_ref.get()
    if not ass_doc.exists:
        raise ValueError("검사코드를 찾을 수 없습니다.")
    ass = ass_doc.to_dict() or {}
    if ass.get("counselorId") != counselor_uid:
        raise PermissionError("접근 권한이 없습니다.")
    join_access_code = (ass.get("accessCode") or "").strip()

    sent = 0
    failed = 0
    skipped = 0
    details: list[dict] = []

    for portal_id in portal_ids:
        pid = (portal_id or "").strip()
        if not pid:
            continue
        pref = db.collection(CLIENT_PORTALS_COLLECTION).document(pid)
        pdoc = pref.get()
        if not pdoc.exists:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "not_found"})
            continue
        pdata = pdoc.to_dict() or {}
        if pdata.get("counselorId") != counselor_uid:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "forbidden"})
            continue
        assigned = list(pdata.get("assignedAssessmentIds") or [])
        if assessment_id not in assigned:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "not_assigned"})
            continue

        email = (pdata.get("email") or "").strip().lower()
        phone = (pdata.get("phone") or "").strip()
        if not email and not phone:
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "no_contact"})
            continue

        portal_access_code = (pdata.get("accessCode") or "").strip()
        new_pin = generate_four_digit_password()
        magic = create_portal_magic_link_token(pid, portal_access_code)
        magic_path = f"/go?t={magic}"
        magic_url = f"{PUBLIC_SITE_URL.rstrip('/')}{magic_path}"

        result = deliver_portal_credentials(
            email=email,
            phone=phone,
            access_code=portal_access_code,
            pin=new_pin,
            magic_path=magic_path,
            display_name=(pdata.get("displayName") or "").strip(),
            join_access_code=join_access_code,
        )
        status = result.get("status") or "failed"
        notify_update: dict = {"lastNotifyStatus": status, "lastNotifyAt": SERVER_TIMESTAMP}
        if status == "sent":
            notify_update["pinHash"] = hash_password(new_pin)
            sent += 1
        else:
            failed += 1
        pref.update(notify_update)
        details.append(
            {
                "portalId": pid,
                "status": status,
                "myCode": portal_access_code,
                "pin": new_pin,
                "magicUrl": magic_url,
            }
        )

    return {"sent": sent, "failed": failed, "skipped": skipped, "details": details}


def _pending_tests_from_rows(test_rows: list[dict]) -> list[dict]:
    return [t for t in (test_rows or []) if (t.get("status") or "") != "completed"]


def send_test_reminders(
    db,
    *,
    assessment_id: str,
    counselor_uid: str,
    portal_ids: list[str],
) -> dict:
    """미완료 검사자에게 미실시 현황·검사 링크 알림 (비밀번호 재발급 없음)."""
    ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    ass_doc = ass_ref.get()
    if not ass_doc.exists:
        raise ValueError("검사코드를 찾을 수 없습니다.")
    ass = ass_doc.to_dict() or {}
    if ass.get("counselorId") != counselor_uid:
        raise PermissionError("접근 권한이 없습니다.")

    join_access_code = (ass.get("accessCode") or "").strip()
    assessment_title = (ass.get("title") or "").strip()
    test_list = ass.get("testList") or []
    required = {
        str(t.get("testId") or "").strip()
        for t in test_list
        if t and str(t.get("testId") or "").strip()
    }

    sent = 0
    failed = 0
    skipped = 0
    details: list[dict] = []

    for portal_id in portal_ids:
        pid = (portal_id or "").strip()
        if not pid:
            continue
        pref = db.collection(CLIENT_PORTALS_COLLECTION).document(pid)
        pdoc = pref.get()
        if not pdoc.exists:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "not_found"})
            continue
        pdata = pdoc.to_dict() or {}
        if pdata.get("counselorId") != counselor_uid:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "forbidden"})
            continue
        assigned = list(pdata.get("assignedAssessmentIds") or [])
        if assessment_id not in assigned:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "not_assigned"})
            continue

        test_rows = _test_detail_rows(db, pid, assessment_id, test_list)
        pending = _pending_tests_from_rows(test_rows)
        test_info = _test_status_for_portal(db, pid, assessment_id, required)
        if test_info.get("testStatus") == "completed" or not pending:
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "all_completed"})
            continue

        email = (pdata.get("email") or "").strip().lower()
        phone = (pdata.get("phone") or "").strip()
        if not email and not phone:
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "no_contact"})
            continue

        portal_access_code = (pdata.get("accessCode") or "").strip()
        magic = create_portal_magic_link_token(pid, portal_access_code)
        magic_path = f"/go?t={magic}"
        magic_url = f"{PUBLIC_SITE_URL.rstrip('/')}{magic_path}"

        result = deliver_test_reminder(
            email=email,
            phone=phone,
            display_name=(pdata.get("displayName") or "").strip(),
            assessment_title=assessment_title,
            join_access_code=join_access_code,
            my_code=portal_access_code,
            pending_tests=pending,
            completed_count=int(test_info.get("completedCount") or 0),
            required_count=int(test_info.get("requiredCount") or 0),
            magic_path=magic_path,
        )
        status = result.get("status") or "failed"
        pref.update({"lastRemindStatus": status, "lastRemindAt": SERVER_TIMESTAMP})
        if status == "sent":
            sent += 1
        elif status == "skipped":
            skipped += 1
        else:
            failed += 1
        details.append(
            {
                "portalId": pid,
                "status": status,
                "pendingCount": len(pending),
                "magicUrl": magic_url,
            }
        )

    return {"sent": sent, "failed": failed, "skipped": skipped, "details": details}
