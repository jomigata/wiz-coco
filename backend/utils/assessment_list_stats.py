"""Denormalized assessment list stats — read, recompute, persist, hooks."""
from __future__ import annotations

import re

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ASSESSMENTS_COLLECTION, CLIENT_PORTALS_COLLECTION
from utils.assessment_dispatch import aggregate_assessment_list_stats
from utils.assessment_list_stats_cache import (
    get_cached_assessment_stats,
    invalidate_assessment_stats_cache,
    invalidate_list_aggregate_cache,
    set_cached_assessment_stats,
)

LIST_STATS_FIELD = "listStats"

_TOKEN_SPLIT_RE = re.compile(r"[^\w가-힣@.+-]+", re.UNICODE)


def empty_list_stats() -> dict:
    return {
        "dispatchSentCount": 0,
        "dispatchFailedCount": 0,
        "dispatchSendingCount": 0,
        "testCompleteCount": 0,
        "testIncompleteCount": 0,
        "emailsCompletedAllTestsCount": 0,
        "emailsNotCompletedAllTestsCount": 0,
    }


def build_assessment_search_tokens(data: dict) -> list[str]:
    """검색용 토큰 — title, code, cohort 등."""
    parts: list[str] = []
    for key in (
        "title",
        "accessCode",
        "cohortName",
        "welcomeMessage",
        "codeCategory",
        "targetAudience",
    ):
        raw = str(data.get(key) or "").strip().lower()
        if raw:
            parts.append(raw)
            parts.extend(_TOKEN_SPLIT_RE.split(raw))
    for item in data.get("testList") or []:
        if not item:
            continue
        for key in ("name", "testId"):
            raw = str(item.get(key) or "").strip().lower()
            if raw:
                parts.append(raw)
    tokens = sorted({p for p in parts if len(p) >= 2})
    return tokens[:200]


def apply_list_stats_to_item(item: dict, stats: dict | None = None) -> None:
    source = stats or item.get(LIST_STATS_FIELD) or {}
    for key in empty_list_stats():
        item[key] = int(source.get(key) or 0)


def _email_counts_for_assessment(db, assessment_id: str, test_list: list) -> tuple[int, int]:
    from utils.result_actor import result_actor_email, result_actor_key
    from config import TEST_RESULTS_COLLECTION

    required = {
        str(t.get("testId") or "").strip()
        for t in (test_list or [])
        if t and str(t.get("testId") or "").strip()
    }
    tmap: dict[str, dict] = {}
    for doc in (
        db.collection(TEST_RESULTS_COLLECTION)
        .where("assessmentId", "==", assessment_id)
        .stream()
    ):
        d = doc.to_dict() or {}
        if (d.get("status") or "completed") != "completed":
            continue
        key = result_actor_key(d, result_id=doc.id)
        if not key:
            continue
        tid = str(d.get("testId") or "").strip()
        if not tid:
            continue
        if key not in tmap:
            tmap[key] = {"testIds": set(), "clientEmail": result_actor_email(d)}
        tmap[key]["testIds"].add(tid)

    emails_any = len(tmap)
    if not required:
        return 0, 0
    emails_all = sum(1 for row in tmap.values() if required <= (row.get("testIds") or set()))
    return emails_all, emails_any - emails_all


def recompute_assessment_list_stats(db, assessment_id: str) -> dict:
    aid = (assessment_id or "").strip()
    if not aid:
        return empty_list_stats()

    ass_doc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
    if not ass_doc.exists:
        return empty_list_stats()

    ass = ass_doc.to_dict() or {}
    owner_uid = (ass.get("counselorId") or "").strip()
    item = {"id": aid, **ass}
    portal_stats = aggregate_assessment_list_stats(
        db,
        counselor_uid=owner_uid or None,
        items=[item],
    )
    pstats = portal_stats.get(aid) or empty_list_stats()
    emails_all, emails_not_all = _email_counts_for_assessment(db, aid, ass.get("testList") or [])

    stats = empty_list_stats()
    stats.update(
        {
            "dispatchSentCount": int(pstats.get("dispatchSentCount") or 0),
            "dispatchFailedCount": int(pstats.get("dispatchFailedCount") or 0),
            "dispatchSendingCount": int(pstats.get("dispatchSendingCount") or 0),
            "testCompleteCount": int(pstats.get("testCompleteCount") or 0),
            "testIncompleteCount": int(pstats.get("testIncompleteCount") or 0),
            "emailsCompletedAllTestsCount": emails_all,
            "emailsNotCompletedAllTestsCount": emails_not_all,
        }
    )
    return stats


