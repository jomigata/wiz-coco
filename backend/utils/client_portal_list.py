"""상담사 내담자 CRM — clientPortals 목록·진행 요약."""
from __future__ import annotations

from config import (
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    TEST_RESULTS_COLLECTION,
)
from utils.assessment_dispatch import (
    _bulk_completed_tests_by_portal_assessment,
    _iso_timestamp,
    _latest_notify_by_portal,
    _resolve_notify_at,
    _resolve_notify_status,
    _test_detail_rows,
    _test_status_for_portal,
)
from utils.portal_assessment_access import get_portal_doc
from utils.portal_linking import list_linked_portal_summaries


def _matches_search(pdata: dict, query: str) -> bool:
    hay = " ".join(
        [
            str(pdata.get("displayName") or ""),
            str(pdata.get("email") or ""),
            str(pdata.get("phone") or ""),
            str(pdata.get("accessCode") or ""),
            str(pdata.get("cohortName") or ""),
        ]
    ).lower()
    return query in hay


def _progress_label(total: int, completed: int) -> str:
    if total <= 0:
        return "no_tests"
    if completed <= 0:
        return "not_started"
    if completed >= total:
        return "completed"
    return "in_progress"


def list_counselor_client_portals(
    db,
    counselor_uid: str,
    *,
    status: str | None = None,
    cohort_id: str | None = None,
    q: str | None = None,
) -> dict:
    """상담사 소유 내담자 포털 목록 + 진행·발송 요약."""
    status_filter = (status or "active").strip().lower()
    query = (q or "").strip().lower()
    cohort_filter = (cohort_id or "").strip()

    rows: list[tuple[str, dict, float]] = []
    refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .stream()
    )
    for doc in refs:
        pdata = doc.to_dict() or {}
        st = (pdata.get("status") or "active").strip()
        if status_filter != "all" and st != status_filter:
            continue
        if cohort_filter and (pdata.get("cohortId") or "") != cohort_filter:
            continue
        if query and not _matches_search(pdata, query):
            continue
        created_raw = pdata.get("createdAt")
        created_ts = 0.0
        if created_raw is not None and hasattr(created_raw, "timestamp"):
            created_ts = float(created_raw.timestamp())
        rows.append((doc.id, pdata, created_ts))

    rows.sort(key=lambda x: x[2], reverse=True)

    portal_ids = {row[0] for row in rows}
    notify_map = _latest_notify_by_portal(db, portal_ids)

    all_assessment_ids: set[str] = set()
    for _, pdata, _ in rows:
        for aid in pdata.get("assignedAssessmentIds") or []:
            s = str(aid).strip()
            if s:
                all_assessment_ids.add(s)

    assessment_cache: dict[str, dict] = {}
    for aid in all_assessment_ids:
        adoc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
        if not adoc.exists:
            continue
        a = adoc.to_dict() or {}
        if (a.get("status") or "active") != "active":
            continue
        assessment_cache[aid] = {
            "assessmentId": aid,
            "title": (a.get("title") or "").strip() or "검사코드",
            "testList": a.get("testList") or [],
        }

    completion_map = _bulk_completed_tests_by_portal_assessment(
        db,
        [row[0] for row in rows],
        set(assessment_cache.keys()),
    )

    cohorts_map: dict[str, dict] = {}
    items: list[dict] = []

    for portal_id, pdata, _ in rows:
        email = (pdata.get("email") or "").strip()
        phone = (pdata.get("phone") or "").strip()
        notify = notify_map.get(portal_id) or {}
        notify_status, notify_error = _resolve_notify_status(
            notify, pdata, email=email, phone=phone
        )
        notify_at = _resolve_notify_at(notify, pdata, notify_status)

        assigned_ids = [
            str(aid).strip()
            for aid in (pdata.get("assignedAssessmentIds") or [])
            if str(aid).strip() in assessment_cache
        ]
        assessments = [assessment_cache[aid] for aid in assigned_ids]

        total_tests = 0
        completed_tests = 0
        for aid in assigned_ids:
            required = {
                str(t.get("testId") or "").strip()
                for t in (assessment_cache[aid].get("testList") or [])
                if t and str(t.get("testId") or "").strip()
            }
            total_tests += len(required)
            completed_tests += len(completion_map.get((portal_id, aid), set()) & required)

        percent = round((completed_tests / total_tests) * 100) if total_tests else 0
        progress_label = _progress_label(total_tests, completed_tests)

        cid = (pdata.get("cohortId") or "").strip()
        cname = (pdata.get("cohortName") or "").strip()
        if cid and cid not in cohorts_map:
            cohorts_map[cid] = {"cohortId": cid, "cohortName": cname or cid}

        items.append(
            {
                "portalId": portal_id,
                "displayName": pdata.get("displayName") or "",
                "email": email or None,
                "phone": phone or None,
                "accessCode": pdata.get("accessCode") or "",
                "cohortId": cid or None,
                "cohortName": cname or None,
                "status": pdata.get("status") or "active",
                "assignedAssessmentCount": len(assigned_ids),
                "assessments": [
                    {"assessmentId": a["assessmentId"], "title": a["title"]}
                    for a in assessments
                ],
                "notifyStatus": notify_status,
                "notifyError": notify_error,
                "notifyAt": notify_at,
                "lastLoginAt": _iso_timestamp(pdata.get("lastLoginAt")),
                "createdAt": _iso_timestamp(pdata.get("createdAt")),
                "progress": {
                    "totalTests": total_tests,
                    "completedTests": completed_tests,
                    "percent": percent,
                    "label": progress_label,
                },
            }
        )

    cohorts = sorted(
        cohorts_map.values(),
        key=lambda c: (c.get("cohortName") or c.get("cohortId") or "").lower(),
    )

    return {
        "items": items,
        "total": len(items),
        "cohorts": cohorts,
    }


