"""Soft-delete · 영구삭제 · 관리자 복구/퍼지 공통 로직."""
from __future__ import annotations

from firebase_admin import firestore as fa_firestore
from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION
from utils.assessment_dispatch import _iso_timestamp


def _matches_counselor_scope(resource_counselor_id: str | None, scoped_uid: str | None) -> bool:
    if scoped_uid is None:
        return True
    return (resource_counselor_id or "").strip() == scoped_uid.strip()


def _permanently_delete_assessment_linked_portals(
    db, *, assessment_id: str, owner_counselor_id: str | None
) -> int:
    """상담코드 영구삭제 시 assessment_deleted 로 archived 된 연결 내담자도 영구삭제."""
    aid = (assessment_id or "").strip()
    if not aid:
        return 0
    owner = (owner_counselor_id or "").strip()
    if owner:
        refs = (
            db.collection(CLIENT_PORTALS_COLLECTION)
            .where("counselorId", "==", owner)
            .where("status", "==", "archived")
            .stream()
        )
    else:
        refs = (
            db.collection(CLIENT_PORTALS_COLLECTION)
            .where("status", "==", "archived")
            .stream()
        )
    deleted = 0
    for doc in refs:
        pdata = doc.to_dict() or {}
        if (pdata.get("archivedReason") or "") != "assessment_deleted":
            continue
        from_aid = (pdata.get("archivedFromAssessmentId") or "").strip()
        if from_aid != aid:
            continue
        doc.reference.update(
            {
                "status": "permanently_deleted",
                "permanentlyDeletedAt": SERVER_TIMESTAMP,
            }
        )
        deleted += 1
    return deleted


def list_archived_assessments(db, *, counselor_uid: str | None) -> list[dict]:
    from utils.assessment_dispatch import aggregate_archived_assessment_list_stats

    refs = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("status", "==", "archived")
        .stream()
    )
    items: list[dict] = []
    for doc in refs:
        data = doc.to_dict() or {}
        if not _matches_counselor_scope(data.get("counselorId"), counselor_uid):
            continue
        items.append(
            {
                "id": doc.id,
                "accessCode": data.get("accessCode") or "",
                "codeCategory": data.get("codeCategory") or "",
                "title": data.get("title") or "",
                "targetAudience": data.get("targetAudience") or "",
                "cohortName": data.get("cohortName") or "",
                "usageEndDate": data.get("usageEndDate") or "",
                "counselorId": data.get("counselorId") or "",
                "createdAt": _iso_timestamp(data.get("createdAt")),
                "archivedAt": _iso_timestamp(data.get("archivedAt")),
                "testList": data.get("testList") or [],
            }
        )
    portal_stats = aggregate_archived_assessment_list_stats(
        db, counselor_uid=counselor_uid, items=items
    )
    for x in items:
        pstats = portal_stats.get(x["id"]) or {}
        x["dispatchSentCount"] = int(pstats.get("dispatchSentCount") or 0)
        x["dispatchFailedCount"] = int(pstats.get("dispatchFailedCount") or 0)
        x["testCompleteCount"] = int(pstats.get("testCompleteCount") or 0)
        x["testIncompleteCount"] = int(pstats.get("testIncompleteCount") or 0)
    items.sort(key=lambda x: x.get("createdAt") or x.get("archivedAt") or "", reverse=True)
    return items


def archive_portals_for_assessment(db, *, counselor_uid: str, assessment_id: str) -> int:
    """상담코드 삭제 시 해당 코드에 배정된 active 내담자 포털을 함께 archived."""
    aid = (assessment_id or "").strip()
    if not aid:
        return 0
    archived_count = 0
    refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .stream()
    )
    for doc in refs:
        pdata = doc.to_dict() or {}
        if (pdata.get("status") or "active") != "active":
            continue
        assigned = list(pdata.get("assignedAssessmentIds") or [])
        if aid not in assigned:
            continue
        doc.reference.update(
            {
                "status": "archived",
                "archivedAt": SERVER_TIMESTAMP,
                "archivedFromAssessmentId": aid,
                "archivedReason": "assessment_deleted",
            }
        )
        archived_count += 1
    try:
        from utils.assessment_list_stats import touch_assessment_list_stats

        touch_assessment_list_stats(db, aid)
    except Exception:
        pass
    return archived_count


