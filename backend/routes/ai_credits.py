"""AI 크레딧·토큰 사용 API — T-3-01 스키마, T-3-03 잔액."""
from flask import Blueprint, jsonify, request, g

from config import (
    AI_CREDITS_ENFORCE,
    AI_REPORTS_COLLECTION,
    AI_USAGE_LEDGER_COLLECTION,
    COUNSELOR_AI_CREDITS_COLLECTION,
    PILOT_FREE_AI_CREDITS,
)
from firebase_init import get_firestore
from auth_middleware import require_counselor, require_admin
from utils.ai_usage_schema import (
    SCHEMA_VERSION,
    AI_USAGE_FEATURES,
    AI_USAGE_REASONS,
    feature_label,
    AiUsageValidationError,
    validate_grant_payload,
)
from utils.counselor_ai_credits import (
    get_ai_balance,
    grant_ai_credits,
    list_ai_ledger,
)
from utils.ai_reports import get_ai_report, list_ai_reports_for_result
from utils.ai_usage_admin import (
    build_ai_usage_summary,
    get_admin_counselor_ai_detail,
    list_admin_ai_ledger,
)

bp = Blueprint("ai_credits", __name__, url_prefix="/api/ai")


@bp.route("/schema", methods=["GET"])
def ai_usage_schema():
    """스키마 버전·허용 enum — 클라이언트·문서 동기화용."""
    return jsonify(
        {
            "schemaVersion": SCHEMA_VERSION,
            "collections": {
                "counselorAiCredits": COUNSELOR_AI_CREDITS_COLLECTION,
                "aiUsageLedger": AI_USAGE_LEDGER_COLLECTION,
                "aiReports": AI_REPORTS_COLLECTION,
            },
            "enums": {
                "features": sorted(AI_USAGE_FEATURES),
                "reasons": sorted(AI_USAGE_REASONS),
            },
            "featureLabels": {f: feature_label(f) for f in sorted(AI_USAGE_FEATURES)},
            "walletPolicy": "separate",
            "creditUnit": "1 AI credit = abstract billing unit (not raw tokens)",
            "pilotFreeAiCredits": PILOT_FREE_AI_CREDITS,
            "enforceCredits": AI_CREDITS_ENFORCE,
            "docs": "/docs/AI_USAGE_SCHEMA.md",
            "implementedEndpoints": [
                "GET /api/ai/schema",
                "GET /api/ai/credits/me",
                "POST /api/ai/credits/grant",
                "GET /api/ai/reports",
                "GET /api/ai/reports/<report_id>",
                "GET /api/ai/admin/usage/summary",
                "GET /api/ai/admin/usage/ledger",
                "GET /api/ai/admin/credits/<counselor_uid>",
            ],
        }
    )


@bp.route("/credits/me", methods=["GET"])
@require_counselor
def ai_credits_me():
    """상담사 본인 AI 크레딧 잔액·최근 원장."""
    db = get_firestore()
    uid = g.counselor_uid
    limit = request.args.get("limit", 30, type=int)
    return jsonify(
        {
            "counselorUid": uid,
            "balance": get_ai_balance(db, uid),
            "enforceCredits": AI_CREDITS_ENFORCE,
            "pilotFreeAiCredits": PILOT_FREE_AI_CREDITS,
            "ledger": list_ai_ledger(db, uid, limit=limit or 30),
        }
    )


@bp.route("/credits/grant", methods=["POST"])
@require_admin
def ai_credits_grant():
    """관리자 — 상담사 AI 크레딧 지급."""
    try:
        payload = validate_grant_payload(request.get_json(silent=True))
    except AiUsageValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    db = get_firestore()
    result = grant_ai_credits(
        db,
        payload["counselorUid"],
        payload["amount"],
        reason=payload["reason"],
        actor_uid=g.counselor_uid,
        metadata=payload.get("metadata"),
    )
    return jsonify(result)


@bp.route("/reports", methods=["GET"])
@require_counselor
def ai_reports_list():
    """상담사 — resultId별 캐시된 AI 리포트 목록."""
    result_id = (request.args.get("resultId") or "").strip()
    feature = (request.args.get("feature") or "").strip() or None
    if not result_id:
        return jsonify({"error": "resultId query parameter required"}), 400
    db = get_firestore()
    reports = list_ai_reports_for_result(db, g.counselor_uid, result_id, feature=feature)
    return jsonify({"resultId": result_id, "reports": reports})


@bp.route("/reports/<report_id>", methods=["GET"])
@require_counselor
def ai_report_detail(report_id):
    """상담사 — AI 리포트 단건 조회 (재열람 무료)."""
    db = get_firestore()
    report = get_ai_report(db, g.counselor_uid, report_id)
    if not report:
        return jsonify({"error": "Not Found"}), 404
    return jsonify(report)


@bp.route("/admin/usage/summary", methods=["GET"])
@require_admin
def ai_admin_usage_summary():
    """관리자 — AI 사용량 월간·전체 요약."""
    month = (request.args.get("month") or "").strip() or None
    db = get_firestore()
    return jsonify(build_ai_usage_summary(db, month=month))


@bp.route("/admin/usage/ledger", methods=["GET"])
@require_admin
def ai_admin_usage_ledger():
    """관리자 — AI 원장 최근 내역."""
    month = (request.args.get("month") or "").strip() or None
    counselor_uid = (request.args.get("counselorUid") or "").strip() or None
    limit = request.args.get("limit", 50, type=int)
    db = get_firestore()
    return jsonify(
        {
            "items": list_admin_ai_ledger(
                db,
                month=month,
                counselor_uid=counselor_uid,
                limit=limit or 50,
            ),
        }
    )


@bp.route("/admin/credits/<counselor_uid>", methods=["GET"])
@require_admin
def ai_admin_counselor_credits(counselor_uid):
    """관리자 — 상담사 AI 잔액·원장 조회."""
    limit = request.args.get("limit", 30, type=int)
    db = get_firestore()
    return jsonify(get_admin_counselor_ai_detail(db, counselor_uid, ledger_limit=limit or 30))
