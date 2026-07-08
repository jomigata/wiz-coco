# 담당 상담사 ↔ 기관 위임 조회 (T-5-03)
from __future__ import annotations

from config import ORGANIZATIONS_COLLECTION
from utils.org_credits import get_org_balance
from utils.org_group_report import list_org_cohort_summaries


def list_counselor_org_liaisons(db, counselor_uid: str) -> list[dict]:
    """상담사가 liaison으로 배정된 기관·cohort 요약."""
    uid = (counselor_uid or "").strip()
    if not uid:
        return []

    rows = []
    for doc in (
        db.collection(ORGANIZATIONS_COLLECTION)
        .where("liaisonCounselorUid", "==", uid)
        .limit(30)
        .stream()
    ):
        d = doc.to_dict() or {}
        if (d.get("status") or "active") != "active":
            continue
        org_id = doc.id
        cohorts = list_org_cohort_summaries(db, organization_id=org_id)
        rows.append(
            {
                "organizationId": org_id,
                "name": d.get("name") or org_id,
                "type": d.get("type") or "school",
                "adminUid": d.get("adminUid") or "",
                "creditBalance": get_org_balance(db, org_id),
                "cohortCount": len(cohorts),
                "cohorts": cohorts,
            }
        )

    rows.sort(key=lambda x: (x.get("name") or "").lower())
    return rows
