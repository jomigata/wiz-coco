"""상담사 통합 모니터링 허브 — 검사코드·내담자·진행 요약."""
from __future__ import annotations

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION, TEST_RESULTS_COLLECTION
from utils.assessment_dispatch import (
    _bulk_completed_tests_by_portal_assessment,
    _iso_timestamp,
    _latest_notify_by_portal,
    _resolve_notify_at,
    _resolve_notify_status,
    _test_status_for_portal,
)


def _progress_label(total: int, completed: int) -> str:
    if total <= 0:
        return "no_tests"
    if completed <= 0:
        return "not_started"
    if completed >= total:
        return "completed"
    return "in_progress"


def get_counselor_monitoring_hub(
    db,
    counselor_uid: str,
    *,
    cohort_id: str | None = None,
) -> dict:
    """상담사 전체 검사코드·내담자 진행 통합 요약."""
    cohort_filter = (cohort_id or "").strip()

    assessment_docs: list[tuple[str, dict]] = []
    ass_refs = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .where("status", "==", "active")
        .stream()
    )
    for doc in ass_refs:
        a = doc.to_dict() or {}
        if (a.get("issueType") or "individual") != "individual":
            continue
        assessment_docs.append((doc.id, a))

    assessment_cache: dict[str, dict] = {}
    for aid, a in assessment_docs:
        test_list = a.get("testList") or []
        required = {
            str(t.get("testId") or "").strip()
            for t in test_list
            if t and str(t.get("testId") or "").strip()
        }
        assessment_cache[aid] = {
            "assessmentId": aid,
            "title": (a.get("title") or "").strip() or "검사코드",
            "joinAccessCode": (a.get("accessCode") or "").strip(),
            "cohortName": (a.get("cohortName") or "").strip(),
            "testList": test_list,
            "requiredTestIds": required,
            "requiredPerRecipient": len(required),
        }

    portal_rows: list[tuple[str, dict, list[str]]] = []
    portal_refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .stream()
    )
    for doc in portal_refs:
        pdata = doc.to_dict() or {}
        if (pdata.get("status") or "active") != "active":
            continue
        if cohort_filter and (pdata.get("cohortId") or "") != cohort_filter:
            continue
        assigned = [
            str(aid).strip()
            for aid in (pdata.get("assignedAssessmentIds") or [])
            if str(aid).strip() in assessment_cache
        ]
        if not assigned:
            continue
        portal_rows.append((doc.id, pdata, assigned))

    portal_ids = {row[0] for row in portal_rows}
    notify_map = _latest_notify_by_portal(db, portal_ids)
    all_assessment_ids = set(assessment_cache.keys())
    portal_id_list = [row[0] for row in portal_rows]
    completion_map = _bulk_completed_tests_by_portal_assessment(
        db, portal_id_list, all_assessment_ids
    )

    assessment_stats: dict[str, dict] = {
        aid: {
            "assessmentId": aid,
            "title": acache["title"],
            "joinAccessCode": acache["joinAccessCode"],
            "cohortName": acache["cohortName"] or None,
            "testList": acache["testList"],
            "requiredPerRecipient": acache["requiredPerRecipient"],
            "recipientCount": 0,
            "completedRecipients": 0,
            "inProgressRecipients": 0,
            "notStartedRecipients": 0,
            "notifyFailedCount": 0,
            "totalTests": 0,
            "completedTests": 0,
            "recipients": [],
        }
        for aid, acache in assessment_cache.items()
    }

    cohorts_map: dict[str, dict] = {}
    seen_portals: set[str] = set()

    for portal_id, pdata, assigned in portal_rows:
        seen_portals.add(portal_id)
        cid = (pdata.get("cohortId") or "").strip()
        cname = (pdata.get("cohortName") or "").strip()
        if cid and cid not in cohorts_map:
            cohorts_map[cid] = {"cohortId": cid, "cohortName": cname or cid}

        email = (pdata.get("email") or "").strip()
        phone = (pdata.get("phone") or "").strip()
        notify = notify_map.get(portal_id) or {}
        notify_status, notify_error = _resolve_notify_status(
            notify, pdata, email=email, phone=phone
        )
        notify_at = _resolve_notify_at(notify, pdata, notify_status)

        for aid in assigned:
            acache = assessment_cache[aid]
            required = acache["requiredTestIds"]
            test_info = _test_status_for_portal(db, portal_id, aid, required)
            completed_tests = int(test_info.get("completedCount") or 0)
            required_count = int(test_info.get("requiredCount") or 0)
            test_status = test_info.get("testStatus") or "not_started"

            stats = assessment_stats[aid]
            stats["recipientCount"] += 1
            stats["totalTests"] += required_count
            stats["completedTests"] += completed_tests
            if test_status == "completed":
                stats["completedRecipients"] += 1
            elif test_status == "in_progress":
                stats["inProgressRecipients"] += 1
            else:
                stats["notStartedRecipients"] += 1
            if notify_status == "failed":
                stats["notifyFailedCount"] += 1

            stats["recipients"].append(
                {
                    "portalId": portal_id,
                    "displayName": pdata.get("displayName") or "",
                    "cohortId": cid or None,
                    "cohortName": cname or None,
                    "cohortKey": cid if cid else INDIVIDUAL_COHORT_KEY,
                    "notifyStatus": notify_status,
                    "notifyError": notify_error,
                    "notifyAt": notify_at,
                    "testStatus": test_status,
                    "completedCount": completed_tests,
                    "requiredCount": required_count,
                }
            )

    assessments_out: list[dict] = []
    for aid, stats in assessment_stats.items():
        if stats["recipientCount"] <= 0:
            continue
        total_tests = stats["totalTests"]
        completed_tests = stats["completedTests"]
        percent = round((completed_tests / total_tests) * 100) if total_tests else 0
        stats["progress"] = {
            "totalTests": total_tests,
            "completedTests": completed_tests,
            "percent": percent,
            "label": _progress_label(total_tests, completed_tests),
        }
        stats["recipients"].sort(
            key=lambda r: ((r.get("displayName") or "").lower(), r.get("portalId") or "")
        )
        assessments_out.append(stats)

    assessments_out.sort(
        key=lambda a: (
            -(a.get("progress") or {}).get("percent", 0),
            (a.get("title") or "").lower(),
        )
    )

    recent_activity: list[dict] = []
    active_assessment_ids = [a["assessmentId"] for a in assessments_out]
    portal_name_map = {row[0]: (row[1].get("displayName") or "") for row in portal_rows}

    for aid in active_assessment_ids[:30]:
        title = assessment_cache.get(aid, {}).get("title") or "검사코드"
        refs = (
            db.collection(TEST_RESULTS_COLLECTION)
            .where("assessmentId", "==", aid)
            .stream()
        )
        for rdoc in refs:
            rd = rdoc.to_dict() or {}
            if (rd.get("status") or "").strip() != "completed":
                continue
            pid = (rd.get("portalId") or "").strip()
            if pid and pid not in portal_name_map:
                continue
            recent_activity.append(
                {
                    "resultId": rdoc.id,
                    "portalId": pid,
                    "displayName": portal_name_map.get(pid, ""),
                    "assessmentId": aid,
                    "assessmentTitle": title,
                    "testId": (rd.get("testId") or "").strip(),
                    "completedAt": _iso_timestamp(rd.get("completedAt")),
                }
            )

    recent_activity.sort(
        key=lambda r: r.get("completedAt") or "",
        reverse=True,
    )
    recent_activity = recent_activity[:40]

    total_recipients = sum(a["recipientCount"] for a in assessments_out)
    completed_recipients = sum(a["completedRecipients"] for a in assessments_out)
    in_progress_recipients = sum(a["inProgressRecipients"] for a in assessments_out)
    not_started_recipients = sum(a["notStartedRecipients"] for a in assessments_out)
    notify_failed = sum(a["notifyFailedCount"] for a in assessments_out)

    cohorts = sorted(
        cohorts_map.values(),
        key=lambda c: (c.get("cohortName") or c.get("cohortId") or "").lower(),
    )

    return {
        "summary": {
            "activeAssessments": len(assessments_out),
            "activePortals": len(seen_portals),
            "totalRecipients": total_recipients,
            "completedRecipients": completed_recipients,
            "inProgressRecipients": in_progress_recipients,
            "notStartedRecipients": not_started_recipients,
            "notifyFailedCount": notify_failed,
        },
        "assessments": assessments_out,
        "recentActivity": recent_activity,
        "cohorts": cohorts,
    }


