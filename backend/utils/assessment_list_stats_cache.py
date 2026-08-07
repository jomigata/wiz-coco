"""In-process TTL cache for assessment list stats (admin + counselor)."""
from __future__ import annotations

import time
from threading import Lock

_STATS_TTL_SEC = 60
_stats_cache: dict[str, tuple[dict, float]] = {}
_list_aggregate_cache: dict[str, tuple[dict, float]] = {}
_lock = Lock()


def _get(cache: dict[str, tuple[dict, float]], key: str) -> dict | None:
    now = time.time()
    with _lock:
        entry = cache.get(key)
        if not entry:
            return None
        value, ts = entry
        if now - ts > _STATS_TTL_SEC:
            cache.pop(key, None)
            return None
        return dict(value)


def _set(cache: dict[str, tuple[dict, float]], key: str, value: dict) -> None:
    with _lock:
        cache[key] = (dict(value), time.time())


def get_cached_assessment_stats(assessment_id: str) -> dict | None:
    return _get(_stats_cache, (assessment_id or "").strip())


def set_cached_assessment_stats(assessment_id: str, stats: dict) -> None:
    aid = (assessment_id or "").strip()
    if aid:
        _set(_stats_cache, aid, stats)


def invalidate_assessment_stats_cache(assessment_id: str | None = None) -> None:
    with _lock:
        if assessment_id:
            _stats_cache.pop((assessment_id or "").strip(), None)
        else:
            _stats_cache.clear()


def get_cached_list_aggregate(cache_key: str) -> dict | None:
    return _get(_list_aggregate_cache, cache_key)


def set_cached_list_aggregate(cache_key: str, payload: dict) -> None:
    if cache_key:
        _set(_list_aggregate_cache, cache_key, payload)


def invalidate_list_aggregate_cache(prefix: str | None = None) -> None:
    with _lock:
        if not prefix:
            _list_aggregate_cache.clear()
            return
        doomed = [k for k in _list_aggregate_cache if k.startswith(prefix)]
        for key in doomed:
            _list_aggregate_cache.pop(key, None)
