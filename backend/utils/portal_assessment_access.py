"""포털 세션 ↔ 배정·연결된 검사(assessment accessCode) 접근 검증."""
from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION
from utils.access_code import normalize_access_code


def get_portal_doc(db, portal_id: str):
    if not portal_id or portal_id.startswith("legacy:"):
        return None
    ref = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).get()
    return ref if ref.exists else None


def find_active_assessment_by_code(db, access_code: str):
    code = normalize_access_code(access_code or "")
    if not code:
        return None
    refs = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("accessCode", "==", code)
        .where("status", "==", "active")
        .limit(1)
        .get()
    )
    return refs[0] if refs else None


def portal_can_use_assessment(db, portal_id: str, access_code: str):
    """
    포털에 배정된 검사이거나, 활성 공유(issueType=shared) 검사를 연결한 경우 True.
    반환: assessment DocumentSnapshot 또는 None
    """
    ass_doc = find_active_assessment_by_code(db, access_code)
    if not ass_doc:
        return None

    portal_doc = get_portal_doc(db, portal_id)
    if not portal_doc:
        return None

    pdata = portal_doc.to_dict() or {}
    assigned = set(pdata.get("assignedAssessmentIds") or [])
    linked = set(pdata.get("linkedAssessmentIds") or [])
    if ass_doc.id in assigned or ass_doc.id in linked:
        return ass_doc

    return None


def link_shared_assessment_to_portal(db, portal_id: str, shared_access_code: str) -> tuple[bool, str, str | None]:
    """공유 검사코드를 포털에 연결. (ok, message, assessment_id)"""
    ass_doc = find_active_assessment_by_code(db, shared_access_code)
    if not ass_doc:
        return False, "공유 검사코드를 찾을 수 없습니다.", None

    ass_data = ass_doc.to_dict() or {}
    if (ass_data.get("issueType") or "shared") != "shared":
        return False, "공유 검사코드만 연결할 수 있습니다.", None

    portal_doc = get_portal_doc(db, portal_id)
    if not portal_doc:
        return False, "포털을 찾을 수 없습니다.", None

    pdata = portal_doc.to_dict() or {}
    assigned = list(pdata.get("assignedAssessmentIds") or [])
    linked = list(pdata.get("linkedAssessmentIds") or [])

    if ass_doc.id in assigned:
        return True, "이미 배정된 검사입니다.", ass_doc.id
    if ass_doc.id in linked:
        return True, "이미 연결된 공유 검사입니다.", ass_doc.id

    linked.append(ass_doc.id)
    portal_doc.reference.update({"linkedAssessmentIds": linked})
    return True, "공유 검사가 연결되었습니다.", ass_doc.id
