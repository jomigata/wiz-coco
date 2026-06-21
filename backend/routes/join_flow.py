# 내담자 검사 시작: 프로필 등록 · 참여 세션 · 완료 후 포털 발급
import uuid

from flask import Blueprint, jsonify, request
from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    ASSESSMENTS_COLLECTION,
    JOIN_PARTICIPANTS_COLLECTION,
)
from firebase_init import get_firestore
from rate_limit import limit_access_code
from utils.access_code import (
    is_valid_access_code,
    normalize_access_code,
)
from utils.participant_auth import get_participant_session_from_request, issue_participant_token
from utils.join_portal_issue import try_issue_portal_for_participant

bp = Blueprint("join_flow", __name__, url_prefix="/api/join")

MSG_NOT_FOUND = (
    "요청하신 검사코드가 확인되지 않습니다. 검사 코드를 다시 확인해 주시기 바랍니다."
)
MSG_EXPIRED = "검사코드 사용기한이 종료되었습니다. 상담사에게 새 코드 발급을 요청해 주세요."


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
    """검사 1건 이상 완료 시 개인 포털(코드+PIN) 생성 및 이메일/SMS 통지 큐 등록."""
    session = get_participant_session_from_request()
    if not session:
        return jsonify({"error": "Unauthorized", "message": "참여 세션이 만료되었습니다."}), 401

    participant_id = (session.get("participantId") or "").strip()
    assessment_id = (session.get("assessmentId") or "").strip()

    db = get_firestore()
    result = try_issue_portal_for_participant(db, participant_id, assessment_id)
    if not result.get("ok"):
        code = 404 if result.get("error") == "not_found" else 400
        return jsonify({"error": "Not Found", "message": result.get("message", "")}), code

    ass_doc = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id).get()
    ass_data = ass_doc.to_dict() or {} if ass_doc.exists else {}
    test_list = ass_data.get("testList") or []
    required_ids = {str(t.get("testId") or "") for t in test_list if t and t.get("testId")}
    done_ids = _completed_test_ids(db, assessment_id, participant_id)
    all_done = bool(required_ids) and required_ids.issubset(done_ids)

    return jsonify(
        {
            "allCompleted": all_done,
            "credentialsSent": bool(result.get("credentialsSent")),
            "completedCount": len(done_ids & required_ids) if required_ids else len(done_ids),
            "totalCount": len(required_ids),
            "message": result.get("message", ""),
        }
    )
