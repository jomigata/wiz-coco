# 협회·상담사 수익화 API — 크레딧·결제·정산 (1~2단계)
import logging

from flask import Blueprint, request, jsonify, g

from firebase_init import get_firestore
from auth_middleware import require_counselor, require_admin
from config import (
    USERS_COLLECTION,
    COMMERCE_CREDITS_ENFORCE,
    PILOT_FREE_CREDITS,
    TOSS_CLIENT_KEY,
    COMMERCE_MOCK_PAYMENTS,
    PLATFORM_FEE_RATE,
)
from data.commerce_products import get_product, public_catalog
from utils.counselor_credits import get_balance, grant_credits, list_ledger
from utils.commerce_orders import create_pending_order, get_order, mark_order_paid
from utils.toss_payments import (
    confirm_payment,
    is_toss_configured,
    verify_webhook_signature,
    parse_webhook_event,
)
from utils.commerce_fulfillment import fulfill_paid_order
from utils.payment_history import list_payments
from utils.commerce_settlement import build_settlement_summary

logger = logging.getLogger(__name__)

bp = Blueprint("commerce", __name__, url_prefix="/api/commerce")


def _serialize_order(order: dict) -> dict:
    out = dict(order)
    for key in ("createdAt", "paidAt", "fulfilledAt"):
        val = out.get(key)
        if val and hasattr(val, "isoformat"):
            out[key] = val.isoformat()
        elif val and hasattr(val, "timestamp"):
            from datetime import datetime

            out[key] = datetime.utcfromtimestamp(val.timestamp()).isoformat() + "Z"
    return out


def _complete_order_flow(
    db,
    order_id: str,
    *,
    payment_key: str,
    payment_method: str,
    provider: str,
    actor_uid: str | None,
) -> dict:
    order = get_order(db, order_id)
    if not order:
        raise ValueError("order_not_found")
    if order.get("counselorUid") != actor_uid and actor_uid:
        pass  # webhook uses order owner
    expected_amount = int(order.get("amount") or 0)
    if order.get("status") != "paid":
        mark_order_paid(
            db,
            order_id,
            toss_payment_key=payment_key,
            payment_method=payment_method,
        )
        order = get_order(db, order_id) or order
    fulfillment = fulfill_paid_order(
        db,
        order,
        payment_key=payment_key,
        payment_method=payment_method,
        provider=provider,
        actor_uid=actor_uid or order.get("counselorUid"),
    )
    return fulfillment


@bp.route("/catalog", methods=["GET"])
def get_catalog():
    return jsonify(
        {
            "pilotFreeCredits": PILOT_FREE_CREDITS,
            "channels": ["b2b2c", "b2b", "b2c"],
            "products": public_catalog(),
            "creditUnit": "1 credit = 1 client portal (one recipient)",
            "payments": {
                "tossConfigured": is_toss_configured(),
                "tossClientKey": TOSS_CLIENT_KEY or None,
                "mockEnabled": COMMERCE_MOCK_PAYMENTS,
            },
        }
    )


