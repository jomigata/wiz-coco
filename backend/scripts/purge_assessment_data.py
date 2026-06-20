#!/usr/bin/env python3
"""
검사코드(assessments) 및 내담자 검사 기록 일괄 삭제.

사용 (저장소 루트):
  python backend/scripts/purge_assessment_data.py --dry-run
  python backend/scripts/purge_assessment_data.py --confirm PURGE

환경: GOOGLE_APPLICATION_CREDENTIALS 또는 FIREBASE_CREDENTIALS_PATH
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from firebase_init import get_firestore
from utils.purge_assessment_data import purge_assessment_platform_data


def main() -> int:
    parser = argparse.ArgumentParser(description="Purge counselor assessment codes and client test data")
    parser.add_argument("--dry-run", action="store_true", help="Count only, do not delete")
    parser.add_argument("--confirm", default="", help='Must be "PURGE" to delete')
    parser.add_argument(
        "--counselor-results-only",
        action="store_true",
        help="Delete only testResults linked to accessCode/assessmentId (default: entire testResults)",
    )
    args = parser.parse_args()

    if not args.dry_run and args.confirm != "PURGE":
        print('삭제하려면 --confirm PURGE 또는 --dry-run 을 사용하세요.', file=sys.stderr)
        return 1

    db = get_firestore()
    result = purge_assessment_platform_data(
        db,
        dry_run=args.dry_run,
        include_all_test_results=not args.counselor_results_only,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
