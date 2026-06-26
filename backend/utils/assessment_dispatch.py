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
from utils.notification_worker import deliver_portal_credentials
from utils.password import generate_four_digit_password, hash_password
from utils.portal_magic import create_portal_magic_link_token


def _latest_notify_by_portal(db, portal_ids: set[str]) -> dict[str, dict]:
    if not portal_ids:
        return {}
    out: dict[str, dict] = {}
    for pid in portal_ids:
        refs = (
            db.collection(NOTIFICATION_QUEUE_COLLECTION)
            .where("portalId", "==", pid)
            .limit(20)
            .stream()
        )
        latest = None
        for doc in refs:
            data = doc.to_dict() or {}
            if latest is None:
                latest = data
                continue
            ca = data.get("createdAt")
            la = latest.get("createdAt")
            if ca and la and hasattr(ca, "timestamp") and hasattr(la, "timestamp"):
                if ca.timestamp() > la.timestamp():
                    latest = data
            elif ca and not la:
                latest = data
        if latest:
            out[pid] = {
                "status": (latest.get("status") or "pending").strip(),
                "error": latest.get("error"),
                "sentVia": latest.get("sentVia"),
            }
    return out


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
        notify_status = (notify.get("status") or pdata.get("lastNotifyStatus") or "not_sent").strip()
        test_info = _test_status_for_portal(db, portal_id, assessment_id, required)
        recipients.append(
            {
                "portalId": portal_id,
                "displayName": pdata.get("displayName") or "",
                "email": pdata.get("email") or "",
                "phone": pdata.get("phone") or "",
                "myCode": pdata.get("accessCode") or "",
                "joinAccessCode": join_access_code,
                "notifyStatus": notify_status,
                "notifyError": notify.get("error"),
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
        pref.update({"pinHash": hash_password(new_pin), "updatedAt": SERVER_TIMESTAMP})

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
        pref.update({"lastNotifyStatus": status, "lastNotifyAt": SERVER_TIMESTAMP})
        if status == "sent":
            sent += 1
        else:
            failed += 1
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
