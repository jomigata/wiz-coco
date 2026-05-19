#!/usr/bin/env python3
"""
Firestore·저장 데이터에서 검사코드·검사결과 코드의 하이픈(-) 제거.

사용 (저장소 루트에서):
  python backend/scripts/migrate_strip_code_hyphens.py --dry-run
  python backend/scripts/migrate_strip_code_hyphens.py

환경: GOOGLE_APPLICATION_CREDENTIALS 또는 FIREBASE_CREDENTIALS_PATH
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# backend 패키지 import
BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from firebase_init import get_firestore
from utils.access_code import normalize_access_code

CODE_FIELDS = (
    "accessCode",
    "code",
    "testCode",
    "counselorCode",
    "groupCode",
    "resultCode",
)

COLLECTIONS_DOC_ID_AS_CODE = ("test_results", "testResults")


def _strip_code(raw: str) -> tuple[str, bool]:
    if not raw or not isinstance(raw, str):
        return raw, False
    if "-" not in raw:
        return raw, False
    n = normalize_access_code(raw)
    if not n or n == raw:
        return raw, False
    return n, True


def _migrate_fields(data: dict) -> tuple[dict, int]:
    changed = 0
    out = dict(data)
    for key in CODE_FIELDS:
        if key not in out:
            continue
        val = out.get(key)
        if not isinstance(val, str):
            continue
        n, did = _strip_code(val)
        if did:
            out[key] = n
            changed += 1
    ud = out.get("userData")
    if isinstance(ud, dict):
        ud2, c = _migrate_nested(ud)
        if c:
            out["userData"] = ud2
            changed += c
    return out, changed


def _migrate_nested(obj: dict) -> tuple[dict, int]:
    changed = 0
    out = dict(obj)
    for key in CODE_FIELDS:
        if key in out and isinstance(out[key], str):
            n, did = _strip_code(out[key])
            if did:
                out[key] = n
                changed += 1
    ci = out.get("clientInfo")
    if isinstance(ci, dict):
        ci2, c = _migrate_nested(ci)
        if c:
            out["clientInfo"] = ci2
            changed += c
    return out, changed


def migrate_assessments(db, dry_run: bool) -> dict:
    stats = {"scanned": 0, "updated": 0}
    for doc in db.collection("assessments").stream():
        stats["scanned"] += 1
        d = doc.to_dict() or {}
        ac = d.get("accessCode", "")
        n, did = _strip_code(ac) if isinstance(ac, str) else (ac, False)
        if not did:
            continue
        stats["updated"] += 1
        print(f"  assessments/{doc.id} accessCode: {ac!r} -> {n!r}")
        if not dry_run:
            doc.reference.update({"accessCode": n})
    return stats


def migrate_test_results_fields(db, collection: str, dry_run: bool) -> dict:
    stats = {"scanned": 0, "field_updates": 0}
    for doc in db.collection(collection).stream():
        stats["scanned"] += 1
        d = doc.to_dict() or {}
        new_d, c = _migrate_fields(d)
        if c == 0:
            continue
        stats["field_updates"] += c
        print(f"  {collection}/{doc.id} fields updated ({c})")
        if not dry_run:
            patch = {k: new_d[k] for k in CODE_FIELDS if k in new_d and new_d.get(k) != d.get(k)}
            if new_d.get("userData") != d.get("userData"):
                patch["userData"] = new_d["userData"]
            if patch:
                doc.reference.update(patch)
    return stats


def migrate_doc_id_as_code(db, collection: str, dry_run: bool) -> dict:
    stats = {"scanned": 0, "renamed": 0, "skipped": 0}
    to_process = []
    for doc in db.collection(collection).stream():
        stats["scanned"] += 1
        old_id = doc.id
        if "-" not in old_id:
            continue
        new_id, did = _strip_code(old_id)
        if not did:
            continue
        to_process.append((doc, old_id, new_id))

    for doc, old_id, new_id in to_process:
        new_ref = db.collection(collection).document(new_id)
        if new_ref.get().exists:
            print(f"  SKIP {collection}/{old_id} -> {new_id} (target exists)")
            stats["skipped"] += 1
            continue
        d = doc.to_dict() or {}
        new_d, _ = _migrate_fields(d)
        if "code" in new_d or True:
            new_d["code"] = new_id
        print(f"  RENAME {collection}/{old_id} -> {new_id}")
        stats["renamed"] += 1
        if not dry_run:
            new_ref.set(new_d)
            doc.reference.delete()
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Strip hyphens from inspection/result codes in Firestore")
    parser.add_argument("--dry-run", action="store_true", help="Print changes only")
    args = parser.parse_args()

    db = get_firestore()
    dry = args.dry_run
    if dry:
        print("=== DRY RUN (no writes) ===\n")

    print("assessments.accessCode …")
    a = migrate_assessments(db, dry)
    print(f"  scanned={a['scanned']} updated={a['updated']}\n")

    for coll in ("testResults",):
        print(f"{coll} field migration …")
        t = migrate_test_results_fields(db, coll, dry)
        print(f"  scanned={t['scanned']} field_updates={t['field_updates']}\n")

    for coll in COLLECTIONS_DOC_ID_AS_CODE:
        print(f"{coll} document ID rename …")
        r = migrate_doc_id_as_code(db, coll, dry)
        print(f"  scanned={r['scanned']} renamed={r['renamed']} skipped={r['skipped']}\n")

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
