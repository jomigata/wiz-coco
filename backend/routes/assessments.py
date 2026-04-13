# 상담사: POST/GET assessments, GET progress | 내담자: POST public lookup by accessCode
from flask import Blueprint, request, jsonify, g
from firebase_admin.firestore import SERVER_TIMESTAMP

from firebase_init import get_firestore
from auth_middleware import require_counselor
from rate_limit import limit_access_code
from config import ASSESSMENTS_COLLECTION, TEST_RESULTS_COLLECTION
from utils.access_code import generate_unique_access_code, normalize_access_code, is_valid_access_code

bp = Blueprint("assessments", __name__, url_prefix="/api/assessments")

MSG_PUBLIC_NOT_FOUND = (
    "요청하신 검사코드가 확인되지 않았습니다. 검사 코드를 다시 확인해 주시기 바랍니다."
)
MSG_ACCESS_CODE_FORMAT = "검사 코드 형식이 올바르지 않습니다. 입력 내용을 다시 확인해 주시기 바랍니다."


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


def _strip_join_secrets_for_counselor_api(d: dict) -> None:
    """상담사 API 응답에서 접속 PIN 관련 필드 제거(신규 세트는 미발급)."""
    d.pop("joinPinHash", None)
    d.pop("joinPin", None)
    d.pop("joinPinConfigured", None)


@bp.route("", methods=["POST"])
@require_counselor
def create_assessment():
    """상담사: 검사코드(세트) 생성, accessCode만 발급·저장. 내담자 접속용 PIN은 사용하지 않음."""
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


def _aggregate_completed_testids_by_email(db, assessment_ids):
    """
    완료된 testResults만: assessmentId -> {clientUid: (email, set(완료한 testId))}.
    """
    per_testids = {aid: {} for aid in assessment_ids}
    if not assessment_ids:
        return per_testids

    coll = db.collection(TEST_RESULTS_COLLECTION)
    chunk_size = 30  # Firestore IN 연산자 상한
    for i in range(0, len(assessment_ids), chunk_size):
        chunk = assessment_ids[i : i + chunk_size]
        for doc in coll.where("assessmentId", "in", chunk).get():
            d = doc.to_dict()
            if not _is_completed_result(d):
                continue
            uid = str(d.get("clientUid") or "").strip()
            email = (d.get("clientEmail") or "").strip().lower()
            aid = d.get("assessmentId")
            if not uid or not aid or aid not in per_testids:
                continue
            tid = str(d.get("testId") or "").strip()
            if tid:
                tmap = per_testids[aid]
                if uid not in tmap:
                    tmap[uid] = {"clientUid": uid, "clientEmail": email or None, "testIds": set()}
                tmap[uid]["testIds"].add(tid)
    return per_testids


@bp.route("", methods=["GET"])
@require_counselor
def list_assessments():
    """상담사: 로그인 상담사 소유 assessments 목록 (행별 진행: 미전체완료 이메일 수 / 전체완료 이메일 수)."""
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
    per_testids = _aggregate_completed_testids_by_email(db, ids)
    for x in items:
        aid = x["id"]
        required = {
            str(t.get("testId") or "").strip()
            for t in (x.get("testList") or [])
            if t and str(t.get("testId") or "").strip()
        }
        tmap = per_testids.get(aid, {})
        emails_any = len(tmap)
        emails_all = 0
        if required:
            for _uid, row in tmap.items():
                tids = row.get("testIds") or set()
                if required <= tids:
                    emails_all += 1
            emails_not_all = emails_any - emails_all
        else:
            emails_all = 0
            emails_not_all = 0
        x["emailsNotCompletedAllTestsCount"] = emails_not_all
        x["emailsCompletedAllTestsCount"] = emails_all
        _strip_join_secrets_for_counselor_api(x)
    return jsonify({"assessments": items})


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
    out = _serialize_doc(doc)
    _strip_join_secrets_for_counselor_api(out)
    return jsonify(out)


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
    """상담사: 해당 assessment의 진행 현황 (testResults를 clientUid 기준 그룹화)."""
    db = get_firestore()
    ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
    ass = ass_ref.get()
    if not ass.exists or ass.to_dict().get("counselorId") != g.counselor_uid:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404
    access_code = ass.to_dict().get("accessCode", "")
    results_refs = db.collection(TEST_RESULTS_COLLECTION).where("assessmentId", "==", assessment_id).get()
    by_client = {}
    for doc in results_refs:
        d = doc.to_dict()
        uid = str(d.get("clientUid") or "").strip()
        email = (d.get("clientEmail") or "").strip().lower()
        if not uid:
            # 레거시 문서: uid가 없으면 email로 대체(가능한 경우만)
            uid = f"legacy-email:{email}" if email else ""
        if not uid:
            continue
        if uid not in by_client:
            by_client[uid] = {"clientUid": uid, "clientEmail": email or None, "results": []}
        r = {"resultId": doc.id, "testId": d.get("testId"), "status": d.get("status"), "completedAt": None}
        if d.get("completedAt"):
            ct = d["completedAt"]
            r["completedAt"] = ct.isoformat() if hasattr(ct, "isoformat") else str(ct)
        by_client[uid]["results"].append(r)
    return jsonify({"accessCode": access_code, "byClient": list(by_client.values())})


@bp.route("/<assessment_id>/results/<result_id>", methods=["GET"])
@require_counselor
def get_assessment_result(assessment_id, result_id):
    """상담사 전용: 해당 assessment 소유의 검사 결과 상세 조회."""
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


def _public_json(doc, d):
    return {
        "assessmentId": doc.id,
        "title": d.get("title", ""),
        "welcomeMessage": d.get("welcomeMessage", ""),
        "testList": d.get("testList", []),
    }


@bp.route("/public/lookup", methods=["POST"])
@limit_access_code
def post_public_lookup():
    """내담자(공개): 활성 검사코드(accessCode)만으로 세트 정보 반환. (구문서의 joinPinHash는 검증하지 않음)"""
    body = request.get_json() or {}
    code = normalize_access_code(body.get("accessCode") or "")
    if not is_valid_access_code(code):
        return jsonify({"error": "Bad Request", "message": MSG_ACCESS_CODE_FORMAT}), 400
    db = get_firestore()
    refs = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("accessCode", "==", code)
        .where("status", "==", "active")
        .limit(1)
        .get()
    )
    if not refs:
        return jsonify({"error": "Not Found", "message": MSG_PUBLIC_NOT_FOUND}), 404
    doc = refs[0]
    d = doc.to_dict()
    return jsonify(_public_json(doc, d))


@bp.route("/public/<access_code>", methods=["GET"])
@limit_access_code
def get_public(access_code):
    """구형 클라이언트 호환: 활성 검사코드로 공개 메타만 조회."""
    code = normalize_access_code(access_code)
    if not is_valid_access_code(code):
        return jsonify({"error": "Not Found", "message": MSG_PUBLIC_NOT_FOUND}), 404
    db = get_firestore()
    refs = (
        db.collection(ASSESSMENTS_COLLECTION)
        .where("accessCode", "==", code)
        .where("status", "==", "active")
        .limit(1)
        .get()
    )
    if not refs:
        return jsonify({"error": "Not Found", "message": MSG_PUBLIC_NOT_FOUND}), 404
    doc = refs[0]
    d = doc.to_dict()
    return jsonify(_public_json(doc, d))
