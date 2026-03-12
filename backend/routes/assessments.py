# 상담사: POST/GET assessments, GET progress | 내담자: GET public by accessCode
from flask import Blueprint, request, jsonify, g
from firebase_admin.firestore import SERVER_TIMESTAMP

from firebase_init import get_firestore
from auth_middleware import require_counselor
from rate_limit import limit_access_code
from config import ASSESSMENTS_COLLECTION, TEST_RESULTS_COLLECTION
from utils.access_code import generate_unique_access_code

bp = Blueprint("assessments", __name__, url_prefix="/api/assessments")


def _serialize_doc(doc):
    d = doc.to_dict()
    d["id"] = doc.id
    if "createdAt" in d and d["createdAt"]:
        t = d["createdAt"]
        if hasattr(t, "isoformat"):
            d["createdAt"] = t.isoformat()
        elif hasattr(t, "timestamp"):
            from datetime import datetime
            d["createdAt"] = datetime.utcfromtimestamp(t.timestamp()).isoformat() + "Z"
    return d


@bp.route("", methods=["POST"])
@require_counselor
def create_assessment():
    """상담사: 패키지 생성, accessCode 생성 후 저장, assessmentId·accessCode 반환."""
    body = request.get_json() or {}
    title = (body.get("title") or "").strip()
    target_audience = body.get("targetAudience", "개인")
    if target_audience not in ("개인", "그룹"):
        target_audience = "개인"
    welcome_message = (body.get("welcomeMessage") or "").strip()
    test_list = body.get("testList") or []
    if not isinstance(test_list, list):
        test_list = []
    test_list = [
        {"testId": str(t.get("testId", "")), "name": str(t.get("name", ""))}
        for t in test_list
        if t
    ]
    if not title:
        return jsonify({"error": "Bad Request", "message": "title required"}), 400
    access_code = generate_unique_access_code()
    db = get_firestore()
    data = {
        "accessCode": access_code,
        "counselorId": g.counselor_uid,
        "title": title,
        "targetAudience": target_audience,
        "welcomeMessage": welcome_message,
        "testList": test_list,
        "createdAt": SERVER_TIMESTAMP,
        "status": "active",
    }
    ref = db.collection(ASSESSMENTS_COLLECTION).document()
    ref.set(data)
    return jsonify({"assessmentId": ref.id, "accessCode": access_code}), 201


@bp.route("", methods=["GET"])
@require_counselor
def list_assessments():
    """상담사: 로그인 상담사 소유 assessments 목록."""
    db = get_firestore()
    refs = db.collection(ASSESSMENTS_COLLECTION).where("counselorId", "==", g.counselor_uid).get()
    def _sort_key(doc):
        t = doc.to_dict().get("createdAt")
        if t is None:
            return 0
        if hasattr(t, "timestamp") and callable(getattr(t, "timestamp", None)):
            return t.timestamp()
        if hasattr(t, "total_seconds"):
            return t.total_seconds()
        return 0
    refs = sorted(refs, key=_sort_key, reverse=True)
    items = [_serialize_doc(d) for d in refs]
    return jsonify({"assessments": items})


@bp.route("/<assessment_id>/progress", methods=["GET"])
@require_counselor
def get_progress(assessment_id):
    """상담사: 해당 assessment의 진행 현황 (testResults를 clientEmail 기준 그룹화)."""
    db = get_firestore()
    ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    ass = ass_ref.get()
    if not ass.exists or ass.to_dict().get("counselorId") != g.counselor_uid:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404
    access_code = ass.to_dict().get("accessCode", "")
    results_refs = db.collection(TEST_RESULTS_COLLECTION).where("assessmentId", "==", assessment_id).get()
    by_email = {}
    for doc in results_refs:
        d = doc.to_dict()
        email = d.get("clientEmail", "")
        if email not in by_email:
            by_email[email] = {"clientEmail": email, "results": []}
        r = {"resultId": doc.id, "testId": d.get("testId"), "status": d.get("status"), "completedAt": None}
        if d.get("completedAt"):
            ct = d["completedAt"]
            r["completedAt"] = ct.isoformat() if hasattr(ct, "isoformat") else str(ct)
        by_email[email]["results"].append(r)
    return jsonify({"accessCode": access_code, "byClient": list(by_email.values())})


@bp.route("/<assessment_id>/results/<result_id>", methods=["GET"])
@require_counselor
def get_assessment_result(assessment_id, result_id):
    """상담사 전용: 해당 assessment 소유의 검사 결과 상세 조회 (비밀번호 불필요)."""
    db = get_firestore()
    ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    ass = ass_ref.get()
    if not ass.exists or ass.to_dict().get("counselorId") != g.counselor_uid:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404
    result_ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    result_doc = result_ref.get()
    if not result_doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = result_doc.to_dict()
    if d.get("assessmentId") != assessment_id:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    out = {
        "resultId": result_doc.id,
        "assessmentId": d.get("assessmentId"),
        "accessCode": d.get("accessCode"),
        "testId": d.get("testId"),
        "clientEmail": d.get("clientEmail"),
        "status": d.get("status"),
        "responses": d.get("responses"),
        "resultData": d.get("resultData"),
        "completedAt": None,
    }
    if d.get("completedAt"):
        ct = d["completedAt"]
        out["completedAt"] = ct.isoformat() if hasattr(ct, "isoformat") else str(ct)
    return jsonify(out)


@bp.route("/public/<access_code>", methods=["GET"])
@limit_access_code
def get_public(access_code):
    """내담자(공개): 코드 유효 시 title, welcomeMessage, testList 반환; 없으면 404."""
    code = (access_code or "").strip().upper()
    if len(code) != 6:
        return jsonify({"error": "Not Found", "message": "Invalid access code"}), 404
    db = get_firestore()
    refs = db.collection(ASSESSMENTS_COLLECTION).where("accessCode", "==", code).where("status", "==", "active").limit(1).get()
    if not refs:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404
    doc = refs[0]
    d = doc.to_dict()
    return jsonify({
        "assessmentId": doc.id,
        "title": d.get("title", ""),
        "welcomeMessage": d.get("welcomeMessage", ""),
        "testList": d.get("testList", []),
    })
