"""Soft-delete · 영구삭제 · 관리자 복구/퍼지 공통 로직."""
from __future__ import annotations

from firebase_admin import firestore as fa_firestore
from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION
from utils.assessment_dispatch import _iso_timestamp


def list_archived_assessments(db, *, counselor_uid: str) -> list[dict]:
    from utils.assessment_dispatch import aggregate_assessment_list_stats

    refs = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .where("status", "==", "archived")
        .stream()
    )
    items: list[dict] = []
    for doc in refs:
        data = doc.to_dict() or {}
        items.append(
            {
                "id": doc.id,
                "accessCode": data.get("accessCode") or "",
                "title": data.get("title") or "",
                "targetAudience": data.get("targetAudience") or "",
                "cohortName": data.get("cohortName") or "",
                "usageEndDate": data.get("usageEndDate") or "",
                "createdAt": _iso_timestamp(data.get("createdAt")),
                "archivedAt": _iso_timestamp(data.get("archivedAt")),
                "testList": data.get("testList") or [],
            }
        )
    portal_stats = aggregate_assessment_list_stats(db, counselor_uid=counselor_uid, items=items)
    for x in items:
        pstats = portal_stats.get(x["id"]) or {}
        x["dispatchSentCount"] = int(pstats.get("dispatchSentCount") or 0)
        x["dispatchFailedCount"] = int(pstats.get("dispatchFailedCount") or 0)
        x["testCompleteCount"] = int(pstats.get("testCompleteCount") or 0)
        x["testIncompleteCount"] = int(pstats.get("testIncompleteCount") or 0)
    items.sort(key=lambda x: x.get("createdAt") or x.get("archivedAt") or "", reverse=True)
    return items


def restore_archived_assessments(db, *, counselor_uid: str, assessment_ids: list[str]) -> dict:
    restored = 0
    failed = 0
    details: list[dict] = []
    for assessment_id in assessment_ids:
        aid = (assessment_id or "").strip()
        if not aid:
            continue
        ref = db.collection(ASSESSMENTS_COLLECTION).document(aid)
        doc = ref.get()
        if not doc.exists:
            failed += 1
            details.append({"assessmentId": aid, "status": "failed", "message": "not_found"})
            continue
        data = doc.to_dict() or {}
        if data.get("counselorId") != counselor_uid:
            failed += 1
            details.append({"assessmentId": aid, "status": "failed", "message": "forbidden"})
            continue
        if (data.get("status") or "active") != "archived":
            failed += 1
            details.append({"assessmentId": aid, "status": "failed", "message": "not_archived"})
            continue
        ref.update(
            {
                "status": "active",
                "archivedAt": fa_firestore.DELETE_FIELD,
            }
        )
        restored += 1
        details.append({"assessmentId": aid, "status": "restored"})
    return {"restored": restored, "failed": failed, "details": details}


def permanently_delete_archived_assessments(
    db, *, counselor_uid: str, assessment_ids: list[str]
) -> dict:
    deleted = 0
    failed = 0
    details: list[dict] = []
    for assessment_id in assessment_ids:
        aid = (assessment_id or "").strip()
        if not aid:
            continue
        ref = db.collection(ASSESSMENTS_COLLECTION).document(aid)
        doc = ref.get()
        if not doc.exists:
            failed += 1
            details.append({"assessmentId": aid, "status": "failed", "message": "not_found"})
            continue
        data = doc.to_dict() or {}
        if data.get("counselorId") != counselor_uid:
            failed += 1
            details.append({"assessmentId": aid, "status": "failed", "message": "forbidden"})
            continue
        if (data.get("status") or "active") != "archived":
            failed += 1
            details.append({"assessmentId": aid, "status": "failed", "message": "not_archived"})
            continue
        ref.update(
            {
                "status": "permanently_deleted",
                "permanentlyDeletedAt": SERVER_TIMESTAMP,
            }
        )
        deleted += 1
        details.append({"assessmentId": aid, "status": "permanently_deleted"})
    return {"deleted": deleted, "failed": failed, "details": details}


def permanently_delete_archived_portals(db, *, counselor_uid: str, portal_ids: list[str]) -> dict:
    deleted = 0
    failed = 0
    details: list[dict] = []
    for portal_id in portal_ids:
        pid = (portal_id or "").strip()
        if not pid:
            continue
        ref = db.collection(CLIENT_PORTALS_COLLECTION).document(pid)
        doc = ref.get()
        if not doc.exists:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "not_found"})
            continue
        data = doc.to_dict() or {}
        if data.get("counselorId") != counselor_uid:
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "forbidden"})
            continue
        if (data.get("status") or "active") != "archived":
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "not_archived"})
            continue
        ref.update(
            {
                "status": "permanently_deleted",
                "permanentlyDeletedAt": SERVER_TIMESTAMP,
            }
        )
        deleted += 1
        details.append({"portalId": pid, "status": "permanently_deleted"})
    return {"deleted": deleted, "failed": failed, "details": details}


