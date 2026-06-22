"""검사 선행 — 프로필 등록 전 게스트 참여 세션."""
from flask import request
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from config import SECRET_KEY

GUEST_MAX_AGE = 7 * 24 * 3600


def issue_guest_token(*, guest_id: str, assessment_id: str, access_code: str) -> str:
    serializer = URLSafeTimedSerializer(SECRET_KEY, salt="join-guest")
    return serializer.dumps(
        {
            "guestId": guest_id,
            "assessmentId": assessment_id,
            "accessCode": access_code,
        }
    )


def verify_guest_token(token: str):
    raw = (token or "").strip()
    if raw.lower().startswith("guest "):
        raw = raw[6:].strip()
    if not raw:
        return None
    try:
        serializer = URLSafeTimedSerializer(SECRET_KEY, salt="join-guest")
        return serializer.loads(raw, max_age=GUEST_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None


def get_guest_session_from_request():
    auth = (request.headers.get("Authorization") or "").strip()
    if not auth:
        return None
    if auth.lower().startswith("guest "):
        return verify_guest_token(auth[6:].strip())
    return None
