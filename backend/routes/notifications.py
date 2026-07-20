# 통지 큐 워커 — 관리자 또는 Cron Secret
from functools import wraps

from flask import Blueprint, jsonify, request, g

from auth_middleware import get_bearer_uid, get_bearer_email_optional, require_counselor
from config import NOTIFICATION_CRON_SECRET, USERS_COLLECTION, BOOTSTRAP_ADMIN_EMAILS
from firebase_init import get_firestore
from utils.notification_worker import process_notification_queue
from utils.bulk_portal_worker import process_pending_bulk_jobs
from utils.cohort_reminder_worker import process_cohort_incomplete_reminders
from utils.individual_reminder_worker import process_individual_incomplete_reminders
from utils.care_reminder_worker import process_care_due_reminders
from utils.notification_channels import get_notification_channel_status
from utils.kakao_alimtalk import (
    get_alimtalk_setup_info,
    send_care_assignment_alimtalk,
    send_portal_credentials_alimtalk,
    send_test_reminder_alimtalk,
)
from utils.assessment_dispatch import send_test_reminders
from utils.portal_magic import create_portal_magic_link_token
from config import BULK_PORTAL_BATCH_SIZE

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def _cron_or_admin_authorized() -> bool:
    secret = (request.headers.get("X-Notification-Cron-Secret") or "").strip()
    if NOTIFICATION_CRON_SECRET and secret and secret == NOTIFICATION_CRON_SECRET:
        return True

    uid = get_bearer_uid()
    if not uid:
        return False
    try:
        db = get_firestore()
        doc = db.collection(USERS_COLLECTION).document(uid).get()
        role = (doc.to_dict() or {}).get("role") if doc.exists else None
        if role == "admin":
            return True
        email = get_bearer_email_optional()
        if email and email in BOOTSTRAP_ADMIN_EMAILS:
            return True
    except Exception:
        pass
    return False


def require_cron_or_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not _cron_or_admin_authorized():
            return jsonify({"error": "Forbidden", "message": "Admin or cron secret required"}), 403
        return f(*args, **kwargs)

    return decorated


@bp.route("/status", methods=["GET"])
def notification_status():
    """알림 채널·Cron 설정 상태 (Wave 6)."""
    return jsonify(get_notification_channel_status())


@bp.route("/alimtalk/templates", methods=["GET"])
@require_cron_or_admin
def alimtalk_templates():
    """Solapi 알림톡 템플릿 등록 가이드 (비밀값 미포함)."""
    return jsonify(get_alimtalk_setup_info())


@bp.route("/alimtalk/test", methods=["POST"])
@require_cron_or_admin
def alimtalk_test():
    """관리자·Cron용 알림톡 테스트 발송."""
    body = request.get_json(silent=True) or {}
    template = (body.get("template") or "testReminder").strip()
    to_phone = (body.get("phone") or body.get("toPhone") or "").strip()
    if not to_phone:
        return jsonify({"error": "Bad Request", "message": "phone이 필요합니다."}), 400

    display_name = (body.get("displayName") or "테스트").strip()
    magic_url = (body.get("magicUrl") or "").strip()

    if template == "careAssignment":
        ok, err = send_care_assignment_alimtalk(
            to_phone=to_phone,
            display_name=display_name,
            assignment_title=(body.get("title") or "테스트 치료·과제").strip(),
            magic_url=magic_url,
        )
    elif template == "portalCredentials":
        ok, err = send_portal_credentials_alimtalk(
            to_phone=to_phone,
            display_name=display_name,
            access_code=(body.get("accessCode") or "TEST01").strip(),
            pin=(body.get("pin") or "1234").strip(),
            join_access_code=(body.get("joinAccessCode") or "JOIN01").strip(),
            magic_url=magic_url,
        )
    else:
        ok, err, _gid = send_test_reminder_alimtalk(
            to_phone=to_phone,
            display_name=display_name,
            assessment_title=(body.get("title") or "테스트 심리검사").strip(),
            magic_url=magic_url,
            pending_summary=(body.get("pending") or "미완료 검사 1건").strip(),
        )

    if ok:
        return jsonify({"ok": True, "template": template, "sentVia": "kakao_alimtalk"})
    return jsonify({"ok": False, "template": template, "error": err or "alimtalk_send_failed"}), 502


