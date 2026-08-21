#!/usr/bin/env python3
"""
상담사 이메일로 검사 크레딧 지급.

사용 예 (저장소 루트, GOOGLE_APPLICATION_CREDENTIALS 설정 후):
  python backend/scripts/grant_counselor_credits_by_email.py jomiga@naver.com 100000
  python backend/scripts/grant_counselor_credits_by_email.py jomiga@naver.com jomigata@naver.com --amount 100000
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from firebase_admin import auth as fb_auth

from config import USERS_COLLECTION
from firebase_init import get_firestore, get_firebase_app
from utils.counselor_credits import get_balance, grant_credits

get_firebase_app()


def resolve_counselor_uid(db, email: str) -> tuple[str, str]:
    email = email.strip().lower()
    if not email:
        raise ValueError("email required")

    for udoc in db.collection(USERS_COLLECTION).where("email", "==", email).limit(20).stream():
        role = (udoc.to_dict() or {}).get("role")
        if role in ("counselor", "admin"):
            return udoc.id, role or "counselor"

    try:
        auth_user = fb_auth.get_user_by_email(email)
        uid = auth_user.uid
    except Exception as exc:
        raise ValueError(f"상담사 사용자를 찾을 수 없음 ({email}): {exc}") from exc

    user_doc = db.collection(USERS_COLLECTION).document(uid).get()
    if not user_doc.exists:
        raise ValueError(f"Firestore users 문서 없음 ({email}, uid={uid})")

    role = (user_doc.to_dict() or {}).get("role")
    if role not in ("counselor", "admin"):
        raise ValueError(f"상담사/admin 역할이 아님 ({email}, role={role})")

    return uid, role or "counselor"


def grant_for_email(db, email: str, amount: int, *, reason: str, actor: str) -> dict:
    uid, role = resolve_counselor_uid(db, email)
    before = get_balance(db, uid)
    result = grant_credits(
        db,
        uid,
        amount,
        reason=reason,
        actor_uid=actor,
        metadata={"source": "admin_script", "email": email.strip().lower(), "role": role},
    )
    after = result.get("balance", get_balance(db, uid))
    print(f"OK {email} uid={uid} role={role} before={before} granted={amount} after={after}")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Grant counselor assessment credits by email")
    parser.add_argument("emails", nargs="+", help="Counselor email(s)")
    parser.add_argument("--amount", type=int, default=100000, help="Credits to grant (default 100000)")
    parser.add_argument("--reason", default="admin_grant", help="Ledger reason")
    parser.add_argument("--actor", default="admin_script", help="Ledger actor uid")
    args = parser.parse_args()

    if args.amount <= 0 or args.amount > 100000:
        print("amount must be between 1 and 100000", file=sys.stderr)
        return 1

    db = get_firestore()
    failed = 0
    for raw in args.emails:
        email = raw.strip().lower()
        if email == "--amount" or email.startswith("--"):
            continue
        try:
            grant_for_email(db, email, args.amount, reason=args.reason, actor=args.actor)
        except Exception as exc:
            failed += 1
            print(f"FAIL {email}: {exc}", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