def restore_portals_for_assessment(db, *, counselor_uid: str, assessment_id: str) -> int:
    """상담코드 복구 시 assessment_deleted 로 archived 된 내담자만 복구 (수동 삭제 제외)."""
    aid = (assessment_id or "").strip()
    if not aid:
        return 0
    restored_count = 0
    refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("counselorId", "==", counselor_uid)
        .where("status", "==", "archived")
        .stream()
    )
    for doc in refs:
        pdata = doc.to_dict() or {}
        if (pdata.get("archivedReason") or "") != "assessment_deleted":
            continue
        from_aid = (pdata.get("archivedFromAssessmentId") or "").strip()
        if from_aid != aid:
            continue
        doc.reference.update(
            {
                "status": "active",
                "archivedAt": fa_firestore.DELETE_FIELD,
                "archivedFromAssessmentId": fa_firestore.DELETE_FIELD,
                "archivedReason": fa_firestore.DELETE_FIELD,
            }
        )
        restored_count += 1
    if restored_count:
        try:
            from utils.assessment_list_stats import touch_assessment_list_stats

            touch_assessment_list_stats(db, aid)
        except Exception:
            pass
    return restored_count


def restore_archived_assessments(db, *, counselor_uid: str | None, assessment_ids: list[str]) -> dict:
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
        if not _matches_counselor_scope(data.get("counselorId"), counselor_uid):
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
        owner_uid = (data.get("counselorId") or counselor_uid or "").strip()
        if owner_uid:
            restore_portals_for_assessment(db, counselor_uid=owner_uid, assessment_id=aid)
        try:
            from utils.assessment_list_stats import touch_assessment_list_stats

            touch_assessment_list_stats(db, aid)
        except Exception:
            pass
        restored += 1
        details.append({"assessmentId": aid, "status": "restored"})
    return {"restored": restored, "failed": failed, "details": details}


