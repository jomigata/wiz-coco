# 기관(Org Admin) API — B2B 대시보드·일괄발송·그룹 리포트
from flask import Blueprint, request, jsonify, g

from firebase_init import get_firestore
from auth_middleware import require_org_admin
from config import BULK_PORTAL_MAX_ROWS, BULK_PORTAL_SYNC_MAX, BULK_PORTAL_BATCH_SIZE, COMMERCE_CREDITS_ENFORCE
from utils.organizations import get_organization
from utils.org_credits import get_org_balance, consume_org_credits, list_org_ledger
from utils.org_group_report import build_anonymous_group_report, list_org_cohort_summaries
from utils.org_cohort_templates import (
    create_org_cohort_template,
    delete_org_cohort_template,
    list_org_cohort_templates,
)
from utils.bulk_portal_worker import (
    create_bulk_job,
    create_portal_for_row,
    get_bulk_job_status,
    new_cohort_id,
    prepare_bulk_assessment,
    process_bulk_job_batch,
)
from utils.phone_format import normalize_recipient_phone
from routes.client_portals import _create_magic_link_token

bp = Blueprint("org", __name__, url_prefix="/api/org")


@bp.route("/me", methods=["GET"])
@require_org_admin
def org_me():
    db = get_firestore()
    org_id = g.organization_id
    org = get_organization(db, org_id) or {}
    balance = get_org_balance(db, org_id)
    ledger = list_org_ledger(db, org_id, limit=int(request.args.get("limit", 15)))
    cohorts = list_org_cohort_summaries(db, organization_id=org_id)
    return jsonify(
        {
            "organizationId": org_id,
            "organization": org,
            "creditBalance": balance,
            "enforceCredits": COMMERCE_CREDITS_ENFORCE,
            "cohorts": cohorts,
            "ledger": ledger,
        }
    )


@bp.route("/dashboard", methods=["GET"])
@require_org_admin
def org_dashboard():
    db = get_firestore()
    org_id = g.organization_id
    return jsonify(
        {
            "organizationId": org_id,
            "creditBalance": get_org_balance(db, org_id),
            "cohorts": list_org_cohort_summaries(db, organization_id=org_id),
        }
    )


@bp.route("/cohorts/<cohort_id>/group-report", methods=["GET"])
@require_org_admin
def org_group_report(cohort_id: str):
    db = get_firestore()
    try:
        report = build_anonymous_group_report(
            db,
            organization_id=g.organization_id,
            cohort_id=cohort_id,
        )
    except ValueError as exc:
        return jsonify({"error": "Not Found", "message": str(exc)}), 404
    return jsonify(report)