def _serialize_assessment_row(doc) -> dict:
    data = doc.to_dict() or {}
    return {
        "id": doc.id,
        "accessCode": data.get("accessCode") or "",
        "title": data.get("title") or "",
        "counselorId": data.get("counselorId") or "",
        "targetAudience": data.get("targetAudience") or "",
        "cohortName": data.get("cohortName") or "",
        "permanentlyDeletedAt": _iso_timestamp(data.get("permanentlyDeletedAt")),
    }


def _serialize_portal_row(doc) -> dict:
    data = doc.to_dict() or {}
    return {
        "portalId": doc.id,
        "displayName": data.get("displayName") or "",
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "myCode": data.get("accessCode") or "",
        "counselorId": data.get("counselorId") or "",
        "assessmentId": (data.get("archivedFromAssessmentId") or "").strip(),
        "permanentlyDeletedAt": _iso_timestamp(data.get("permanentlyDeletedAt")),
    }


def list_permanently_deleted_records(db) -> dict:
    assessments = [
        _serialize_assessment_row(doc)
        for doc in db.collection(ASSESSMENTS_COLLECTION)
        .where("status", "==", "permanently_deleted")
        .stream()
    ]
    portals = [
        _serialize_portal_row(doc)
        for doc in db.collection(CLIENT_PORTALS_COLLECTION)
        .where("status", "==", "permanently_deleted")
        .stream()
    ]
    assessments.sort(key=lambda x: x.get("permanentlyDeletedAt") or "", reverse=True)
    portals.sort(key=lambda x: x.get("permanentlyDeletedAt") or "", reverse=True)
    return {"assessments": assessments, "portals": portals}


def restore_permanently_deleted_records(
    db,
    *,
    assessment_ids: list[str] | None = None,
    portal_ids: list[str] | None = None,
) -> dict:
    restored_assessments = 0
    restored_portals = 0
    failed = 0
    details: list[dict] = []

    for aid in assessment_ids or []:
        assessment_id = (aid or "").strip()
        if not assessment_id:
            continue
        ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
        doc = ref.get()
        if not doc.exists:
            failed += 1
            details.append({"kind": "assessment", "id": assessment_id, "status": "failed"})
            continue
        data = doc.to_dict() or {}
        if (data.get("status") or "active") != "permanently_deleted":
            failed += 1
            details.append({"kind": "assessment", "id": assessment_id, "status": "failed"})
            continue
        ref.update(
            {
                "status": "archived",
                "permanentlyDeletedAt": fa_firestore.DELETE_FIELD,
            }
        )
        restored_assessments += 1
        details.append({"kind": "assessment", "id": assessment_id, "status": "restored"})

    for pid in portal_ids or []:
        portal_id = (pid or "").strip()
        if not portal_id:
            continue
        ref = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id)
        doc = ref.get()
        if not doc.exists:
            failed += 1
            details.append({"kind": "portal", "id": portal_id, "status": "failed"})
            continue
        data = doc.to_dict() or {}
        if (data.get("status") or "active") != "permanently_deleted":
            failed += 1
            details.append({"kind": "portal", "id": portal_id, "status": "failed"})
            continue
        ref.update(
            {
                "status": "archived",
                "permanentlyDeletedAt": fa_firestore.DELETE_FIELD,
            }
        )
        restored_portals += 1
        details.append({"kind": "portal", "id": portal_id, "status": "restored"})

    return {
        "restoredAssessments": restored_assessments,
        "restoredPortals": restored_portals,
        "failed": failed,
        "details": details,
    }


def purge_permanently_deleted_records(
    db,
    *,
    assessment_ids: list[str] | None = None,
    portal_ids: list[str] | None = None,
) -> dict:
    purged_assessments = 0
    purged_portals = 0
    failed = 0
    details: list[dict] = []

    for aid in assessment_ids or []:
        assessment_id = (aid or "").strip()
        if not assessment_id:
            continue
        ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
        doc = ref.get()
        if not doc.exists:
            failed += 1
            continue
        data = doc.to_dict() or {}
        if (data.get("status") or "active") != "permanently_deleted":
            failed += 1
            continue
        ref.delete()
        purged_assessments += 1
        details.append({"kind": "assessment", "id": assessment_id, "status": "purged"})

    for pid in portal_ids or []:
        portal_id = (pid or "").strip()
        if not portal_id:
            continue
        ref = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id)
        doc = ref.get()
        if not doc.exists:
            failed += 1
            continue
        data = doc.to_dict() or {}
        if (data.get("status") or "active") != "permanently_deleted":
            failed += 1
            continue
        ref.delete()
        purged_portals += 1
        details.append({"kind": "portal", "id": portal_id, "status": "purged"})

    return {
        "purgedAssessments": purged_assessments,
        "purgedPortals": purged_portals,
        "failed": failed,
        "details": details,
    }
