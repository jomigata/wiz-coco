# Admin — B2B 기관 생성·크레딧·담당자 배정
from flask import Blueprint, request, jsonify, g

from firebase_init import get_firestore
from auth_middleware import require_admin
from utils.organizations import (
    create_organization,
    get_organization,
    list_organizations,
    assign_org_admin,
)
from utils.org_credits import grant_org_credits, get_org_balance, list_org_ledger

bp = Blueprint("admin_organizations", __name__, url_prefix="/api/admin/organizations")


@bp.route("", methods=["GET"])
@require_admin
def admin_list_orgs():
    db = get_firestore()
    rows = list_organizations(db, limit=int(request.args.get("limit", 100)))
    for row in rows:
        oid = row.get("organizationId") or row.get("id")
        if oid:
            row["creditBalance"] = get_org_balance(db, oid)
    return jsonify({"organizations": rows})


@bp.route("", methods=["POST"])
@require_admin
def admin_create_org():
    body = request.get_json() or {}
    name = (body.get("name") or "").strip()
    org_type = (body.get("type") or "school").strip()
    liaison = (body.get("liaisonCounselorUid") or "").strip()
    admin_uid = (body.get("adminUid") or "").strip()

    if not name:
        return jsonify({"error": "Bad Request", "message": "name이 필요합니다."}), 400
    if not liaison:
        return jsonify({"error": "Bad Request", "message": "liaisonCounselorUid(담당 상담사)가 필요합니다."}), 400

    db = get_firestore()
    try:
        org = create_organization(
            db,
            name=name,
            org_type=org_type,
            liaison_counselor_uid=liaison,
            admin_uid=admin_uid,
            actor_uid=g.admin_uid,
        )
    except ValueError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400

    return jsonify({"ok": True, "organization": org}), 201


@bp.route("/<org_id>/grant-credits", methods=["POST"])
@require_admin
def admin_grant_org_credits(org_id: str):
    body = request.get_json() or {}
    try:
        amount = int(body.get("amount") or 0)
    except (TypeError, ValueError):
        amount = 0
    reason = (body.get("reason") or "admin_org_grant").strip()

    if amount <= 0 or amount > 100000:
        return jsonify({"error": "Bad Request", "message": "amount는 1~100000 사이여야 합니다."}), 400

    db = get_firestore()
    if not get_organization(db, org_id):
        return jsonify({"error": "Not Found", "message": "기관을 찾을 수 없습니다."}), 404

    result = grant_org_credits(
        db,
        org_id,
        amount,
        reason=reason,
        actor_uid=g.admin_uid,
        metadata={"source": "admin_api"},
    )
    return jsonify({"ok": True, **result})


@bp.route("/<org_id>/assign-admin", methods=["POST"])
@require_admin
def admin_assign_org_admin(org_id: str):
    body = request.get_json() or {}
    admin_uid = (body.get("adminUid") or "").strip()
    if not admin_uid:
        return jsonify({"error": "Bad Request", "message": "adminUid가 필요합니다."}), 400

    db = get_firestore()
    try:
        assign_org_admin(db, org_id, admin_uid, actor_uid=g.admin_uid)
    except ValueError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400

    return jsonify({"ok": True, "organizationId": org_id, "adminUid": admin_uid})


@bp.route("/<org_id>", methods=["GET"])
@require_admin
def admin_get_org(org_id: str):
    db = get_firestore()
    org = get_organization(db, org_id)
    if not org:
        return jsonify({"error": "Not Found", "message": "기관을 찾을 수 없습니다."}), 404
    org["creditBalance"] = get_org_balance(db, org_id)
    org["ledger"] = list_org_ledger(db, org_id, limit=20)
    return jsonify(org)
