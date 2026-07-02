# 기관 cohort 익명 그룹 통계 리포트
from __future__ import annotations

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION, TEST_RESULTS_COLLECTION


def _iso(val):
    if val and hasattr(val, "isoformat"):
        return val.isoformat()
    if val and hasattr(val, "timestamp"):
        from datetime import datetime

        return datetime.utcfromtimestamp(val.timestamp()).isoformat() + "Z"
    return None


def build_anonymous_group_report(db, *, organization_id: str, cohort_id: str) -> dict:
    """개인 식별 정보 없이 cohort 단위 진행·완료 통계."""
    cohort_id = (cohort_id or "").strip()
    org_id = (organization_id or "").strip()
    if not cohort_id or not org_id:
        raise ValueError("cohortId and organizationId required")

    assessments = []
    for doc in db.collection(ASSESSMENTS_COLLECTION).where("organizationId", "==", org_id).stream():
        d = doc.to_dict() or {}
        if (d.get("clientPortalCohortId") or "") != cohort_id:
            continue
        if (d.get("status") or "active") != "active":
            continue
        assessments.append({"id": doc.id, **d})

    if not assessments:
        raise ValueError("cohort not found for organization")

    assessment_ids = {a["id"] for a in assessments}
    primary = assessments[0]
    test_list = primary.get("testList") or []
    required_count = max(1, len(test_list))

    portal_ids: list[str] = []
    for doc in db.collection(CLIENT_PORTALS_COLLECTION).where("cohortId", "==", cohort_id).stream():
        pdata = doc.to_dict() or {}
        if (pdata.get("organizationId") or "") != org_id:
            continue
        if (pdata.get("status") or "active") != "active":
            continue
        portal_ids.append(doc.id)

    total = len(portal_ids)
    completed_participants = 0
    in_progress = 0
    not_started = 0
    by_test: dict[str, dict] = {}

    for tid_item in test_list:
        tid = str(tid_item.get("testId") or "").strip()
        if tid:
            by_test[tid] = {"testId": tid, "name": tid_item.get("name") or tid, "completedCount": 0}

    for pid in portal_ids:
        done_tests: set[str] = set()
        for doc in db.collection(TEST_RESULTS_COLLECTION).where("portalId", "==", pid).stream():
            d = doc.to_dict() or {}
            if (d.get("status") or "") != "completed":
                continue
            aid = d.get("assessmentId") or ""
            if aid not in assessment_ids:
                continue
            tid = str(d.get("testId") or "").strip()
            if tid:
                done_tests.add(tid)
                if tid in by_test:
                    by_test[tid]["completedCount"] += 1

        n = len(done_tests)
        if n >= required_count:
            completed_participants += 1
        elif n > 0:
            in_progress += 1
        else:
            not_started += 1

    completion_rate = round((completed_participants / total * 100), 1) if total else 0.0

    return {
        "organizationId": org_id,
        "cohortId": cohort_id,
        "cohortName": primary.get("cohortName") or "",
        "anonymous": True,
        "participantCount": total,
        "completedCount": completed_participants,
        "inProgressCount": in_progress,
        "notStartedCount": not_started,
        "completionRatePercent": completion_rate,
        "requiredTestsPerParticipant": required_count,
        "byTest": list(by_test.values()),
        "assessmentCount": len(assessments),
        "generatedAt": _iso(__import__("datetime").datetime.utcnow()),
        "disclaimer": "개인 식별 정보는 포함되지 않습니다. 조직 통계 참고용입니다.",
    }


def list_org_cohort_summaries(db, *, organization_id: str) -> list[dict]:
    """기관 대시보드 — cohort별 익명 요약."""
    org_id = (organization_id or "").strip()
    cohorts: dict[str, dict] = {}

    for doc in db.collection(ASSESSMENTS_COLLECTION).where("organizationId", "==", org_id).stream():
        d = doc.to_dict() or {}
        cid = (d.get("clientPortalCohortId") or "").strip()
        if not cid:
            continue
        if cid not in cohorts:
            cohorts[cid] = {
                "cohortId": cid,
                "cohortName": d.get("cohortName") or cid,
                "assessmentIds": [],
                "prepaidByOrg": bool(d.get("prepaidByOrg")),
            }
        cohorts[cid]["assessmentIds"].append(doc.id)

    summaries = []
    for cid, meta in cohorts.items():
        try:
            report = build_anonymous_group_report(db, organization_id=org_id, cohort_id=cid)
            summaries.append(
                {
                    "cohortId": cid,
                    "cohortName": meta["cohortName"],
                    "participantCount": report["participantCount"],
                    "completedCount": report["completedCount"],
                    "completionRatePercent": report["completionRatePercent"],
                    "prepaidByOrg": meta["prepaidByOrg"],
                }
            )
        except ValueError:
            summaries.append(
                {
                    "cohortId": cid,
                    "cohortName": meta["cohortName"],
                    "participantCount": 0,
                    "completedCount": 0,
                    "completionRatePercent": 0,
                    "prepaidByOrg": meta["prepaidByOrg"],
                }
            )

    summaries.sort(key=lambda x: x.get("cohortName") or "")
    return summaries
