# 상담사: POST/GET assessments, GET progress | 내담자: GET public by accessCode
from flask import Blueprint, request, jsonify, g
from firebase_admin.firestore import SERVER_TIMESTAMP

from firebase_init import get_firestore
from auth_middleware import require_counselor
from rate_limit import limit_access_code
from config import ASSESSMENTS_COLLECTION, TEST_RESULTS_COLLECTION
from utils.access_code import generate_unique_access_code, normalize_access_code, is_valid_access_code

bp = Blueprint("assessments", __name__, url_prefix="/api/assessments")


def _serialize_doc(doc):
    d = doc.to_dict()
    d["id"] = doc.id
    for key in ("createdAt", "updatedAt", "archivedAt"):
        if key in d and d[key]:
            t = d[key]
            if hasattr(t, "isoformat"):
                d[key] = t.isoformat()
            elif hasattr(t, "timestamp"):
                from datetime import datetime
                d[key] = datetime.utcfromtimestamp(t.timestamp()).isoformat() + "Z"
    return d


@bp.route("", methods=["POST"])
@require_counselor
def create_assessment():
    """상담사: 검사코드(세트) 생성, accessCode 생성 후 저장, assessmentId·accessCode 반환."""
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


def _is_completed_result(d):
    return (d.get("status") or "completed") == "completed"


def _aggregate_completions_by_email(db, assessment_ids):
    """
    testResults에서 assessmentId가 목록에 속하고 status=completed인 문서만 집계.
    반환: (전체 이메일별 합계 dict, assessmentId -> {email: count})
    """
    totals = {}
    per_assessment = {aid: {} for aid in assessment_ids}
    if not assessment_ids:
        return totals, per_assessment

    coll = db.collection(TEST_RESULTS_COLLECTION)
    chunk_size = 30  # Firestore IN 연산자 상한
    for i in range(0, len(assessment_ids), chunk_size):
        chunk = assessment_ids[i : i + chunk_size]
        for doc in coll.where("assessmentId", "in", chunk).get():
            d = doc.to_dict()
            if not _is_completed_result(d):
                continue
            email = (d.get("clientEmail") or "").strip().lower()
            aid = d.get("assessmentId")
            if not email or not aid or aid not in per_assessment:
                continue
            totals[email] = totals.get(email, 0) + 1
            m = per_assessment[aid]
            m[email] = m.get(email, 0) + 1
    return totals, per_assessment


@bp.route("", methods=["GET"])
@require_counselor
def list_assessments():
    """상담사: 로그인 상담사 소유 assessments 목록 + 내담자 이메일별 검사 완료 합계."""
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
    # 목록에는 활성 검사코드만 (삭제=archived 는 제외, 구문서는 status 없으면 active 로 간주)
    items = [x for x in items if (x.get("status") or "active") == "active"]
    ids = [x["id"] for x in items]
    totals, per_assessment = _aggregate_completions_by_email(db, ids)
    totals_rows = sorted(
        ({"clientEmail": em, "completedCount": cnt} for em, cnt in totals.items()),
        key=lambda r: (-r["completedCount"], r["clientEmail"]),
    )
    for x in items:
        aid = x["id"]
        by_em = per_assessment.get(aid, {})
        x["completionByEmail"] = by_em
        x["completedTestsTotal"] = sum(by_em.values())
        x["completedClientsCount"] = len(by_em)
    return jsonify(
        {
            "assessments": items,
            "emailCompletionTotals": totals_rows,
        }
    )


def _get_owned_assessment(db, assessment_id):
    """상담사 소유 + 활성 문서만. 없으면 (None, None)."""
    ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    doc = ref.get()
    if not doc.exists:
        return None, None
    d = doc.to_dict()
    if d.get("counselorId") != g.counselor_uid:
        return None, None
    if (d.get("status") or "active") != "active":
        return None, None
    return ref, doc


@bp.route("/<assessment_id>", methods=["GET"])
@require_counselor
def get_assessment(assessment_id):
    """상담사: 단일 검사코드(세트) 조회 (수정 폼용)."""
    db = get_firestore()
    ref, doc = _get_owned_assessment(db, assessment_id)
    if not doc:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404
    return jsonify(_serialize_doc(doc))


@bp.route("/<assessment_id>", methods=["PUT"])
@require_counselor
def update_assessment(assessment_id):
    """상담사: 검사코드 세트 메타데이터 수정. accessCode·counselorId 는 변경 불가."""
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

    db = get_firestore()
    ref, doc = _get_owned_assessment(db, assessment_id)
    if not doc:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404

    ref.update(
        {
            "title": title,
            "targetAudience": target_audience,
            "welcomeMessage": welcome_message,
            "testList": test_list,
            "updatedAt": SERVER_TIMESTAMP,
        }
    )
    return jsonify({"assessmentId": assessment_id, "message": "updated"})


@bp.route("/<assessment_id>", methods=["DELETE"])
@require_counselor
def delete_assessment(assessment_id):
    """상담사: 검사코드 세트 비활성화(soft delete, status=archived). 내담자 신규 접속 불가."""
    db = get_firestore()
    ref, doc = _get_owned_assessment(db, assessment_id)
    if not doc:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404

    ref.update({"status": "archived", "archivedAt": SERVER_TIMESTAMP})
    return jsonify({"assessmentId": assessment_id, "message": "archived"})


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
    code = normalize_access_code(access_code)
    if not is_valid_access_code(code):
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
