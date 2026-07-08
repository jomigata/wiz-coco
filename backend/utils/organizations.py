# 기관(Organization) CRUD — B2B
from __future__ import annotations

import secrets
import time

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ORGANIZATIONS_COLLECTION, USERS_COLLECTION


def generate_org_id() -> str:
    return f"org_{int(time.time())}_{secrets.token_hex(3)}"


def create_organization(
    db,
    *,
    name: str,
    org_type: str,
    liaison_counselor_uid: str,
    admin_uid: str = "",
    actor_uid: str,
) -> dict:
    name = (name or "").strip()
    if not name:
        raise ValueError("name required")
    liaison = (liaison_counselor_uid or "").strip()
    if not liaison:
        raise ValueError("liaisonCounselorUid required")

    org_id = generate_org_id()
    db.collection(ORGANIZATIONS_COLLECTION).document(org_id).set(
        {
            "organizationId": org_id,
            "name": name[:200],
            "type": (org_type or "school").strip()[:40],
            "liaisonCounselorUid": liaison,
            "adminUid": (admin_uid or "").strip(),
            "groupReportEnabled": True,
            "prepaidEntry": True,
            "status": "active",
            "createdAt": SERVER_TIMESTAMP,
            "createdBy": actor_uid,
        }
    )

    if admin_uid:
        assign_org_admin(db, org_id, admin_uid, actor_uid=actor_uid)

    return get_organization(db, org_id) or {"organizationId": org_id}


def get_organization(db, org_id: str) -> dict | None:
    doc = db.collection(ORGANIZATIONS_COLLECTION).document(org_id).get()
    if not doc.exists:
        return None
    d = doc.to_dict() or {}
    d["id"] = doc.id
    for key in ("createdAt", "updatedAt"):
        val = d.get(key)
        if val and hasattr(val, "isoformat"):
            d[key] = val.isoformat()
    return d


def assign_org_admin(db, org_id: str, admin_uid: str, *, actor_uid: str = "") -> None:
    org = get_organization(db, org_id)
    if not org:
        raise ValueError("organization not found")
    admin_uid = (admin_uid or "").strip()
    if not admin_uid:
        raise ValueError("adminUid required")

    db.collection(ORGANIZATIONS_COLLECTION).document(org_id).update(
        {"adminUid": admin_uid, "updatedAt": SERVER_TIMESTAMP}
    )
    db.collection(USERS_COLLECTION).document(admin_uid).set(
        {
            "role": "org_admin",
            "organizationId": org_id,
            "updatedAt": SERVER_TIMESTAMP,
        },
        merge=True,
    )


def get_org_context_for_user(db, uid: str) -> dict | None:
    user_doc = db.collection(USERS_COLLECTION).document(uid).get()
    if not user_doc.exists:
        return None
    data = user_doc.to_dict() or {}
    role = data.get("role")
    org_id = (data.get("organizationId") or "").strip()
    if role not in ("org_admin", "admin") or not org_id:
        if role == "admin":
            return None
        return None
    org = get_organization(db, org_id)
    if not org:
        return None
    return {"organizationId": org_id, "organization": org, "role": role}


def list_organizations(db, *, limit: int = 100) -> list[dict]:
    limit = max(1, min(limit, 200))
    snaps = db.collection(ORGANIZATIONS_COLLECTION).limit(limit).stream()
    rows = []
    for snap in snaps:
        d = snap.to_dict() or {}
        d["id"] = snap.id
        rows.append(d)
    rows.sort(key=lambda x: x.get("name") or "")
    return rows[:limit]


def update_organization_liaison(
    db,
    org_id: str,
    liaison_counselor_uid: str,
    *,
    actor_uid: str = "",
) -> dict | None:
    """기관 담당 상담사(liaison) 변경 — T-5-03."""
    org = get_organization(db, org_id)
    if not org:
        raise ValueError("organization not found")
    liaison = (liaison_counselor_uid or "").strip()
    if not liaison:
        raise ValueError("liaisonCounselorUid required")

    db.collection(ORGANIZATIONS_COLLECTION).document(org_id).update(
        {
            "liaisonCounselorUid": liaison,
            "updatedAt": SERVER_TIMESTAMP,
            "liaisonUpdatedBy": actor_uid or "",
        }
    )
    return get_organization(db, org_id)
