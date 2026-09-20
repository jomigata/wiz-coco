#!/usr/bin/env python3
"""Backfill clientPortals.dispatchSummary from dispatch API logic (TASK-020)."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from firebase_init import get_firestore
from utils.assessment_dispatch import get_assessment_dispatch_status
from utils.portal_dispatch_summary import build_dispatch_summary, patch_portal_dispatch_summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--assessment-id", required=True)
    parser.add_argument("--counselor-uid", default="")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    db = get_firestore()
    uid = args.counselor_uid.strip() or None
    data = get_assessment_dispatch_status(db, args.assessment_id, uid, limit=200)
    if not data:
        print("assessment not found or access denied")
        return 1
    updated = 0
    for row in data.get("recipients") or []:
        portal_id = (row.get("portalId") or "").strip()
        if not portal_id:
            continue
        required = len(data.get("testList") or [])
        completed = sum(1 for t in row.get("tests") or [] if t.get("status") == "completed")
        summary = build_dispatch_summary(
            notify_status=row.get("notifyStatus") or "not_sent",
            test_status=row.get("testStatus") or "not_started",
            completed_count=completed,
            required_count=required,
        )
        if args.dry_run:
            print("dry-run", portal_id, summary)
        else:
            patch_portal_dispatch_summary(db, portal_id, summary)
        updated += 1
    print(f"{'would update' if args.dry_run else 'updated'} {updated} portals")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
