# 결과 제출/조회/수정/삭제 (POST, GET, PUT, DELETE)
from flask import Blueprint, request, jsonify
from firebase_admin.firestore import SERVER_TIMESTAMP
from datetime import datetime, timezone

from firebase_init import get_firestore
from auth_middleware import get_bearer_uid, get_bearer_email_optional
from rate_limit import limit_access_code, limit_password_api
from config import ASSESSMENTS_COLLECTION, TEST_RESULTS_COLLECTION
from utils.password import verify_password
from utils.scoring import compute_result_data
from utils.access_code import normalize_access_code, is_valid_access_code

bp = Blueprint("results", __name__, url_prefix="/api/results")
MSG_ACCESS_CODE_EXPIRED = "검사코드 사용기한이 종료되었습니다. 상담사에게 새 코드 발급을 요청해 주세요."


def _is_assessment_expired(d: dict) -> bool:
    usage_end = str(d.get("usageEndDate") or "").strip()
    if not usage_end:
        return False
    try:
        end_date = datetime.strptime(usage_end, "%Y-%m-%d").date()
    except Exception:
        return False
    today_utc = datetime.now(timezone.utc).date()
    return today_utc > end_date


def _get_assessment_or_404(db, assessment_id, counselor_uid=None):
    ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    doc = ref.get()
    if not doc.exists:
        return None, 404
    d = doc.to_dict()
    if counselor_uid is not None and d.get("counselorId") != counselor_uid:
        return None, 404
    return doc, None


def _token_owns_result(token_uid: str | None, token_email: str | None, d: dict) -> bool:
    """
    신규: clientUid 기준 소유권 확인.
    레거시: clientUid 없는 문서에 한해 clientEmail로 소유권 확인(이메일 클레임이 있을 때만).
    """
    if token_uid and token_uid == (d.get("clientUid") or "").strip():
        return True
    if not d.get("clientUid") and token_email:
        return token_email == (d.get("clientEmail") or "").strip().lower()
    return False


def _legacy_password_valid(d: dict, password: str) -> bool:
    """구 데이터(passwordHash 있음)만 4자리 비밀번호로 허용."""
    ph = d.get("passwordHash")
    if not ph:
        return False
    return bool(password) and verify_password(password, ph)


@bp.route("", methods=["POST"])
@limit_access_code
def submit_result():
    """
    내담자: Authorization(Firebase ID 토큰) 필수, accessCode, testId, responses.
    소유권은 clientUid(토큰 uid) 기준으로 저장. email은 선택(있는 경우만 저장).
    비밀번호 필드는 저장하지 않음(로그인으로만 수정·삭제).
    """
    body = request.get_json() or {}
    access_code = normalize_access_code(body.get("accessCode") or "")
    test_id = (body.get("testId") or "").strip()
    client_uid = get_bearer_uid()
    client_email = get_bearer_email_optional()
    responses = body.get("responses")
    if not client_uid:
        return jsonify(
            {
                "error": "Unauthorized",
                "message": "Valid Firebase ID token required to submit results.",
            }
        ), 401
    if not is_valid_access_code(access_code):
        return jsonify({"error": "Bad Request", "message": "invalid accessCode format"}), 400
    if not test_id:
        return jsonify({"error": "Bad Request", "message": "testId required"}), 400
    if responses is None:
        return jsonify({"error": "Bad Request", "message": "responses required"}), 400

    db = get_firestore()
    ass_refs = db.collection(ASSESSMENTS_COLLECTION).where("accessCode", "==", access_code).where("status", "==", "active").limit(1).get()
    if not ass_refs:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404
    ass_doc = ass_refs[0]
    ass_data = ass_doc.to_dict() or {}
    if _is_assessment_expired(ass_data):
        return jsonify({"error": "Gone", "message": MSG_ACCESS_CODE_EXPIRED}), 410
    assessment_id = ass_doc.id

    result_data = compute_result_data(test_id, responses if isinstance(responses, (dict, list)) else {})

    data = {
        "accessCode": access_code,
        "assessmentId": assessment_id,
        "testId": test_id,
        "clientUid": client_uid,
        **({"clientEmail": client_email} if client_email else {}),
        "status": "completed",
        "responses": responses,
        "resultData": result_data,
        "completedAt": SERVER_TIMESTAMP,
    }
    ref = db.collection(TEST_RESULTS_COLLECTION).document()
    ref.set(data)

    return jsonify(
        {
            "resultId": ref.id,
            "message": "Result submitted.",
        }
    ), 201


