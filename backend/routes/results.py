# 결과 제출/조회/수정/삭제 (POST, GET, PUT, DELETE)
from flask import Blueprint, request, jsonify
from firebase_admin.firestore import SERVER_TIMESTAMP
from datetime import datetime, timezone

from firebase_init import get_firestore
from auth_middleware import get_bearer_uid, get_bearer_email_optional
from rate_limit import limit_access_code, limit_password_api
from config import ASSESSMENTS_COLLECTION, TEST_RESULTS_COLLECTION, JOIN_PARTICIPANTS_COLLECTION
from utils.password import verify_password
from utils.scoring import compute_result_data
from utils.access_code import normalize_access_code, is_valid_access_code
from utils.guest_auth import get_guest_session_from_request
from utils.participant_auth import get_participant_session_from_request
from utils.portal_auth import get_portal_session_from_request
from utils.join_portal_issue import try_issue_portal_for_participant
from utils.portal_assessment_access import portal_can_use_assessment, get_portal_doc
from utils.portal_linking import get_portal_ecosystem_ids, result_visible_to_portal_ecosystem
from utils.test_result_queries import query_results_shared_to_assessment

bp = Blueprint("results", __name__, url_prefix="/api/results")
MSG_ACCESS_CODE_EXPIRED = "검사코드 사용기한이 종료되었습니다. 상담사에게 새 코드 발급을 요청해 주세요."


def _iso_timestamp(value) -> str | None:
    if value is None:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


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


def _portal_owns_result(portal_id: str | None, d: dict) -> bool:
    if not portal_id:
        return False
    return portal_id == (d.get("portalId") or "").strip()


def _participant_owns_result(participant_id: str | None, d: dict) -> bool:
    if not participant_id:
        return False
    return participant_id == (d.get("participantId") or "").strip()


