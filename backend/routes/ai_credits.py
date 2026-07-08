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
