"""케어 할당 API — T-2-01 스키마 메타, T-2-04부터 CRUD 구현."""
from flask import Blueprint, jsonify, request

from config import CARE_ASSIGNMENTS_COLLECTION, CARE_PROGRESS_COLLECTION
from utils.care_assignment_schema import (
    SCHEMA_VERSION,
    CARE_ASSIGNMENT_TYPES,
    CARE_ASSIGNMENT_STATUSES,
    CARE_ASSIGNMENT_SOURCES,
    CARE_PRIORITIES,
    CARE_PROGRESS_STATUSES,
    CARE_PROGRESS_ENTRY_KINDS,
    assignment_type_label,
)
from utils.care_program_catalog import (
    CATALOG_VERSION as CARE_PROGRAM_CATALOG_VERSION,
    CareProgramNotFoundError,
    get_care_program,
    get_care_program_catalog_meta,
    list_care_programs,
)

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
            ],
            "plannedEndpoints": [
                "POST /api/care-assignments",
                "GET /api/care-assignments",
                "PATCH /api/care-assignments/{assignmentId}",
                "GET /api/client-portals/care-assignments",
                "POST /api/client-portals/care-assignments/{assignmentId}/progress",
            ],
        }
    )


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
