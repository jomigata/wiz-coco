# 결과 제출/조회/수정/삭제 (POST, GET, PUT, DELETE)
from flask import Blueprint, request, jsonify, g
from firebase_admin.firestore import SERVER_TIMESTAMP

from firebase_init import get_firestore
from auth_middleware import get_bearer_client_email
from rate_limit import limit_access_code, limit_password_api
from config import ASSESSMENTS_COLLECTION, TEST_RESULTS_COLLECTION
from utils.password import generate_four_digit_password, hash_password, verify_password
from utils.scoring import compute_result_data
from utils.access_code import normalize_access_code, is_valid_access_code

bp = Blueprint("results", __name__, url_prefix="/api/results")


def _get_assessment_or_404(db, assessment_id, counselor_uid=None):
    ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    doc = ref.get()
    if not doc.exists:
        return None, 404
    d = doc.to_dict()
    if counselor_uid is not None and d.get("counselorId") != counselor_uid:
        return None, 404
    return doc, None


@bp.route("", methods=["POST"])
@limit_access_code
def submit_result():
    """
    내담자: Authorization(Firebase ID 토큰) 필수, accessCode, testId, responses.
    clientEmail은 토큰의 email과 동일하게 저장. 채점 후 4자리 비밀번호 해시 저장, 평문은 응답에 1회만 포함(이메일 발송 없음).
    """
    body = request.get_json() or {}
    access_code = normalize_access_code(body.get("accessCode") or "")
    test_id = (body.get("testId") or "").strip()
    client_email = get_bearer_client_email()
    responses = body.get("responses")
    if not client_email:
        return jsonify(
            {
                "error": "Unauthorized",
                "message": "Firebase login with email is required to submit results.",
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
    assessment_id = ass_doc.id
    ass_data = ass_doc.to_dict()
    test_list = ass_data.get("testList") or []
    test_name = next((t.get("name", t.get("testId", "")) for t in test_list if str(t.get("testId")) == test_id), test_id)

    result_data = compute_result_data(test_id, responses if isinstance(responses, (dict, list)) else {})
    password = generate_four_digit_password()
    password_hash = hash_password(password)

    data = {
        "accessCode": access_code,
        "assessmentId": assessment_id,
        "testId": test_id,
        "clientEmail": client_email,
        "status": "completed",
        "responses": responses,
        "resultData": result_data,
        "passwordHash": password_hash,
        "completedAt": SERVER_TIMESTAMP,
    }
    ref = db.collection(TEST_RESULTS_COLLECTION).document()
    ref.set(data)

    return jsonify(
        {
            "resultId": ref.id,
            "message": "Result submitted. Save the 4-digit password shown below; it is required to edit or delete this result.",
            "plainPassword": password,
        }
    ), 201


@bp.route("", methods=["GET"])
@limit_access_code
def list_results():
    """accessCode + 로그인 사용자(토큰) 이메일로 해당 testResults 목록 반환."""
    access_code = normalize_access_code(request.args.get("accessCode") or "")
    client_email = get_bearer_client_email()
    if not client_email:
        return jsonify(
            {"error": "Unauthorized", "message": "Firebase login with email is required to list results."}
        ), 401
    if not is_valid_access_code(access_code):
        return jsonify({"error": "Bad Request", "message": "accessCode required"}), 400

    db = get_firestore()
    refs = (
        db.collection(TEST_RESULTS_COLLECTION)
        .where("accessCode", "==", access_code)
        .where("clientEmail", "==", client_email)
        .get()
    )
    items = []
    for doc in refs:
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
    """로그인 사용자(토큰 email)의 검사코드 세트 제출 결과 전부 (accessCode 무관)."""
    client_email = get_bearer_client_email()
    if not client_email:
        return jsonify(
            {"error": "Unauthorized", "message": "Firebase login with email is required."}
        ), 401

    db = get_firestore()
    refs = list(
        db.collection(TEST_RESULTS_COLLECTION)
        .where("clientEmail", "==", client_email)
        .limit(200)
        .stream()
    )
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
    for doc in refs:
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
    (1) Bearer 토큰의 email이 결과의 clientEmail과 같으면: 요약 조회용으로 resultData·accessCode 포함 (비밀번호 불필요).
    (2) 그 외: ?password= 4자리 확인 후 수정 폼용(testId, responses).
    """
    password = (request.args.get("password") or "").strip()
    token_email = get_bearer_client_email()

    db = get_firestore()
    ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = doc.to_dict()
    doc_owner = (d.get("clientEmail") or "").strip().lower()

    if token_email and doc_owner == token_email:
        return jsonify({
            "resultId": doc.id,
            "testId": d.get("testId"),
            "responses": d.get("responses"),
            "clientEmail": d.get("clientEmail"),
            "resultData": d.get("resultData"),
            "accessCode": d.get("accessCode"),
            "assessmentId": d.get("assessmentId"),
        })

    if not password:
        return jsonify({"error": "Bad Request", "message": "password required"}), 400
    if not verify_password(password, d.get("passwordHash", "")):
        return jsonify({"error": "Forbidden", "message": "Invalid password"}), 403
    return jsonify({
        "resultId": doc.id,
        "testId": d.get("testId"),
        "responses": d.get("responses"),
        "clientEmail": d.get("clientEmail"),
    })


@bp.route("/<result_id>", methods=["PUT"])
@limit_password_api
def update_result(result_id):
    """password + responses 로 수정·재채점. 비밀번호 확인 필요."""
    body = request.get_json() or {}
    password = (body.get("password") or "").strip()
    responses = body.get("responses")
    if not password:
        return jsonify({"error": "Bad Request", "message": "password required"}), 400
    if responses is None:
        return jsonify({"error": "Bad Request", "message": "responses required"}), 400

    db = get_firestore()
    ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = doc.to_dict()
    if not verify_password(password, d.get("passwordHash", "")):
        return jsonify({"error": "Forbidden", "message": "Invalid password"}), 403

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
    """password 확인 후 삭제."""
    body = request.get_json() or {}
    password = (body.get("password") or "").strip()
    if not password:
        return jsonify({"error": "Bad Request", "message": "password required"}), 400

    db = get_firestore()
    ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = doc.to_dict()
    if not verify_password(password, d.get("passwordHash", "")):
        return jsonify({"error": "Forbidden", "message": "Invalid password"}), 403

    ref.delete()
    return jsonify({"message": "Deleted"}), 200
