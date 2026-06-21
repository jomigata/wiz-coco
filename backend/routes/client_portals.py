# 내담자 포털: 1인 1 accessCode+PIN, 매직 링크, 일괄 초대
import csv
import io
import uuid
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
)
from firebase_init import get_firestore
from auth_middleware import require_counselor
from rate_limit import limit_access_code
from utils.access_code import (
    normalize_access_code,
    is_valid_access_code,
    generate_unique_portal_access_code,
)
from utils.password import generate_four_digit_password, hash_password, verify_password

bp = Blueprint("client_portals", __name__, url_prefix="/api/client-portals")

MSG_INVALID_CREDENTIALS = "검사 코드 또는 비밀번호를 확인해 주세요."
MSG_PORTAL_NOT_FOUND = "요청하신 검사 코드가 확인되지 않습니다."


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
    ids = d.get("assignedAssessmentIds") or []
    items = []
    for aid in ids:
        adoc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
        if not adoc.exists:
            continue
        a = adoc.to_dict()
        if a.get("status") != "active":
            continue
        items.append(
            {
                "assessmentId": adoc.id,
                "title": a.get("title", ""),
                "welcomeMessage": a.get("welcomeMessage", ""),
                "usageEndDate": a.get("usageEndDate", ""),
                "testList": a.get("testList", []),
                "accessCode": a.get("accessCode", ""),
            }
        )
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
    code = normalize_access_code(body.get("accessCode") or "")
    pin = "".join(c for c in str(body.get("pin") or "") if c.isdigit())[:4]
    remember = bool(body.get("remember"))

    if not is_valid_access_code(code):
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
    assessments = _load_assessments_for_portal(db, pdoc)
    return jsonify({**_portal_public_json(pdoc, assessments), "assessments": assessments})


@bp.route("/magic-link/verify", methods=["POST"])
@limit_access_code
def verify_magic_link():
    body = request.get_json() or {}
    token = (body.get("token") or "").strip()
    if not token:
        return jsonify({"error": "Bad Request", "message": "링크가 유효하지 않습니다."}), 400
    try:
        data = _serializer("portal-magic").loads(token, max_age=PORTAL_MAGIC_LINK_MAX_AGE)
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
    session_token = _issue_portal_token(portal_id, code, remember=True)
    pdoc.reference.update({"lastLoginAt": SERVER_TIMESTAMP})
    return jsonify(
        {
            "portalToken": session_token,
            "rememberDays": 30,
            "portal": _portal_public_json(pdoc, assessments),
        }
    )


def _create_magic_link_token(portal_id: str, access_code: str) -> str:
    return _serializer("portal-magic").dumps({"portalId": portal_id, "accessCode": access_code})


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

    scheduled_at = None
    if scheduled_at_raw:
        try:
            scheduled_at = datetime.fromisoformat(scheduled_at_raw.replace("Z", "+00:00"))
            if scheduled_at.tzinfo is None:
                scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
        except Exception:
            return jsonify({"error": "Bad Request", "message": "scheduledAt 형식이 올바르지 않습니다."}), 400

    if not title:
        return jsonify({"error": "Bad Request", "message": "검사 세트 제목(title)이 필요합니다."}), 400
    if not isinstance(rows, list) or not rows:
        return jsonify({"error": "Bad Request", "message": "초대할 내담자 목록(rows)이 필요합니다."}), 400
    if len(rows) > 500:
        return jsonify({"error": "Bad Request", "message": "한 번에 최대 500명까지 생성할 수 있습니다."}), 400

    test_list = [
        {"testId": str(t.get("testId", "")), "name": str(t.get("name", ""))}
        for t in test_list
        if t and t.get("testId")
    ]

    db = get_firestore()
    cohort_id = str(uuid.uuid4())
    counselor_uid = g.counselor_uid
    created = []
    notify_queue = db.collection("notificationQueue")

    for row in rows:
        display_name = (row.get("displayName") or row.get("name") or "").strip() or "내담자"
        email = (row.get("email") or "").strip().lower()
        phone = (row.get("phone") or "").strip()

        access_code = generate_unique_portal_access_code()
        pin = generate_four_digit_password()
        pin_hash = hash_password(pin)

        assessment_ref = db.collection(ASSESSMENTS_COLLECTION).document()
        assessment_ref.set(
            {
                "accessCode": access_code,
                "counselorId": counselor_uid,
                "title": title,
                "issueType": "individual",
                "targetAudience": "개인",
                "welcomeMessage": welcome_message,
                "usageEndDate": usage_end_date,
                "testList": test_list,
                "createdAt": SERVER_TIMESTAMP,
                "status": "active",
                "clientPortalCohortId": cohort_id,
            }
        )

        portal_ref = db.collection(CLIENT_PORTALS_COLLECTION).document()
        portal_ref.set(
            {
                "accessCode": access_code,
                "pinHash": pin_hash,
                "counselorId": counselor_uid,
                "displayName": display_name,
                "email": email,
                "phone": phone,
                "cohortId": cohort_id,
                "cohortName": cohort_name,
                "assignedAssessmentIds": [assessment_ref.id],
                "status": "active",
                "createdAt": SERVER_TIMESTAMP,
            }
        )

        magic = _create_magic_link_token(portal_ref.id, access_code)
        magic_path = f"/go?t={magic}"

        if queue_notify and (email or phone):
            queue_item = {
                "type": "portal_credentials",
                "portalId": portal_ref.id,
                "email": email,
                "phone": phone,
                "accessCode": access_code,
                "pin": pin,
                "magicPath": magic_path,
                "displayName": display_name,
                "status": "pending",
                "createdAt": SERVER_TIMESTAMP,
                "counselorId": counselor_uid,
            }
            if scheduled_at:
                queue_item["scheduledAt"] = scheduled_at.isoformat()
            notify_queue.add(queue_item)

        created.append(
            {
                "portalId": portal_ref.id,
                "displayName": display_name,
                "email": email,
                "phone": phone,
                "accessCode": access_code,
                "pin": pin,
                "magicPath": magic_path,
            }
        )

    return jsonify(
        {
            "cohortId": cohort_id,
            "cohortName": cohort_name,
            "created": created,
            "notifyQueued": sum(1 for c in created if queue_notify and (c.get("email") or c.get("phone"))),
        }
    ), 201


@bp.route("/bulk/export-csv", methods=["POST"])
@require_counselor
def bulk_export_csv():
    """생성 결과를 CSV 문자열로 반환 (프론트 다운로드용)."""
    body = request.get_json() or {}
    rows = body.get("created") or []
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["이름", "이메일", "휴대폰", "검사코드", "비밀번호", "매직링크경로"])
    for r in rows:
        writer.writerow(
            [
                r.get("displayName", ""),
                r.get("email", ""),
                r.get("phone", ""),
                r.get("accessCode", ""),
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
