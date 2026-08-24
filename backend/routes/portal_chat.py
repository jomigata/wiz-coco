"""내 검사실 ↔ 검사 케어 매니저 1:1 문의 채팅 API."""
from flask import Blueprint, jsonify, request

from auth_middleware import require_counselor
from firebase_init import get_firestore
from utils.counselor_scope import scope_counselor_uid
from utils.portal_auth import get_portal_session_from_request
from utils.portal_chat import (
    assert_counselor_can_access_portal,
    assert_portal_session,
    list_counselor_chat_threads,
    list_portal_chat_messages,
    mark_portal_chat_read,
    process_due_scheduled_portal_chat,
    schedule_portal_chat_message,
    send_portal_chat_message,
    update_portal_chat_reply_status,
    _parse_scheduled_at,
)

bp = Blueprint("portal_chat", __name__, url_prefix="/api/portal-chat")


@bp.route("/me/messages", methods=["GET"])
def portal_list_messages():
    payload = get_portal_session_from_request()
    if not payload:
        return jsonify({"error": "Unauthorized", "message": "세션이 만료되었습니다."}), 401

    portal_id = (payload.get("portalId") or "").strip()
    if not portal_id or portal_id.startswith("legacy:"):
        return jsonify({"messages": []})

    db = get_firestore()
    try:
        assert_portal_session(db, portal_id)
    except LookupError:
        return jsonify({"error": "Not Found", "message": "나의코드를 찾을 수 없습니다."}), 404

    limit = request.args.get("limit", 100)
    messages = list_portal_chat_messages(db, portal_id, limit=limit)
    mark_portal_chat_read(db, portal_id, reader_role="portal")
    return jsonify({"messages": messages})


@bp.route("/me/messages", methods=["POST"])
def portal_send_message():
    payload = get_portal_session_from_request()
    if not payload:
        return jsonify({"error": "Unauthorized", "message": "세션이 만료되었습니다."}), 401

    portal_id = (payload.get("portalId") or "").strip()
    if not portal_id or portal_id.startswith("legacy:"):
        return jsonify({"error": "Bad Request", "message": "문의 채팅을 이용할 수 없습니다."}), 400

    body = request.get_json(silent=True) or {}
    message = (body.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Bad Request", "message": "메시지를 입력해 주세요."}), 400

    db = get_firestore()
    try:
        counselor_id, _ = assert_portal_session(db, portal_id)
    except LookupError:
        return jsonify({"error": "Not Found", "message": "나의코드를 찾을 수 없습니다."}), 404

    try:
        item = send_portal_chat_message(
            db,
            portal_id=portal_id,
            counselor_id=counselor_id,
            sender_role="portal",
            message=message,
        )
    except ValueError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400
    return jsonify({"message": item}), 201


@bp.route("/threads", methods=["GET"])
@require_counselor
def counselor_list_threads():
    db = get_firestore()
    threads = list_counselor_chat_threads(db, scope_counselor_uid())
    return jsonify({"threads": threads})


@bp.route("/threads/<portal_id>/messages", methods=["GET"])
@require_counselor
def counselor_list_messages(portal_id: str):
    db = get_firestore()
    try:
        assert_counselor_can_access_portal(db, scope_counselor_uid(), portal_id)
    except PermissionError:
        return jsonify({"error": "Forbidden", "message": "접근 권한이 없습니다."}), 403

    process_due_scheduled_portal_chat(db, scope_counselor_uid())
    limit = request.args.get("limit", 100)
    messages = list_portal_chat_messages(db, portal_id, limit=limit, include_scheduled=True)
    mark_portal_chat_read(db, portal_id, reader_role="counselor")
    return jsonify({"messages": messages})


@bp.route("/threads/<portal_id>/messages", methods=["POST"])
@require_counselor
def counselor_send_message(portal_id: str):
    body = request.get_json(silent=True) or {}
    message = (body.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Bad Request", "message": "메시지를 입력해 주세요."}), 400

    reply_status = (body.get("replyStatus") or "").strip().lower() or None
    scheduled_raw = (body.get("scheduledAt") or "").strip() or None
    scheduled_at = _parse_scheduled_at(scheduled_raw)

    db = get_firestore()
    try:
        portal = assert_counselor_can_access_portal(db, scope_counselor_uid(), portal_id)
    except PermissionError:
        return jsonify({"error": "Forbidden", "message": "접근 권한이 없습니다."}), 403

    counselor_id = (portal.get("counselorId") or "").strip()
    try:
        if scheduled_at:
            item = schedule_portal_chat_message(
                db,
                portal_id=portal_id,
                counselor_id=counselor_id,
                message=message,
                scheduled_at=scheduled_at,
                reply_status=reply_status,
            )
            if reply_status:
                update_portal_chat_reply_status(db, portal_id, reply_status)
        else:
            item = send_portal_chat_message(
                db,
                portal_id=portal_id,
                counselor_id=counselor_id,
                sender_role="counselor",
                message=message,
                reply_status=reply_status,
            )
    except ValueError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400
    return jsonify({"message": item}), 201


@bp.route("/threads/<portal_id>/reply-status", methods=["PATCH"])
@require_counselor
def counselor_update_reply_status(portal_id: str):
    body = request.get_json(silent=True) or {}
    reply_status = (body.get("replyStatus") or "").strip().lower()
    if reply_status not in ("pending", "done"):
        return jsonify({"error": "Bad Request", "message": "replyStatus는 pending 또는 done 이어야 합니다."}), 400

    db = get_firestore()
    try:
        assert_counselor_can_access_portal(db, scope_counselor_uid(), portal_id)
    except PermissionError:
        return jsonify({"error": "Forbidden", "message": "접근 권한이 없습니다."}), 403

    try:
        update_portal_chat_reply_status(db, portal_id, reply_status)
    except ValueError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400
    return jsonify({"ok": True, "replyStatus": reply_status})
