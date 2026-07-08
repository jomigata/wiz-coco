# 상담사 AI 크레딧 (검사 크레딧과 분리 지갑 — T-3-01)
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import (
    AI_CREDITS_ENFORCE,
    AI_USAGE_LEDGER_COLLECTION,
    COUNSELOR_AI_CREDITS_COLLECTION,
)
from utils.ai_usage_schema import validate_ledger_entry_payload


class InsufficientAiCreditsError(Exception):
    def __init__(self, balance: int, required: int):
        self.balance = balance
        self.required = required
        super().__init__(f"Insufficient AI credits: have {balance}, need {required}")


def _credits_ref(db, counselor_uid: str):
    return db.collection(COUNSELOR_AI_CREDITS_COLLECTION).document(counselor_uid)


def get_ai_balance(db, counselor_uid: str) -> int:
    doc = _credits_ref(db, counselor_uid).get()
    if not doc.exists:
        return 0
    data = doc.to_dict() or {}
    try:
        return max(0, int(data.get("balance") or 0))
    except (TypeError, ValueError):
        return 0


def _append_ai_ledger(db, entry: dict):
    payload = validate_ledger_entry_payload(entry)
    payload["createdAt"] = SERVER_TIMESTAMP
    db.collection(AI_USAGE_LEDGER_COLLECTION).add(payload)


def grant_ai_credits(
    db,
    counselor_uid: str,
    amount: int,
    *,
    reason: str,
    actor_uid: str | None = None,
    feature: str = "admin_grant",
    metadata: dict | None = None,
) -> dict:
    if amount <= 0:
        raise ValueError("amount must be positive")

    ref = _credits_ref(db, counselor_uid)
    current = get_ai_balance(db, counselor_uid)
    new_balance = current + amount
    ref.set(
        {
            "counselorUid": counselor_uid,
            "balance": new_balance,
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )
    _append_ai_ledger(
        db,
        {
            "counselorUid": counselor_uid,
            "feature": feature,
            "delta": amount,
            "balanceAfter": new_balance,
            "reason": reason,
            "actorUid": actor_uid,
            "metadata": metadata,
        },
    )
    return {"counselorUid": counselor_uid, "balance": new_balance, "granted": amount}


def consume_ai_credits(
    db,
    counselor_uid: str,
    amount: int,
    *,
    reason: str,
    feature: str,
    actor_uid: str | None = None,
    metadata: dict | None = None,
    tokens_prompt: int | None = None,
    tokens_completion: int | None = None,
    tokens_total: int | None = None,
    model_id: str | None = None,
    session_id: str | None = None,
    portal_id: str | None = None,
    result_id: str | None = None,
    report_id: str | None = None,
    enforce: bool | None = None,
) -> dict:
    """AI 크레딧 차감. enforce=True 또는 AI_CREDITS_ENFORCE 시 잔액 부족이면 예외."""
    if amount <= 0:
        return {
            "counselorUid": counselor_uid,
            "balance": get_ai_balance(db, counselor_uid),
            "consumed": 0,
        }

    should_enforce = AI_CREDITS_ENFORCE if enforce is None else enforce
    balance = get_ai_balance(db, counselor_uid)

    if balance < amount:
        if should_enforce:
            raise InsufficientAiCreditsError(balance, amount)
        return {
            "counselorUid": counselor_uid,
            "balance": balance,
            "consumed": 0,
            "warning": "insufficient_ai_credits",
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

    entry: dict = {
        "counselorUid": counselor_uid,
        "feature": feature,
        "delta": -amount,
        "balanceAfter": new_balance,
        "reason": reason,
    }
    if actor_uid:
        entry["actorUid"] = actor_uid
    if metadata:
        entry["metadata"] = metadata
    if tokens_prompt is not None:
        entry["tokensPrompt"] = tokens_prompt
    if tokens_completion is not None:
        entry["tokensCompletion"] = tokens_completion
    if tokens_total is not None:
        entry["tokensTotal"] = tokens_total
    if model_id:
        entry["modelId"] = model_id
    if session_id:
        entry["sessionId"] = session_id
    if portal_id:
        entry["portalId"] = portal_id
    if result_id:
        entry["resultId"] = result_id
    if report_id:
        entry["reportId"] = report_id

    _append_ai_ledger(db, entry)
    return {"counselorUid": counselor_uid, "balance": new_balance, "consumed": amount}


def list_ai_ledger(db, counselor_uid: str, *, limit: int = 30) -> list[dict]:
    limit = max(1, min(limit, 100))
    snaps = (
        db.collection(AI_USAGE_LEDGER_COLLECTION)
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
