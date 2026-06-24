# 내담자 포털: 1인 1 accessCode+PIN, 매직 링크, 일괄 초대
import csv
import io
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify, g
from firebase_admin.firestore import SERVER_TIMESTAMP
from utils.portal_auth import get_portal_session_from_request
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from config import (
    SECRET_KEY,
    ASSESSMENTS_COLLECTION,
    CLIENT_PORTALS_COLLECTION,
    PORTAL_MAGIC_LINK_MAX_AGE,
    PORTAL_SESSION_MAX_AGE,
    PORTAL_SESSION_REMEMBER_MAX_AGE,
    BULK_PORTAL_MAX_ROWS,
    BULK_PORTAL_SYNC_MAX,
    BULK_PORTAL_BATCH_SIZE,
)
from firebase_init import get_firestore
from auth_middleware import require_counselor
from rate_limit import limit_access_code
from utils.access_code import (
    normalize_access_code,
    is_valid_access_code,
)
from utils.portal_linking import (
    link_my_code_to_portal,
    list_linked_portal_summaries,
    share_result_to_assessment,
    get_portal_ecosystem_ids,
)
from utils.my_code import normalize_my_code, is_valid_my_code
from utils.portal_assessment_access import link_shared_assessment_to_portal, get_portal_doc
from utils.password import hash_password, verify_password
from utils.portal_magic import create_portal_magic_link_token, verify_portal_magic_link_token
from utils.bulk_portal_worker import (
    create_bulk_job,
    create_portal_for_row,
    get_bulk_job_status,
    load_bulk_job_created_rows,
    new_cohort_id,
    prepare_bulk_assessment,
    process_bulk_job_batch,
    resend_job_notifications,
    resend_cohort_notifications,
)

bp = Blueprint("client_portals", __name__, url_prefix="/api/client-portals")

MSG_INVALID_CREDENTIALS = "나의코드 또는 비밀번호를 확인해 주세요."
MSG_PORTAL_NOT_FOUND = "나의코드를 찾을 수 없습니다."


def _serializer(salt: str):
    return URLSafeTimedSerializer(SECRET_KEY, salt=salt)


def _issue_portal_token(portal_id: str, access_code: str, remember: bool = False) -> str:
    max_age = PORTAL_SESSION_REMEMBER_MAX_AGE if remember else PORTAL_SESSION_MAX_AGE
    return _serializer("portal-session").dumps(
        {"portalId": portal_id, "accessCode": access_code, "maxAge": max_age}
    )



def _find_portal_by_access_code(db, code: str):
    refs = (
        db.collection(CLIENT_PORTALS_COLLECTION)
        .where("accessCode", "==", code)
        .where("status", "==", "active")
        .limit(1)
        .get()
    )
    return refs[0] if refs else None


def _load_assessments_for_portal(db, portal_doc):
    d = portal_doc.to_dict()
    assigned = list(d.get("assignedAssessmentIds") or [])
    linked = list(d.get("linkedAssessmentIds") or [])
    ids = list(dict.fromkeys(assigned + linked))
    items = []
    for aid in ids:
        adoc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
        if not adoc.exists:
            continue
        a = adoc.to_dict()
        if a.get("status") != "active":
            continue
        is_linked = aid in linked and aid not in assigned
        issue_type = "shared" if is_linked else (a.get("issueType") or "individual")
        items.append(
            {
                "assessmentId": adoc.id,
                "title": a.get("title", ""),
                "welcomeMessage": a.get("welcomeMessage", ""),
                "usageEndDate": a.get("usageEndDate", ""),
                "testList": a.get("testList", []),
                "accessCode": a.get("accessCode", ""),
                "issueType": issue_type,
                "isLinkedShared": is_linked,
            }
        )
    return items


