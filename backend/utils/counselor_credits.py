# 상담사 검사 크레딧 (협회 Admin 지급 · 일괄발송 차감)
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    COUNSELOR_CREDITS_COLLECTION,
    COUNSELOR_CREDIT_LEDGER_COLLECTION,
    COMMERCE_CREDITS_ENFORCE,
    FIRST_SEND_TRIAL_ENABLED,
)
from utils.points_display import POINTS_PER_ASSESSMENT_CREDIT


class InsufficientCreditsError(Exception):
    def __init__(self, balance: int, required: int):
        self.balance = balance
        self.required = required
        super().__init__(f"Insufficient credits: have {balance}, need {required}")


def _credits_ref(db, counselor_uid: str):
    return db.collection(COUNSELOR_CREDITS_COLLECTION).document(counselor_uid)


_PORTAL_CHARGE_REASONS = frozenset(
    {
        "bulk_portal_sync",
        "bulk_portal_async",
        "portal_assessment_push",
        "public_portal_claim",
        "initial_dispatch_success",
        "notify_resend_phone",
    }
)


def _has_prior_portal_credit_charge(db, counselor_uid: str) -> bool:
    for row in list_ledger(db, counselor_uid, limit=50):
        try:
            delta = int(row.get("delta") or 0)
        except (TypeError, ValueError):
            delta = 0
        reason = (row.get("reason") or "").strip()
        if delta < 0 and reason in _PORTAL_CHARGE_REASONS:
            return True
    return False


def is_first_send_trial_eligible(db, counselor_uid: str) -> bool:
    """상담사 첫 1명 발송 시 검사 크레딧을 차감하지 않음."""
    if not FIRST_SEND_TRIAL_ENABLED:
        return False
    doc = _credits_ref(db, counselor_uid).get()
    if doc.exists:
        data = doc.to_dict() or {}
        if data.get("firstSendTrialUsed"):
            return False
    return not _has_prior_portal_credit_charge(db, counselor_uid)