def get_counselor_client_portal_detail(
    db,
    counselor_uid: str,
    portal_id: str,
) -> dict | None:
    """상담사 내담자 1명 상세 — 검사·발송·진행·결과 통합."""
    pid = (portal_id or "").strip()
    if not pid:
        return None

    portal_doc = get_portal_doc(db, pid)
    if not portal_doc:
        return None
    pdata = portal_doc.to_dict() or {}
    if pdata.get("counselorId") != counselor_uid:
        return None

    email = (pdata.get("email") or "").strip()
    phone = (pdata.get("phone") or "").strip()
    notify_map = _latest_notify_by_portal(db, {pid})
    notify = notify_map.get(pid) or {}
    notify_status, notify_error = _resolve_notify_status(
        notify, pdata, email=email, phone=phone
    )
    notify_at = _resolve_notify_at(notify, pdata, notify_status)

    assigned_ids = [
        str(aid).strip()
        for aid in (pdata.get("assignedAssessmentIds") or [])
        if str(aid).strip()
    ]

    assessments: list[dict] = []
    all_aids: set[str] = set()
    total_tests = 0
    completed_tests = 0

    for aid in assigned_ids:
        adoc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
        if not adoc.exists:
            continue
        a = adoc.to_dict() or {}
        if a.get("counselorId") != counselor_uid:
            continue
        if (a.get("status") or "active") != "active":
            continue
        all_aids.add(aid)
        test_list = a.get("testList") or []
        required = {
            str(t.get("testId") or "").strip()
            for t in test_list
            if t and str(t.get("testId") or "").strip()
        }
        test_info = _test_status_for_portal(db, pid, aid, required)
        tests = _test_detail_rows(db, pid, aid, test_list)
        total_tests += test_info.get("requiredCount") or 0
        completed_tests += test_info.get("completedCount") or 0
        assessments.append(
            {
                "assessmentId": aid,
                "title": (a.get("title") or "").strip() or "검사코드",
                "joinAccessCode": (a.get("accessCode") or "").strip(),
                "cohortName": (a.get("cohortName") or pdata.get("cohortName") or "").strip(),
                "usageEndDate": (a.get("usageEndDate") or "").strip() or None,
                "welcomeMessage": (a.get("welcomeMessage") or "").strip(),
                "testList": test_list,
                "testStatus": test_info.get("testStatus"),
                "completedCount": test_info.get("completedCount"),
                "requiredCount": test_info.get("requiredCount"),
                "tests": tests,
            }
        )

    percent = round((completed_tests / total_tests) * 100) if total_tests else 0
    progress_label = _progress_label(total_tests, completed_tests)

    recent_results: list[dict] = []
    result_refs = (
        db.collection(TEST_RESULTS_COLLECTION)
        .where("portalId", "==", pid)
        .stream()
    )
    for rdoc in result_refs:
        rd = rdoc.to_dict() or {}
        recent_results.append(
            {
                "resultId": rdoc.id,
                "assessmentId": (rd.get("assessmentId") or "").strip(),
                "testId": (rd.get("testId") or "").strip(),
                "testType": (rd.get("testType") or rd.get("testId") or "").strip(),
                "status": (rd.get("status") or "").strip(),
                "completedAt": _iso_timestamp(rd.get("completedAt")),
                "createdAt": _iso_timestamp(rd.get("createdAt")),
            }
        )
    recent_results.sort(
        key=lambda r: (r.get("completedAt") or r.get("createdAt") or ""),
        reverse=True,
    )
    recent_results = recent_results[:30]

    linked_portals = list_linked_portal_summaries(db, pid)

    return {
        "portal": {
            "portalId": pid,
            "displayName": pdata.get("displayName") or "",
            "email": email or None,
            "phone": phone or None,
            "accessCode": pdata.get("accessCode") or "",
            "cohortId": (pdata.get("cohortId") or "").strip() or None,
            "cohortName": (pdata.get("cohortName") or "").strip() or None,
            "status": pdata.get("status") or "active",
            "createdAt": _iso_timestamp(pdata.get("createdAt")),
            "updatedAt": _iso_timestamp(pdata.get("updatedAt")),
            "lastLoginAt": _iso_timestamp(pdata.get("lastLoginAt")),
            "notifyStatus": notify_status,
            "notifyError": notify_error,
            "notifyAt": notify_at,
            "notifySentVia": notify.get("sentVia") or "",
        },
        "progress": {
            "totalTests": total_tests,
            "completedTests": completed_tests,
            "percent": percent,
            "label": progress_label,
        },
        "assessments": assessments,
        "recentResults": recent_results,
        "linkedPortals": linked_portals,
    }
