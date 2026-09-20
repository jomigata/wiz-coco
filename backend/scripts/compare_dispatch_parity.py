#!/usr/bin/env python3
"""Compare Firestore vs Postgres dispatch list for one assessment (TASK-072 parity)."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from firebase_init import get_firestore
from utils.assessment_dispatch import get_assessment_dispatch_status


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--assessment-id", required=True)
    parser.add_argument("--counselor-uid", required=True)
    parser.add_argument("--limit", type=int, default=50)
    args = parser.parse_args()

    os.environ["DISPATCH_LIST_SOURCE"] = "firestore"
    db = get_firestore()
    fs = get_assessment_dispatch_status(
        db,
        args.assessment_id,
        args.counselor_uid,
        limit=args.limit,
        expand_tests=False,
    )
    if not fs:
        print("Firestore dispatch: not found")
        return 1

    if not (os.getenv("DATABASE_URL") or "").strip():
        print("DATABASE_URL not set — skip postgres compare")
        return 1

    from utils.dispatch_list_postgres import try_get_dispatch_from_postgres

    pg = try_get_dispatch_from_postgres(
        assessment_id=args.assessment_id,
        counselor_uid=args.counselor_uid,
        limit=args.limit,
        cursor=None,
        expand_tests=False,
        assessment_meta={
            "title": fs.get("title") or "",
            "cohortName": fs.get("cohortName") or "",
            "joinAccessCode": fs.get("joinAccessCode") or "",
            "testList": fs.get("testList") or [],
        },
    )
    if not pg:
        print("Postgres dispatch: not found or empty SQL")
        return 1

    fs_rows = {
        r["portalId"]: (r.get("displayName"), r.get("notifyStatus"), r.get("testStatus"))
        for r in fs.get("recipients") or []
    }
    pg_rows = {
        r["portalId"]: (r.get("displayName"), r.get("notifyStatus"), r.get("testStatus"))
        for r in pg.get("recipients") or []
    }
    only_fs = set(fs_rows) - set(pg_rows)
    only_pg = set(pg_rows) - set(fs_rows)
    mismatch = [pid for pid in fs_rows.keys() & pg_rows.keys() if fs_rows[pid] != pg_rows[pid]]

    print(f"Firestore recipients: {len(fs_rows)}")
    print(f"Postgres recipients: {len(pg_rows)}")
    if only_fs:
        print("Only in Firestore:", sorted(only_fs)[:10], "..." if len(only_fs) > 10 else "")
    if only_pg:
        print("Only in Postgres:", sorted(only_pg)[:10], "..." if len(only_pg) > 10 else "")
    if mismatch:
        print("Field mismatches:", len(mismatch))
        for pid in mismatch[:5]:
            print(" ", pid, fs_rows[pid], "vs", pg_rows[pid])

    ok = not only_fs and not only_pg and not mismatch
    print("PARITY OK" if ok else "PARITY FAIL")
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
