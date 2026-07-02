# 협회·상담사 수익화 API — 크레딧·카탈로그 (1단계)
from flask import Blueprint, request, jsonify, g

from firebase_init import get_firestore
from auth_middleware import require_counselor, require_admin
from config import USERS_COLLECTION, COMMERCE_CREDITS_ENFORCE, PILOT_FREE_CREDITS
from utils.counselor_credits import (
    get_balance,
    grant_credits,
    list_ledger,
    InsufficientCreditsError,
)

bp = Blueprint("commerce", __name__, url_prefix="/api/commerce")

# 프론트 monetizationCatalog.ts 와 동기화 (정적)
PUBLIC_CATALOG = {
    "pilotFreeCredits": PILOT_FREE_CREDITS,
    "channels": ["b2b2c", "b2b", "b2c"],
    "counselorProducts": [
        {
            "id": "pilot-50",
            "name": "파일럿 패키지",
            "priceLabel": f"무료 {PILOT_FREE_CREDITS}크레딧",
        },
        {"id": "counselor-starter", "name": "스타터", "priceLabel": "월 150,000원"},
        {"id": "counselor-pro", "name": "프로", "priceLabel": "월 250,000원"},
    ],
    "creditUnit": "1 credit = 1 client portal (one recipient)",
}


@bp.route("/catalog", methods=["GET"])
def get_catalog():
    return jsonify(PUBLIC_CATALOG)


@bp.route("/credits/me", methods=["GET"])
@require_counselor
def credits_me():
    db = get_firestore()
    uid = g.counselor_uid
    balance = get_balance(db, uid)
    ledger = list_ledger(db, uid, limit=int(request.args.get("limit", 20)))
    return jsonify(
        {
            "counselorUid": uid,
            "balance": balance,
            "enforceCredits": COMMERCE_CREDITS_ENFORCE,
            "pilotFreeCredits": PILOT_FREE_CREDITS,
            "ledger": ledger,
        }
    )


@bp.route("/credits/<counselor_uid>", methods=["GET"])
@require_admin
def credits_for_counselor(counselor_uid: str):
    db = get_firestore()
    uid = (counselor_uid or "").strip()
    if not uid:
        return jsonify({"error": "Bad Request", "message": "counselorUid required"}), 400
    balance = get_balance(db, uid)
    ledger = list_ledger(db, uid, limit=int(request.args.get("limit", 30)))
    user_doc = db.collection(USERS_COLLECTION).document(uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}
    return jsonify(
        {
            "counselorUid": uid,
            "balance": balance,
            "email": user_data.get("email") or "",
            "role": user_data.get("role") or "",
            "ledger": ledger,
        }
    )


@bp.route("/credits/grant", methods=["POST"])
@require_admin
def credits_grant():
    body = request.get_json() or {}
    counselor_uid = (body.get("counselorUid") or body.get("counselor_uid") or "").strip()
    try:
        amount = int(body.get("amount") or 0)
    except (TypeError, ValueError):
        amount = 0
    reason = (body.get("reason") or "admin_grant").strip()

    if not counselor_uid:
        return jsonify({"error": "Bad Request", "message": "counselorUid가 필요합니다."}), 400
    if amount <= 0 or amount > 100000:
        return jsonify({"error": "Bad Request", "message": "amount는 1~100000 사이여야 합니다."}), 400

    db = get_firestore()
    user_doc = db.collection(USERS_COLLECTION).document(counselor_uid).get()
    if not user_doc.exists:
        return jsonify({"error": "Not Found", "message": "해당 사용자를 찾을 수 없습니다."}), 404
    role = (user_doc.to_dict() or {}).get("role")
    if role not in ("counselor", "admin"):
        return (
            jsonify(
                {
                    "error": "Bad Request",
                    "message": "상담사(counselor) 또는 admin 역할 사용자에게만 지급할 수 있습니다.",
                }
            ),
            400,
        )

    try:
        result = grant_credits(
            db,
            counselor_uid,
            amount,
            reason=reason,
            actor_uid=g.admin_uid,
            metadata={"source": "admin_api"},
        )
    except ValueError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400

    return jsonify({"ok": True, **result})
