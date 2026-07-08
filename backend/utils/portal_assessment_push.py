"""기존 내담자 포털에 검사코드(assessment) 추가 push."""
from __future__ import annotations

from firebase_admin.firestore import ArrayUnion, SERVER_TIMESTAMP

from config import (
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    COMMERCE_CREDITS_ENFORCE,
    PUBLIC_SITE_URL,
)
from utils.access_code import generate_unique_access_code
from utils.assessment_dispatch import _pending_tests_from_rows, _test_detail_rows
from utils.counselor_credits import consume_credits, get_balance
from utils.notification_worker import deliver_test_reminder
from utils.portal_magic import create_portal_magic_link_token


def _normalize_test_list(test_list: list | None) -> list[dict]:
    return [
        {"testId": str(t.get("testId") or ""), "name": str(t.get("name") or "")}
        for t in (test_list or [])
        if t and str(t.get("testId") or "").strip()
    ]


def _verify_push_assessment(db, assessment_id: str, counselor_uid: str) -> dict:
    ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    ass_doc = ass_ref.get()
    if not ass_doc.exists:
        raise ValueError("검사코드를 찾을 수 없습니다.")
    ass = ass_doc.to_dict() or {}
    if ass.get("counselorId") != counselor_uid:
        raise PermissionError("선택한 검사코드에 접근할 수 없습니다.")
    if (ass.get("status") or "active") != "active":
        raise ValueError("비활성화된 검사코드입니다.")
    if (ass.get("issueType") or "individual") != "individual":
        raise ValueError("개별 발급 검사코드만 push할 수 있습니다.")
    return {
        "assessmentId": assessment_id,
        "title": (ass.get("title") or "").strip() or "검사코드",
        "joinAccessCode": (ass.get("accessCode") or "").strip(),
        "testList": ass.get("testList") or [],
    }


def _create_push_assessment(
    db,
    *,
    counselor_uid: str,
    title: str,
    welcome_message: str,
    usage_end_date: str,
    test_list: list[dict],
) -> dict:
    if not test_list:
        raise ValueError("포함할 검사(testList)가 필요합니다.")
    title = (title or "").strip() or "추가 검사"
    join_access_code = generate_unique_access_code()
    assessment_ref = db.collection(ASSESSMENTS_COLLECTION).document()
    assessment_ref.set(
        {
            "accessCode": join_access_code,
            "counselorId": counselor_uid,
            "title": title,
            "issueType": "individual",
            "targetAudience": "개별",
            "welcomeMessage": (welcome_message or "").strip(),
            "usageEndDate": (usage_end_date or "").strip(),
            "testList": test_list,
            "createdAt": SERVER_TIMESTAMP,
            "status": "active",
            "pushSource": "portal_push",
        }
    )
    return {
        "assessmentId": assessment_ref.id,
        "title": title,
        "joinAccessCode": join_access_code,
        "testList": test_list,
    }


def _notify_portal_push(
    db,
    *,
    portal_id: str,
    pdata: dict,
    assessment: dict,
) -> dict:
    aid = assessment["assessmentId"]
    test_list = assessment.get("testList") or []
    required = {
        str(t.get("testId") or "").strip()
        for t in test_list
        if t and str(t.get("testId") or "").strip()
    }
    test_rows = _test_detail_rows(db, portal_id, aid, test_list)
    pending = _pending_tests_from_rows(test_rows)
    if not pending:
        return {"status": "skipped", "message": "no_pending_tests"}

    email = (pdata.get("email") or "").strip().lower()
    phone = (pdata.get("phone") or "").strip()
    if not email and not phone:
        return {"status": "skipped", "message": "no_contact"}

    portal_access_code = (pdata.get("accessCode") or "").strip()
    magic = create_portal_magic_link_token(portal_id, portal_access_code)
    magic_path = f"/go?t={magic}"
    completed_count = sum(1 for t in test_rows if (t.get("status") or "") == "completed")

    result = deliver_test_reminder(
        email=email,
        phone=phone,
        display_name=(pdata.get("displayName") or "").strip(),
        assessment_title=assessment.get("title") or "",
        join_access_code=assessment.get("joinAccessCode") or "",
        my_code=portal_access_code,
        pending_tests=pending,
        completed_count=completed_count,
        required_count=len(required),
        magic_path=magic_path,
    )
    status = result.get("status") or "failed"
    db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).update(
        {
            "lastPushNotifyStatus": status,
            "lastPushNotifyAt": SERVER_TIMESTAMP,
        }
    )
    return {
        "status": status,
        "pendingCount": len(pending),
        "magicUrl": f"{PUBLIC_SITE_URL.rstrip('/')}{magic_path}",
        "sentVia": result.get("sentVia"),
    }


