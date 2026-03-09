# Firebase Admin SDK 초기화 (상담사 인증 + Firestore)
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

from config import FIREBASE_CREDENTIALS_PATH

_firebase_app = None
_db = None


def get_firebase_app():
    global _firebase_app
    if _firebase_app is None:
        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
        else:
            path = FIREBASE_CREDENTIALS_PATH.strip()
            if path and os.path.isfile(path):
                cred = credentials.Certificate(path)
                _firebase_app = firebase_admin.initialize_app(cred)
            else:
                # GOOGLE_APPLICATION_CREDENTIALS 환경변수 사용
                _firebase_app = firebase_admin.initialize_app()
    return _firebase_app


def get_firestore():
    global _db
    if _db is None:
        get_firebase_app()
        _db = firestore.client()
    return _db


def verify_id_token(token: str):
    """Firebase ID 토큰 검증 후 uid 반환. 실패 시 None 또는 예외."""
    get_firebase_app()
    decoded = auth.verify_id_token(token)
    return decoded.get("uid")
