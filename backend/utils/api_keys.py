# 공개 API 키 (화이트라벨·연동 4단계)
from __future__ import annotations

import secrets

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import API_KEYS_COLLECTION


def generate_api_key() -> str:
    return f"wiz_live_{secrets.token_urlsafe(24)}"


def create_api_key(
    db,
    *,
    name: str,
    created_by: str,
    scopes: list[str] | None = None,
) -> dict:
    key = generate_api_key()
    ref = db.collection(API_KEYS_COLLECTION).document()
    ref.set(
        {
            "keyPrefix": key[:16],
            "keyHash": key,
            "name": (name or "default")[:120],
            "scopes": scopes or ["catalog:read"],
            "status": "active",
            "createdBy": created_by,
            "createdAt": SERVER_TIMESTAMP,
            "lastUsedAt": None,
        }
    )
    return {"id": ref.id, "apiKey": key, "name": name, "scopes": scopes or ["catalog:read"]}


def validate_api_key(db, raw_key: str) -> dict | None:
    key = (raw_key or "").strip()
    if not key or len(key) < 20:
        return None
    snaps = db.collection(API_KEYS_COLLECTION).where("keyHash", "==", key).limit(1).stream()
    for snap in snaps:
        data = snap.to_dict() or {}
        if (data.get("status") or "") != "active":
            return None
        snap.reference.update({"lastUsedAt": SERVER_TIMESTAMP})
        return {"id": snap.id, **data}
    return None
