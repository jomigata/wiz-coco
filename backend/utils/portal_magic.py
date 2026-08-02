"""내담자 포털 매직 링크 토큰."""
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from config import SECRET_KEY, PORTAL_MAGIC_LINK_MAX_AGE


def _serializer(salt: str):
    return URLSafeTimedSerializer(SECRET_KEY, salt=salt)


def create_portal_magic_link_token(portal_id: str, access_code: str) -> str:
    return _serializer("portal-magic").dumps({"portalId": portal_id, "accessCode": access_code})


def verify_portal_magic_link_token(token: str) -> dict:
    return _serializer("portal-magic").loads(token, max_age=PORTAL_MAGIC_LINK_MAX_AGE)


def get_portal_magic_link_timestamps(token: str) -> tuple[int | None, int | None]:
    """Return (issued_at_unix, expires_at_unix) without enforcing max_age."""
    try:
        _, ts = _serializer("portal-magic").loads(token, max_age=None, return_timestamp=True)
        issued = int(ts)
        return issued, issued + PORTAL_MAGIC_LINK_MAX_AGE
    except Exception:
        return None, None


__all__ = [
    "create_portal_magic_link_token",
    "verify_portal_magic_link_token",
    "get_portal_magic_link_timestamps",
    "BadSignature",
    "SignatureExpired",
]
