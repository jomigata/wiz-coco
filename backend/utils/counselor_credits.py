# 상담사 검사 크레딧 (협회 Admin 지급 · 일괄발송 차감)
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    COUNSELOR_CREDITS_COLLECTION,
    COUNSELOR_CREDIT_LEDGER_COLLECTION,
    COMMERCE_CREDITS_ENFORCE,
)


class InsufficientCreditsError(Exception):
    def __init__(self, balance: int, required: int):
        self.balance = balance
        self.required = required
        super().__init__(f"Insufficient credits: have {balance}, need {required}")


def _credits_ref(db, counselor_uid: str):
    return db.collection(COUNSELOR_CREDITS_COLLECTION).document(counselor_uid)


def get_balance(db, counselor_uid: str) -> int:
    doc = _credits_ref(db, counselor_uid).get()
    if not doc.exists:
        return 0
    data = doc.to_dict() or {}
    try:
        return max(0, int(data.get("balance") or 0))
    except (TypeError, ValueError):
        return 0


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
) -> dict:
    if amount <= 0:
        raise ValueError("amount must be positive")
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
    _append_ledger(
        db,
        counselor_uid=counselor_uid,
        delta=amount,
        balance_after=new_balance,
        reason=reason,
        actor_uid=actor_uid,
        metadata=metadata,
    )
    return {"counselorUid": counselor_uid, "balance": new_balance, "granted": amount}


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