@bp.route("/credits/me", methods=["GET"])
@require_counselor
def credits_me():
    db = get_firestore()
    uid = g.counselor_uid
    balance = get_balance(db, uid)
    ledger = list_ledger(db, uid, limit=int(request.args.get("limit", 20)))
    sub_doc = db.collection("subscriptions").document(uid).get()
    subscription = sub_doc.to_dict() if sub_doc.exists else None
    return jsonify(
        {
            "counselorUid": uid,
            "balance": balance,
            "enforceCredits": COMMERCE_CREDITS_ENFORCE,
            "pilotFreeCredits": PILOT_FREE_CREDITS,
            "subscription": subscription,
            "ledger": ledger,
            "payments": {
                "tossClientKey": TOSS_CLIENT_KEY or None,
                "mockEnabled": COMMERCE_MOCK_PAYMENTS,
            },
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
    sub_doc = db.collection("subscriptions").document(uid).get()
    return jsonify(
        {
            "counselorUid": uid,
            "balance": balance,
            "email": user_data.get("email") or "",
            "role": user_data.get("role") or "",
            "subscription": sub_doc.to_dict() if sub_doc.exists else None,
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


@bp.route("/checkout/prepare", methods=["POST"])
@require_counselor
def checkout_prepare():
    body = request.get_json() or {}
    product_id = (body.get("productId") or "").strip()
    product = get_product(product_id)
    if not product:
        return jsonify({"error": "Bad Request", "message": "유효하지 않은 상품입니다."}), 400

    db = get_firestore()
    order = create_pending_order(db, counselor_uid=g.counselor_uid, product=product)
    return jsonify(
        {
            "ok": True,
            "orderId": order["orderId"],
            "amount": order["amount"],
            "orderName": order["orderName"],
            "productId": product.id,
            "credits": product.credits,
            "customerKey": g.counselor_uid,
            "tossClientKey": TOSS_CLIENT_KEY or None,
            "mockEnabled": COMMERCE_MOCK_PAYMENTS and not is_toss_configured(),
        }
    )


@bp.route("/checkout/confirm", methods=["POST"])
@require_counselor
def checkout_confirm():
    body = request.get_json() or {}
    order_id = (body.get("orderId") or "").strip()
    payment_key = (body.get("paymentKey") or "").strip()
    try:
        amount = int(body.get("amount") or 0)
    except (TypeError, ValueError):
        amount = 0

    if not order_id or not payment_key or amount <= 0:
        return jsonify({"error": "Bad Request", "message": "orderId, paymentKey, amount가 필요합니다."}), 400

    db = get_firestore()
    order = get_order(db, order_id)
    if not order:
        return jsonify({"error": "Not Found", "message": "주문을 찾을 수 없습니다."}), 404
    if order.get("counselorUid") != g.counselor_uid:
        return jsonify({"error": "Forbidden", "message": "본인 주문만 결제할 수 있습니다."}), 403
    if int(order.get("amount") or 0) != amount:
        return jsonify({"error": "Bad Request", "message": "결제 금액이 일치하지 않습니다."}), 400

    if order.get("fulfilledAt"):
        return jsonify({"ok": True, "alreadyFulfilled": True, "orderId": order_id})

    try:
        toss_result = confirm_payment(
            payment_key=payment_key,
            order_id=order_id,
            amount=amount,
        )
    except RuntimeError as exc:
        return jsonify({"error": "Payment Failed", "message": str(exc)}), 402

    method = toss_result.get("method") or ""
    try:
        fulfillment = _complete_order_flow(
            db,
            order_id,
            payment_key=payment_key,
            payment_method=method,
            provider="toss",
            actor_uid=g.counselor_uid,
        )
    except ValueError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400

    return jsonify({"ok": True, **fulfillment})


@bp.route("/checkout/mock-complete", methods=["POST"])
@require_counselor
def checkout_mock_complete():
    if not COMMERCE_MOCK_PAYMENTS:
        return jsonify({"error": "Forbidden", "message": "Mock 결제가 비활성화되어 있습니다."}), 403

    body = request.get_json() or {}
    order_id = (body.get("orderId") or "").strip()
    if not order_id:
        return jsonify({"error": "Bad Request", "message": "orderId가 필요합니다."}), 400

    db = get_firestore()
    order = get_order(db, order_id)
    if not order:
        return jsonify({"error": "Not Found", "message": "주문을 찾을 수 없습니다."}), 404
    if order.get("counselorUid") != g.counselor_uid:
        return jsonify({"error": "Forbidden", "message": "본인 주문만 결제할 수 있습니다."}), 403

    mock_key = f"mock_{order_id}"
    mark_order_paid(db, order_id, toss_payment_key=mock_key, payment_method="mock")
    order = get_order(db, order_id) or order
    fulfillment = fulfill_paid_order(
        db,
        order,
        payment_key=mock_key,
        payment_method="mock",
        provider="mock",
        actor_uid=g.counselor_uid,
    )
    return jsonify({"ok": True, "mock": True, **fulfillment})


@bp.route("/webhooks/toss", methods=["POST"])
def toss_webhook():
    raw = request.get_data()
    signature = request.headers.get("Toss-Signature") or request.headers.get("X-Toss-Signature")
    if not verify_webhook_signature(raw, signature):
        return jsonify({"error": "Invalid signature"}), 401

    try:
        payload = request.get_json(silent=True) or {}
    except Exception:
        payload = {}

    event = parse_webhook_event(payload)
    order_id = event.get("orderId") or ""
    payment_key = event.get("paymentKey") or ""
    status = (event.get("status") or "").upper()

    if not order_id or status not in ("DONE", "PAID", "COMPLETED"):
        return jsonify({"ok": True, "ignored": True})

    db = get_firestore()
    order = get_order(db, order_id)
    if not order:
        logger.warning("Toss webhook unknown orderId=%s", order_id)
        return jsonify({"ok": True, "unknownOrder": True})

    if order.get("fulfilledAt"):
        return jsonify({"ok": True, "alreadyFulfilled": True})

    mark_order_paid(
        db,
        order_id,
        toss_payment_key=payment_key,
        payment_method=event.get("method") or "toss",
    )
    order = get_order(db, order_id) or order
    try:
        fulfillment = fulfill_paid_order(
            db,
            order,
            payment_key=payment_key,
            payment_method=event.get("method") or "toss",
            provider="toss",
            actor_uid=order.get("counselorUid"),
        )
    except Exception as exc:
        logger.exception("Webhook fulfillment failed orderId=%s", order_id)
        return jsonify({"error": "Fulfillment failed", "message": str(exc)}), 500

    return jsonify({"ok": True, **fulfillment})


@bp.route("/payments", methods=["GET"])
@require_admin
def admin_list_payments():
    db = get_firestore()
    limit = int(request.args.get("limit", 100))
    rows = list_payments(db, limit=limit)
    return jsonify({"payments": rows})


@bp.route("/settlement/summary", methods=["GET"])
@require_admin
def settlement_summary():
    month = (request.args.get("month") or "").strip()
    if not month or len(month) != 7:
        from datetime import datetime

        month = datetime.utcnow().strftime("%Y-%m")

    db = get_firestore()
    payments = list_payments(db, limit=500)
    summary = build_settlement_summary(
        payments,
        month=month,
        platform_fee_rate=PLATFORM_FEE_RATE,
    )
    summary["payments"] = summary["payments"][:50]
    return jsonify(summary)