@bp.route("", methods=["GET"])
@limit_access_code
def list_results():
    """accessCode + 로그인 사용자(토큰 uid)로 해당 testResults 목록 반환."""
    access_code = normalize_access_code(request.args.get("accessCode") or "")
    client_uid = get_bearer_uid()
    token_email = get_bearer_email_optional()
    if not client_uid:
        return jsonify(
            {"error": "Unauthorized", "message": "Valid Firebase ID token required."}
        ), 401
    if not is_valid_access_code(access_code):
        return jsonify({"error": "Bad Request", "message": "accessCode required"}), 400

    db = get_firestore()
    refs = db.collection(TEST_RESULTS_COLLECTION).where("accessCode", "==", access_code).where("clientUid", "==", client_uid).get()
    # 레거시(예전 제출분): clientUid가 없고 clientEmail만 있는 경우를 위해 email 클레임이 있으면 추가 조회 후 병합
    legacy_refs = []
    if token_email:
        legacy_refs = db.collection(TEST_RESULTS_COLLECTION).where("accessCode", "==", access_code).where("clientEmail", "==", token_email).get()
    items = []
    seen = set()
    for doc in (refs or []):
        seen.add(doc.id)
        d = doc.to_dict()
        items.append({
            "resultId": doc.id,
            "testId": d.get("testId"),
            "status": d.get("status"),
            "completedAt": d.get("completedAt").isoformat() if d.get("completedAt") and hasattr(d["completedAt"], "isoformat") else None,
        })
    for doc in (legacy_refs or []):
        if doc.id in seen:
            continue
        d = doc.to_dict()
        items.append({
            "resultId": doc.id,
            "testId": d.get("testId"),
            "status": d.get("status"),
            "completedAt": d.get("completedAt").isoformat() if d.get("completedAt") and hasattr(d["completedAt"], "isoformat") else None,
        })
    return jsonify({"results": items})


@bp.route("/mine", methods=["GET"])
@limit_access_code
def list_my_results():
    """로그인 사용자(토큰 uid)의 검사코드 세트 제출 결과 전부 (accessCode 무관)."""
    client_uid = get_bearer_uid()
    token_email = get_bearer_email_optional()
    if not client_uid:
        return jsonify(
            {"error": "Unauthorized", "message": "Valid Firebase ID token required."}
        ), 401

    db = get_firestore()
    refs = list(db.collection(TEST_RESULTS_COLLECTION).where("clientUid", "==", client_uid).limit(200).stream())
    legacy_refs = []
    if token_email:
        legacy_refs = list(db.collection(TEST_RESULTS_COLLECTION).where("clientEmail", "==", token_email).limit(200).stream())
    assessment_cache: dict = {}

    def _assessment_title(aid) -> str | None:
        if not aid:
            return None
        if aid in assessment_cache:
            return assessment_cache[aid]
        ad = db.collection(ASSESSMENTS_COLLECTION).document(str(aid)).get()
        t = (ad.to_dict() or {}).get("title") if ad.exists else None
        assessment_cache[aid] = t
        return t

    items = []
    seen = set()
    for doc in refs:
        seen.add(doc.id)
        d = doc.to_dict() or {}
        aid = d.get("assessmentId")
        ca = d.get("completedAt")
        completed_iso = None
        if ca is not None and hasattr(ca, "isoformat"):
            completed_iso = ca.isoformat()
        items.append({
            "resultId": doc.id,
            "accessCode": d.get("accessCode"),
            "assessmentId": aid,
            "assessmentTitle": _assessment_title(aid),
            "testId": d.get("testId"),
            "status": d.get("status"),
            "completedAt": completed_iso,
        })
    for doc in legacy_refs:
        if doc.id in seen:
            continue
        d = doc.to_dict() or {}
        aid = d.get("assessmentId")
        ca = d.get("completedAt")
        completed_iso = None
        if ca is not None and hasattr(ca, "isoformat"):
            completed_iso = ca.isoformat()
        items.append({
            "resultId": doc.id,
            "accessCode": d.get("accessCode"),
            "assessmentId": aid,
            "assessmentTitle": _assessment_title(aid),
            "testId": d.get("testId"),
            "status": d.get("status"),
            "completedAt": completed_iso,
        })

    def _sort_key(row):
        t = row.get("completedAt") or ""
        return t

    items.sort(key=_sort_key, reverse=True)
    return jsonify({"results": items})