def _load_assessments_for_portal_ecosystem(db, primary_portal_id: str):
    """현재 + 연결된 나의코드의 검사코드 목록(중복 assessment 제거)."""
    items = []
    seen = set()
    for pid in get_portal_ecosystem_ids(db, primary_portal_id):
        pdoc = get_portal_doc(db, pid)
        if not pdoc:
            continue
        pd = pdoc.to_dict() or {}
        source_code = pd.get("accessCode", "")
        for item in _load_assessments_for_portal(db, pdoc):
            aid = item.get("assessmentId")
            if not aid or aid in seen:
                continue
            seen.add(aid)
            enriched = dict(item)
            enriched["sourcePortalId"] = pid
            enriched["sourceMyCode"] = source_code
            enriched["isFromLinkedPortal"] = pid != primary_portal_id
            items.append(enriched)
    return items


def _portal_public_json(portal_doc, assessments=None):
    d = portal_doc.to_dict()
    assigned = []
    if assessments is not None:
        assigned = [{"assessmentId": a["assessmentId"], "title": a.get("title", "")} for a in assessments]
    else:
        for aid in d.get("assignedAssessmentIds") or []:
            assigned.append({"assessmentId": aid})
    return {
        "id": portal_doc.id,
        "accessCode": d.get("accessCode", ""),
        "displayName": d.get("displayName", ""),
        "counselorId": d.get("counselorId", ""),
        "assignedAssessments": assigned,
    }


@bp.route("/login", methods=["POST"])
@limit_access_code
def portal_login():
    body = request.get_json() or {}
    code = normalize_my_code(body.get("accessCode") or "")
    pin = "".join(c for c in str(body.get("pin") or "") if c.isdigit())[:4]
    remember = bool(body.get("remember"))

    if not is_valid_my_code(code):
        return jsonify({"error": "Bad Request", "message": MSG_INVALID_CREDENTIALS}), 400

    db = get_firestore()
    portal_doc = _find_portal_by_access_code(db, code)

    if portal_doc:
        d = portal_doc.to_dict()
        pin_hash = d.get("pinHash") or ""
        if not pin_hash or not verify_password(pin, pin_hash):
            return jsonify({"error": "Unauthorized", "message": MSG_INVALID_CREDENTIALS}), 401
        assessments = _load_assessments_for_portal(db, portal_doc)
        portal_doc.reference.update({"lastLoginAt": SERVER_TIMESTAMP})
        token = _issue_portal_token(portal_doc.id, code, remember)
        return jsonify(
            {
                "portalToken": token,
                "rememberDays": 30 if remember else 1,
                "portal": _portal_public_json(portal_doc, assessments),
            }
        )

    # 공유 검사코드는 검사 시작 전용 — 내 검사실은 개인 포털(코드+PIN)로만 접속
    return jsonify({"error": "Not Found", "message": MSG_PORTAL_NOT_FOUND}), 404


@bp.route("/me", methods=["GET"])
def portal_me():
    payload = get_portal_session_from_request()
    if not payload:
        return jsonify({"error": "Unauthorized", "message": "세션이 만료되었습니다."}), 401

    portal_id = payload.get("portalId") or ""
    db = get_firestore()

    if portal_id.startswith("legacy:"):
        aid = portal_id.split(":", 1)[1]
        adoc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
        if not adoc.exists:
            return jsonify({"error": "Not Found", "message": MSG_PORTAL_NOT_FOUND}), 404
        a = adoc.to_dict()
        assessments = [
            {
                "assessmentId": aid,
                "title": a.get("title", ""),
                "welcomeMessage": a.get("welcomeMessage", ""),
                "usageEndDate": a.get("usageEndDate", ""),
                "testList": a.get("testList", []),
                "accessCode": a.get("accessCode", ""),
            }
        ]
        return jsonify(
            {
                "id": portal_id,
                "accessCode": a.get("accessCode", ""),
                "displayName": a.get("title", ""),
                "counselorId": a.get("counselorId", ""),
                "assignedAssessments": [{"assessmentId": aid, "title": a.get("title", "")}],
                "assessments": assessments,
            }
        )

    pdoc = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).get()
    if not pdoc.exists:
        return jsonify({"error": "Not Found", "message": MSG_PORTAL_NOT_FOUND}), 404
    assessments = _load_assessments_for_portal_ecosystem(db, portal_id)
    linked_portals = list_linked_portal_summaries(db, portal_id)
    return jsonify(
        {
            **_portal_public_json(pdoc, assessments),
            "assessments": assessments,
            "linkedPortals": linked_portals,
        }
    )