def _token_owns_result(token_uid: str | None, token_email: str | None, d: dict, portal_id: str | None = None, participant_id: str | None = None) -> bool:
    """
    신규: clientUid 또는 portalId 기준 소유권 확인.
    레거시: clientUid 없는 문서에 한해 clientEmail로 소유권 확인(이메일 클레임이 있을 때만).
    """
    if _portal_owns_result(portal_id, d):
        return True
    if _participant_owns_result(participant_id, d):
        return True
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
    내담자: Portal 세션 또는 Firebase ID 토큰.
    Portal: accessCode, testId, responses — portalId로 소유권 저장.
    Firebase: clientUid(토큰 uid) 기준 저장.
    """
    body = request.get_json() or {}
    access_code = normalize_access_code(body.get("accessCode") or "")
    test_id = (body.get("testId") or "").strip()
    portal_session = get_portal_session_from_request()
    participant_session = get_participant_session_from_request()
    guest_session = get_guest_session_from_request()
    client_uid = get_bearer_uid() if not portal_session and not participant_session and not guest_session else None
    client_email = get_bearer_email_optional() if not portal_session and not participant_session and not guest_session else None
    responses = body.get("responses")

    db = get_firestore()

    if portal_session:
        portal_id = (portal_session.get("portalId") or "").strip()
        if not portal_id or not portal_can_use_assessment(db, portal_id, access_code):
            return jsonify({"error": "Forbidden", "message": "이 검사에 접근할 수 없습니다."}), 403
    elif participant_session:
        token_code = normalize_access_code(participant_session.get("accessCode") or "")
        if token_code != access_code:
            return jsonify({"error": "Forbidden", "message": "검사 코드가 세션과 일치하지 않습니다."}), 403
    elif guest_session:
        token_code = normalize_access_code(guest_session.get("accessCode") or "")
        if token_code != access_code:
            return jsonify({"error": "Forbidden", "message": "검사 코드가 세션과 일치하지 않습니다."}), 403
    elif not client_uid:
        return jsonify(
            {
                "error": "Unauthorized",
                "message": "검사를 시작하려면 검사코드를 다시 입력해 주세요.",
            }
        ), 401
    if not is_valid_access_code(access_code):
        return jsonify({"error": "Bad Request", "message": "invalid accessCode format"}), 400
    if not test_id:
        return jsonify({"error": "Bad Request", "message": "testId required"}), 400
    if responses is None:
        return jsonify({"error": "Bad Request", "message": "responses required"}), 400

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
        "status": "completed",
        "responses": responses,
        "resultData": result_data,
        "completedAt": SERVER_TIMESTAMP,
        "submittedAt": SERVER_TIMESTAMP,
    }
    if portal_session:
        data["portalId"] = (portal_session.get("portalId") or "").strip()
    elif participant_session:
        data["participantId"] = (participant_session.get("participantId") or "").strip()
        pref = db.collection(JOIN_PARTICIPANTS_COLLECTION).document(data["participantId"]).get()
        if pref.exists:
            pd = pref.to_dict() or {}
            data["clientEmail"] = pd.get("email", "")
            data["clientProfile"] = {
                "displayName": pd.get("displayName", ""),
                "birthYear": pd.get("birthYear"),
                "gender": pd.get("gender", ""),
                "region": pd.get("region", ""),
                "phone": pd.get("phone", ""),
            }
    elif guest_session:
        data["guestId"] = (guest_session.get("guestId") or "").strip()
    else:
        data["clientUid"] = client_uid
        if client_email:
            data["clientEmail"] = client_email
    ref = db.collection(TEST_RESULTS_COLLECTION).document()
    ref.set(data)

    portal_issued = None
    if participant_session:
        portal_issued = try_issue_portal_for_participant(
            db,
            (participant_session.get("participantId") or "").strip(),
            assessment_id,
        )

    payload = {
        "resultId": ref.id,
        "message": "Result submitted.",
    }
    if portal_issued and portal_issued.get("credentialsSent"):
        payload["portalCredentialsSent"] = True
        payload["portalMessage"] = portal_issued.get("message", "")

    return jsonify(payload), 201


@bp.route("", methods=["GET"])
@limit_access_code
def list_results():
    """accessCode + Participant/Portal 세션 또는 Firebase uid로 testResults 목록."""
    access_code = normalize_access_code(request.args.get("accessCode") or "")
    portal_session = get_portal_session_from_request()
    participant_session = get_participant_session_from_request()
    guest_session = get_guest_session_from_request()
    client_uid = get_bearer_uid() if not portal_session and not participant_session and not guest_session else None
    token_email = get_bearer_email_optional() if not portal_session and not participant_session and not guest_session else None

    db = get_firestore()

    if portal_session:
        portal_id = (portal_session.get("portalId") or "").strip()
        if not portal_can_use_assessment(db, portal_id, access_code):
            return jsonify({"error": "Forbidden", "message": "이 검사에 접근할 수 없습니다."}), 403
    elif participant_session:
        token_code = normalize_access_code(participant_session.get("accessCode") or "")
        if token_code != access_code:
            return jsonify({"error": "Forbidden", "message": "검사 코드가 세션과 일치하지 않습니다."}), 403
    elif guest_session:
        token_code = normalize_access_code(guest_session.get("accessCode") or "")
        if token_code != access_code:
            return jsonify({"error": "Forbidden", "message": "검사 코드가 세션과 일치하지 않습니다."}), 403
    elif not client_uid:
        return jsonify(
            {"error": "Unauthorized", "message": "참여 세션이 필요합니다."}
        ), 401
    if not is_valid_access_code(access_code):
        return jsonify({"error": "Bad Request", "message": "accessCode required"}), 400

    if portal_session:
        portal_id = (portal_session.get("portalId") or "").strip()
        portal_doc = get_portal_doc(db, portal_id)
        join_participant_id = ""
        if portal_doc:
            join_participant_id = (portal_doc.to_dict() or {}).get("joinParticipantId") or ""

        seen = set()
        items = []

        def _append(doc, *, is_shared: bool = False, source_access_code: str = ""):
            if doc.id in seen:
                return
            seen.add(doc.id)
            d = doc.to_dict()
            item = {
                "resultId": doc.id,
                "testId": d.get("testId"),
                "status": d.get("status"),
                "completedAt": _iso_timestamp(d.get("completedAt")),
                "submittedAt": _iso_timestamp(d.get("submittedAt") or d.get("completedAt")),
                "updatedAt": _iso_timestamp(d.get("updatedAt")),
            }
            if is_shared:
                item["isShared"] = True
                item["sourceAccessCode"] = source_access_code or d.get("accessCode", "")
            items.append(item)

        ass_refs = (
            db.collection(ASSESSMENTS_COLLECTION)
            .where("accessCode", "==", access_code)
            .where("status", "==", "active")
            .limit(1)
            .get()
        )
        assessment_id = ass_refs[0].id if ass_refs else ""

        for doc in (
            db.collection(TEST_RESULTS_COLLECTION)
            .where("accessCode", "==", access_code)
            .where("portalId", "==", portal_id)
            .get()
        ):
            _append(doc)

        ecosystem = get_portal_ecosystem_ids(db, portal_id)
        for pid in ecosystem:
            if pid == portal_id:
                continue
            for doc in (
                db.collection(TEST_RESULTS_COLLECTION)
                .where("accessCode", "==", access_code)
                .where("portalId", "==", pid)
                .get()
            ):
                _append(doc)

        if join_participant_id:
            for doc in (
                db.collection(TEST_RESULTS_COLLECTION)
                .where("accessCode", "==", access_code)
                .where("participantId", "==", join_participant_id)
                .get()
            ):
                _append(doc)

        if assessment_id:
            for doc in query_results_shared_to_assessment(db, assessment_id):
                d = doc.to_dict() or {}
                if not result_visible_to_portal_ecosystem(db, portal_id, d):
                    continue
                _append(doc, is_shared=True, source_access_code=d.get("accessCode", ""))

        return jsonify({"results": items})

    if guest_session:
        guest_id = (guest_session.get("guestId") or "").strip()
        refs = (
            db.collection(TEST_RESULTS_COLLECTION)
            .where("accessCode", "==", access_code)
            .where("guestId", "==", guest_id)
            .get()
        )
        items = []
        for doc in refs or []:
            d = doc.to_dict()
            items.append({
                "resultId": doc.id,
                "testId": d.get("testId"),
                "status": d.get("status"),
                "completedAt": d.get("completedAt").isoformat() if d.get("completedAt") and hasattr(d["completedAt"], "isoformat") else None,
            })
        return jsonify({"results": items})

    if participant_session:
        participant_id = (participant_session.get("participantId") or "").strip()
        refs = (
            db.collection(TEST_RESULTS_COLLECTION)
            .where("accessCode", "==", access_code)
            .where("participantId", "==", participant_id)
            .get()
        )
        items = []
        for doc in refs or []:
            d = doc.to_dict()
            items.append({
                "resultId": doc.id,
                "testId": d.get("testId"),
                "status": d.get("status"),
                "completedAt": d.get("completedAt").isoformat() if d.get("completedAt") and hasattr(d["completedAt"], "isoformat") else None,
            })
        return jsonify({"results": items})

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

    def _assessment_snapshot(aid):
        """캐시된 검사 세트 제목 및 사용최종일(마이페이지 목록 표시용)."""
        if not aid:
            return None, None
        if aid in assessment_cache:
            return assessment_cache[aid]
        ad = db.collection(ASSESSMENTS_COLLECTION).document(str(aid)).get()
        data = ad.to_dict() or {} if ad.exists else {}
        title = data.get("title")
        usage_raw = str(data.get("usageEndDate") or "").strip()
        usage_end = usage_raw or None
        assessment_cache[aid] = (title, usage_end)
        return assessment_cache[aid]

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
        atitle, usage_end = _assessment_snapshot(aid)
        items.append({
            "resultId": doc.id,
            "accessCode": d.get("accessCode"),
            "assessmentId": aid,
            "assessmentTitle": atitle,
            "usageEndDate": usage_end,
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
        atitle, usage_end = _assessment_snapshot(aid)
        items.append({
            "resultId": doc.id,
            "accessCode": d.get("accessCode"),
            "assessmentId": aid,
            "assessmentTitle": atitle,
            "usageEndDate": usage_end,
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
    portal_session = get_portal_session_from_request()
    token_uid = get_bearer_uid() if not portal_session else None
    token_email = get_bearer_email_optional() if not portal_session else None
    portal_id = (portal_session.get("portalId") or "").strip() if portal_session else None

    db = get_firestore()
    ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = doc.to_dict()

    if _token_owns_result(token_uid, token_email, d, portal_id):
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

    if portal_id and result_visible_to_portal_ecosystem(db, portal_id, d):
        return jsonify({
            "resultId": doc.id,
            "testId": d.get("testId"),
            "responses": d.get("responses"),
            "clientEmail": d.get("clientEmail"),
            "resultData": d.get("resultData"),
            "accessCode": d.get("accessCode"),
            "assessmentId": d.get("assessmentId"),
            "isShared": True,
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
    portal_session = get_portal_session_from_request()
    token_uid = get_bearer_uid() if not portal_session else None
    token_email = get_bearer_email_optional() if not portal_session else None
    portal_id = (portal_session.get("portalId") or "").strip() if portal_session else None

    if responses is None:
        return jsonify({"error": "Bad Request", "message": "responses required"}), 400

    db = get_firestore()
    ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = doc.to_dict()

    if _token_owns_result(token_uid, token_email, d, portal_id):
        pass
    elif _legacy_password_valid(d, password):
        pass
    else:
        if not _token_owns_result(token_uid, token_email, d, portal_id) and d.get("passwordHash") and not password:
            return jsonify({"error": "Bad Request", "message": "password required"}), 400
        return jsonify({"error": "Forbidden", "message": "Invalid password or not owner"}), 403

    result_data = compute_result_data(d.get("testId", ""), responses if isinstance(responses, (dict, list)) else {})
    update_payload = {
        "responses": responses,
        "resultData": result_data,
        "status": "completed",
        "updatedAt": SERVER_TIMESTAMP,
    }
    if not d.get("submittedAt"):
        update_payload["submittedAt"] = d.get("completedAt") or SERVER_TIMESTAMP
    ref.update(update_payload)
    return jsonify({"resultId": result_id, "message": "Updated"})


@bp.route("/<result_id>", methods=["DELETE"])
@limit_password_api
def delete_result(result_id):
    """소유자(Bearer) 또는 레거시 password로 삭제."""
    body = request.get_json() or {} if request.is_json else {}
    password = (body.get("password") or "").strip()
    portal_session = get_portal_session_from_request()
    token_uid = get_bearer_uid() if not portal_session else None
    token_email = get_bearer_email_optional() if not portal_session else None
    portal_id = (portal_session.get("portalId") or "").strip() if portal_session else None

    db = get_firestore()
    ref = db.collection(TEST_RESULTS_COLLECTION).document(result_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Not Found", "message": "Result not found"}), 404
    d = doc.to_dict()

    if _token_owns_result(token_uid, token_email, d, portal_id):
        ref.delete()
        return jsonify({"message": "Deleted"}), 200
    if _legacy_password_valid(d, password):
        ref.delete()
        return jsonify({"message": "Deleted"}), 200

    if d.get("passwordHash") and not password:
        return jsonify({"error": "Bad Request", "message": "password required"}), 400
    return jsonify({"error": "Forbidden", "message": "Invalid password or not owner"}), 403