@bp.route("/<result_id>", methods=["GET"])
@limit_password_api
def get_result(result_id):
    """
    Bearer uid가 결과 소유자면 전체 조회.
    그 외: 구 데이터만 ?password= 로 조회(레거시).
    """
    password = (request.args.get("password") or "").strip()
    token_uid = get_bearer_uid()
    token_email = get_bearer_email_optional()

    db = get_firestore()
    ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = doc.to_dict()

    if _token_owns_result(token_uid, token_email, d):
        return jsonify({
            "resultId": doc.id,
            "testId": d.get("testId"),
            "responses": d.get("responses"),
            "clientUid": d.get("clientUid"),
            "clientEmail": d.get("clientEmail"),
            "resultData": d.get("resultData"),
            "accessCode": d.get("accessCode"),
            "assessmentId": d.get("assessmentId"),
        })

    if _legacy_password_valid(d, password):
        return jsonify({
            "resultId": doc.id,
            "testId": d.get("testId"),
            "responses": d.get("responses"),
            "clientEmail": d.get("clientEmail"),
        })

    if not password:
        return jsonify({"error": "Bad Request", "message": "password required"}), 400
    return jsonify({"error": "Forbidden", "message": "Invalid password"}), 403


@bp.route("/<result_id>", methods=["PUT"])
@limit_password_api
def update_result(result_id):
    """
    소유자(Bearer uid 일치): password 없이 responses만으로 수정.
    레거시(passwordHash 있음): password + responses.
    """
    body = request.get_json() or {}
    password = (body.get("password") or "").strip()
    responses = body.get("responses")
    token_uid = get_bearer_uid()
    token_email = get_bearer_email_optional()

    if responses is None:
        return jsonify({"error": "Bad Request", "message": "responses required"}), 400

    db = get_firestore()
    ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = doc.to_dict()

    if _token_owns_result(token_uid, token_email, d):
        pass
    elif _legacy_password_valid(d, password):
        pass
    else:
        if not _token_owns_result(token_uid, token_email, d) and d.get("passwordHash") and not password:
            return jsonify({"error": "Bad Request", "message": "password required"}), 400
        return jsonify({"error": "Forbidden", "message": "Invalid password or not owner"}), 403

    result_data = compute_result_data(d.get("testId", ""), responses if isinstance(responses, (dict, list)) else {})
    ref.update({
        "responses": responses,
        "resultData": result_data,
        "status": "completed",
        "completedAt": SERVER_TIMESTAMP,
    })
    return jsonify({"resultId": result_id, "message": "Updated"})


@bp.route("/<result_id>", methods=["DELETE"])
@limit_password_api
def delete_result(result_id):
    """소유자(Bearer) 또는 레거시 password로 삭제."""
    body = request.get_json() or {} if request.is_json else {}
    password = (body.get("password") or "").strip()
    token_uid = get_bearer_uid()
    token_email = get_bearer_email_optional()

    db = get_firestore()
    ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = doc.to_dict()

    if _token_owns_result(token_uid, token_email, d):
        ref.delete()
        return jsonify({"message": "Deleted"}), 200
    if _legacy_password_valid(d, password):
        ref.delete()
        return jsonify({"message": "Deleted"}), 200

    if d.get("passwordHash") and not password:
        return jsonify({"error": "Bad Request", "message": "password required"}), 400
    return jsonify({"error": "Forbidden", "message": "Invalid password or not owner"}), 403