@bp.route("/magic-link/verify", methods=["POST"])
@limit_access_code
def verify_magic_link():
    body = request.get_json() or {}
    token = (body.get("token") or "").strip()
    if not token:
        return jsonify({"error": "Bad Request", "message": "링크가 유효하지 않습니다."}), 400
    try:
        data = verify_portal_magic_link_token(token)
    except SignatureExpired:
        return jsonify({"error": "Gone", "message": "링크가 만료되었습니다. 담당자에게 새 링크를 요청해 주세요."}), 410
    except BadSignature:
        return jsonify({"error": "Bad Request", "message": "링크가 유효하지 않습니다."}), 400

    portal_id = data.get("portalId")
    code = data.get("accessCode")
    db = get_firestore()
    pdoc = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).get()
    if not pdoc.exists:
        return jsonify({"error": "Not Found", "message": MSG_PORTAL_NOT_FOUND}), 404
    assessments = _load_assessments_for_portal(db, pdoc)
    session_token = _issue_portal_token(portal_id, code, remember=False)
    pdoc.reference.update({"lastLoginAt": SERVER_TIMESTAMP})
    return jsonify(
        {
            "portalToken": session_token,
            "rememberDays": 1,
            "portal": _portal_public_json(pdoc, assessments),
        }
    )


def _create_magic_link_token(portal_id: str, access_code: str) -> str:
    return create_portal_magic_link_token(portal_id, access_code)


@bp.route("/link-assessment", methods=["POST"])
@limit_access_code
def link_shared_assessment():
    """포털에 공유 검사코드(세트) 연결."""
    payload = get_portal_session_from_request()
    if not payload:
        return jsonify({"error": "Unauthorized", "message": "세션이 만료되었습니다."}), 401

    body = request.get_json() or {}
    shared_code = normalize_access_code(
        body.get("sharedAccessCode") or body.get("accessCode") or ""
    )
    if not is_valid_access_code(shared_code):
        return jsonify({"error": "Bad Request", "message": "공유 검사코드 형식이 올바르지 않습니다."}), 400

    db = get_firestore()
    portal_id = (payload.get("portalId") or "").strip()
    ok, message, assessment_id = link_shared_assessment_to_portal(db, portal_id, shared_code)
    if not ok:
        return jsonify({"error": "Bad Request", "message": message}), 400

    pdoc = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).get()
    assessments = _load_assessments_for_portal_ecosystem(db, portal_id) if pdoc.exists else []
    return jsonify(
        {
            "message": message,
            "assessmentId": assessment_id,
            "assessments": assessments,
            "linkedPortals": list_linked_portal_summaries(db, portal_id),
        }
    )


@bp.route("/link-my-code", methods=["POST"])
@limit_access_code
def link_my_code():
    """다른 나의코드+PIN을 현재 세션 포털에 연결."""
    payload = get_portal_session_from_request()
    if not payload:
        return jsonify({"error": "Unauthorized", "message": "세션이 만료되었습니다."}), 401

    body = request.get_json() or {}
    my_code = normalize_my_code(body.get("accessCode") or body.get("myCode") or "")
    pin = "".join(c for c in str(body.get("pin") or "") if c.isdigit())[:4]
    if not is_valid_my_code(my_code):
        return jsonify({"error": "Bad Request", "message": "나의코드 형식을 확인해 주세요."}), 400

    db = get_firestore()
    portal_id = (payload.get("portalId") or "").strip()
    ok, message = link_my_code_to_portal(db, portal_id, my_code, pin)
    if not ok:
        return jsonify({"error": "Bad Request", "message": message}), 400

    assessments = _load_assessments_for_portal_ecosystem(db, portal_id)
    return jsonify(
        {
            "message": message,
            "assessments": assessments,
            "linkedPortals": list_linked_portal_summaries(db, portal_id),
        }
    )


