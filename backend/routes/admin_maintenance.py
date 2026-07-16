# 운영 데이터 초기화 — Cron Secret 또는 admin
from functools import wraps

from flask import Blueprint, jsonify, request

from auth_middleware import get_bearer_uid, get_bearer_email_optional
from config import BOOTSTRAP_ADMIN_EMAILS, NOTIFICATION_CRON_SECRET, USERS_COLLECTION
from firebase_init import get_firestore
from utils.purge_assessment_data import purge_assessment_platform_data

bp = Blueprint("admin_maintenance", __name__, url_prefix="/api/admin")


def _authorized() -> bool:
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


def require_admin_or_cron(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not _authorized():
            return jsonify({"error": "Forbidden", "message": "Admin or cron secret required"}), 403
        return f(*args, **kwargs)

    return decorated


@bp.route("/purge-assessment-data", methods=["POST"])
@require_admin_or_cron
def purge_assessment_data():
    """
    검사코드(assessments) 및 연동 내담자 검사 기록 일괄 삭제.
    body: { "dryRun": false, "includeAllTestResults": true, "confirm": "PURGE" }
    """
    body = request.get_json(silent=True) or {}
    dry_run = bool(body.get("dryRun"))
    include_all = bool(body.get("includeAllTestResults", True))
    confirm = (body.get("confirm") or "").strip()
    if not dry_run and confirm != "PURGE":
        return jsonify(
            {
                "error": "Bad Request",
                "message": '실행하려면 body.confirm="PURGE" 를 포함하세요. 미리보기는 dryRun=true.',
            }
        ), 400

    db = get_firestore()
    result = purge_assessment_platform_data(
        db,
        dry_run=dry_run,
        include_all_test_results=include_all,
    )
    return jsonify(result)


@bp.route("/permanently-deleted", methods=["GET"])
@require_admin_or_cron
def list_permanently_deleted():
    from utils.deletion_records import list_permanently_deleted_records

    db = get_firestore()
    return jsonify(list_permanently_deleted_records(db))


@bp.route("/permanently-deleted/restore", methods=["POST"])
@require_admin_or_cron
def restore_permanently_deleted():
    from utils.deletion_records import restore_permanently_deleted_records

    body = request.get_json(silent=True) or {}
    assessment_ids = body.get("assessmentIds") or []
    portal_ids = body.get("portalIds") or []
    db = get_firestore()
    result = restore_permanently_deleted_records(
        db,
        assessment_ids=[str(x).strip() for x in assessment_ids if str(x).strip()],
        portal_ids=[str(x).strip() for x in portal_ids if str(x).strip()],
    )
    return jsonify(result)


@bp.route("/permanently-deleted/purge", methods=["POST"])
@require_admin_or_cron
def purge_permanently_deleted():
    from utils.deletion_records import purge_permanently_deleted_records

    body = request.get_json(silent=True) or {}
    confirm = (body.get("confirm") or "").strip()
    if confirm != "PURGE":
        return jsonify(
            {"error": "Bad Request", "message": '실행하려면 body.confirm="PURGE" 가 필요합니다.'}
        ), 400
    assessment_ids = body.get("assessmentIds") or []
    portal_ids = body.get("portalIds") or []
    db = get_firestore()
    result = purge_permanently_deleted_records(
        db,
        assessment_ids=[str(x).strip() for x in assessment_ids if str(x).strip()],
        portal_ids=[str(x).strip() for x in portal_ids if str(x).strip()],
    )
    return jsonify(result)
