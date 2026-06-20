# 내담자 검사 시작: 프로필 등록 · 참여 세션 · 완료 후 포털 발급
import uuid

from flask import Blueprint, jsonify, request
from firebase_admin.firestore import SERVER_TIMESTAMP
from itsdangerous import URLSafeTimedSerializer

from config import (
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    JOIN_PARTICIPANTS_COLLECTION,
    NOTIFICATION_QUEUE_COLLECTION,
    SECRET_KEY,
)
from firebase_init import get_firestore
from rate_limit import limit_access_code
from utils.access_code import (
    generate_unique_portal_access_code,
    is_valid_access_code,
    normalize_access_code,
)
from utils.participant_auth import get_participant_session_from_request, issue_participant_token
from utils.password import generate_four_digit_password, hash_password

bp = Blueprint("join_flow", __name__, url_prefix="/api/join")

MSG_NOT_FOUND = (
    "요청하신 검사코드가 확인되지 않습니다. 검사 코드를 다시 확인해 주시기 바랍니다."
)
MSG_EXPIRED = "검사코드 사용기한이 종료되었습니다. 상담사에게 새 코드 발급을 요청해 주세요."


def _create_magic_link_token(portal_id: str, access_code: str) -> str:
    return URLSafeTimedSerializer(SECRET_KEY, salt="portal-magic").dumps(
        {"portalId": portal_id, "accessCode": access_code}
    )


def _find_active_assessment(db, code: str):
    refs = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("accessCode", "==", code)
        .where("status", "==", "active")
        .limit(1)
        .get()
    )
    return refs[0] if refs else None


def _is_assessment_expired(d: dict) -> bool:
    from datetime import datetime, timezone

    usage_end = str(d.get("usageEndDate") or "").strip()
    if not usage_end:
        return False
    try:
        end_date = datetime.strptime(usage_end, "%Y-%m-%d").date()
    except Exception:
        return False
    return datetime.now(timezone.utc).date() > end_date


def _normalize_phone(raw: str) -> str:
    return "".join(c for c in str(raw or "") if c.isdigit() or c == "+")


@bp.route("/register", methods=["POST"])
@limit_access_code
def register_participant():
    """검사코드 + 프로필 → 참여 세션 토큰 발급."""
    body = request.get_json() or {}
    code = normalize_access_code(body.get("accessCode") or "")
    display_name = (body.get("displayName") or body.get("name") or "").strip()
    birth_year = str(body.get("birthYear") or "").strip()
    gender = (body.get("gender") or "").strip()
    region = (body.get("region") or "").strip()
    email = (body.get("email") or "").strip().lower()
    phone = _normalize_phone(body.get("phone") or "")

    if not is_valid_access_code(code):
        return jsonify({"error": "Bad Request", "message": MSG_NOT_FOUND}), 400
    if not display_name:
        return jsonify({"error": "Bad Request", "message": "이름을 입력해 주세요."}), 400
    if not birth_year or not birth_year.isdigit() or len(birth_year) != 4:
        return jsonify({"error": "Bad Request", "message": "출생년도 4자리를 입력해 주세요."}), 400
    if gender not in ("male", "female", "남", "여", "남성", "여성"):
        return jsonify({"error": "Bad Request", "message": "성별을 선택해 주세요."}), 400
    if not region:
        return jsonify({"error": "Bad Request", "message": "지역을 선택해 주세요."}), 400
    if not email or "@" not in email:
        return jsonify({"error": "Bad Request", "message": "이메일을 입력해 주세요."}), 400
    if len(phone) < 10:
        return jsonify({"error": "Bad Request", "message": "휴대폰 번호를 입력해 주세요."}), 400

    gender_norm = "male" if gender in ("male", "남", "남성") else "female"

    db = get_firestore()
    ass_doc = _find_active_assessment(db, code)
    if not ass_doc:
        return jsonify({"error": "Not Found", "message": MSG_NOT_FOUND}), 404
    ass_data = ass_doc.to_dict() or {}
    if _is_assessment_expired(ass_data):
        return jsonify({"error": "Gone", "message": MSG_EXPIRED}), 410

    participant_id = str(uuid.uuid4())
    ref = db.collection(JOIN_PARTICIPANTS_COLLECTION).document(participant_id)
    ref.set(
        {
            "assessmentId": ass_doc.id,
            "sharedAccessCode": code,
            "counselorId": ass_data.get("counselorId", ""),
            "displayName": display_name,
            "birthYear": int(birth_year),
            "gender": gender_norm,
            "region": region,
            "email": email,
            "phone": phone,
            "status": "active",
            "portalId": "",
            "credentialsSentAt": None,
            "createdAt": SERVER_TIMESTAMP,
        }
    )

    token = issue_participant_token(
        participant_id=participant_id,
        assessment_id=ass_doc.id,
        access_code=code,
    )
    return jsonify(
        {
            "participantId": participant_id,
            "participantToken": token,
            "assessmentId": ass_doc.id,
            "accessCode": code,
            "displayName": display_name,
        }
    ), 201