@bp.route("/share-result", methods=["POST"])
@limit_access_code
def share_result():
    """완료된 검사 결과를 다른 검사코드(assessment)에 공유."""
    payload = get_portal_session_from_request()
    if not payload:
        return jsonify({"error": "Unauthorized", "message": "세션이 만료되었습니다."}), 401

    body = request.get_json() or {}
    result_id = (body.get("resultId") or "").strip()
    target_code = normalize_access_code(
        body.get("targetAccessCode") or body.get("sharedAccessCode") or body.get("accessCode") or ""
    )
    if not result_id:
        return jsonify({"error": "Bad Request", "message": "resultId가 필요합니다."}), 400
    if not target_code:
        return jsonify({"error": "Bad Request", "message": "공유할 검사코드를 입력해 주세요."}), 400

    db = get_firestore()
    portal_id = (payload.get("portalId") or "").strip()
    ok, message = share_result_to_assessment(db, portal_id, result_id, target_code)
    if not ok:
        return jsonify({"error": "Bad Request", "message": message}), 400
    return jsonify({"message": message, "resultId": result_id, "targetAccessCode": target_code})


@bp.route("/bulk", methods=["POST"])
@require_counselor
def bulk_create():
    """상담사: CSV/행 목록으로 내담자 포털 + 검사 세트 일괄 생성."""
    body = request.get_json() or {}
    cohort_name = (body.get("cohortName") or body.get("cohort_name") or "일괄 초대").strip()
    rows = body.get("rows") or []
    title = (body.get("title") or "").strip()
    welcome_message = (body.get("welcomeMessage") or "").strip()
    usage_end_date = (body.get("usageEndDate") or "").strip()
    test_list = body.get("testList") or []
    queue_notify = bool(body.get("queueNotify"))
    scheduled_at_raw = (body.get("scheduledAt") or "").strip()
    scheduled_at_iso = ""

    if scheduled_at_raw and queue_notify:
        try:
            sched = datetime.fromisoformat(scheduled_at_raw.replace("Z", "+00:00"))
            if sched.tzinfo is None:
                sched = sched.replace(tzinfo=timezone.utc)
            if sched <= datetime.now(timezone.utc):
                return (
                    jsonify({"error": "Bad Request", "message": "예약 발송 시각은 현재 이후여야 합니다."}),
                    400,
                )
            scheduled_at_iso = sched.astimezone(timezone.utc).isoformat()
        except ValueError:
            return jsonify({"error": "Bad Request", "message": "예약 발송 시각 형식이 올바르지 않습니다."}), 400

    if not title:
        return jsonify({"error": "Bad Request", "message": "검사 세트 제목(title)이 필요합니다."}), 400
    if not isinstance(rows, list) or not rows:
        return jsonify({"error": "Bad Request", "message": "초대할 내담자 목록(rows)이 필요합니다."}), 400
    if len(rows) > BULK_PORTAL_MAX_ROWS:
        return (
            jsonify(
                {
                    "error": "Bad Request",
                    "message": f"한 번에 최대 {BULK_PORTAL_MAX_ROWS}명까지 생성할 수 있습니다.",
                }
            ),
            400,
        )

    test_list = [
        {"testId": str(t.get("testId", "")), "name": str(t.get("name", ""))}
        for t in test_list
        if t and t.get("testId")
    ]

    db = get_firestore()
    cohort_id = new_cohort_id()
    counselor_uid = g.counselor_uid
    existing_assessment_id = (body.get("assessmentId") or "").strip()

    try:
        assessment_ref_id, join_access_code, cohort_id = prepare_bulk_assessment(
            db,
            counselor_uid=counselor_uid,
            title=title,
            welcome_message=welcome_message,
            usage_end_date=usage_end_date,
            test_list=test_list,
            existing_assessment_id=existing_assessment_id,
            cohort_id=cohort_id,
        )
    except PermissionError as exc:
        return jsonify({"error": "Forbidden", "message": str(exc)}), 403
    except ValueError as exc:
        msg = str(exc)
        code = 404 if "찾을 수 없" in msg else 400
        return jsonify({"error": "Bad Request" if code == 400 else "Not Found", "message": msg}), code

    normalized_rows = [
        {
            "displayName": (row.get("displayName") or row.get("name") or "").strip() or "내담자",
            "email": (row.get("email") or "").strip().lower(),
            "phone": (row.get("phone") or "").strip(),
        }
        for row in rows
    ]

    if len(normalized_rows) > BULK_PORTAL_SYNC_MAX:
        job_id = create_bulk_job(
            db,
            counselor_uid=counselor_uid,
            cohort_name=cohort_name,
            cohort_id=cohort_id,
            assessment_id=assessment_ref_id,
            join_access_code=join_access_code,
            rows=normalized_rows,
            queue_notify=queue_notify,
            scheduled_at_iso=scheduled_at_iso,
        )
        process_bulk_job_batch(
            db,
            job_id,
            batch_size=BULK_PORTAL_BATCH_SIZE,
            max_seconds=20.0,
            create_magic_link=_create_magic_link_token,
        )
        status = get_bulk_job_status(db, job_id, counselor_uid=counselor_uid) or {}
        return (
            jsonify(
                {
                    "async": True,
                    "jobId": job_id,
                    "cohortId": cohort_id,
                    "cohortName": cohort_name,
                    "assessmentId": assessment_ref_id,
                    "joinAccessCode": join_access_code,
                    "notifyQueued": status.get("notifyQueued", 0),
                    "scheduledAt": scheduled_at_iso or None,
                    **status,
                }
            ),
            202,
        )

    created = []
    notify_queued = 0
    for row in normalized_rows:
        created_row, queued = create_portal_for_row(
            db,
            row=row,
            counselor_uid=counselor_uid,
            cohort_id=cohort_id,
            cohort_name=cohort_name,
            assessment_ref_id=assessment_ref_id,
            join_access_code=join_access_code,
            queue_notify=queue_notify,
            scheduled_at_iso=scheduled_at_iso,
            bulk_job_id="",
            create_magic_link=_create_magic_link_token,
        )
        created.append(created_row)
        if queued:
            notify_queued += 1

    return jsonify(
        {
            "async": False,
            "cohortId": cohort_id,
            "cohortName": cohort_name,
            "assessmentId": assessment_ref_id,
            "joinAccessCode": join_access_code,
            "created": created,
            "notifySent": 0,
            "notifyFailed": 0,
            "notifyQueued": notify_queued,
            "scheduledAt": scheduled_at_iso or None,
        }
    ), 201


