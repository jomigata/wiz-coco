"""검사 참여 세션 (코드만으로 시작, 프로필 등록 후 검사 제출)."""
from flask import request
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from config import SECRET_KEY

PARTICIPANT_MAX_AGE = 7 * 24 * 3600


def issue_participant_token(*, participant_id: str, assessment_id: str, access_code: str) -> str:
    serializer = URLSafeTimedSerializer(SECRET_KEY, salt="join-participant")
    return serializer.dumps(
        {
            "participantId": participant_id,
            "assessmentId": assessment_id,
            "accessCode": access_code,
        }
    )


def verify_participant_token(token: str):
    raw = (token or "").strip()
    if raw.lower().startswith("participant "):
        raw = raw[12:].strip()
    if not raw:
        return None
    try:
        serializer = URLSafeTimedSerializer(SECRET_KEY, salt="join-participant")
        return serializer.loads(raw, max_age=PARTICIPANT_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None


def get_participant_session_from_request():
    auth = (request.headers.get("Authorization") or "").strip()
    if not auth:
        return None
    if auth.lower().startswith("participant "):
        return verify_participant_token(auth)
    return None
