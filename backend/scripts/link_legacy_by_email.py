#!/usr/bin/env python3
"""
관리자(또는 지정 이메일)의 testResults 레거시 uid/email 을 현재 Firebase Auth uid에 연결.

사용 예 (저장소 루트, GOOGLE_APPLICATION_CREDENTIALS 설정 후):
  python backend/scripts/link_legacy_by_email.py jomigata@gmail.com
  python backend/scripts/link_legacy_by_email.py wizcocoai@gmail.com
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from firebase_admin import auth as fb_auth
from firebase_admin.firestore import SERVER_TIMESTAMP

from firebase_init import get_firestore, init_firebase
from config import USERS_COLLECTION, TEST_RESULTS_COLLECTION

init_firebase()


def link_email(email: str) -> None:
    email = email.strip().lower()
    if not email:
        print("이메일이 필요합니다.")
        return

    try:
        user = fb_auth.get_user_by_email(email)
        uid = user.uid
    except Exception as e:
        print(f"Firebase Auth 사용자 없음 ({email}): {e}")
        return

    db = get_firestore()
    linked = 0
    seen: set[str] = set()

    def link_snap(snap) -> None:
        nonlocal linked
        if snap.id in seen:
            return
        seen.add(snap.id)
        data = snap.to_dict() or {}
        updates = {}
        if data.get("uid") != uid:
            updates["uid"] = uid
        if data.get("clientUid") != uid:
            updates["clientUid"] = uid
        if updates:
            updates["updatedAt"] = SERVER_TIMESTAMP
            snap.reference.update(updates)
            linked += 1

    for field in ("email", "clientEmail"):
        for snap in db.collection(TEST_RESULTS_COLLECTION).where(field, "==", email).stream():
            link_snap(snap)

    for udoc in db.collection(USERS_COLLECTION).where("email", "==", email).stream():
        old_uid = udoc.id
        if old_uid == uid:
            continue
        for snap in db.collection(TEST_RESULTS_COLLECTION).where("uid", "==", old_uid).stream():
            link_snap(snap)

    db.collection(USERS_COLLECTION).document(uid).set(
        {"email": email, "role": "admin", "linkedLegacyAt": SERVER_TIMESTAMP},
        merge=True,
    )
    print(f"완료: {email} → uid={uid}, testResults 연결 {linked}건")


if __name__ == "__main__":
    emails = sys.argv[1:] or ["jomigata@gmail.com", "wizcocoai@gmail.com"]
    for em in emails:
        link_email(em)