@bp.route("/process", methods=["POST"])
@require_cron_or_admin
def process_queue():
    body = request.get_json(silent=True) or {}
    limit = min(int(body.get("limit") or 50), 200)
    notify_result = process_notification_queue(limit=limit)
    bulk_result = process_pending_bulk_jobs(
        get_firestore(),
        limit=min(int(body.get("bulkJobLimit") or 3), 10),
        batch_size=BULK_PORTAL_BATCH_SIZE,
        max_seconds=25.0,
        create_magic_link=create_portal_magic_link_token,
    )
    return jsonify({"notifications": notify_result, "bulkPortalJobs": bulk_result})


@bp.route("/cohort-reminders", methods=["POST"])
@require_cron_or_admin
def process_cohort_reminders():
    """그룹 미완료 자동 리마인더 — 일 1회 Cron 권장."""
    body = request.get_json(silent=True) or {}
    limit = min(int(body.get("limit") or 40), 100)
    min_hours = body.get("minHours")
    try:
        min_hours = int(min_hours) if min_hours is not None else None
    except (TypeError, ValueError):
        min_hours = None
    result = process_cohort_incomplete_reminders(
        get_firestore(),
        limit=limit,
        min_hours=min_hours,
    )
    return jsonify(result)


@bp.route("/individual-reminders", methods=["POST"])
@require_cron_or_admin
def process_individual_reminders():
    """개별 내담자 미완료 자동 리마인더 (Wave 6)."""
    body = request.get_json(silent=True) or {}
    limit = min(int(body.get("limit") or 40), 100)
    min_hours = body.get("minHours")
    try:
        min_hours = int(min_hours) if min_hours is not None else None
    except (TypeError, ValueError):
        min_hours = None
    result = process_individual_incomplete_reminders(
        get_firestore(),
        limit=limit,
        min_hours=min_hours,
    )
    return jsonify(result)


@bp.route("/care-reminders", methods=["POST"])
@require_cron_or_admin
def process_care_reminders():
    """치료·과제 마감 리마인더 (Wave 6)."""
    body = request.get_json(silent=True) or {}
    limit = min(int(body.get("limit") or 30), 80)
    min_hours = body.get("minHours")
    try:
        min_hours = int(min_hours) if min_hours is not None else None
    except (TypeError, ValueError):
        min_hours = None
    result = process_care_due_reminders(
        get_firestore(),
        limit=limit,
        min_hours=min_hours,
    )
    return jsonify(result)


@bp.route("/reminders/assessment", methods=["POST"])
@require_counselor
def counselor_assessment_reminders():
    """상담사 수동 검사 리마인더 (Wave 6 — w6-reminder-api)."""
    body = request.get_json(silent=True) or {}
    assessment_id = (body.get("assessmentId") or "").strip()
    portal_ids = body.get("portalIds") or []
    if not assessment_id:
        return jsonify({"error": "Bad Request", "message": "assessmentId가 필요합니다."}), 400
    if not isinstance(portal_ids, list) or not portal_ids:
        return jsonify({"error": "Bad Request", "message": "portalIds가 필요합니다."}), 400
    db = get_firestore()
    try:
        result = send_test_reminders(
            db,
            assessment_id=assessment_id,
            counselor_uid=g.counselor_uid,
            portal_ids=[str(x).strip() for x in portal_ids if str(x).strip()],
        )
    except PermissionError as exc:
        return jsonify({"error": "Forbidden", "message": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": "Not Found", "message": str(exc)}), 404
    return jsonify(result)
