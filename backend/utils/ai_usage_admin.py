# Admin AI 사용량 집계 (T-3-08)
from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from config import AI_USAGE_LEDGER_COLLECTION, COUNSELOR_AI_CREDITS_COLLECTION, USERS_COLLECTION
from utils.ai_usage_schema import feature_label


def _parse_month(month_str: str) -> tuple[datetime, datetime]:
    start = datetime.strptime(month_str.strip(), "%Y-%m")
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def _serialize_ts(val) -> str | None:
    if val is None:
        return None
    if hasattr(val, "isoformat"):
        return val.isoformat()
    if hasattr(val, "timestamp"):
        return datetime.utcfromtimestamp(val.timestamp()).isoformat() + "Z"
    return str(val)


def _parse_dt(iso_str: str | None) -> datetime | None:
    if not iso_str:
        return None
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        if dt.tzinfo:
            dt = dt.replace(tzinfo=None)
        return dt
    except ValueError:
        return None


def _in_month(iso_str: str | None, start: datetime, end: datetime) -> bool:
    dt = _parse_dt(iso_str)
    if not dt:
        return False
    return start <= dt < end


def _normalize_ledger_row(snap) -> dict:
    d = snap.to_dict() or {}
    d["id"] = snap.id
    d["createdAt"] = _serialize_ts(d.get("createdAt"))
    return d


def fetch_recent_ai_ledger(db, *, limit: int = 400) -> list[dict]:
    limit = max(1, min(limit, 500))
    rows = [_normalize_ledger_row(snap) for snap in db.collection(AI_USAGE_LEDGER_COLLECTION).limit(limit).stream()]
    rows.sort(key=lambda x: x.get("createdAt") or "", reverse=True)
    return rows[:limit]


def build_ai_usage_summary(db, *, month: str | None = None, ledger_limit: int = 400) -> dict:
    rows = fetch_recent_ai_ledger(db, limit=ledger_limit)
    if month:
        start, end = _parse_month(month)
        rows = [r for r in rows if _in_month(r.get("createdAt"), start, end)]

    granted = 0
    consumed = 0
    tokens_total = 0
    by_feature: dict[str, dict] = defaultdict(
        lambda: {"count": 0, "creditsConsumed": 0, "creditsGranted": 0, "tokens": 0}
    )

    counselor_activity: set[str] = set()

    for row in rows:
        delta = int(row.get("delta") or 0)
        feature = str(row.get("feature") or row.get("reason") or "unknown")
        counselor_uid = str(row.get("counselorUid") or "").strip()
        if counselor_uid:
            counselor_activity.add(counselor_uid)

        if delta > 0:
            granted += delta
            by_feature[feature]["creditsGranted"] += delta
        elif delta < 0:
            consumed += abs(delta)
            by_feature[feature]["creditsConsumed"] += abs(delta)

        by_feature[feature]["count"] += 1
        tok = int(row.get("tokensTotal") or 0)
        if tok:
            tokens_total += tok
            by_feature[feature]["tokens"] += tok

    wallets = []
    total_balance = 0
    wallet_count = 0
    for snap in db.collection(COUNSELOR_AI_CREDITS_COLLECTION).stream():
        d = snap.to_dict() or {}
        balance = max(0, int(d.get("balance") or 0))
        wallet_count += 1
        total_balance += balance
        if balance > 0:
            wallets.append({"counselorUid": snap.id, "balance": balance})

    wallets.sort(key=lambda x: x["balance"], reverse=True)

    by_feature_out = {
        k: {
            "feature": k,
            "label": feature_label(k) if k in {
                "counsel_message", "session_summary", "assessment_interpret",
                "test_recommendation", "report_generate", "admin_grant",
            } else k,
            **v,
        }
        for k, v in sorted(by_feature.items(), key=lambda x: -x[1]["count"])
    }

    return {
        "month": month,
        "entryCount": len(rows),
        "activeCounselors": len(counselor_activity),
        "creditsGranted": granted,
        "creditsConsumed": consumed,
        "tokensTotal": tokens_total,
        "walletCount": wallet_count,
        "totalWalletBalance": total_balance,
        "byFeature": by_feature_out,
        "topWallets": wallets[:15],
    }


def list_admin_ai_ledger(
    db,
    *,
    month: str | None = None,
    counselor_uid: str | None = None,
    limit: int = 50,
) -> list[dict]:
    limit = max(1, min(limit, 100))
    pool_limit = 400 if month or counselor_uid else limit
    rows = fetch_recent_ai_ledger(db, limit=pool_limit)

    if counselor_uid:
        rows = [r for r in rows if r.get("counselorUid") == counselor_uid]
    if month:
        start, end = _parse_month(month)
        rows = [r for r in rows if _in_month(r.get("createdAt"), start, end)]

    return rows[:limit]


def get_admin_counselor_ai_detail(db, counselor_uid: str, *, ledger_limit: int = 30) -> dict:
    from utils.counselor_ai_credits import get_ai_balance, list_ai_ledger

    email = None
    user_doc = db.collection(USERS_COLLECTION).document(counselor_uid).get()
    if user_doc.exists:
        email = (user_doc.to_dict() or {}).get("email")

    return {
        "counselorUid": counselor_uid,
        "email": email,
        "balance": get_ai_balance(db, counselor_uid),
        "ledger": list_ai_ledger(db, counselor_uid, limit=ledger_limit),
    }
