"""상담(코드)(assessments) 및 회원·비회원 검사·상담 관련 Firestore 데이터 일괄 삭제."""
from __future__ import annotations

from config import (
    AI_REPORTS_COLLECTION,
    AI_USAGE_LEDGER_COLLECTION,
    ASSESSMENTS_COLLECTION,
    B2C_ENTITLEMENTS_COLLECTION,
    BULK_PORTAL_JOBS_COLLECTION,
    CARE_ASSIGNMENTS_COLLECTION,
    CARE_PROGRESS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    DAILY_RECORDS_COLLECTION,
    JOIN_PARTICIPANTS_COLLECTION,
    NOTIFICATION_QUEUE_COLLECTION,
    TEST_RESULTS_COLLECTION,
)
from utils.access_code import reset_access_code_generation_meta
from utils.my_code import reset_my_code_generation_meta

BATCH_SIZE = 400
LEGACY_TEST_RESULTS_COLLECTION = "test_results"
BULK_JOB_CREATED_ROWS = "createdRows"

# 검사·결과·상담 내용 등 플랫폼 사용자 콘텐츠 (계정·결제·기관 제외)
PLATFORM_CONTENT_COLLECTIONS = (
    "chatMessages",
    "counselingAppointments",
    "clientCounselorRelations",
    "dataSharingRequests",
    "mbtiCompatibility",
    "testAssignments",
    "testCodeGenerationLogs",
    "crisisEvents",
    "counselorCodes",
    "testSearchQueries",
)

AI_COUNSEL_SESSIONS_COLLECTION = "aiCounselSessions"
AI_COUNSEL_MESSAGES_SUBCOLLECTION = "messages"


def _delete_query_docs(db, query, label: str, dry_run: bool) -> int:
    deleted = 0
    while True:
        docs = list(query.limit(BATCH_SIZE).stream())
        if not docs:
            break
        if dry_run:
            deleted += len(docs)
            if len(docs) < BATCH_SIZE:
                break
            continue
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
        deleted += len(docs)
    return deleted


def _delete_entire_collection(db, collection_name: str, dry_run: bool) -> int:
    return _delete_query_docs(
        db,
        db.collection(collection_name),
        collection_name,
        dry_run,
    )


def _delete_subcollection(db, parent_collection: str, subcollection: str, dry_run: bool) -> int:
    deleted = 0
    for parent in db.collection(parent_collection).stream():
        query = parent.reference.collection(subcollection)
        deleted += _delete_query_docs(db, query, subcollection, dry_run)
    return deleted


def _delete_bulk_job_subcollections(db, dry_run: bool) -> int:
    return _delete_subcollection(db, BULK_PORTAL_JOBS_COLLECTION, BULK_JOB_CREATED_ROWS, dry_run)


def _delete_counselor_test_results(db, dry_run: bool) -> int:
    """assessmentId / accessCode / portalId 중 하나라도 있는 testResults 삭제."""
    coll = db.collection(TEST_RESULTS_COLLECTION)
    deleted = 0
    while True:
        docs = list(coll.limit(BATCH_SIZE).stream())
        if not docs:
            break
        to_delete = [
            d
            for d in docs
            if (d.to_dict() or {}).get("assessmentId")
            or (d.to_dict() or {}).get("accessCode")
            or (d.to_dict() or {}).get("portalId")
        ]
        if not to_delete:
            break
        if dry_run:
            deleted += len(to_delete)
            if len(docs) < BATCH_SIZE:
                break
            continue
        batch = db.batch()
        for d in to_delete:
            batch.delete(d.reference)
        batch.commit()
        deleted += len(to_delete)
        if len(docs) < BATCH_SIZE:
            break
    return deleted


def _delete_ai_counsel_sessions(db, dry_run: bool) -> dict:
    """AI 상담 세션 및 messages 하위 컬렉션 삭제."""
    sessions_deleted = 0
    messages_deleted = 0
    for doc in db.collection(AI_COUNSEL_SESSIONS_COLLECTION).stream():
        messages_deleted += _delete_query_docs(
            db,
            doc.reference.collection(AI_COUNSEL_MESSAGES_SUBCOLLECTION),
            AI_COUNSEL_MESSAGES_SUBCOLLECTION,
            dry_run,
        )
        if dry_run:
            sessions_deleted += 1
        else:
            doc.reference.delete()
            sessions_deleted += 1
    return {
        "aiCounselSessions": sessions_deleted,
        "aiCounselMessages": messages_deleted,
    }


def purge_assessment_platform_data(db, *, dry_run: bool = False, include_all_test_results: bool = False) -> dict:
    """
    상담코드·검사·결과·상담내용 등 플랫폼 사용자 콘텐츠 일괄 삭제.
    users·counselors·결제·기관·FAQ 등 계정/운영 메타는 유지.
    testResults: include_all_test_results=True 이면 컬렉션 전체, 아니면 상담(코드) 연동 문서만.
    """
    counts = {
        "bulkPortalJobCreatedRows": _delete_bulk_job_subcollections(db, dry_run),
        "assessments": _delete_entire_collection(db, ASSESSMENTS_COLLECTION, dry_run),
        "clientPortals": _delete_entire_collection(db, CLIENT_PORTALS_COLLECTION, dry_run),
        "joinParticipants": _delete_entire_collection(db, JOIN_PARTICIPANTS_COLLECTION, dry_run),
        "notificationQueue": _delete_entire_collection(db, NOTIFICATION_QUEUE_COLLECTION, dry_run),
        "bulkPortalJobs": _delete_entire_collection(db, BULK_PORTAL_JOBS_COLLECTION, dry_run),
        "careAssignments": _delete_entire_collection(db, CARE_ASSIGNMENTS_COLLECTION, dry_run),
        "careProgress": _delete_entire_collection(db, CARE_PROGRESS_COLLECTION, dry_run),
        "dailyRecords": _delete_entire_collection(db, DAILY_RECORDS_COLLECTION, dry_run),
        "aiReports": _delete_entire_collection(db, AI_REPORTS_COLLECTION, dry_run),
        "aiUsageLedger": _delete_entire_collection(db, AI_USAGE_LEDGER_COLLECTION, dry_run),
        "b2cEntitlements": _delete_entire_collection(db, B2C_ENTITLEMENTS_COLLECTION, dry_run),
    }
    for name in PLATFORM_CONTENT_COLLECTIONS:
        counts[name] = _delete_entire_collection(db, name, dry_run)
    counts.update(_delete_ai_counsel_sessions(db, dry_run))
    if include_all_test_results:
        counts["testResults"] = _delete_entire_collection(db, TEST_RESULTS_COLLECTION, dry_run)
    else:
        counts["testResults"] = _delete_counselor_test_results(db, dry_run)

    legacy = 0
    try:
        legacy = _delete_entire_collection(db, LEGACY_TEST_RESULTS_COLLECTION, dry_run)
    except Exception:
        legacy = 0
    counts["test_results_legacy"] = legacy
    counts["accessCodeMetaReset"] = reset_access_code_generation_meta(db, dry_run=dry_run)
    counts["myCodeMetaReset"] = reset_my_code_generation_meta(db, dry_run=dry_run)
    counts["dryRun"] = dry_run
    counts["totalDeleted"] = sum(
        v
        for k, v in counts.items()
        if k not in ("dryRun", "totalDeleted", "accessCodeMetaReset", "myCodeMetaReset")
    )
    return counts
