"""케어 할당 API — T-2-01 스키마 메타, T-2-04부터 CRUD 구현."""
from flask import Blueprint, jsonify, request, g

from config import CARE_ASSIGNMENTS_COLLECTION, CARE_PROGRESS_COLLECTION
from firebase_init import get_firestore
from auth_middleware import require_counselor
from utils.care_assignment_schema import (
    SCHEMA_VERSION,
    CARE_ASSIGNMENT_TYPES,
    CARE_ASSIGNMENT_STATUSES,
    CARE_ASSIGNMENT_SOURCES,
    CARE_PRIORITIES,
    CARE_PROGRESS_STATUSES,
    CARE_PROGRESS_ENTRY_KINDS,
    assignment_type_label,
    CareAssignmentValidationError,
)
from utils.care_program_catalog import (
    CATALOG_VERSION as CARE_PROGRAM_CATALOG_VERSION,
    CareProgramNotFoundError,
    get_care_program,
    get_care_program_catalog_meta,
    list_care_programs,
)
from utils.care_assignments import create_care_assignments, list_counselor_care_assignments
from utils.daily_records import list_counselor_daily_records, update_counselor_daily_record_notes

bp = Blueprint("care_assignments", __name__, url_prefix="/api/care-assignments")


@bp.route("/schema", methods=["GET"])
def care_assignment_schema():
    """스키마 버전·허용 enum — 클라이언트·문서 동기화용."""
    return jsonify(
        {
            "schemaVersion": SCHEMA_VERSION,
            "collections": {
                "careAssignments": CARE_ASSIGNMENTS_COLLECTION,
                "careProgress": CARE_PROGRESS_COLLECTION,
            },
            "enums": {
                "assignmentTypes": sorted(CARE_ASSIGNMENT_TYPES),
                "assignmentStatuses": sorted(CARE_ASSIGNMENT_STATUSES),
                "assignmentSources": sorted(CARE_ASSIGNMENT_SOURCES),
                "priorities": sorted(CARE_PRIORITIES),
                "progressStatuses": sorted(CARE_PROGRESS_STATUSES),
                "progressEntryKinds": sorted(CARE_PROGRESS_ENTRY_KINDS),
            },
            "assignmentTypeLabels": {
                t: assignment_type_label(t) for t in sorted(CARE_ASSIGNMENT_TYPES)
            },
            "docs": "/docs/CARE_ASSIGNMENTS_SCHEMA.md",
            "careProgramCatalogVersion": CARE_PROGRAM_CATALOG_VERSION,
            "implementedEndpoints": [
                "GET /api/care-assignments/schema",
                "GET /api/care-assignments/programs",
                "GET /api/care-assignments/programs/<programId>",
                "POST /api/care-assignments",
                "GET /api/care-assignments",
                "GET /api/client-portals/care-assignments",
                "POST /api/client-portals/care-assignments/{assignmentId}/progress",
                "GET /api/care-assignments/daily-records",
                "PATCH /api/care-assignments/daily-records/{recordId}",
            ],
            "plannedEndpoints": [
                "PATCH /api/care-assignments/{assignmentId}",
            ],
        }
    )


@bp.route("", methods=["POST"])
@require_counselor
def create_care_assignment_route():
    db = get_firestore()
    body = request.get_json(silent=True) or {}
    try:
        result = create_care_assignments(db, g.counselor_uid, body)
    except CareAssignmentValidationError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": "Internal Server Error", "message": str(exc)}), 500
    status_code = 201 if result.get("assigned", 0) > 0 else 200
    return jsonify(result), status_code


@bp.route("", methods=["GET"])
@require_counselor
def list_care_assignment_route():
    db = get_firestore()
    portal_id = (request.args.get("portalId") or "").strip() or None
    status = (request.args.get("status") or "").strip() or None
    assignment_type = (request.args.get("type") or "").strip() or None
    try:
        limit = int(request.args.get("limit") or 50)
    except ValueError:
        limit = 50
    result = list_counselor_care_assignments(
        db,
        g.counselor_uid,
        portal_id=portal_id,
        status=status,
        assignment_type=assignment_type,
        limit=limit,
    )
    return jsonify(result)


@bp.route("/daily-records", methods=["GET"])
@require_counselor
def list_daily_records_route():
    """상담사 — 포털·마이페이지 일상 기록 (T-2-09)."""
    db = get_firestore()
    portal_id = (request.args.get("portalId") or "").strip() or None
    try:
        limit = int(request.args.get("limit") or 50)
    except ValueError:
        limit = 50
    result = list_counselor_daily_records(
        db,
        g.counselor_uid,
        portal_id=portal_id,
        limit=limit,
    )
    return jsonify(result)


@bp.route("/daily-records/<record_id>", methods=["PATCH"])
@require_counselor
def patch_daily_record_route(record_id: str):
    """상담사 — 일상 기록 메모."""
    db = get_firestore()
    body = request.get_json(silent=True) or {}
    try:
        result = update_counselor_daily_record_notes(
            db,
            g.counselor_uid,
            record_id,
            body.get("counselorNotes") or "",
        )
    except CareAssignmentValidationError as exc:
        return jsonify({"error": "Bad Request", "message": str(exc)}), 400
    return jsonify(result)


@bp.route("/programs", methods=["GET"])
def list_care_program_catalog():
    """치료프로그램 카탈로그 목록."""
    category = (request.args.get("category") or "").strip() or None
    programs = list_care_programs(category=category, active_only=True)
    meta = get_care_program_catalog_meta()
    if category:
        meta = {**meta, "programs": programs, "filter": {"category": category}}
    return jsonify(meta)


@bp.route("/programs/<program_id>", methods=["GET"])
def get_care_program_detail(program_id: str):
    """치료프로그램 상세 메타 (세션 본문은 프론트 카탈로그 참조)."""
    try:
        program = get_care_program(program_id)
    except CareProgramNotFoundError as exc:
        return jsonify({"error": "Not Found", "message": str(exc)}), 404
    return jsonify(
        {
            "catalogVersion": CARE_PROGRAM_CATALOG_VERSION,
            "program": program,
            "sessionsNote": "세션 상세는 프론트 src/data/careProgramCatalog.ts 또는 향후 API 확장에서 제공",
        }
    )
