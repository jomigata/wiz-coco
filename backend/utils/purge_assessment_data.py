"""검사코드(assessments) 및 관련 내담자 검사 데이터 일괄 삭제."""
from __future__ import annotations

from config import (
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    JOIN_PARTICIPANTS_COLLECTION,
    NOTIFICATION_QUEUE_COLLECTION,
    TEST_RESULTS_COLLECTION,
)

BATCH_SIZE = 400
LEGACY_TEST_RESULTS_COLLECTION = "test_results"


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
            # 남은 문서가 모두 비대상이면 전체 스캔 종료
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


def purge_assessment_platform_data(db, *, dry_run: bool = False, include_all_test_results: bool = False) -> dict:
    """
    assessments, clientPortals, notificationQueue 전체 삭제.
    testResults: include_all_test_results=True 이면 컬렉션 전체, 아니면 검사코드 연동 문서만.
    """
    counts = {
        "assessments": _delete_entire_collection(db, ASSESSMENTS_COLLECTION, dry_run),
        "clientPortals": _delete_entire_collection(db, CLIENT_PORTALS_COLLECTION, dry_run),
        "joinParticipants": _delete_entire_collection(db, JOIN_PARTICIPANTS_COLLECTION, dry_run),
        "notificationQueue": _delete_entire_collection(db, NOTIFICATION_QUEUE_COLLECTION, dry_run),
    }
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
    counts["dryRun"] = dry_run
    counts["totalDeleted"] = sum(v for k, v in counts.items() if k not in ("dryRun", "totalDeleted"))
    return counts