def _completed_test_ids(db, assessment_id: str, participant_id: str) -> set[str]:
    from config import TEST_RESULTS_COLLECTION

    refs = (
        db.collection(TEST_RESULTS_COLLECTION)
        .where("assessmentId", "==", assessment_id)
        .where("participantId", "==", participant_id)
        .where("status", "==", "completed")
        .get()
    )
    return {str(d.to_dict().get("testId") or "") for d in refs if d.to_dict().get("testId")}


@bp.route("/finalize", methods=["POST"])
@limit_access_code
def finalize_participant():
    """모든 검사 완료 시 개인 포털(코드+PIN) 생성 및 이메일/SMS 통지 큐 등록."""
    session = get_participant_session_from_request()
    if not session:
        return jsonify({"error": "Unauthorized", "message": "참여 세션이 만료되었습니다."}), 401

    participant_id = (session.get("participantId") or "").strip()
    assessment_id = (session.get("assessmentId") or "").strip()
    access_code = normalize_access_code(session.get("accessCode") or "")

    db = get_firestore()
    pref = db.collection(JOIN_PARTICIPANTS_COLLECTION).document(participant_id).get()
    if not pref.exists:
        return jsonify({"error": "Not Found", "message": "참여 정보를 찾을 수 없습니다."}), 404
    pdata = pref.to_dict() or {}

    ass_doc = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id).get()
    if not ass_doc.exists:
        return jsonify({"error": "Not Found", "message": MSG_NOT_FOUND}), 404
    ass_data = ass_doc.to_dict() or {}
    test_list = ass_data.get("testList") or []
    required_ids = {str(t.get("testId") or "") for t in test_list if t and t.get("testId")}
    if not required_ids:
        return jsonify({"error": "Bad Request", "message": "등록된 검사가 없습니다."}), 400

    done_ids = _completed_test_ids(db, assessment_id, participant_id)
    if not required_ids.issubset(done_ids):
        missing = len(required_ids - done_ids)
        return jsonify(
            {
                "allCompleted": False,
                "completedCount": len(done_ids & required_ids),
                "totalCount": len(required_ids),
                "message": f"아직 {missing}개 검사가 남았습니다.",
            }
        ), 200

    if pdata.get("credentialsSentAt") or pdata.get("portalId"):
        return jsonify(
            {
                "allCompleted": True,
                "credentialsSent": True,
                "message": "내 검사실 접속 정보가 이미 발송되었습니다. 이메일·문자를 확인해 주세요.",
            }
        )

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
            "status": "active",
            "createdAt": SERVER_TIMESTAMP,
        }
    )

    magic = _create_magic_link_token(portal_ref.id, portal_access_code)
    magic_path = f"/go?t={magic}"

    pref.reference.update({"portalId": portal_ref.id, "credentialsSentAt": SERVER_TIMESTAMP})

    db.collection(NOTIFICATION_QUEUE_COLLECTION).add(
        {
            "type": "portal_credentials",
            "email": pdata.get("email", ""),
            "phone": pdata.get("phone", ""),
            "accessCode": portal_access_code,
            "pin": pin,
            "magicPath": magic_path,
            "displayName": pdata.get("displayName", ""),
            "status": "pending",
            "createdAt": SERVER_TIMESTAMP,
        }
    )

    return jsonify(
        {
            "allCompleted": True,
            "credentialsSent": True,
            "message": "모든 검사가 완료되었습니다. 내 검사실 접속 정보를 이메일·문자로 보내드렸습니다.",
        }
    )
