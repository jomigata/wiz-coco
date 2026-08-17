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
from utils.assessment_dispatch import aggregate_assessment_list_stats
from utils.counselor_scope import resource_owned_by_scope, scope_counselor_uid
from utils.assessment_list_stats import (
    LIST_STATS_FIELD,
    apply_list_stats_to_item,
    build_assessment_search_tokens,
    fetch_stats_by_ids,
    resolve_stats_for_items,
    recompute_and_persist_assessment_list_stats,
    sync_assessment_search_fields,
    touch_assessment_list_stats,
)

bp = Blueprint("assessments", __name__, url_prefix="/api/assessments")

VALID_CODE_CATEGORIES = frozenset(
    {"individual", "group", "school", "corporate", "community", "other"}
)

MSG_PUBLIC_NOT_FOUND = (
    "요청하신 상담(코드)가 확인되지 않았습니다. 상담(코드)를 다시 확인해 주시기 바랍니다."
)
MSG_ACCESS_CODE_FORMAT = "상담(코드) 형식이 올바르지 않습니다. 입력 내용을 다시 확인해 주시기 바랍니다."
MSG_ACCESS_CODE_EXPIRED = "상담(코드) 사용기한이 종료되었습니다. 상담사에게 새 코드 발급을 요청해 주세요."


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
    """상담사: 공동 이용(일반) 상담(코드) 생성 — 지원 종료. 상담(코드) 일괄 발급 API 사용."""
    body = request.get_json() or {}
    issue_type = (body.get("issueType") or "shared").strip()
    if issue_type != "individual":
        return jsonify(
            {
                "error": "Gone",
                "message": "일반코드(공유 상담(코드)) 생성은 지원하지 않습니다. 새 상담(코드) 만들기에서 내담자 목록을 등록해 주세요.",
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


DEFAULT_LIST_LIMIT = 100
MAX_LIST_LIMIT = 200


def _assessment_matches_search(item: dict, query: str) -> bool:
    q = (query or "").strip().lower()
    if not q:
        return True
    tokens = item.get("searchTokens") or []
    if any(q in str(t).lower() for t in tokens):
        return True
    hay = " ".join(
        [
            str(item.get("title") or ""),
            str(item.get("accessCode") or ""),
            str(item.get("cohortName") or ""),
            str(item.get("welcomeMessage") or ""),
            str(item.get("codeCategory") or ""),
            str(item.get("targetAudience") or ""),
        ]
    ).lower()
    return q in hay


def _fetch_assessment_list_page(
    db,
    *,
    scoped_uid: str | None,
    filter_counselor_id: str | None,
    limit: int,
    cursor_id: str | None,
    search_query: str,
):
    """Firestore cursor pagination — active assessment만 limit개 수집."""
    from google.cloud.firestore_v1 import Query

    coll = db.collection(ASSESSMENTS_COLLECTION)
    if scoped_uid:
        base = coll.where("counselorId", "==", scoped_uid)
    elif filter_counselor_id:
        base = coll.where("counselorId", "==", filter_counselor_id)
    else:
        base = coll

    query = base.order_by("createdAt", direction=Query.DESCENDING)
    if cursor_id:
        cursor_doc = coll.document(cursor_id).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)

    items: list = []
    last_scanned = None
    batch_size = max(limit + 25, 50)
    rounds = 0
    while len(items) < limit and rounds < 12:
        rounds += 1
        docs = list(query.limit(batch_size).stream())
        if not docs:
            break
        for doc in docs:
            last_scanned = doc
            d = _serialize_doc(doc)
            if (d.get("status") or "active") != "active":
                continue
            if not _assessment_matches_search(d, search_query):
                continue
            items.append(d)
            if len(items) >= limit:
                break
        if len(docs) < batch_size or len(items) >= limit:
            break
        query = base.order_by("createdAt", direction=Query.DESCENDING).start_after(docs[-1])

    next_cursor = None
    if last_scanned is not None and len(items) >= limit:
        next_cursor = last_scanned.id
    return items, next_cursor


@bp.route("", methods=["GET"])
@require_counselor
def list_assessments():
    """상담사: 로그인 상담사 소유 assessments 목록 (admin: 전체, 페이지네이션·검색·listStats)."""
    db = get_firestore()
    scoped_uid = scope_counselor_uid()

    try:
        limit = min(max(int(request.args.get("limit") or DEFAULT_LIST_LIMIT), 1), MAX_LIST_LIMIT)
    except (TypeError, ValueError):
        limit = DEFAULT_LIST_LIMIT
    cursor_id = (request.args.get("cursor") or "").strip() or None
    search_query = (request.args.get("q") or "").strip().lower()
    include_stats = request.args.get("includeStats", "1") != "0"
    filter_counselor_id = (request.args.get("counselorId") or "").strip() or None
    if scoped_uid:
        filter_counselor_id = None

    items, next_cursor = _fetch_assessment_list_page(
        db,
        scoped_uid=scoped_uid,
        filter_counselor_id=filter_counselor_id,
        limit=limit,
        cursor_id=cursor_id,
        search_query=search_query,
    )

    if include_stats:
        resolve_stats_for_items(db, items, recompute_missing=True)
    else:
        for x in items:
            apply_list_stats_to_item(x, x.get(LIST_STATS_FIELD))

    for x in items:
        _strip_join_secrets_for_counselor_api(x)
        x.pop(LIST_STATS_FIELD, None)

    if scoped_uid is None:
        from utils.counselor_emails import attach_counselor_emails

        attach_counselor_emails(db, items)

    return jsonify(
        {
            "assessments": items,
            "nextCursor": next_cursor,
            "hasMore": bool(next_cursor),
            "limit": limit,
        }
    )


@bp.route("/stats", methods=["GET"])
@require_counselor
def batch_assessment_list_stats():
    """목록 행 stats만 lazy 조회 — live poll·진행현황 컬럼용."""
    db = get_firestore()
    raw = (request.args.get("ids") or "").strip()
    ids = [x.strip() for x in raw.split(",") if x.strip()]
    if not ids:
        return jsonify({"stats": {}})
    stats = fetch_stats_by_ids(db, ids[:100])
    return jsonify({"stats": stats})


@bp.route("/<assessment_id>/stats/refresh", methods=["POST"])
@require_counselor
def refresh_assessment_list_stats(assessment_id):
    """단일 assessment listStats 강제 재계산."""
    db = get_firestore()
    ref, doc = _get_owned_assessment(db, assessment_id)
    if not doc:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404
    stats = recompute_and_persist_assessment_list_stats(db, doc.id)
    return jsonify({"assessmentId": doc.id, "listStats": stats})


def _assessment_status_active(d: dict) -> bool:
    return (d.get("status") or "active") == "active"


def _owned_assessment_from_doc(doc):
    """문서가 현재 상담사 소유·활성이면 (ref, doc), 아니면 (None, None)."""
    if not doc.exists:
        return None, None
    d = doc.to_dict() or {}
    if not resource_owned_by_scope(d.get("counselorId")):
        return None, None
    if not _assessment_status_active(d):
        return None, None
    return doc.reference, doc


def _find_owned_assessment_by_access_code(db, access_code: str, *, include_archived: bool = False):
    """accessCode + counselorId 로 assessment 조회."""
    code = normalize_access_code(access_code)
    if not is_valid_access_code(code):
        return None, None
    scoped_uid = scope_counselor_uid()
    refs_query = db.collection(ASSESSMENTS_COLLECTION).where("accessCode", "==", code)
    if scoped_uid:
        refs_query = refs_query.where("counselorId", "==", scoped_uid)
    refs = refs_query.limit(5).get()
    for doc in refs:
        d = doc.to_dict() or {}
        if not resource_owned_by_scope(d.get("counselorId")):
            continue
        status = d.get("status") or "active"
        if status == "active" or (include_archived and status == "archived"):
            return doc.reference, doc
    return None, None


def _get_owned_assessment(db, assessment_id, *, access_code_hint: str = ""):
    """상담사 소유 + 활성 문서. doc id 우선, 실패 시 accessCode(경로·쿼리) fallback."""
    raw = (assessment_id or "").strip()
    if raw:
        ref, doc = _owned_assessment_from_doc(
            db.collection(ASSESSMENTS_COLLECTION).document(raw).get()
        )
        if doc:
            return ref, doc
        if is_valid_access_code(normalize_access_code(raw)):
            ref, doc = _find_owned_assessment_by_access_code(db, raw)
            if doc:
                return ref, doc

    hint = (access_code_hint or "").strip()
    if hint:
        return _find_owned_assessment_by_access_code(db, hint)
    return None, None


def _get_owned_assessment_for_delete(db, assessment_id, *, access_code_hint: str = ""):
    """삭제용: 활성 우선 조회, 없으면 archived(이미 삭제됨)도 반환."""
    ref, doc = _get_owned_assessment(db, assessment_id, access_code_hint=access_code_hint)
    if doc:
        return ref, doc

    raw = (assessment_id or "").strip()
    if raw:
        doc = db.collection(ASSESSMENTS_COLLECTION).document(raw).get()
        if doc.exists:
            d = doc.to_dict() or {}
            if resource_owned_by_scope(d.get("counselorId")) and (d.get("status") or "active") == "archived":
                return doc.reference, doc
        if is_valid_access_code(normalize_access_code(raw)):
            ref, doc = _find_owned_assessment_by_access_code(db, raw, include_archived=True)
            if doc:
                return ref, doc

    hint = (access_code_hint or "").strip()
    if hint:
        return _find_owned_assessment_by_access_code(db, hint, include_archived=True)
    return None, None


@bp.route("/<assessment_id>", methods=["GET"])
@require_counselor
def get_assessment(assessment_id):
    """상담사: 단일 상담(코드)(세트) 조회 (수정 폼용)."""
    db = get_firestore()
    access_code_hint = (request.args.get("accessCode") or "").strip()
    ref, doc = _get_owned_assessment(db, assessment_id, access_code_hint=access_code_hint)
    if not doc:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404
    out = _serialize_doc(doc)
    _strip_join_secrets_for_counselor_api(out)
    return jsonify(out)


@bp.route("/<assessment_id>", methods=["PUT"])
@require_counselor
def update_assessment(assessment_id):
    """상담사: 상담(코드) 세트 메타데이터 수정. accessCode·counselorId 는 변경 불가."""
    body = request.get_json() or {}
    title = (body.get("title") or "").strip()
    target_audience = body.get("targetAudience", "개인")
    if target_audience not in ("개인", "그룹"):
        target_audience = "개인"
    welcome_message = (body.get("welcomeMessage") or "").strip()
    usage_end_date = _normalize_usage_end_date(body.get("usageEndDate"))
    code_category = (body.get("codeCategory") or body.get("code_category") or "").strip()
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
    if not code_category:
        return jsonify({"error": "Bad Request", "message": "codeCategory required"}), 400
    if code_category not in VALID_CODE_CATEGORIES:
        return jsonify({"error": "Bad Request", "message": "invalid codeCategory"}), 400

    db = get_firestore()
    access_code_hint = (body.get("accessCode") or request.args.get("accessCode") or "").strip()
    ref, doc = _get_owned_assessment(db, assessment_id, access_code_hint=access_code_hint)
    if not doc:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404

    existing = doc.to_dict() or {}
    search_source = {
        **existing,
        "title": title,
        "targetAudience": target_audience,
        "welcomeMessage": welcome_message,
        "codeCategory": code_category,
        "testList": test_list,
    }
    ref.update(
        {
            "title": title,
            "targetAudience": target_audience,
            "welcomeMessage": welcome_message,
            "usageEndDate": usage_end_date or "",
            "codeCategory": code_category,
            "testList": test_list,
            "updatedAt": SERVER_TIMESTAMP,
            "searchTokens": build_assessment_search_tokens(search_source),
        }
    )
    touch_assessment_list_stats(db, assessment_id)
    return jsonify({"assessmentId": assessment_id, "message": "updated"})


@bp.route("/<assessment_id>", methods=["DELETE"])
@require_counselor
def delete_assessment(assessment_id):
    """상담사: 상담(코드) 세트 비활성화(soft delete, status=archived). 내담자 신규 접속 불가."""
    db = get_firestore()
    access_code_hint = (request.args.get("accessCode") or "").strip()
    ref, doc = _get_owned_assessment_for_delete(db, assessment_id, access_code_hint=access_code_hint)
    if not doc:
        return jsonify({"error": "Not Found", "message": "Assessment not found"}), 404

    data = doc.to_dict() or {}
    resolved_id = doc.id
    if (data.get("status") or "active") == "archived":
        return jsonify({"assessmentId": resolved_id, "message": "already_archived"})

    ref.update({"status": "archived", "archivedAt": SERVER_TIMESTAMP})
    from utils.deletion_records import archive_portals_for_assessment

    scoped_uid = scope_counselor_uid()
    owner_uid = (data.get("counselorId") or scoped_uid or g.counselor_uid)
    archive_portals_for_assessment(
        db, counselor_uid=owner_uid, assessment_id=resolved_id
    )
    return jsonify({"assessmentId": resolved_id, "message": "archived"})


@bp.route("/archived", methods=["GET"])
@require_counselor
def list_archived_assessments_route():
    from utils.deletion_records import list_archived_assessments

    db = get_firestore()
    scoped_uid = scope_counselor_uid()
    items = list_archived_assessments(db, counselor_uid=scoped_uid)
    if scoped_uid is None:
        from utils.counselor_emails import attach_counselor_emails

        attach_counselor_emails(db, items)
    return jsonify({"assessments": items})


@bp.route("/archived/restore", methods=["POST"])
@require_counselor
def restore_archived_assessments_route():
    from utils.deletion_records import restore_archived_assessments

    body = request.get_json(silent=True) or {}
    assessment_ids = body.get("assessmentIds") or []
    if not isinstance(assessment_ids, list) or not assessment_ids:
        return jsonify({"error": "Bad Request", "message": "assessmentIds가 필요합니다."}), 400
    db = get_firestore()
    scoped_uid = scope_counselor_uid()
    result = restore_archived_assessments(
        db,
        counselor_uid=scoped_uid,
        assessment_ids=[str(x).strip() for x in assessment_ids if str(x).strip()],
    )
    return jsonify(result)


@bp.route("/archived/permanent-delete", methods=["POST"])
@require_counselor
def permanent_delete_archived_assessments_route():
    from utils.deletion_records import permanently_delete_archived_assessments

    body = request.get_json(silent=True) or {}
    assessment_ids = body.get("assessmentIds") or []
    if not isinstance(assessment_ids, list) or not assessment_ids:
        return jsonify({"error": "Bad Request", "message": "assessmentIds가 필요합니다."}), 400
    db = get_firestore()
    scoped_uid = scope_counselor_uid()
    result = permanently_delete_archived_assessments(
        db,
        counselor_uid=scoped_uid,
        assessment_ids=[str(x).strip() for x in assessment_ids if str(x).strip()],
    )
    return jsonify(result)


@bp.route("/<assessment_id>/progress", methods=["GET"])
@require_counselor
def get_progress(assessment_id):
    """상담사: 해당 assessment의 진행 현황 (testResults를 clientUid 기준 그룹화)."""
    try:
        db = get_firestore()
        ass_ref = db.collection(ASSESSMENTS_COLLECTION).document(assessment_id)
        ass = ass_ref.get()
        ass_data = ass.to_dict() or {} if ass.exists else {}
        if not ass.exists or not resource_owned_by_scope(ass_data.get("counselorId")):
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
    if not ass.exists or not resource_owned_by_scope((ass.to_dict() or {}).get("counselorId")):
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
    """내담자(공개): 활성 상담(코드)(accessCode)만으로 세트 정보 반환. (구문서의 joinPinHash는 검증하지 않음)"""
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
    """구형 클라이언트 호환: 활성 상담(코드)로 공개 메타만 조회."""
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
