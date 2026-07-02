# B2C Freemium · 개인 이용권 · 미니 검사 (4단계)
import logging

from flask import Blueprint, request, jsonify, g

from firebase_init import get_firestore
from auth_middleware import require_auth
from config import TOSS_CLIENT_KEY, COMMERCE_MOCK_PAYMENTS
from data.commerce_products import get_product, public_catalog
from data.mini_check import MINI_CHECK_QUESTIONS, score_mini_check
from utils.b2c_entitlements import get_b2c_entitlements
from utils.commerce_orders import create_pending_order, get_order, mark_order_paid, order_buyer_uid
from utils.toss_payments import confirm_payment, is_toss_configured
from utils.commerce_fulfillment import fulfill_paid_order

logger = logging.getLogger(__name__)

bp = Blueprint("b2c", __name__, url_prefix="/api/b2c")


def _complete_b2c_order(
    db,
    order_id: str,
    *,
    payment_key: str,
    payment_method: str,
    provider: str,
    actor_uid: str,
) -> dict:
    order = get_order(db, order_id)
    if not order:
        raise ValueError("order_not_found")
    if order_buyer_uid(order) != actor_uid:
        raise ValueError("forbidden")
    if order.get("status") != "paid":
        mark_order_paid(
            db,
            order_id,
            toss_payment_key=payment_key,
            payment_method=payment_method,
        )
        order = get_order(db, order_id) or order
    return fulfill_paid_order(
        db,
        order,
        payment_key=payment_key,
        payment_method=payment_method,
        provider=provider,
        actor_uid=actor_uid,
    )


@bp.route("/catalog", methods=["GET"])
def b2c_catalog():
    return jsonify(
        {
            "channel": "b2c",
            "brand": "WizCoCo Discover",
            "products": public_catalog("b2c"),
            "payments": {
                "tossConfigured": is_toss_configured(),
                "tossClientKey": TOSS_CLIENT_KEY or None,
                "mockEnabled": COMMERCE_MOCK_PAYMENTS,
            },
        }
    )


@bp.route("/mini-check/questions", methods=["GET"])
def mini_check_questions():
    return jsonify({"questions": MINI_CHECK_QUESTIONS, "disclaimer": "참고용 · 진단 아님"})


@bp.route("/mini-check/score", methods=["POST"])
def mini_check_score():
    body = request.get_json(silent=True) or {}
    answers = body.get("answers") if isinstance(body.get("answers"), dict) else body
    return jsonify(score_mini_check(answers or {}))


@bp.route("/entitlements/me", methods=["GET"])
@require_auth
def entitlements_me():
    db = get_firestore()
    data = get_b2c_entitlements(db, g.auth_uid)
    return jsonify(data)


@bp.route("/checkout/prepare", methods=["POST"])
@require_auth
def checkout_prepare():
    body = request.get_json() or {}
    product_id = (body.get("productId") or "").strip()
    product = get_product(product_id)
    if not product or product.channel != "b2c":
        return jsonify({"error": "Bad Request", "message": "유효하지 않은 B2C 상품입니다."}), 400

    db = get_firestore()
    order = create_pending_order(db, buyer_uid=g.auth_uid, product=product, channel="b2c")
    return jsonify(
        {
            "ok": True,
            "orderId": order["orderId"],
            "amount": order["amount"],
            "orderName": order["orderName"],
            "productId": product.id,
            "entitlementTier": product.entitlement_tier,
            "customerKey": g.auth_uid,
            "tossClientKey": TOSS_CLIENT_KEY or None,
            "mockEnabled": COMMERCE_MOCK_PAYMENTS and not is_toss_configured(),
        }
    )


@bp.route("/checkout/confirm", methods=["POST"])
@require_auth
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
    if order_buyer_uid(order) != g.auth_uid:
        return jsonify({"error": "Forbidden", "message": "본인 주문만 결제할 수 있습니다."}), 403
    if (order.get("channel") or "") != "b2c":
        return jsonify({"error": "Bad Request", "message": "B2C 주문이 아닙니다."}), 400
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
        fulfillment = _complete_b2c_order(
            db,
            order_id,
            payment_key=payment_key,
            payment_method=method,
            provider="toss",
            actor_uid=g.auth_uid,
        )
    except ValueError as exc:
        msg = str(exc)
        if msg == "forbidden":
            return jsonify({"error": "Forbidden", "message": "본인 주문만 결제할 수 있습니다."}), 403
        return jsonify({"error": "Bad Request", "message": msg}), 400

    return jsonify({"ok": True, **fulfillment})


@bp.route("/checkout/mock-complete", methods=["POST"])
@require_auth
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
    if order_buyer_uid(order) != g.auth_uid:
        return jsonify({"error": "Forbidden", "message": "본인 주문만 결제할 수 있습니다."}), 403
    if (order.get("channel") or "") != "b2c":
        return jsonify({"error": "Bad Request", "message": "B2C 주문이 아닙니다."}), 400

    mock_key = f"mock_b2c_{order_id}"
    mark_order_paid(db, order_id, toss_payment_key=mock_key, payment_method="mock")
    order = get_order(db, order_id) or order
    fulfillment = fulfill_paid_order(
        db,
        order,
        payment_key=mock_key,
        payment_method="mock",
        provider="mock",
        actor_uid=g.auth_uid,
    )
    return jsonify({"ok": True, "mock": True, **fulfillment})
