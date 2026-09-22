"""상담사 검사 포인트 lot — 지급별 유효기간, FEFO 차감."""
from __future__ import annotations

from datetime import datetime, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import COUNSELOR_CREDIT_LOTS_COLLECTION
from utils.points_display import POINTS_PER_ASSESSMENT_CREDIT


def _lots_query(db, counselor_uid: str):
    return (
        db.collection(COUNSELOR_CREDIT_LOTS_COLLECTION)
        .where("counselorUid", "==", counselor_uid)
        .where("pointsRemaining", ">", 0)
    )


def _parse_expires_at(raw) -> datetime | None:
    if not raw:
        return None
    if isinstance(raw, datetime):
        dt = raw
    else:
        try:
            dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _lot_is_active(data: dict, *, now: datetime | None = None) -> bool:
    now = now or datetime.now(timezone.utc)
    try:
        remaining = int(data.get("pointsRemaining") or 0)
    except (TypeError, ValueError):
        remaining = 0
    if remaining <= 0:
        return False
    expires = _parse_expires_at(data.get("expiresAt"))
    if expires is not None and expires <= now:
        return False
    return True


def expire_stale_lots(db, counselor_uid: str) -> int:
    """만료 lot 포인트 소멸 — lot 0 처리 및 지갑에서 차감."""
    now = datetime.now(timezone.utc)
    expired = 0
    for snap in _lots_query(db, counselor_uid).stream():
        data = snap.to_dict() or {}
        expires = _parse_expires_at(data.get("expiresAt"))
        if expires is None or expires > now:
            continue
        try:
            remaining = int(data.get("pointsRemaining") or 0)
        except (TypeError, ValueError):
            remaining = 0
        if remaining <= 0:
            continue
        snap.reference.update(
            {
                "pointsRemaining": 0,
                "expiredAt": now.isoformat(),
                "updatedAt": SERVER_TIMESTAMP,
            }
        )
        expired += remaining
    if expired > 0:
        from utils.counselor_credits import forfeit_points_without_lots

        forfeit_points_without_lots(
            db,
            counselor_uid,
            expired,
            reason="credit_lot_expired",
        )
    return expired


def sum_active_lot_points(db, counselor_uid: str) -> int:
    expire_stale_lots(db, counselor_uid)
    total = 0
    for snap in _lots_query(db, counselor_uid).stream():
        data = snap.to_dict() or {}
        if not _lot_is_active(data):
            continue
        try:
            total += int(data.get("pointsRemaining") or 0)
        except (TypeError, ValueError):
            pass
    return max(0, total)


def create_credit_lot(
    db,
    *,
    counselor_uid: str,
    points: int,
    expires_at: datetime | str | None,
    reason: str,
    actor_uid: str | None = None,
    metadata: dict | None = None,
) -> str:
    if points <= 0:
        raise ValueError("points must be positive")
    expires_iso = None
    if expires_at is not None:
        if isinstance(expires_at, datetime):
            exp = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
            expires_iso = exp.astimezone(timezone.utc).isoformat()
        else:
            expires_iso = str(expires_at).strip() or None
    payload = {
        "counselorUid": counselor_uid,
        "pointsGranted": points,
        "pointsRemaining": points,
        "expiresAt": expires_iso,
        "reason": (reason or "").strip() or "grant",
        "createdAt": SERVER_TIMESTAMP,
        "updatedAt": SERVER_TIMESTAMP,
    }
    if actor_uid:
        payload["grantedByUid"] = actor_uid
    if metadata:
        payload["metadata"] = metadata
    ref = db.collection(COUNSELOR_CREDIT_LOTS_COLLECTION).document()
    ref.set(payload)
    return ref.id


def consume_from_lots_fefo(
    db,
    counselor_uid: str,
    points: int,
) -> tuple[int, list[dict]]:
    """만료일이 가장 빠른 lot부터 차감. Returns (consumed_from_lots, lot_deltas)."""
    if points <= 0:
        return 0, []
    expire_stale_lots(db, counselor_uid)
    now = datetime.now(timezone.utc)
    candidates: list[tuple[datetime, str, dict]] = []
    for snap in _lots_query(db, counselor_uid).stream():
        data = snap.to_dict() or {}
        if not _lot_is_active(data, now=now):
            continue
        expires = _parse_expires_at(data.get("expiresAt"))
        sort_key = expires or datetime(9999, 12, 31, tzinfo=timezone.utc)
        candidates.append((sort_key, snap.id, data))

    candidates.sort(key=lambda x: (x[0], x[1]))
    need = points
    consumed = 0
    lot_deltas: list[dict] = []
    for _, lot_id, data in candidates:
        if need <= 0:
            break
        try:
            remaining = int(data.get("pointsRemaining") or 0)
        except (TypeError, ValueError):
            continue
        if remaining <= 0:
            continue
        take = min(remaining, need)
        new_remaining = remaining - take
        db.collection(COUNSELOR_CREDIT_LOTS_COLLECTION).document(lot_id).update(
            {
                "pointsRemaining": new_remaining,
                "updatedAt": SERVER_TIMESTAMP,
            }
        )
        lot_deltas.append({"lotId": lot_id, "points": take, "remainingAfter": new_remaining})
        consumed += take
        need -= take
    return consumed, lot_deltas


def list_credit_lots(db, counselor_uid: str, *, limit: int = 50) -> list[dict]:
    limit = max(1, min(limit, 100))
    expire_stale_lots(db, counselor_uid)
    rows: list[dict] = []
    for snap in (
        db.collection(COUNSELOR_CREDIT_LOTS_COLLECTION)
        .where("counselorUid", "==", counselor_uid)
        .limit(limit * 3)
        .stream()
    ):
        data = snap.to_dict() or {}
        data["id"] = snap.id
        created = data.get("createdAt")
        if created and hasattr(created, "isoformat"):
            data["createdAt"] = created.isoformat()
        elif created and hasattr(created, "timestamp"):
            data["createdAt"] = datetime.utcfromtimestamp(created.timestamp()).isoformat() + "Z"
        rows.append(data)
    rows.sort(key=lambda x: x.get("createdAt") or "", reverse=True)
    return rows[:limit]


def parse_grant_expires_at(body: dict) -> datetime | None:
    """Admin grant — expiresAt ISO 또는 validityDays 누적."""
    raw = (body.get("expiresAt") or body.get("expires_at") or "").strip()
    if raw:
        dt = _parse_expires_at(raw)
        if dt is None:
            raise ValueError("expiresAt 형식이 올바르지 않습니다.")
        return dt
    try:
        days = int(body.get("validityDays") or body.get("validity_days") or 0)
    except (TypeError, ValueError):
        days = 0
    if days <= 0:
        return None
    from datetime import timedelta

    return datetime.now(timezone.utc) + timedelta(days=days)
