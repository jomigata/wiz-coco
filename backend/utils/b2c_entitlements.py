# B2C/D2C 개인 이용권 (Basic / Premium / Pro)
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import B2C_ENTITLEMENTS_COLLECTION


TIER_RANK = {"basic": 1, "premium": 2, "pro": 3}


def grant_b2c_tier(
    db,
    uid: str,
    *,
    tier: str,
    product_id: str,
    order_id: str,
    valid_days: int = 365,
) -> dict:
    tier = (tier or "").strip().lower()
    if tier not in TIER_RANK:
        raise ValueError("invalid tier")

    ref = db.collection(B2C_ENTITLEMENTS_COLLECTION).document(uid)
    doc = ref.get()
    existing = doc.to_dict() if doc.exists else {}
    current = (existing.get("activeTier") or "").strip().lower()
    if current and TIER_RANK.get(current, 0) >= TIER_RANK[tier]:
        new_tier = current
    else:
        new_tier = tier

    now = datetime.now(timezone.utc)
    expires = (now + timedelta(days=valid_days)).isoformat()
    purchases = list(existing.get("purchases") or [])
    purchases.append(
        {
            "productId": product_id,
            "orderId": order_id,
            "tier": tier,
            "grantedAt": now.isoformat(),
            "expiresAt": expires,
        }
    )

    ref.set(
        {
            "uid": uid,
            "activeTier": new_tier,
            "purchases": purchases[-20:],
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )
    return {"uid": uid, "activeTier": new_tier, "tierGranted": tier, "expiresAt": expires}


def get_b2c_entitlements(db, uid: str) -> dict:
    doc = db.collection(B2C_ENTITLEMENTS_COLLECTION).document(uid).get()
    if not doc.exists:
        return {"uid": uid, "activeTier": None, "purchases": []}
    d = doc.to_dict() or {}
    d["uid"] = uid
    return d


def has_tier(db, uid: str, minimum_tier: str) -> bool:
    data = get_b2c_entitlements(db, uid)
    active = (data.get("activeTier") or "").strip().lower()
    return TIER_RANK.get(active, 0) >= TIER_RANK.get(minimum_tier, 99)
