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
    _merge_notify_snapshot,
    _resolve_notify_at,
    _resolve_notify_status,
    _test_detail_rows,
    _test_status_for_portal,
)
from utils.portal_assessment_access import get_portal_doc
from utils.portal_linking import list_linked_portal_summaries
from utils.counselor_monitoring import INDIVIDUAL_COHORT_KEY


def _matches_cohort_filter(pdata: dict, cohort_filter: str) -> bool:
    if not cohort_filter:
        return True
    portal_cid = (pdata.get("cohortId") or "").strip()
    if cohort_filter == INDIVIDUAL_COHORT_KEY:
        return not portal_cid
    return portal_cid == cohort_filter


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
    progress: str | None = None,
    tag: str | None = None,
    q: str | None = None,
) -> dict:
    """상담사 소유 내담자 포털 목록 + 진행·발송 요약."""
    status_filter = (status or "active").strip().lower()
    query = (q or "").strip().lower()
    cohort_filter = (cohort_id or "").strip()
    progress_filter = (progress or "all").strip().lower()
    if progress_filter not in ("all", "not_started", "in_progress", "completed", "no_tests"):
        progress_filter = "all"
    tag_filter = (tag or "").strip().lower()

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
        if not _matches_cohort_filter(pdata, cohort_filter):
            continue
        if query and not _matches_search(pdata, query):
            continue
        if tag_filter:
            tags = [
                str(t).strip().lower()
                for t in (pdata.get("counselorTags") or [])
                if str(t).strip()
            ]
            if tag_filter not in tags:
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
        notify_snap = _merge_notify_snapshot(notify, pdata)
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
                "notifyKind": notify_snap.get("notifyKind") or "initial",
                "lastLoginAt": _iso_timestamp(pdata.get("lastLoginAt")),
                "createdAt": _iso_timestamp(pdata.get("createdAt")),
                "counselorTags": [
                    str(t).strip()
                    for t in (pdata.get("counselorTags") or [])
                    if str(t).strip()
                ][:10],
                "progress": {
                    "totalTests": total_tests,
                    "completedTests": completed_tests,
                    "percent": percent,
                    "label": progress_label,
                },
            }
        )

    if progress_filter != "all":
        items = [item for item in items if item.get("progress", {}).get("label") == progress_filter]

    all_tags: set[str] = set()
    for _, pdata, _ in rows:
        for t in pdata.get("counselorTags") or []:
            s = str(t).strip()
            if s:
                all_tags.add(s)

    assessment_meta = {
        aid: {"testList": entry.get("testList") or []}
        for aid, entry in assessment_cache.items()
    }

    cohorts = sorted(
        cohorts_map.values(),
        key=lambda c: (c.get("cohortName") or c.get("cohortId") or "").lower(),
    )

    return {
        "items": items,
        "total": len(items),
        "cohorts": cohorts,
        "tags": sorted(all_tags, key=lambda x: x.lower()),
        "assessmentMeta": assessment_meta,
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
    notify_snap = _merge_notify_snapshot(notify, pdata)
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
            "notifySentVia": notify_snap.get("sentVia") or "",
            "notifyKind": notify_snap.get("notifyKind") or "initial",
            "counselorTags": [
                str(t).strip()
                for t in (pdata.get("counselorTags") or [])
                if str(t).strip()
            ][:10],
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


def list_counselor_portal_test_assignments(
    db,
    counselor_uid: str,
    *,
    status: str | None = None,
    test_status: str | None = None,
    cohort_id: str | None = None,
    assessment_id: str | None = None,
    q: str | None = None,
) -> dict:
    """상담사 내담자×검사코드×검사항목 할당 목록 (flatten)."""
    portal_status_filter = (status or "active").strip().lower()
    test_status_filter = (test_status or "all").strip().lower()
    query = (q or "").strip().lower()
    cohort_filter = (cohort_id or "").strip()
    assessment_filter = (assessment_id or "").strip()

    rows: list[tuple[str, dict, float]] = []
    refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .stream()
    )
    for doc in refs:
        pdata = doc.to_dict() or {}
        st = (pdata.get("status") or "active").strip()
        if portal_status_filter != "all" and st != portal_status_filter:
            continue
        if not _matches_cohort_filter(pdata, cohort_filter):
            continue
        if query and not _matches_search(pdata, query):
            continue
        created_raw = pdata.get("createdAt")
        created_ts = 0.0
        if created_raw is not None and hasattr(created_raw, "timestamp"):
            created_ts = float(created_raw.timestamp())
        rows.append((doc.id, pdata, created_ts))

    rows.sort(key=lambda x: x[2], reverse=True)

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
        if a.get("counselorId") != counselor_uid:
            continue
        if (a.get("status") or "active") != "active":
            continue
        assessment_cache[aid] = {
            "assessmentId": aid,
            "title": (a.get("title") or "").strip() or "검사코드",
            "joinAccessCode": (a.get("accessCode") or "").strip(),
            "testList": a.get("testList") or [],
        }

    cohorts_map: dict[str, dict] = {}
    assessments_map: dict[str, dict] = {}
    items: list[dict] = []

    for portal_id, pdata, _ in rows:
        email = (pdata.get("email") or "").strip()
        cid = (pdata.get("cohortId") or "").strip()
        cname = (pdata.get("cohortName") or "").strip()
        if cid and cid not in cohorts_map:
            cohorts_map[cid] = {"cohortId": cid, "cohortName": cname or cid}

        assigned_ids = [
            str(aid).strip()
            for aid in (pdata.get("assignedAssessmentIds") or [])
            if str(aid).strip() in assessment_cache
        ]

        for aid in assigned_ids:
            if assessment_filter and aid != assessment_filter:
                continue
            acache = assessment_cache[aid]
            if aid not in assessments_map:
                assessments_map[aid] = {
                    "assessmentId": aid,
                    "title": acache["title"],
                }
            test_list = acache.get("testList") or []
            test_rows = _test_detail_rows(db, portal_id, aid, test_list)
            for test in test_rows:
                tstatus = (test.get("status") or "not_started").strip()
                if test_status_filter != "all" and tstatus != test_status_filter:
                    continue
                items.append(
                    {
                        "portalId": portal_id,
                        "displayName": pdata.get("displayName") or "",
                        "email": email or None,
                        "accessCode": pdata.get("accessCode") or "",
                        "cohortId": cid or None,
                        "cohortName": cname or None,
                        "portalStatus": pdata.get("status") or "active",
                        "assessmentId": aid,
                        "assessmentTitle": acache["title"],
                        "joinAccessCode": acache["joinAccessCode"],
                        "testId": test.get("testId") or "",
                        "testName": test.get("testName") or "",
                        "status": tstatus,
                        "completedAt": test.get("completedAt"),
                        "resultId": test.get("resultId"),
                    }
                )

    items.sort(
        key=lambda r: (
            (r.get("displayName") or "").lower(),
            (r.get("assessmentTitle") or "").lower(),
            (r.get("testName") or "").lower(),
        )
    )

    cohorts = sorted(
        cohorts_map.values(),
        key=lambda c: (c.get("cohortName") or c.get("cohortId") or "").lower(),
    )
    assessments = sorted(
        assessments_map.values(),
        key=lambda a: (a.get("title") or "").lower(),
    )

    return {
        "items": items,
        "total": len(items),
        "cohorts": cohorts,
        "assessments": assessments,
    }


def update_portal_counselor_tags(
    db,
    counselor_uid: str,
    portal_id: str,
    tags: list[str],
) -> dict | None:
    """상담사 관리용 내담자 태그 저장 (최대 10개)."""
    from firebase_admin.firestore import SERVER_TIMESTAMP

    pid = (portal_id or "").strip()
    if not pid:
        return None

    portal_doc = get_portal_doc(db, pid)
    if not portal_doc:
        return None
    pdata = portal_doc.to_dict() or {}
    if pdata.get("counselorId") != counselor_uid:
        return None

    cleaned: list[str] = []
    seen: set[str] = set()
    for raw in tags or []:
        t = str(raw).strip()[:32]
        if not t:
            continue
        key = t.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(t)
        if len(cleaned) >= 10:
            break

    portal_doc.reference.set(
        {"counselorTags": cleaned, "updatedAt": SERVER_TIMESTAMP},
        merge=True,
    )
    return get_counselor_client_portal_detail(db, counselor_uid, pid)
