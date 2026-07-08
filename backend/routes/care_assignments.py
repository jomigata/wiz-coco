"""케어 할당 API — T-2-01 스키마 메타, T-2-04부터 CRUD 구현."""
from flask import Blueprint, jsonify

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
            "implementedEndpoints": ["GET /api/care-assignments/schema"],
            "plannedEndpoints": [
                "POST /api/care-assignments",
                "GET /api/care-assignments",
                "PATCH /api/care-assignments/{assignmentId}",
                "GET /api/client-portals/care-assignments",
                "POST /api/client-portals/care-assignments/{assignmentId}/progress",
            ],
        }
    )