def persist_assessment_list_stats(db, assessment_id: str, stats: dict) -> dict:
    aid = (assessment_id or "").strip()
    if not aid:
        return stats
    payload = {**empty_list_stats(), **(stats or {})}
    payload["statsUpdatedAt"] = SERVER_TIMESTAMP
    db.collection(ASSESSMENTS_COLLECTION).document(aid).set(
        {LIST_STATS_FIELD: payload},
        merge=True,
    )
    set_cached_assessment_stats(aid, payload)
    invalidate_list_aggregate_cache()
    return payload


def recompute_and_persist_assessment_list_stats(db, assessment_id: str) -> dict:
    stats = recompute_assessment_list_stats(db, assessment_id)
    return persist_assessment_list_stats(db, assessment_id, stats)


def touch_assessment_list_stats(db, assessment_id: str | None) -> None:
    aid = (assessment_id or "").strip()
    if not aid:
        return
    try:
        invalidate_assessment_stats_cache(aid)
        recompute_and_persist_assessment_list_stats(db, aid)
    except Exception:
        pass


def touch_assessments_for_portal_ref(portal_ref) -> None:
    if portal_ref is None:
        return
    try:
        from firebase_init import get_firestore

        doc = portal_ref.get()
        if not doc.exists:
            return
        touch_assessments_for_portal_data(get_firestore(), doc.id, doc.to_dict() or {})
    except Exception:
        pass


def touch_assessments_for_portal_data(db, portal_id: str, pdata: dict) -> None:
    aids: set[str] = set()
    for raw in pdata.get("assignedAssessmentIds") or []:
        s = str(raw).strip()
        if s:
            aids.add(s)
    from_aid = (pdata.get("archivedFromAssessmentId") or "").strip()
    if from_aid:
        aids.add(from_aid)
    for aid in aids:
        touch_assessment_list_stats(db, aid)


def resolve_stats_for_items(
    db,
    items: list[dict],
    *,
    recompute_missing: bool = True,
) -> dict[str, dict]:
    """items에 listStats 적용 — 없으면 캐시/재계산."""
    out: dict[str, dict] = {}
    missing: list[str] = []

    for item in items:
        aid = item.get("id")
        if not aid:
            continue
        cached = get_cached_assessment_stats(aid)
        if cached:
            out[aid] = cached
            apply_list_stats_to_item(item, cached)
            continue

        ls = item.get(LIST_STATS_FIELD) or {}
        if ls.get("statsUpdatedAt") is not None:
            out[aid] = ls
            set_cached_assessment_stats(aid, ls)
            apply_list_stats_to_item(item, ls)
        elif recompute_missing:
            missing.append(aid)

    for aid in missing:
        stats = recompute_and_persist_assessment_list_stats(db, aid)
        out[aid] = stats
        for item in items:
            if item.get("id") == aid:
                apply_list_stats_to_item(item, stats)
                item[LIST_STATS_FIELD] = stats

    return out


def fetch_stats_by_ids(db, assessment_ids: list[str]) -> dict[str, dict]:
    ids = [(x or "").strip() for x in assessment_ids if (x or "").strip()]
    if not ids:
        return {}
    out: dict[str, dict] = {}
    missing: list[str] = []
    for aid in ids[:100]:
        cached = get_cached_assessment_stats(aid)
        if cached:
            out[aid] = cached
            continue
        doc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
        if not doc.exists:
            continue
        data = doc.to_dict() or {}
        ls = data.get(LIST_STATS_FIELD) or {}
        if ls.get("statsUpdatedAt") is not None:
            out[aid] = ls
            set_cached_assessment_stats(aid, ls)
        else:
            missing.append(aid)

    for aid in missing:
        stats = recompute_and_persist_assessment_list_stats(db, aid)
        out[aid] = stats
    return out


def sync_assessment_search_fields(db, assessment_id: str, data: dict | None = None) -> None:
    aid = (assessment_id or "").strip()
    if not aid:
        return
    if data is None:
        doc = db.collection(ASSESSMENTS_COLLECTION).document(aid).get()
        if not doc.exists:
            return
        data = doc.to_dict() or {}
    tokens = build_assessment_search_tokens(data)
    db.collection(ASSESSMENTS_COLLECTION).document(aid).set(
        {"searchTokens": tokens},
        merge=True,
    )
