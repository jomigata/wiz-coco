# 통지 큐 워커 — 관리자 또는 Cron Secret
from functools import wraps

from flask import Blueprint, jsonify, request

from auth_middleware import get_bearer_uid, get_bearer_email_optional
from config import NOTIFICATION_CRON_SECRET, USERS_COLLECTION, BOOTSTRAP_ADMIN_EMAILS
from firebase_init import get_firestore
from utils.notification_worker import process_notification_queue
from utils.bulk_portal_worker import process_pending_bulk_jobs
from utils.cohort_reminder_worker import process_cohort_incomplete_reminders
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
    """그룹 미완료 자동 리마인더 (T-5-02) — 일 1회 Cron 권장."""
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
