# 상담사: POST/GET assessments, GET progress | 내담자: POST public lookup by accessCode
from flask import Blueprint, request, jsonify, g
from firebase_admin.firestore import SERVER_TIMESTAMP
from datetime import datetime, timezone

from firebase_init import get_firestore
from auth_middleware import require_counselor
from rate_limit import limit_access_code
from config import ASSESSMENTS_COLLECTION, TEST_RESULTS_COLLECTION, CLIENT_PORTALS_COLLECTION
from utils.access_code import generate_unique_access_code, normalize_access_code, is_valid_access_code
from utils.result_actor import (
    result_actor_key,
    result_actor_email,
    result_actor_display,
    build_portal_labels,
    build_participant_labels,
    fallback_actor_label,
)
from utils.test_result_queries import query_results_shared_to_assessment

bp = Blueprint("assessments", __name__, url_prefix="/api/assessments")

MSG_PUBLIC_NOT_FOUND = (
    "요청하신 검사코드가 확인되지 않았습니다. 검사 코드를 다시 확인해 주시기 바랍니다."
)
MSG_ACCESS_CODE_FORMAT = "검사 코드 형식이 올바르지 않습니다. 입력 내용을 다시 확인해 주시기 바랍니다."
MSG_ACCESS_CODE_EXPIRED = "검사코드 사용기한이 종료되었습니다. 상담사에게 새 코드 발급을 요청해 주세요."


def _normalize_usage_end_date(raw):
    s = str(raw or "").strip()
    if not s:
        return ""
    try:
        return datetime.strptime(s, "%Y-%m-%d").date().isoformat()
    except Exception:
        return None


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
    """상담사 API 응답에서 구 PIN 필드 제거."""
    d.pop("joinPinHash", None)
    d.pop("joinPin", None)
    d.pop("joinPinConfigured", None)


@bp.route("", methods=["POST"])
@require_counselor
def create_assessment():
    """상담사: 공동 이용(일반) 검사코드 생성 — 지원 종료. 검사코드 일괄 발급 API 사용."""
    body = request.get_json() or {}
    issue_type = (body.get("issueType") or "shared").strip()
    if issue_type != "individual":
        return jsonify(
            {
                "error": "Gone",
                "message": "일반코드(공유 검사코드) 생성은 지원하지 않습니다. 새 검사코드 만들기에서 내담자 목록을 등록해 주세요.",
            }
        ), 410
    return jsonify(
        {"error": "Bad Request", "message": "개별 발급은 내담자 목록 일괄 생성 API를 사용하세요."}
    ), 400


def _is_completed_result(d):
    return (d.get("status") or "completed") == "completed"


