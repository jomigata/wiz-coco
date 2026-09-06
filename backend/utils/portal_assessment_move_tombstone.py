"""나의코드 이동 후 원 상담코드 현황에 표시할 tombstone."""
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    ASSESSMENT_MOVE_TOMBSTONES_COLLECTION,
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
)


def _load_assessment_meta(db, assessment_id: str) -> dict:
    doc = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id).get()
    if not doc.exists:
        return {"assessmentId": assessment_id, "title": "", "accessCode": ""}
    data = doc.to_dict() or {}
    return {
        "assessmentId": assessment_id,
        "title": (data.get("title") or "").strip(),
        "accessCode": (data.get("accessCode") or "").strip(),
        "cohortName": (data.get("cohortName") or "").strip(),
    }


def create_move_tombstone(
    db,
    *,
    counselor_uid: str,
    portal_id: str,
    from_assessment_id: str,
    to_assessment_id: str,
    display_name: str,
    source_my_code: str,
    target_my_code: str,
    target_join_access_code: str,
    tests: list[dict],
) -> str:
    """이동 완료 tombstone — source 현황 목록에 '이동완료' 표시용."""
    tombstone_id = f"{from_assessment_id}_{portal_id}_{to_assessment_id}"
    to_meta = _load_assessment_meta(db, to_assessment_id)
    ref = db.collection(ASSESSMENT_MOVE_TOMBSTONES_COLLECTION).document(tombstone_id)
    ref.set(
        {
            "counselorId": counselor_uid,
            "portalId": portal_id,
            "fromAssessmentId": from_assessment_id,
            "toAssessmentId": to_assessment_id,
            "displayName": (display_name or "").strip(),
            "sourceMyCode": (source_my_code or "").strip(),
            "targetMyCode": (target_my_code or "").strip(),
            "targetJoinAccessCode": (target_join_access_code or to_meta.get("accessCode") or "").strip(),
            "targetAssessmentTitle": to_meta.get("title") or "",
            "tests": tests or [],
            "status": "active",
            "movedAt": SERVER_TIMESTAMP,
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )
    return tombstone_id


def list_move_tombstones_for_assessment(
    db,
    *,
    assessment_id: str,
    counselor_uid: str | None,
) -> list[dict]:
    refs = (
        db.collection(ASSESSMENT_MOVE_TOMBSTONES_COLLECTION)
        .where("fromAssessmentId", "==", assessment_id)
        .where("status", "==", "active")
        .stream()
    )
    out: list[dict] = []
    for doc in refs:
        data = doc.to_dict() or {}
        if counselor_uid and (data.get("counselorId") or "") != counselor_uid:
            continue
        moved_at = data.get("movedAt")
        moved_iso = ""
        if moved_at and hasattr(moved_at, "isoformat"):
            try:
                moved_iso = moved_at.isoformat()
            except Exception:
                moved_iso = str(moved_at)
        out.append(
            {
                "tombstoneId": doc.id,
                "portalId": data.get("portalId") or "",
                "displayName": data.get("displayName") or "",
                "sourceMyCode": data.get("sourceMyCode") or "",
                "targetMyCode": data.get("targetMyCode") or "",
                "targetJoinAccessCode": data.get("targetJoinAccessCode") or "",
                "targetAssessmentId": data.get("toAssessmentId") or "",
                "targetAssessmentTitle": data.get("targetAssessmentTitle") or "",
                "tests": data.get("tests") or [],
                "movedAt": moved_iso,
            }
        )
    out.sort(key=lambda r: (r.get("displayName") or "", r.get("tombstoneId") or ""))
    return out


def get_move_tombstone(db, tombstone_id: str, counselor_uid: str) -> dict | None:
    doc = db.collection(ASSESSMENT_MOVE_TOMBSTONES_COLLECTION).document(tombstone_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    if (data.get("counselorId") or "") != counselor_uid:
        return None
    if (data.get("status") or "") != "active":
        return None
    return {"id": doc.id, **data}


def deactivate_move_tombstone(db, tombstone_id: str) -> None:
    ref = db.collection(ASSESSMENT_MOVE_TOMBSTONES_COLLECTION).document(tombstone_id)
    ref.update({"status": "restored", "updatedAt": SERVER_TIMESTAMP})


def tombstones_to_dispatch_recipients(tombstones: list[dict]) -> list[dict]:
    """get_assessment_dispatch_status 응답에 병합할 가상 recipient."""
    rows: list[dict] = []
    for t in tombstones:
        tests = t.get("tests") or []
        completed = sum(1 for x in tests if (x.get("status") or "") == "completed")
        required = len(tests)
        rows.append(
            {
                "portalId": t.get("portalId") or "",
                "displayName": t.get("displayName") or "",
                "email": "",
                "phone": "",
                "myCode": t.get("sourceMyCode") or "",
                "joinAccessCode": "",
                "notifyStatus": "not_sent",
                "notifyError": None,
                "notifyAt": None,
                "notifySentVia": "",
                "notifyKind": "",
                "notifyEmailChannel": "",
                "notifyPhoneChannel": "",
                "tests": tests,
                "testStatus": "completed" if required and completed >= required else "in_progress",
                "completedCount": completed,
                "requiredCount": required,
                "moveStatus": "moved_out",
                "tombstoneId": t.get("tombstoneId") or "",
                "movedToAssessmentId": t.get("targetAssessmentId") or "",
                "movedToMyCode": t.get("targetMyCode") or "",
                "movedToJoinAccessCode": t.get("targetJoinAccessCode") or "",
                "movedToAssessmentTitle": t.get("targetAssessmentTitle") or "",
                "movedAt": t.get("movedAt") or "",
            }
        )
    return rows


def restore_portal_from_move(
    db,
    *,
    counselor_uid: str,
    tombstone_id: str,
) -> dict:
    """이동 tombstone 1건 — target → source 로 되돌림."""
    from utils.portal_assessment_move import move_portals_to_assessment

    tomb = get_move_tombstone(db, tombstone_id, counselor_uid)
    if not tomb:
        raise ValueError("이동 기록을 찾을 수 없습니다.")

    portal_id = (tomb.get("portalId") or "").strip()
    from_aid = (tomb.get("fromAssessmentId") or "").strip()
    to_aid = (tomb.get("toAssessmentId") or "").strip()
    if not portal_id or not from_aid or not to_aid:
        raise ValueError("복구할 이동 정보가 올바르지 않습니다.")

    pref = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).get()
    if not pref.exists:
        raise ValueError("내담자를 찾을 수 없습니다.")
    pdata = pref.to_dict() or {}
    if pdata.get("counselorId") != counselor_uid:
        raise PermissionError("접근 권한이 없습니다.")

    assigned = [str(x).strip() for x in (pdata.get("assignedAssessmentIds") or []) if str(x).strip()]
    if to_aid not in assigned:
        raise ValueError("이동된 상담코드에 내담자가 없어 복구할 수 없습니다.")

    result = move_portals_to_assessment(
        db,
        counselor_uid=counselor_uid,
        portal_ids=[portal_id],
        target_assessment_id=from_aid,
        source_assessment_id=to_aid,
        skip_tombstone=True,
    )
    if result.get("moved", 0) < 1:
        detail = (result.get("details") or [{}])[0]
        msg = detail.get("message") or "복구에 실패했습니다."
        raise ValueError(str(msg))

    deactivate_move_tombstone(db, tombstone_id)
    return {
        "restored": 1,
        "portalId": portal_id,
        "fromAssessmentId": to_aid,
        "toAssessmentId": from_aid,
        "tombstoneId": tombstone_id,
    }
