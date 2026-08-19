"""상담관리 목록 — 플랫폼 전체 건수 (관리자 ownOnly 조회 시)."""
from __future__ import annotations

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION


def count_active_assessments(db) -> int:
    refs = db.collection(ASSESSMENTS_COLLECTION).where("status", "==", "active").stream()
    return sum(1 for _ in refs)


def count_archived_assessments(db) -> int:
    refs = db.collection(ASSESSMENTS_COLLECTION).where("status", "==", "archived").stream()
    return sum(1 for _ in refs)


def count_client_portals_by_status(db, *, status: str) -> int:
    st = (status or "active").strip().lower()
    if st == "all":
        refs = db.collection(CLIENT_PORTALS_COLLECTION).stream()
    else:
        refs = db.collection(CLIENT_PORTALS_COLLECTION).where("status", "==", st).stream()
    return sum(1 for _ in refs)