def mark_first_send_trial_used(
    db,
    counselor_uid: str,
    *,
    portal_id: str,
    assessment_id: str,
    actor_uid: str | None = None,
) -> dict:
    balance = get_balance(db, counselor_uid)
    _credits_ref(db, counselor_uid).set(
        {
            "counselorUid": counselor_uid,
            "balance": balance,
            "firstSendTrialUsed": True,
            "firstSendTrialUsedAt": SERVER_TIMESTAMP,
            "firstSendTrialPortalId": portal_id,
            "firstSendTrialAssessmentId": assessment_id,
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )
    _append_ledger(
        db,
        counselor_uid=counselor_uid,
        delta=0,
        balance_after=balance,
        reason="first_send_trial",
        actor_uid=actor_uid,
        metadata={"portalId": portal_id, "assessmentId": assessment_id},
    )
    return {
        "counselorUid": counselor_uid,
        "balance": balance,
        "consumed": 0,
        "trial": True,
        "message": "first_send_free",
    }


def get_balance(db, counselor_uid: str) -> int:
    doc = _credits_ref(db, counselor_uid).get()
    if not doc.exists:
        return 0
    data = doc.to_dict() or {}
    try:
        return max(0, int(data.get("balance") or 0))
    except (TypeError, ValueError):
        return 0


def _get_point_reserve(db, counselor_uid: str) -> int:
    doc = _credits_ref(db, counselor_uid).get()
    if not doc.exists:
        return 0
    data = doc.to_dict() or {}
    try:
        reserve = int(data.get("pointReserve") or 0)
    except (TypeError, ValueError):
        reserve = 0
    return max(0, min(POINTS_PER_ASSESSMENT_CREDIT - 1, reserve))


def get_points_available(db, counselor_uid: str) -> int:
    from utils.counselor_credit_lots import expire_stale_lots

    expire_stale_lots(db, counselor_uid)
    balance = get_balance(db, counselor_uid)
    reserve = _get_point_reserve(db, counselor_uid)
    return max(0, balance * POINTS_PER_ASSESSMENT_CREDIT - reserve)


def forfeit_points_without_lots(
    db,
    counselor_uid: str,
    points: int,
    *,
    reason: str,
    actor_uid: str | None = None,
) -> None:
    """만료 lot 등 — FEFO lot 재차감 없이 지갑에서만 포인트 차감."""
    if points <= 0:
        return
    balance = get_balance(db, counselor_uid)
    reserve = _get_point_reserve(db, counselor_uid)
    new_reserve = reserve + points
    credit_delta = 0
    while new_reserve >= POINTS_PER_ASSESSMENT_CREDIT:
        new_reserve -= POINTS_PER_ASSESSMENT_CREDIT
        credit_delta += 1
    new_balance = max(0, balance - credit_delta)
    _credits_ref(db, counselor_uid).set(
        {
            "counselorUid": counselor_uid,
            "balance": new_balance,
            "pointReserve": new_reserve,
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )
    _append_ledger(
        db,
        counselor_uid=counselor_uid,
        delta=-credit_delta,
        balance_after=new_balance,
        reason=reason,
        actor_uid=actor_uid,
        metadata={"pointsForfeited": points},
    )


def consume_portal_points(
    db,
    counselor_uid: str,
    points: int,
    *,
    reason: str,
    actor_uid: str | None = None,
    metadata: dict | None = None,
    enforce: bool | None = None,
) -> dict:
    """포털 1포인트 단위 차감 — 100포인트마다 크레딧 1건 ledger 반영."""
    if points <= 0:
        balance = get_balance(db, counselor_uid)
        return {
            "counselorUid": counselor_uid,
            "balance": balance,
            "consumed": 0,
            "pointsConsumed": 0,
            "pointsAvailable": get_points_available(db, counselor_uid),
        }

    should_enforce = COMMERCE_CREDITS_ENFORCE if enforce is None else enforce
    balance = get_balance(db, counselor_uid)
    reserve = _get_point_reserve(db, counselor_uid)
    from utils.counselor_credit_lots import consume_from_lots_fefo

    available = balance * POINTS_PER_ASSESSMENT_CREDIT - reserve
    if available < points:
        if should_enforce:
            required_credits = (reserve + points + POINTS_PER_ASSESSMENT_CREDIT - 1) // POINTS_PER_ASSESSMENT_CREDIT
            raise InsufficientCreditsError(balance, required_credits)
        return {
            "counselorUid": counselor_uid,
            "balance": balance,
            "consumed": 0,
            "pointsConsumed": 0,
            "warning": "insufficient_credits",
            "requiredPoints": points,
            "pointsAvailable": available,
        }

    from_lots, lot_deltas = consume_from_lots_fefo(db, counselor_uid, points)
    new_reserve = reserve + points
    credit_delta = 0
    while new_reserve >= POINTS_PER_ASSESSMENT_CREDIT:
        new_reserve -= POINTS_PER_ASSESSMENT_CREDIT
        credit_delta += 1
    new_balance = balance - credit_delta
    ref = _credits_ref(db, counselor_uid)
    ref.set(
        {
            "counselorUid": counselor_uid,
            "balance": new_balance,
            "pointReserve": new_reserve,
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )

    ledger_meta = dict(metadata or {})
    ledger_meta["pointsCharged"] = points
    if lot_deltas:
        ledger_meta["lotConsumptions"] = lot_deltas
    if credit_delta > 0:
        _append_ledger(
            db,
            counselor_uid=counselor_uid,
            delta=-credit_delta,
            balance_after=new_balance,
            reason=reason,
            actor_uid=actor_uid,
            metadata=ledger_meta,
        )
    else:
        _append_ledger(
            db,
            counselor_uid=counselor_uid,
            delta=0,
            balance_after=new_balance,
            reason=reason,
            actor_uid=actor_uid,
            metadata=ledger_meta,
        )
    return {
        "counselorUid": counselor_uid,
        "balance": new_balance,
        "consumed": credit_delta,
        "pointsConsumed": points,
        "pointsAvailable": get_points_available(db, counselor_uid),
    }


def _append_ledger(
    db,
    *,
    counselor_uid: str,
    delta: int,
    balance_after: int,
    reason: str,
    actor_uid: str | None = None,
    metadata: dict | None = None,
):
    payload = {
        "counselorUid": counselor_uid,
        "delta": delta,
        "balanceAfter": balance_after,
        "reason": (reason or "").strip() or "adjustment",
        "createdAt": SERVER_TIMESTAMP,
    }
    if actor_uid:
        payload["actorUid"] = actor_uid
    if metadata:
        payload["metadata"] = metadata
    db.collection(COUNSELOR_CREDIT_LEDGER_COLLECTION).add(payload)


def grant_credits(
    db,
    counselor_uid: str,
    amount: int,
    *,
    reason: str,
    actor_uid: str,
    metadata: dict | None = None,
    expires_at=None,
) -> dict:
    if amount <= 0:
        raise ValueError("amount must be positive")
    from utils.counselor_credit_lots import create_credit_lot

    ref = _credits_ref(db, counselor_uid)
    doc = ref.get()
    current = 0
    if doc.exists:
        current = get_balance(db, counselor_uid)
    new_balance = current + amount
    ref.set(
        {
            "counselorUid": counselor_uid,
            "balance": new_balance,
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )
    grant_points = amount * POINTS_PER_ASSESSMENT_CREDIT
    lot_meta = dict(metadata or {})
    lot_id = create_credit_lot(
        db,
        counselor_uid=counselor_uid,
        points=grant_points,
        expires_at=expires_at,
        reason=reason,
        actor_uid=actor_uid,
        metadata=lot_meta,
    )
    lot_meta["lotId"] = lot_id
    if expires_at is not None:
        if hasattr(expires_at, "isoformat"):
            lot_meta["expiresAt"] = expires_at.isoformat()
        else:
            lot_meta["expiresAt"] = str(expires_at)
    _append_ledger(
        db,
        counselor_uid=counselor_uid,
        delta=amount,
        balance_after=new_balance,
        reason=reason,
        actor_uid=actor_uid,
        metadata=lot_meta,
    )
    return {
        "counselorUid": counselor_uid,
        "balance": new_balance,
        "granted": amount,
        "lotId": lot_id,
        "pointsGranted": grant_points,
    }


def consume_credits(
    db,
    counselor_uid: str,
    amount: int,
    *,
    reason: str,
    actor_uid: str | None = None,
    metadata: dict | None = None,
    enforce: bool | None = None,
) -> dict:
    """크레딧 차감. enforce=True 또는 COMMERCE_CREDITS_ENFORCE 시 잔액 부족이면 예외."""
    if amount <= 0:
        return {"counselorUid": counselor_uid, "balance": get_balance(db, counselor_uid), "consumed": 0}

    should_enforce = COMMERCE_CREDITS_ENFORCE if enforce is None else enforce
    balance = get_balance(db, counselor_uid)

    if balance < amount:
        if should_enforce:
            raise InsufficientCreditsError(balance, amount)
        return {
            "counselorUid": counselor_uid,
            "balance": balance,
            "consumed": 0,
            "warning": "insufficient_credits",
            "required": amount,
        }

    ref = _credits_ref(db, counselor_uid)
    new_balance = balance - amount
    ref.set(
        {
            "counselorUid": counselor_uid,
            "balance": new_balance,
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )
    _append_ledger(
        db,
        counselor_uid=counselor_uid,
        delta=-amount,
        balance_after=new_balance,
        reason=reason,
        actor_uid=actor_uid,
        metadata=metadata,
    )
    return {"counselorUid": counselor_uid, "balance": new_balance, "consumed": amount}


def list_ledger(db, counselor_uid: str, *, limit: int = 30) -> list[dict]:
    limit = max(1, min(limit, 100))
    snaps = (
        db.collection(COUNSELOR_CREDIT_LEDGER_COLLECTION)
        .where("counselorUid", "==", counselor_uid)
        .limit(limit)
        .stream()
    )
    rows = []
    for snap in snaps:
        d = snap.to_dict() or {}
        d["id"] = snap.id
        created = d.get("createdAt")
        if created and hasattr(created, "isoformat"):
            d["createdAt"] = created.isoformat()
        elif created and hasattr(created, "timestamp"):
            from datetime import datetime

            d["createdAt"] = datetime.utcfromtimestamp(created.timestamp()).isoformat() + "Z"
        rows.append(d)
    rows.sort(key=lambda x: x.get("createdAt") or "", reverse=True)
    return rows[:limit]


def charge_initial_dispatch_success(
    db,
    *,
    counselor_uid: str | None,
    portal_id: str,
    assessment_id: str = "",
    actor_uid: str | None = None,
    enforce: bool | None = None,
) -> dict | None:
    """내담자 최초 발송(이메일/휴대폰) 성공 시 1회 5포인트."""
    from config import CLIENT_PORTALS_COLLECTION
    from utils.points_display import POINT_COST_INITIAL_RECIPIENT_DISPATCH

    if not counselor_uid or not portal_id:
        return None
    portal_ref = db.collection(CLIENT_PORTALS_COLLECTION).document(portal_id)
    snap = portal_ref.get()
    if not snap.exists:
        return None
    pdata = snap.to_dict() or {}
    if pdata.get("initialDispatchPointsCharged"):
        return None
    org_prepaid = bool(pdata.get("prepaidByOrg"))
    if org_prepaid:
        portal_ref.set({"initialDispatchPointsCharged": True}, merge=True)
        return {"skipped": "org_prepaid"}

    if is_first_send_trial_eligible(db, counselor_uid) and not pdata.get("firstSendTrialApplied"):
        mark_first_send_trial_used(
            db,
            counselor_uid,
            portal_id=portal_id,
            assessment_id=assessment_id or "",
            actor_uid=actor_uid or counselor_uid,
        )
        portal_ref.set({"initialDispatchPointsCharged": True, "firstSendTrialApplied": True}, merge=True)
        return {"trial": True, "pointsConsumed": 0}

    result = consume_portal_points(
        db,
        counselor_uid,
        POINT_COST_INITIAL_RECIPIENT_DISPATCH,
        reason="initial_dispatch_success",
        actor_uid=actor_uid or counselor_uid,
        metadata={"portalId": portal_id, "assessmentId": assessment_id or None},
        enforce=enforce,
    )
    portal_ref.set({"initialDispatchPointsCharged": True}, merge=True)
    return result