def permanently_delete_archived_assessments(
    db, *, counselor_uid: str | None, assessment_ids: list[str]
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
        if not _matches_counselor_scope(data.get("counselorId"), counselor_uid):
            failed += 1
            details.append({"assessmentId": aid, "status": "failed", "message": "forbidden"})
            continue
        if (data.get("status") or "active") != "archived":
            failed += 1
            details.append({"assessmentId": aid, "status": "failed", "message": "not_archived"})
            continue
        owner_uid = (data.get("counselorId") or "").strip()
        ref.update(
            {
                "status": "permanently_deleted",
                "permanentlyDeletedAt": SERVER_TIMESTAMP,
            }
        )
        cascaded = _permanently_delete_assessment_linked_portals(
            db,
            assessment_id=aid,
            owner_counselor_id=owner_uid or None,
        )
        deleted += 1
        details.append(
            {
                "assessmentId": aid,
                "status": "permanently_deleted",
                "cascadedPortals": cascaded,
            }
        )
    return {"deleted": deleted, "failed": failed, "details": details}


def reconcile_assessment_deleted_portals(db, *, counselor_uid: str) -> int:
    """삭제된 상담코드에 연결된 내담자가 잘못 복구·영구삭제된 경우 archived 상태로 되돌림."""
    uid = (counselor_uid or "").strip()
    if not uid:
        return 0

    archived_aids: set[str] = set()
    for doc in (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("counselorId", "==", uid)
        .where("status", "==", "archived")
        .stream()
    ):
        archived_aids.add(doc.id)

    if not archived_aids:
        return 0

    reconciled = 0
    refs = db.collection(CLIENT_PORTALS_COLLECTION).where("counselorId", "==", uid).stream()
    for doc in refs:
        pdata = doc.to_dict() or {}
        status = (pdata.get("status") or "active").strip()
        reason = (pdata.get("archivedReason") or "").strip()
        from_aid = (pdata.get("archivedFromAssessmentId") or "").strip()
        assigned = [str(x).strip() for x in (pdata.get("assignedAssessmentIds") or []) if str(x).strip()]

        linked_aid = from_aid if from_aid in archived_aids else next((aid for aid in assigned if aid in archived_aids), "")
        if not linked_aid:
            continue

        if status == "archived":
            if reason == "manual":
                continue
            if reason == "assessment_deleted" and from_aid == linked_aid:
                continue

        if status not in ("active", "permanently_deleted"):
            continue

        update_fields: dict = {
            "status": "archived",
            "archivedFromAssessmentId": linked_aid,
            "archivedReason": "assessment_deleted",
            "permanentlyDeletedAt": fa_firestore.DELETE_FIELD,
        }
        if status == "active" or not pdata.get("archivedAt"):
            update_fields["archivedAt"] = SERVER_TIMESTAMP
        doc.reference.update(update_fields)
        reconciled += 1
    return reconciled


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
        if not _matches_counselor_scope(data.get("counselorId"), counselor_uid):
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "forbidden"})
            continue
        if (data.get("status") or "active") != "archived":
            failed += 1
            details.append({"portalId": pid, "status": "failed", "message": "not_archived"})
            continue
        if (data.get("archivedReason") or "") == "assessment_deleted":
            failed += 1
            details.append(
                {
                    "portalId": pid,
                    "status": "failed",
                    "message": "assessment_deleted_linked",
                }
            )
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


def _portal_linked_assessment_id(data: dict) -> str:
    from_aid = (data.get("archivedFromAssessmentId") or "").strip()
    if from_aid:
        return from_aid
    assigned = [str(x).strip() for x in (data.get("assignedAssessmentIds") or []) if str(x).strip()]
    return assigned[0] if assigned else ""


def _serialize_portal_row(doc) -> dict:
    data = doc.to_dict() or {}
    return {
        "portalId": doc.id,
        "displayName": data.get("displayName") or "",
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "myCode": data.get("accessCode") or "",
        "counselorId": data.get("counselorId") or "",
        "assessmentId": _portal_linked_assessment_id(data),
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
    from utils.counselor_emails import attach_counselor_emails

    attach_counselor_emails(db, assessments)
    attach_counselor_emails(db, portals)
    return {"assessments": assessments, "portals": portals}


def restore_permanently_deleted_portals_for_assessment(db, *, assessment_id: str) -> int:
    """영구삭제 상담코드 복구 시 연결된 영구삭제 내담자도 삭제된 내담자(archived)로 복구."""
    aid = (assessment_id or "").strip()
    if not aid:
        return 0
    restored_count = 0
    refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("status", "==", "permanently_deleted")
        .stream()
    )
    for doc in refs:
        pdata = doc.to_dict() or {}
        from_aid = (pdata.get("archivedFromAssessmentId") or "").strip()
        assigned = [str(x).strip() for x in (pdata.get("assignedAssessmentIds") or []) if str(x).strip()]
        if from_aid != aid and aid not in assigned:
            continue
        doc.reference.update(
            {
                "status": "archived",
                "permanentlyDeletedAt": fa_firestore.DELETE_FIELD,
            }
        )
        restored_count += 1
    return restored_count


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
        linked = restore_permanently_deleted_portals_for_assessment(db, assessment_id=assessment_id)
        if linked:
            restored_portals += linked
            details.append(
                {
                    "kind": "portal_batch",
                    "assessmentId": assessment_id,
                    "status": "restored",
                    "count": linked,
                }
            )

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