@bp.route("/bulk/jobs/<job_id>", methods=["GET"])
@require_counselor
def get_bulk_job(job_id):
    """대량 발급 job 진행률 — 폴링 시 배치 처리도 함께 진행."""
    db = get_firestore()
    counselor_uid = g.counselor_uid
    status = get_bulk_job_status(db, job_id, counselor_uid=counselor_uid)
    if not status:
        return jsonify({"error": "Not Found", "message": "작업을 찾을 수 없습니다."}), 404

    if status.get("status") in ("pending", "running"):
        process_bulk_job_batch(
            db,
            job_id,
            batch_size=BULK_PORTAL_BATCH_SIZE,
            max_seconds=25.0,
            create_magic_link=_create_magic_link_token,
        )
        status = get_bulk_job_status(db, job_id, counselor_uid=counselor_uid) or status

    return jsonify(status)


@bp.route("/bulk/jobs/<job_id>/result", methods=["GET"])
@require_counselor
def get_bulk_job_result(job_id):
    db = get_firestore()
    counselor_uid = g.counselor_uid
    status = get_bulk_job_status(db, job_id, counselor_uid=counselor_uid)
    if not status:
        return jsonify({"error": "Not Found", "message": "작업을 찾을 수 없습니다."}), 404
    if status.get("status") != "completed":
        return jsonify({"error": "Conflict", "message": "아직 발급이 완료되지 않았습니다.", "status": status}), 409

    created = load_bulk_job_created_rows(db, job_id, counselor_uid=counselor_uid)
    return jsonify(
        {
            **status,
            "created": created,
            "cohortId": status.get("cohortId"),
            "cohortName": status.get("cohortName"),
            "joinAccessCode": status.get("joinAccessCode"),
            "notifyQueued": status.get("notifyQueued", 0),
        }
    )