INDIVIDUAL_COHORT_KEY = "__individual__"


def get_counselor_cohort_monitoring_view(
    db,
    counselor_uid: str,
) -> dict:
    """그룹(학급·단체)별 진행률 집계."""
    assessment_docs: list[tuple[str, dict]] = []
    ass_refs = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .where("status", "==", "active")
        .stream()
    )
    for doc in ass_refs:
        a = doc.to_dict() or {}
        if (a.get("issueType") or "individual") != "individual":
            continue
        assessment_docs.append((doc.id, a))

    assessment_cache: dict[str, dict] = {}
    for aid, a in assessment_docs:
        test_list = a.get("testList") or []
        required = {
            str(t.get("testId") or "").strip()
            for t in test_list
            if t and str(t.get("testId") or "").strip()
        }
        assessment_cache[aid] = {
            "assessmentId": aid,
            "title": (a.get("title") or "").strip() or "검사코드",
            "joinAccessCode": (a.get("accessCode") or "").strip(),
            "testList": test_list,
            "requiredTestIds": required,
        }

    portal_rows: list[tuple[str, dict, list[str]]] = []
    portal_refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .stream()
    )
    for doc in portal_refs:
        pdata = doc.to_dict() or {}
        if (pdata.get("status") or "active") != "active":
            continue
        assigned = [
            str(aid).strip()
            for aid in (pdata.get("assignedAssessmentIds") or [])
            if str(aid).strip() in assessment_cache
        ]
        if not assigned:
            continue
        portal_rows.append((doc.id, pdata, assigned))

    portal_ids = {row[0] for row in portal_rows}
    notify_map = _latest_notify_by_portal(db, portal_ids)

    cohort_buckets: dict[str, dict] = {}

    def _bucket(cid: str, cname: str) -> dict:
        if cid not in cohort_buckets:
            cohort_buckets[cid] = {
                "cohortId": cid if cid != INDIVIDUAL_COHORT_KEY else "",
                "cohortKey": cid,
                "cohortName": cname,
                "portalCount": 0,
                "completedPortals": 0,
                "inProgressPortals": 0,
                "notStartedPortals": 0,
                "notifyFailedCount": 0,
                "totalTests": 0,
                "completedTests": 0,
                "assessmentIds": set(),
                "assessments": {},
            }
        return cohort_buckets[cid]

    for portal_id, pdata, assigned in portal_rows:
        raw_cid = (pdata.get("cohortId") or "").strip()
        raw_cname = (pdata.get("cohortName") or "").strip()
        if raw_cid:
            bucket_key = raw_cid
            bucket_name = raw_cname or raw_cid
        else:
            bucket_key = INDIVIDUAL_COHORT_KEY
            bucket_name = "개별 발급"

        bucket = _bucket(bucket_key, bucket_name)
        bucket["portalCount"] += 1

        email = (pdata.get("email") or "").strip()
        phone = (pdata.get("phone") or "").strip()
        notify = notify_map.get(portal_id) or {}
        notify_status, _ = _resolve_notify_status(notify, pdata, email=email, phone=phone)
        if notify_status == "failed":
            bucket["notifyFailedCount"] += 1

        portal_total = 0
        portal_completed = 0
        portal_has_progress = False

        for aid in assigned:
            acache = assessment_cache[aid]
            required = acache["requiredTestIds"]
            test_info = _test_status_for_portal(db, portal_id, aid, required)
            completed_tests = int(test_info.get("completedCount") or 0)
            required_count = int(test_info.get("requiredCount") or 0)
            test_status = test_info.get("testStatus") or "not_started"

            portal_total += required_count
            portal_completed += completed_tests
            if test_status in ("in_progress", "completed"):
                portal_has_progress = True

            bucket["totalTests"] += required_count
            bucket["completedTests"] += completed_tests
            bucket["assessmentIds"].add(aid)

            ass_entry = bucket["assessments"].setdefault(
                aid,
                {
                    "assessmentId": aid,
                    "title": acache["title"],
                    "joinAccessCode": acache["joinAccessCode"],
                    "recipientCount": 0,
                    "completedRecipients": 0,
                    "inProgressRecipients": 0,
                    "notStartedRecipients": 0,
                    "totalTests": 0,
                    "completedTests": 0,
                },
            )
            ass_entry["recipientCount"] += 1
            ass_entry["totalTests"] += required_count
            ass_entry["completedTests"] += completed_tests
            if test_status == "completed":
                ass_entry["completedRecipients"] += 1
            elif test_status == "in_progress":
                ass_entry["inProgressRecipients"] += 1
            else:
                ass_entry["notStartedRecipients"] += 1

        if portal_total > 0 and portal_completed >= portal_total:
            bucket["completedPortals"] += 1
        elif portal_has_progress or portal_completed > 0:
            bucket["inProgressPortals"] += 1
        else:
            bucket["notStartedPortals"] += 1

    cohort_items: list[dict] = []
    group_count = 0
    individual_count = 0

    for cid, bucket in cohort_buckets.items():
        total_tests = bucket["totalTests"]
        completed_tests = bucket["completedTests"]
        percent = round((completed_tests / total_tests) * 100) if total_tests else 0

        assessments = []
        for aid, entry in bucket["assessments"].items():
            a_total = entry["totalTests"]
            a_completed = entry["completedTests"]
            a_percent = round((a_completed / a_total) * 100) if a_total else 0
            assessments.append(
                {
                    **entry,
                    "progress": {
                        "totalTests": a_total,
                        "completedTests": a_completed,
                        "percent": a_percent,
                        "label": _progress_label(a_total, a_completed),
                    },
                }
            )
        assessments.sort(key=lambda a: (-(a.get("progress") or {}).get("percent", 0), a.get("title") or ""))

        item = {
            "cohortId": bucket["cohortId"],
            "cohortKey": bucket["cohortKey"],
            "cohortName": bucket["cohortName"],
            "portalCount": bucket["portalCount"],
            "assessmentCount": len(bucket["assessmentIds"]),
            "completedPortals": bucket["completedPortals"],
            "inProgressPortals": bucket["inProgressPortals"],
            "notStartedPortals": bucket["notStartedPortals"],
            "notifyFailedCount": bucket["notifyFailedCount"],
            "totalTests": total_tests,
            "completedTests": completed_tests,
            "progress": {
                "totalTests": total_tests,
                "completedTests": completed_tests,
                "percent": percent,
                "label": _progress_label(total_tests, completed_tests),
            },
            "assessments": assessments,
        }
        cohort_items.append(item)
        if cid == INDIVIDUAL_COHORT_KEY:
            individual_count += 1
        else:
            group_count += 1

    cohort_items.sort(
        key=lambda c: (
            c.get("cohortKey") == INDIVIDUAL_COHORT_KEY,
            -(c.get("progress") or {}).get("percent", 0),
            (c.get("cohortName") or "").lower(),
        )
    )

    total_portals = sum(c["portalCount"] for c in cohort_items)
    total_completed_portals = sum(c["completedPortals"] for c in cohort_items)
    total_in_progress_portals = sum(c["inProgressPortals"] for c in cohort_items)

    return {
        "summary": {
            "totalCohorts": len(cohort_items),
            "groupCohorts": group_count,
            "individualCohorts": individual_count,
            "totalPortals": total_portals,
            "completedPortals": total_completed_portals,
            "inProgressPortals": total_in_progress_portals,
            "notStartedPortals": sum(c["notStartedPortals"] for c in cohort_items),
            "notifyFailedCount": sum(c["notifyFailedCount"] for c in cohort_items),
        },
        "cohorts": cohort_items,
    }
