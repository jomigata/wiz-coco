# 공개 API v1 · 화이트라벨 카탈로그 (4단계)
import logging

from flask import Blueprint, request, jsonify, g

from firebase_init import get_firestore
from auth_middleware import require_admin
from data.commerce_products import public_catalog
from utils.api_keys import create_api_key, validate_api_key

logger = logging.getLogger(__name__)

bp = Blueprint("public_api", __name__, url_prefix="/api/v1/public")


def _require_api_key():
    raw = (
        request.headers.get("X-Api-Key")
        or request.headers.get("Authorization", "").replace("Bearer ", "").strip()
        or request.args.get("apiKey")
        or ""
    ).strip()
    if not raw:
        return None, (jsonify({"error": "Unauthorized", "message": "X-Api-Key header required"}), 401)
    db = get_firestore()
    key_data = validate_api_key(db, raw)
    if not key_data:
        return None, (jsonify({"error": "Unauthorized", "message": "Invalid API key"}), 401)
    return key_data, None


@bp.route("/health", methods=["GET"])
def public_health():
    return jsonify({"status": "ok", "service": "wizcoco-api", "version": "v1"})


@bp.route("/catalog", methods=["GET"])
def public_catalog_route():
    _, err = _require_api_key()
    if err:
        return err
    channel = (request.args.get("channel") or "").strip() or None
    products = public_catalog(channel)
    return jsonify(
        {
            "version": "v1",
            "channels": ["b2b2c", "b2c", "b2b"],
            "products": products,
            "creditUnit": "1 credit = 1 client portal (one recipient)",
        }
    )


@bp.route("/mini-check/questions", methods=["GET"])
def public_mini_questions():
    _, err = _require_api_key()
    if err:
        return err
    from data.mini_check import MINI_CHECK_QUESTIONS

    return jsonify({"questions": MINI_CHECK_QUESTIONS})


admin_bp = Blueprint("developer_admin", __name__, url_prefix="/api/admin/developer")


@admin_bp.route("/api-keys", methods=["POST"])
@require_admin
def admin_create_api_key():
    body = request.get_json() or {}
    name = (body.get("name") or "integration").strip()
    scopes = body.get("scopes")
    if scopes is not None and not isinstance(scopes, list):
        scopes = None
    db = get_firestore()
    result = create_api_key(db, name=name, created_by=g.admin_uid, scopes=scopes)
    return jsonify({"ok": True, **result})


@admin_bp.route("/api-keys", methods=["GET"])
@require_admin
def admin_list_api_keys():
    db = get_firestore()
    from config import API_KEYS_COLLECTION

    rows = []
    for snap in db.collection(API_KEYS_COLLECTION).order_by("createdAt", direction="DESCENDING").limit(50).stream():
        data = snap.to_dict() or {}
        rows.append(
            {
                "id": snap.id,
                "name": data.get("name"),
                "keyPrefix": data.get("keyPrefix"),
                "scopes": data.get("scopes") or [],
                "status": data.get("status"),
                "lastUsedAt": data.get("lastUsedAt"),
            }
        )
    return jsonify({"apiKeys": rows})
