#!/usr/bin/env python3
"""Upsert dispatch_recipients row from Firestore portal (TASK-073 POC)."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from firebase_init import get_firestore
from utils.portal_dispatch_summary import refresh_portal_test_summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--portal-id", required=True)
    parser.add_argument("--assessment-id", required=True)
    parser.add_argument("--counselor-uid", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    url = (os.getenv("DATABASE_URL") or "").strip()
    if not url:
        print("DATABASE_URL required")
        return 1
    db = get_firestore()
    portal = db.collection("clientPortals").document(args.portal_id).get()
    if not portal.exists:
        print("portal not found")
        return 1
    pdata = portal.to_dict() or {}
    summary = pdata.get("dispatchSummary") or {}
    if args.dry_run:
        print("dry-run upsert", args.portal_id, summary)
        return 0
    try:
        import psycopg2
    except ImportError:
        print("psycopg2 not installed")
        return 1
    refresh_portal_test_summary(
        db,
        portal_id=args.portal_id,
        assessment_id=args.assessment_id,
        required_test_ids=set(),
    )
    conn = psycopg2.connect(url)
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO dispatch_recipients (
              portal_id, counselor_uid, assessment_id, display_name,
              notify_status, test_status, completed_count, required_count, updated_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            ON CONFLICT (portal_id) DO UPDATE SET
              notify_status = EXCLUDED.notify_status,
              test_status = EXCLUDED.test_status,
              completed_count = EXCLUDED.completed_count,
              required_count = EXCLUDED.required_count,
              updated_at = NOW()
            """,
            (
                args.portal_id,
                args.counselor_uid,
                args.assessment_id,
                pdata.get("displayName") or "",
                summary.get("notifyStatus") or pdata.get("lastNotifyStatus") or "not_sent",
                summary.get("testStatus") or "not_started",
                int(summary.get("completedCount") or 0),
                int(summary.get("requiredCount") or 0),
            ),
        )
    conn.commit()
    conn.close()
    print("upserted", args.portal_id)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