def _aggregate_completed_testids_by_email(db, assessment_ids):
    """
    완료된 testResults: assessmentId -> {actorKey: {clientUid, clientEmail, testIds}}.
    portal / participant / guest / clientUid / email 모두 포함.
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
            aid = d.get("assessmentId")
            if not aid or aid not in per_testids:
                continue
            key = result_actor_key(d, result_id=doc.id)
            if not key:
                continue
            tid = str(d.get("testId") or "").strip()
            if not tid:
                continue
            tmap = per_testids[aid]
            if key not in tmap:
                tmap[key] = {
                    "clientUid": key,
                    "clientEmail": result_actor_email(d),
                    "testIds": set(),
                }
            elif not tmap[key].get("clientEmail") and result_actor_email(d):
                tmap[key]["clientEmail"] = result_actor_email(d)
            tmap[key]["testIds"].add(tid)
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
    usage_end_date = _normalize_usage_end_date(body.get("usageEndDate"))
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
    if usage_end_date is None:
        return jsonify({"error": "Bad Request", "message": "usageEndDate must be YYYY-MM-DD"}), 400

    db = get_firestore()
    ref, doc = _get_owned_assessment(db, assessment_id)
    if not doc:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404

    ref.update(
        {
            "title": title,
            "targetAudience": target_audience,
            "welcomeMessage": welcome_message,
            "usageEndDate": usage_end_date or "",
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
    try:
        db = get_firestore()
        ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
        ass = ass_ref.get()
        ass_data = ass.to_dict() or {} if ass.exists else {}
        if not ass.exists or ass_data.get("counselorId") != g.counselor_uid:
            return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404
        access_code = ass_data.get("accessCode", "")

        result_docs = list(
            db.collection(TEST_RESULTS_COLLECTION)
            .where("assessmentId", "==", assessment_id)
            .stream()
        )
        shared_docs = query_results_shared_to_assessment(db, assessment_id)

        portal_ids: set[str] = set()
        participant_ids: set[str] = set()
        raw_rows = []
        seen_result_ids: set[str] = set()
        for doc in result_docs + shared_docs:
            if doc.id in seen_result_ids:
                continue
            seen_result_ids.add(doc.id)
            d = doc.to_dict() or {}
            portal_id = str(d.get("portalId") or "").strip()
            if portal_id:
                portal_ids.add(portal_id)
            participant_id = str(d.get("participantId") or "").strip()
            if participant_id:
                participant_ids.add(participant_id)
            shared_ids = d.get("sharedToAssessmentIds") or []
            is_shared = assessment_id in shared_ids and d.get("assessmentId") != assessment_id
            key = result_actor_key(d, result_id=doc.id)
            if key.startswith("participant:"):
                participant_ids.add(key.split(":", 1)[1])
            elif key.startswith("portal:"):
                portal_ids.add(key.split(":", 1)[1])
            raw_rows.append({"resultId": doc.id, "data": d, "isShared": is_shared, "actorKey": key})

        portal_labels = build_portal_labels(db, portal_ids)
        participant_labels = build_participant_labels(db, participant_ids)

        by_client = {}
        for row in raw_rows:
            result_id = row["resultId"]
            d = row["data"]
            key = row.get("actorKey") or result_actor_key(d, result_id=result_id)
            if not key:
                continue
            display_name = (
                result_actor_display(d, key, portal_labels, participant_labels)
                or result_actor_email(d)
                or fallback_actor_label(key)
            )
            if key not in by_client:
                by_client[key] = {
                    "clientUid": key,
                    "clientEmail": result_actor_email(d),
                    "clientDisplayName": display_name,
                    "results": [],
                }
            elif not by_client[key].get("clientDisplayName") and display_name:
                by_client[key]["clientDisplayName"] = display_name
            elif not by_client[key].get("clientEmail") and result_actor_email(d):
                by_client[key]["clientEmail"] = result_actor_email(d)
            r = {
                "resultId": result_id,
                "testId": d.get("testId"),
                "status": d.get("status"),
                "completedAt": None,
                "isShared": bool(row.get("isShared")),
            }
            if d.get("completedAt"):
                ct = d["completedAt"]
                r["completedAt"] = ct.isoformat() if hasattr(ct, "isoformat") else str(ct)
            by_client[key]["results"].append(r)
        return jsonify({"accessCode": access_code, "byClient": list(by_client.values())})
    except Exception:
        return jsonify(
            {
                "error": "Internal Server Error",
                "message": "진행 현황을 불러오는 중 오류가 발생했습니다.",
            }
        ), 500


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
    d = result_doc.to_dict() or {}
    shared_ids = list(d.get("sharedToAssessmentIds") or [])
    if d.get("assessmentId") != assessment_id and assessment_id not in shared_ids:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404

    portal_id = str(d.get("portalId") or "").strip()
    participant_id = str(d.get("participantId") or "").strip()
    actor_key = result_actor_key(d, result_id=result_doc.id)
    portal_labels = build_portal_labels(db, {portal_id} if portal_id else set())
    participant_labels = build_participant_labels(db, {participant_id} if participant_id else set())
    client_display = (
        result_actor_display(d, actor_key, portal_labels, participant_labels)
        or result_actor_email(d)
        or fallback_actor_label(actor_key)
    )

    out = {
        "resultId": result_doc.id,
        "assessmentId": d.get("assessmentId"),
        "accessCode": d.get("accessCode"),
        "testId": d.get("testId"),
        "clientEmail": client_display,
        "clientDisplayName": client_display,
        "status": d.get("status"),
        "responses": d.get("responses"),
        "resultData": d.get("resultData"),
        "completedAt": None,
        "isShared": assessment_id in shared_ids and d.get("assessmentId") != assessment_id,
        "sharedToAssessmentIds": shared_ids,
    }
    if d.get("completedAt"):
        ct = d["completedAt"]
        out["completedAt"] = ct.isoformat() if hasattr(ct, "isoformat") else str(ct)
    return jsonify(out)


def _public_json(doc, d):
    issue_type = (d.get("issueType") or "shared").strip()
    if issue_type not in ("shared", "individual"):
        issue_type = "shared"
    return {
        "assessmentId": doc.id,
        "title": d.get("title", ""),
        "welcomeMessage": d.get("welcomeMessage", ""),
        "usageEndDate": d.get("usageEndDate", ""),
        "testList": d.get("testList", []),
        "issueType": issue_type,
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
    if _is_assessment_expired(d):
        return jsonify({"error": "Gone", "message": MSG_ACCESS_CODE_EXPIRED}), 410
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
    if _is_assessment_expired(d):
        return jsonify({"error": "Gone", "message": MSG_ACCESS_CODE_EXPIRED}), 410
    return jsonify(_public_json(doc, d))
