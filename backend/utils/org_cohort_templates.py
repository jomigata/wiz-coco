# 기관 cohort 검사 세트 프리셋 (T-5-01)
from __future__ import annotations

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import ORG_COHORT_TEMPLATES_COLLECTION


def list_org_cohort_templates(db, organization_id: str) -> list[dict]:
    org_id = (organization_id or "").strip()
    if not org_id:
        return []
    snaps = (
        db.collection(ORG_COHORT_TEMPLATES_COLLECTION)
        .where("organizationId", "==", org_id)
        .limit(50)
        .stream()
    )
    rows = []
    for snap in snaps:
        d = snap.to_dict() or {}
        d["id"] = snap.id
        for key in ("createdAt", "updatedAt"):
            val = d.get(key)
            if val and hasattr(val, "isoformat"):
                d[key] = val.isoformat()
        rows.append(d)
    rows.sort(key=lambda x: (x.get("name") or "").lower())
    return rows


def create_org_cohort_template(
    db,
    organization_id: str,
    *,
    name: str,
    title: str = "",
    welcome_message: str = "",
    usage_end_date: str = "",
    test_list: list,
    actor_uid: str = "",
) -> dict:
    org_id = (organization_id or "").strip()
    label = (name or "").strip()
    if not org_id or not label:
        raise ValueError("organizationId and name required")

    cleaned_tests = [
        {"testId": str(t.get("testId") or "").strip(), "name": str(t.get("name") or "").strip()}
        for t in (test_list or [])
        if t and str(t.get("testId") or "").strip()
    ]
    if not cleaned_tests:
        raise ValueError("testList required")

    ref = db.collection(ORG_COHORT_TEMPLATES_COLLECTION).document()
    payload = {
        "organizationId": org_id,
        "name": label[:80],
        "title": (title or label).strip()[:120],
        "welcomeMessage": (welcome_message or "").strip()[:2000],
        "usageEndDate": (usage_end_date or "").strip()[:32],
        "testList": cleaned_tests,
        "createdAt": SERVER_TIMESTAMP,
        "updatedAt": SERVER_TIMESTAMP,
        "createdBy": actor_uid,
    }
    ref.set(payload)
    out = dict(payload)
    out["id"] = ref.id
    out.pop("createdAt", None)
    out.pop("updatedAt", None)
    return out


def delete_org_cohort_template(db, organization_id: str, template_id: str) -> bool:
    ref = db.collection(ORG_COHORT_TEMPLATES_COLLECTION).document((template_id or "").strip())
    doc = ref.get()
    if not doc.exists:
        return False
    d = doc.to_dict() or {}
    if d.get("organizationId") != organization_id:
        return False
    ref.delete()
    return True
