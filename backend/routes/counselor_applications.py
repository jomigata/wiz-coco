"""상담사 전환 승인 신청 — 관리자·신청자 알림."""
from flask import Blueprint, jsonify, request

from auth_middleware import get_bearer_uid, require_admin
from utils.email_notify import (
    send_counselor_application_admin_email,
    send_counselor_application_result_email,
)

bp = Blueprint("counselor_applications", __name__)


@bp.route("/api/counselor-applications/notify", methods=["POST"])
def notify_admin():
    uid = get_bearer_uid()
    if not uid:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    application_id = str(data.get("applicationId") or "").strip()
    if not application_id:
        return jsonify({"success": False, "error": "applicationId required"}), 400

    emailed = send_counselor_application_admin_email(
        application_id=application_id,
        applicant_name=str(data.get("applicantName") or ""),
        applicant_email=str(data.get("applicantEmail") or ""),
        phone=str(data.get("phone") or ""),
        specialization=data.get("specialization") if isinstance(data.get("specialization"), list) else [],
        practice_type=str(data.get("practiceType") or ""),
        organization_name=str(data.get("organizationName") or ""),
    )

    return jsonify({"success": True, "emailed": emailed})


@bp.route("/api/counselor-applications/notify-result", methods=["POST"])
@require_admin
def notify_applicant_result():
    data = request.get_json(silent=True) or {}
    applicant_email = str(data.get("applicantEmail") or "").strip()
    if not applicant_email:
        return jsonify({"success": False, "error": "applicantEmail required"}), 400

    approved = bool(data.get("approved"))
    emailed = send_counselor_application_result_email(
        applicant_email=applicant_email,
        applicant_name=str(data.get("applicantName") or ""),
        approved=approved,
        review_notes=str(data.get("reviewNotes") or ""),
    )

    return jsonify({"success": True, "emailed": emailed})