def push_assessments_to_portals(
    db,
    *,
    counselor_uid: str,
    portal_ids: list[str],
    assessment_id: str | None = None,
    title: str = "",
    welcome_message: str = "",
    usage_end_date: str = "",
    test_list: list | None = None,
    notify: bool = True,
) -> dict:
    """
    기존 내담자 포털에 검사코드를 추가 배정하고 선택적으로 알림을 발송합니다.

    assessment_id가 있으면 기존 검사코드를, 없으면 testList로 신규 검사코드를 생성합니다.
    """
    normalized_portal_ids = [str(pid).strip() for pid in (portal_ids or []) if str(pid).strip()]
    if not normalized_portal_ids:
        raise ValueError("portalIds가 필요합니다.")

    if assessment_id:
        assessment = _verify_push_assessment(db, assessment_id.strip(), counselor_uid)
    else:
        normalized_tests = _normalize_test_list(test_list)
        assessment = _create_push_assessment(
            db,
            counselor_uid=counselor_uid,
            title=title,
            welcome_message=welcome_message,
            usage_end_date=usage_end_date,
            test_list=normalized_tests,
        )

    aid = assessment["assessmentId"]
    eligible: list[tuple[str, dict]] = []
    details: list[dict] = []
    skipped = 0
    failed = 0

    for pid in normalized_portal_ids:
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
        if (pdata.get("status") or "active") != "active":
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "archived"})
            continue
        assigned = [str(x).strip() for x in (pdata.get("assignedAssessmentIds") or [])]
        if aid in assigned:
            skipped += 1
            details.append({"portalId": pid, "status": "skipped", "message": "already_assigned"})
            continue
        eligible.append((pid, pdata))

    credit_required = len(eligible)
    credit_info: dict = {
        "counselorUid": counselor_uid,
        "balance": get_balance(db, counselor_uid),
        "consumed": 0,
    }
    if credit_required > 0 and COMMERCE_CREDITS_ENFORCE:
        balance = get_balance(db, counselor_uid)
        if balance < credit_required:
            return {
                "error": "insufficient_credits",
                "message": f"검사 크레딧이 부족합니다. (보유 {balance}, 필요 {credit_required})",
                "balance": balance,
                "required": credit_required,
                "assessmentId": aid,
            }

    assigned_count = 0
    notify_sent = 0
    notify_failed = 0
    notify_skipped = 0

    for pid, pdata in eligible:
        pref = db.collection(CLIENT_PORTALS_COLLECTION).document(pid)
        pref.update(
            {
                "assignedAssessmentIds": ArrayUnion([aid]),
                "lastAssessmentPushAt": SERVER_TIMESTAMP,
                "updatedAt": SERVER_TIMESTAMP,
            }
        )
        assigned_count += 1
        detail: dict = {"portalId": pid, "status": "assigned", "displayName": pdata.get("displayName") or ""}

        if notify:
            notify_result = _notify_portal_push(
                db,
                portal_id=pid,
                pdata=pdata,
                assessment=assessment,
            )
            detail["notify"] = notify_result
            nstatus = notify_result.get("status")
            if nstatus == "sent":
                notify_sent += 1
            elif nstatus == "skipped":
                notify_skipped += 1
            else:
                notify_failed += 1
        else:
            detail["notify"] = {"status": "skipped", "message": "notify_disabled"}

        details.append(detail)

    if credit_required > 0:
        credit_info = consume_credits(
            db,
            counselor_uid,
            credit_required,
            reason="portal_assessment_push",
            actor_uid=counselor_uid,
            metadata={"assessmentId": aid, "portalCount": credit_required},
        )

    return {
        "assessmentId": aid,
        "assessmentTitle": assessment.get("title") or "",
        "joinAccessCode": assessment.get("joinAccessCode") or "",
        "assigned": assigned_count,
        "skipped": skipped,
        "failed": failed,
        "notify": {
            "sent": notify_sent,
            "failed": notify_failed,
            "skipped": notify_skipped,
        },
        "details": details,
        "credits": credit_info,
    }
