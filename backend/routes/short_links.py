"""공개 단축 go 링크 해석 API."""
from flask import Blueprint, jsonify

from firebase_init import get_firestore
from utils.short_link import resolve_short_link

bp = Blueprint("short_links", __name__, url_prefix="/api/short-links")


@bp.route("/<code>", methods=["GET"])
def get_short_link(code):
    """SMS 단축 URL(/go/?c=…) → magic token."""
    db = get_firestore()
    data = resolve_short_link(db, code)
    if not data:
        return jsonify({"error": "Not Found", "message": "링크가 유효하지 않거나 만료되었습니다."}), 404
    return jsonify(
        {
            "code": data["code"],
            "magicToken": data["magicToken"],
            "tab": data.get("tab") or "",
            "expiresAt": data.get("expiresAt"),
            "issuedAt": data.get("issuedAt"),
        }
    )