@bp.route("/bulk", methods=["POST"])
@require_org_admin
def org_bulk_create():
    """기관 선결제 크레딧으로 내담자 포털 일괄 생성 (내담자 0원)."""
    body = request.get_json() or {}
    cohort_name = (body.get("cohortName") or "").strip()
    rows = body.get("rows") or []
    title = (body.get("title") or cohort_name or "기관 검사").strip()
    welcome_message = (body.get("welcomeMessage") or "").strip()
    usage_end_date = (body.get("usageEndDate") or "").strip()
    test_list = body.get("testList") or []
    queue_notify = bool(body.get("queueNotify"))

    if not cohort_name:
        return jsonify({"error": "Bad Request", "message": "cohortName(학급/부서명)이 필요합니다."}), 400
    if not isinstance(rows, list) or not rows:
        return jsonify({"error": "Bad Request", "message": "rows가 필요합니다."}), 400
    if len(rows) > BULK_PORTAL_MAX_ROWS:
        return jsonify({"error": "Bad Request", "message": f"최대 {BULK_PORTAL_MAX_ROWS}명까지 가능합니다."}), 400

    test_list = [
        {"testId": str(t.get("testId", "")), "name": str(t.get("name", ""))}
        for t in test_list
        if t and t.get("testId")
    ]
    if not test_list:
        return jsonify({"error": "Bad Request", "message": "testList가 필요합니다."}), 400

    db = get_firestore()
    org_id = g.organization_id
    counselor_uid = g.liaison_counselor_uid
    credit_required = len(rows)

    if COMMERCE_CREDITS_ENFORCE:
        balance = get_org_balance(db, org_id)
        if balance < credit_required:
            return (
                jsonify(
                    {
                        "error": "Payment Required",
                        "message": f"기관 크레딧 부족 (보유 {balance}, 필요 {credit_required})",
                        "balance": balance,
                        "required": credit_required,
                    }
                ),
                402,
            )

    cohort_id = new_cohort_id()
    try:
        assessment_ref_id, join_access_code, cohort_id = prepare_bulk_assessment(
            db,
            counselor_uid=counselor_uid,
            title=title,
            welcome_message=welcome_message,
            usage_end_date=usage_end_date,
            test_list=test_list,
            existing_assessment_id="",
            cohort_id=cohort_id,
            cohort_name=cohort_name,
            organization_id=org_id,
            prepaid_by_org=True,
        )
    except (PermissionError, ValueError) as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400

    normalized_rows = [
        {
            "displayName": (row.get("displayName") or row.get("name") or "").strip() or "내담자",
            "email": (row.get("email") or "").strip().lower(),
            "phone": normalize_recipient_phone((row.get("phone") or "").strip()),
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
            scheduled_at_iso="",
            organization_id=org_id,
        )
        process_bulk_job_batch(
            db,
            job_id,
            batch_size=BULK_PORTAL_BATCH_SIZE,
            max_seconds=20.0,
            create_magic_link=_create_magic_link_token,
        )
        credit_info = consume_org_credits(
            db,
            org_id,
            credit_required,
            reason="org_bulk_async",
            actor_uid=g.org_admin_uid,
            metadata={"jobId": job_id, "cohortId": cohort_id},
        )
        status = get_bulk_job_status(db, job_id, counselor_uid=counselor_uid) or {}
        return jsonify({"async": True, "jobId": job_id, "cohortId": cohort_id, "credits": credit_info, **status}), 202

    created = []
    notify_queued = notify_sent = notify_failed = 0
    immediate = queue_notify and len(normalized_rows) <= BULK_PORTAL_SYNC_MAX
    for row in normalized_rows:
        created_row, queued, sent, failed = create_portal_for_row(
            db,
            row=row,
            counselor_uid=counselor_uid,
            cohort_id=cohort_id,
            cohort_name=cohort_name,
            assessment_ref_id=assessment_ref_id,
            join_access_code=join_access_code,
            queue_notify=queue_notify,
            scheduled_at_iso="",
            bulk_job_id="",
            create_magic_link=_create_magic_link_token,
            immediate_notify=immediate,
            organization_id=org_id,
        )
        created.append(created_row)
        if queued:
            notify_queued += 1
        notify_sent += sent
        notify_failed += failed

    credit_info = consume_org_credits(
        db,
        org_id,
        len(created),
        reason="org_bulk_sync",
        actor_uid=g.org_admin_uid,
        metadata={"cohortId": cohort_id, "assessmentId": assessment_ref_id},
    )

    return jsonify(
        {
            "async": False,
            "prepaidByOrg": True,
            "cohortId": cohort_id,
            "cohortName": cohort_name,
            "assessmentId": assessment_ref_id,
            "created": created,
            "credits": credit_info,
            "notifyQueued": notify_queued,
            "notifySent": notify_sent,
            "notifyFailed": notify_failed,
        }
    ), 201


@bp.route("/cohort-templates", methods=["GET"])
@require_org_admin
def org_list_cohort_templates():
    """기관 cohort 검사 세트 프리셋 목록 (T-5-01)."""
    db = get_firestore()
    templates = list_org_cohort_templates(db, g.organization_id)
    return jsonify({"templates": templates})


@bp.route("/cohort-templates", methods=["POST"])
@require_org_admin
def org_create_cohort_template():
    body = request.get_json(silent=True) or {}
    db = get_firestore()
    try:
        template = create_org_cohort_template(
            db,
            g.organization_id,
            name=(body.get("name") or "").strip(),
            title=(body.get("title") or "").strip(),
            welcome_message=(body.get("welcomeMessage") or "").strip(),
            usage_end_date=(body.get("usageEndDate") or "").strip(),
            test_list=body.get("testList") or [],
            actor_uid=g.org_admin_uid,
        )
    except ValueError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400
    return jsonify(template), 201


@bp.route("/cohort-templates/<template_id>", methods=["DELETE"])
@require_org_admin
def org_delete_cohort_template(template_id: str):
    db = get_firestore()
    if not delete_org_cohort_template(db, g.organization_id, template_id):
        return jsonify({"error": "Not Found", "message": "템플릿을 찾을 수 없습니다."}), 404
    return jsonify({"ok": True})
