# 기관(학교·기업) 크레딧 — B2B 선결제
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ORG_CREDITS_COLLECTION, ORG_CREDIT_LEDGER_COLLECTION, COMMERCE_CREDITS_ENFORCE


class InsufficientOrgCreditsError(Exception):
    def __init__(self, balance: int, required: int):
        self.balance = balance
        self.required = required
        super().__init__(f"Insufficient org credits: have {balance}, need {required}")


def _ref(db, org_id: str):
    return db.collection(ORG_CREDITS_COLLECTION).document(org_id)


def get_org_balance(db, org_id: str) -> int:
    doc = _ref(db, org_id).get()
    if not doc.exists:
        return 0
    try:
        return max(0, int((doc.to_dict() or {}).get("balance") or 0))
    except (TypeError, ValueError):
        return 0


def _ledger(db, *, org_id: str, delta: int, balance_after: int, reason: str, actor_uid: str | None, metadata: dict | None):
    payload = {
        "organizationId": org_id,
        "delta": delta,
        "balanceAfter": balance_after,
        "reason": (reason or "").strip() or "adjustment",
        "createdAt": SERVER_TIMESTAMP,
    }
    if actor_uid:
        payload["actorUid"] = actor_uid
    if metadata:
        payload["metadata"] = metadata
    db.collection(ORG_CREDIT_LEDGER_COLLECTION).add(payload)


def grant_org_credits(db, org_id: str, amount: int, *, reason: str, actor_uid: str, metadata: dict | None = None) -> dict:
    if amount <= 0:
        raise ValueError("amount must be positive")
    balance = get_org_balance(db, org_id)
    new_balance = balance + amount
    _ref(db, org_id).set(
        {"organizationId": org_id, "balance": new_balance, "updatedAt": SERVER_TIMESTAMP},
        merge=True,
    )
    _ledger(db, org_id=org_id, delta=amount, balance_after=new_balance, reason=reason, actor_uid=actor_uid, metadata=metadata)
    return {"organizationId": org_id, "balance": new_balance, "granted": amount}


def consume_org_credits(
    db,
    org_id: str,
    amount: int,
    *,
    reason: str,
    actor_uid: str | None = None,
    metadata: dict | None = None,
    enforce: bool | None = None,
) -> dict:
    if amount <= 0:
        return {"organizationId": org_id, "balance": get_org_balance(db, org_id), "consumed": 0}
    should_enforce = COMMERCE_CREDITS_ENFORCE if enforce is None else enforce
    balance = get_org_balance(db, org_id)
    if balance < amount:
        if should_enforce:
            raise InsufficientOrgCreditsError(balance, amount)
        return {
            "organizationId": org_id,
            "balance": balance,
            "consumed": 0,
            "warning": "insufficient_credits",
            "required": amount,
        }
    new_balance = balance - amount
    _ref(db, org_id).set(
        {"organizationId": org_id, "balance": new_balance, "updatedAt": SERVER_TIMESTAMP},
        merge=True,
    )
    _ledger(db, org_id=org_id, delta=-amount, balance_after=new_balance, reason=reason, actor_uid=actor_uid, metadata=metadata)
    return {"organizationId": org_id, "balance": new_balance, "consumed": amount}


def list_org_ledger(db, org_id: str, *, limit: int = 30) -> list[dict]:
    limit = max(1, min(limit, 100))
    snaps = (
        db.collection(ORG_CREDIT_LEDGER_COLLECTION)
        .where("organizationId", "==", org_id)
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
