"""공동 검사코드 참여자 — 검사 1건 이상 완료 시 개인 포털(코드+PIN) 발급."""
from firebase_admin.firestore import SERVER_TIMESTAMP
from itsdangerous import URLSafeTimedSerializer

from config import (
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    JOIN_PARTICIPANTS_COLLECTION,
    SECRET_KEY,
    TEST_RESULTS_COLLECTION,
)
from utils.access_code import generate_unique_portal_access_code
from utils.password import generate_four_digit_password, hash_password
from utils.notification_worker import deliver_portal_credentials


def _completed_test_ids(db, assessment_id: str, participant_id: str) -> set[str]:
    refs = (
        db.collection(TEST_RESULTS_COLLECTION)
        .where("assessmentId", "==", assessment_id)
        .where("participantId", "==", participant_id)
        .where("status", "==", "completed")
        .get()
    )
    return {str(d.to_dict().get("testId") or "") for d in refs if d.to_dict().get("testId")}


def _create_magic_link_token(portal_id: str, access_code: str) -> str:
    return URLSafeTimedSerializer(SECRET_KEY, salt="portal-magic").dumps(
        {"portalId": portal_id, "accessCode": access_code}
    )


def try_issue_portal_for_participant(db, participant_id: str, assessment_id: str) -> dict:
    """
    공동 검사코드 참여자에게 검사 1건 이상 완료 시 내 검사실 자격 증명 발급.
    이미 발급된 경우 credentialsSent=True 로 반환.
    """
    pref = db.collection(JOIN_PARTICIPANTS_COLLECTION).document(participant_id).get()
    if not pref.exists:
        return {"ok": False, "error": "not_found", "message": "참여 정보를 찾을 수 없습니다."}

    pdata = pref.to_dict() or {}
    if pdata.get("credentialsSentAt") or pdata.get("portalId"):
        return {
            "ok": True,
            "credentialsSent": True,
            "alreadySent": True,
            "message": "내 검사실 접속 정보가 이미 발송되었습니다. 이메일·문자를 확인해 주세요.",
        }

    ass_doc = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id).get()
    if not ass_doc.exists:
        return {"ok": False, "error": "assessment_not_found", "message": "검사코드를 찾을 수 없습니다."}

    ass_data = ass_doc.to_dict() or {}
    issue_type = (ass_data.get("issueType") or "shared").strip()
    if issue_type != "shared":
        return {
            "ok": True,
            "credentialsSent": False,
            "skipped": True,
            "message": "개별 발급 검사코드는 발급 시 접속 정보가 전달됩니다.",
        }

    done_ids = _completed_test_ids(db, assessment_id, participant_id)
    if not done_ids:
        return {
            "ok": True,
            "credentialsSent": False,
            "completedCount": 0,
            "message": "검사를 1건 이상 완료하면 내 검사실 접속 정보가 발송됩니다.",
        }

    portal_access_code = generate_unique_portal_access_code()
    pin = generate_four_digit_password()
    pin_hash = hash_password(pin)

    portal_ref = db.collection(CLIENT_PORTALS_COLLECTION).document()
    portal_ref.set(
        {
            "accessCode": portal_access_code,
            "pinHash": pin_hash,
            "counselorId": ass_data.get("counselorId", ""),
            "displayName": pdata.get("displayName", ""),
            "email": pdata.get("email", ""),
            "phone": pdata.get("phone", ""),
            "birthYear": pdata.get("birthYear"),
            "gender": pdata.get("gender", ""),
            "region": pdata.get("region", ""),
            "assignedAssessmentIds": [assessment_id],
            "joinParticipantId": participant_id,
            "sharedAccessCode": pdata.get("sharedAccessCode", ass_data.get("accessCode", "")),
            "status": "active",
            "createdAt": SERVER_TIMESTAMP,
        }
    )

    magic = _create_magic_link_token(portal_ref.id, portal_access_code)
    magic_path = f"/go?t={magic}"

    pref.reference.update({"portalId": portal_ref.id, "credentialsSentAt": SERVER_TIMESTAMP})

    deliver_portal_credentials(
        email=pdata.get("email", ""),
        phone=pdata.get("phone", ""),
        access_code=portal_access_code,
        pin=pin,
        magic_path=magic_path,
        display_name=pdata.get("displayName", ""),
        join_access_code=pdata.get("sharedAccessCode", ass_data.get("accessCode", "")),
    )

    return {
        "ok": True,
        "credentialsSent": True,
        "completedCount": len(done_ids),
        "message": "검사가 완료되었습니다. 내 검사실 접속 정보를 이메일·문자로 보내드렸습니다.",
    }