@bp.route("/bulk/jobs/<job_id>/resend-notifications", methods=["POST"])
@require_counselor
def resend_bulk_job_notifications(job_id):
    db = get_firestore()
    try:
        result = resend_job_notifications(db, job_id, counselor_uid=g.counselor_uid)
    except PermissionError as exc:
        return jsonify({"error": "Forbidden", "message": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": "Not Found", "message": str(exc)}), 404
    return jsonify(result)


@bp.route("/bulk/resend-notifications", methods=["POST"])
@require_counselor
def resend_bulk_notifications():
    body = request.get_json(silent=True) or {}
    job_id = (body.get("jobId") or "").strip()
    cohort_id = (body.get("cohortId") or "").strip()
    db = get_firestore()
    try:
        if job_id:
            result = resend_job_notifications(db, job_id, counselor_uid=g.counselor_uid)
        elif cohort_id:
            result = resend_cohort_notifications(db, cohort_id, counselor_uid=g.counselor_uid)
        else:
            return jsonify({"error": "Bad Request", "message": "jobId 또는 cohortId가 필요합니다."}), 400
    except PermissionError as exc:
        return jsonify({"error": "Forbidden", "message": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": "Not Found", "message": str(exc)}), 404
    return jsonify(result)


@bp.route("/bulk/export-csv", methods=["POST"])
@require_counselor
def bulk_export_csv():
    """생성 결과를 CSV 문자열로 반환 (프론트 다운로드용)."""
    body = request.get_json() or {}
    rows = body.get("created") or []
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["이름", "이메일", "휴대폰", "검사코드", "나의코드", "비밀번호", "매직링크경로"])
    for r in rows:
        writer.writerow(
            [
                r.get("displayName", ""),
                r.get("email", ""),
                r.get("phone", ""),
                r.get("joinAccessCode", r.get("accessCode", "")),
                r.get("myCode", r.get("accessCode", "")),
                r.get("pin", ""),
                r.get("magicPath", ""),
            ]
        )
    return jsonify({"csv": buf.getvalue()})


@bp.route("/magic-link/create", methods=["POST"])
@require_counselor
def create_magic_link():
    body = request.get_json() or {}
    portal_id = (body.get("portalId") or "").strip()
    if not portal_id:
        return jsonify({"error": "Bad Request", "message": "portalId required"}), 400
    db = get_firestore()
    pdoc = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id).get()
    if not pdoc.exists:
        return jsonify({"error": "Not Found", "message": MSG_PORTAL_NOT_FOUND}), 404
    d = pdoc.to_dict()
    if d.get("counselorId") != g.counselor_uid:
        return jsonify({"error": "Forbidden", "message": "권한이 없습니다."}), 403
    code = d.get("accessCode", "")
    token = _create_magic_link_token(portal_id, code)
    return jsonify({"magicPath": f"/go/?t={token}", "accessCode": code})
