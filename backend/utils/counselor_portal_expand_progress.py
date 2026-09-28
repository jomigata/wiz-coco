"""내담자 목록 진행률 — 펼침 테이블(검사+숙제)과 동일 집계."""
from __future__ import annotations

from collections import defaultdict

from config import CARE_ASSIGNMENTS_COLLECTION
from utils.assessment_dispatch import _test_detail_rows_from_map

_TEST_STATUS_RANK = {"completed": 3, "in_progress": 2, "not_started": 1}


def _dedupe_test_rows(rows: list[dict]) -> list[dict]:
    order: list[str] = []
    by_id: dict[str, dict] = {}
    for row in rows:
        tid = str(row.get("testId") or "").strip()
        if not tid:
            continue
        prev = by_id.get(tid)
        if not prev:
            by_id[tid] = row
            order.append(tid)
            continue
        prev_rank = _TEST_STATUS_RANK.get(str(prev.get("status") or ""), 0)
        rank = _TEST_STATUS_RANK.get(str(row.get("status") or ""), 0)
        if rank > prev_rank:
            by_id[tid] = row
        elif rank == prev_rank and str(row.get("status") or "") == "completed":
            if (row.get("completedAt") or "") >= (prev.get("completedAt") or ""):
                by_id[tid] = row
    return [by_id[tid] for tid in order]


def _care_assignment_status(data: dict) -> str:
    status = (data.get("status") or "").strip()
    if status == "completed":
        return "completed"
    progress = data.get("progress") or {}
    if isinstance(progress, dict):
        ps = (progress.get("status") or "").strip()
        if ps == "completed" or status == "completed":
            return "completed"
        if ps == "in_progress":
            return "in_progress"
    return "not_started"


def _care_counts_for_expand(care_items: list[dict], test_name_keys: set[str]) -> tuple[int, int]:
    by_title: dict[str, str] = {}
    for item in care_items or []:
        st = (item.get("status") or "").strip()
        if st in ("cancelled", "expired"):
            continue
        title = (item.get("title") or "숙제").strip()
        key = title.lower()
        if not key or key in test_name_keys:
            continue
        row_status = _care_assignment_status(item)
        prev = by_title.get(key)
        if not prev:
            by_title[key] = row_status
            continue
        if _TEST_STATUS_RANK.get(row_status, 0) > _TEST_STATUS_RANK.get(prev, 0):
            by_title[key] = row_status
    total = len(by_title)
    completed = sum(1 for s in by_title.values() if s == "completed")
    return completed, total


def portal_expand_progress_counts(
    portal_id: str,
    assigned_ids: list[str],
    assessment_cache: dict,
    completion_map: dict,
    care_items: list[dict] | None = None,
) -> tuple[int, int, dict]:
    """Returns (completed, total, {careCompleted, careTotal, testCompleted, testTotal})."""
    pid = (portal_id or "").strip()
    merged_rows: list[dict] = []
    for aid in assigned_ids:
        cached = assessment_cache.get(aid)
        if not cached:
            continue
        test_list = cached.get("testList") or []
        completed_ids = completion_map.get((pid, aid), set())
        by_test: dict[str, dict] = {}
        for tid in completed_ids:
            by_test[str(tid)] = {
                "status": "completed",
                "resultId": None,
                "completedAt": None,
            }
        merged_rows.extend(_test_detail_rows_from_map(by_test, test_list))

    unique_tests = _dedupe_test_rows(merged_rows)
    test_name_keys = {
        str(r.get("testName") or "").strip().lower()
        for r in unique_tests
        if str(r.get("testName") or "").strip()
    }
    test_total = len(unique_tests)
    test_completed = sum(1 for r in unique_tests if (r.get("status") or "") == "completed")

    care_completed, care_total = _care_counts_for_expand(care_items or [], test_name_keys)
    return (
        test_completed + care_completed,
        test_total + care_total,
        {
            "testCompleted": test_completed,
            "testTotal": test_total,
            "careCompleted": care_completed,
            "careTotal": care_total,
        },
    )


def bulk_active_care_by_portal(
    db,
    counselor_uid: str | None,
    portal_ids: list[str],
) -> dict[str, list[dict]]:
    """활성 숙제 — portalId별 (진행률 집계용, progress 서브컬렉션 미조회)."""
    if not counselor_uid or not portal_ids:
        return {}
    portal_set = {p.strip() for p in portal_ids if (p or "").strip()}
    if not portal_set:
        return {}

    out: dict[str, list[dict]] = defaultdict(list)
    query = (
        db.collection(CARE_ASSIGNMENTS_COLLECTION)
        .where("counselorId", "==", counselor_uid.strip())
        .where("status", "==", "active")
    )
    for doc in query.stream():
        data = doc.to_dict() or {}
        pid = (data.get("portalId") or "").strip()
        if pid not in portal_set:
            continue
        out[pid].append(data)
    return dict(out)
