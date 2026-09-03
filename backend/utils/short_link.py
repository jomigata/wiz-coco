"""SMS·이메일·알림톡용 짧은 go 링크 — Firestore shortLinks 컬렉션."""
from __future__ import annotations

import hashlib
import logging
import re
import secrets
import time
from urllib.parse import parse_qs, urlparse

from firebase_admin.firestore import SERVER_TIMESTAMP

from config import PORTAL_MAGIC_LINK_MAX_AGE, PUBLIC_SITE_URL, SHORT_LINKS_COLLECTION
from utils.portal_magic import get_portal_magic_link_timestamps

logger = logging.getLogger(__name__)

SHORT_LINK_CODE_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
SHORT_LINK_CODE_LENGTH = 7
_TOKEN_FROM_PATH_RE = re.compile(r"[?&]t=([^&]+)")

# 동일 magic 토큰 재발송 시 Firestore read/write 반복 방지 (프로세스 메모리, TTL 5분)
_GO_URL_CACHE: dict[str, tuple[str, float]] = {}
_GO_URL_CACHE_TTL_SEC = 300


def _generate_short_code() -> str:
    return "".join(secrets.choice(SHORT_LINK_CODE_ALPHABET) for _ in range(SHORT_LINK_CODE_LENGTH))


def _deterministic_short_code(magic_token: str, tab: str = "") -> str:
    """magicToken+tab 해시 → 고정 doc ID. where 쿼리 없이 get() 1회로 조회."""
    payload = f"{magic_token}\0{(tab or '').strip()}".encode("utf-8")
    digest = hashlib.sha256(payload).digest()
    return "".join(
        SHORT_LINK_CODE_ALPHABET[digest[i] % len(SHORT_LINK_CODE_ALPHABET)]
        for i in range(SHORT_LINK_CODE_LENGTH)
    )


def extract_magic_token(*, magic_path: str = "", magic_url: str = "") -> str:
    """magic_path(/go?t=…) 또는 magic_url에서 토큰 추출."""
    for raw in (magic_path, magic_url):
        text = (raw or "").strip()
        if not text:
            continue
        if text.startswith("http"):
            parsed = urlparse(text)
            qs = parse_qs(parsed.query)
            token = (qs.get("t") or [""])[0].strip()
            if token:
                return token
        match = _TOKEN_FROM_PATH_RE.search(text)
        if match:
            return match.group(1).strip()
    return ""


def extract_tab_from_magic_path(magic_path: str = "", magic_url: str = "") -> str:
    for raw in (magic_path, magic_url):
        text = (raw or "").strip()
        if not text:
            continue
        if text.startswith("http"):
            parsed = urlparse(text)
        elif text.startswith("/"):
            parsed = urlparse(f"https://x.invalid{text}")
        else:
            continue
        tab = (parse_qs(parsed.query).get("tab") or [""])[0].strip()
        if tab:
            return tab
    return ""


def build_short_go_url(code: str) -> str:
    slug = (code or "").strip()
    return f"{PUBLIC_SITE_URL.rstrip('/')}/go/?c={slug}"


def _short_link_not_expired(data: dict) -> bool:
    expires_at = data.get("expiresAt")
    try:
        if expires_at is not None and int(expires_at) < int(time.time()):
            return False
    except (TypeError, ValueError):
        pass
    return bool((data.get("magicToken") or "").strip())


def find_existing_short_code_for_magic(
    db,
    *,
    magic_token: str,
    tab: str = "",
) -> str:
    token = (magic_token or "").strip()
    if not token:
        return ""
    code = _deterministic_short_code(token, tab)
    try:
        snap = db.collection(SHORT_LINKS_COLLECTION).document(code).get()
        if not snap.exists:
            return ""
        data = snap.to_dict() or {}
        if (data.get("magicToken") or "").strip() != token:
            return ""
        if (data.get("tab") or "").strip() != (tab or "").strip():
            return ""
        if _short_link_not_expired(data):
            return code
    except Exception:
        logger.exception("find_existing_short_code_for_magic get failed")
    return ""


def get_or_create_short_link_for_magic(
    db,
    *,
    magic_token: str,
    portal_id: str = "",
    tab: str = "",
) -> str:
    """magic 토큰당 고정 doc ID — 조회 1회, 없을 때만 set."""
    token = (magic_token or "").strip()
    if not token:
        raise ValueError("magic_token required")

    want_tab = (tab or "").strip()
    code = _deterministic_short_code(token, want_tab)
    coll = db.collection(SHORT_LINKS_COLLECTION)
    ref = coll.document(code)
    snap = ref.get()

    issued_at, expires_at = get_portal_magic_link_timestamps(token)
    if expires_at is None:
        expires_at = int(time.time()) + PORTAL_MAGIC_LINK_MAX_AGE

    if snap.exists:
        data = snap.to_dict() or {}
        stored_token = (data.get("magicToken") or "").strip()
        if stored_token == token and (data.get("tab") or "").strip() == want_tab:
            if _short_link_not_expired(data):
                return code
            payload = {"expiresAt": expires_at}
            if issued_at is not None:
                payload["issuedAt"] = issued_at
            ref.update(payload)
            return code
        # 해시 충돌 — 랜덤 코드 fallback (극히 드묾)
        logger.warning("short_link deterministic code collision for %s", code[:4])
    else:
        payload = {
            "magicToken": token,
            "portalId": (portal_id or "").strip() or None,
            "tab": want_tab or None,
            "expiresAt": expires_at,
            "createdAt": SERVER_TIMESTAMP,
        }
        if issued_at is not None:
            payload["issuedAt"] = issued_at
        ref.set(payload)
        return code

    for _ in range(8):
        fallback_code = _generate_short_code()
        fallback_ref = coll.document(fallback_code)
        if fallback_ref.get().exists:
            continue
        payload = {
            "magicToken": token,
            "portalId": (portal_id or "").strip() or None,
            "tab": want_tab or None,
            "expiresAt": expires_at,
            "createdAt": SERVER_TIMESTAMP,
        }
        if issued_at is not None:
            payload["issuedAt"] = issued_at
        fallback_ref.set(payload)
        return fallback_code

    raise RuntimeError("short_link_code_generation_failed")


def build_short_go_url_for_magic(
    db,
    *,
    magic_path: str = "",
    magic_url: str = "",
    portal_id: str = "",
    tab: str = "",
) -> str:
    return resolve_message_go_url(
        db,
        magic_path=magic_path,
        magic_url=magic_url,
        portal_id=portal_id,
        tab=tab,
    )


def resolve_message_go_url(
    db,
    *,
    magic_path: str = "",
    magic_url: str = "",
    portal_id: str = "",
    tab: str = "",
) -> str:
    """이메일·SMS·알림톡용 — 긴 /go?t=… 대신 짧은 /go/?c= URL."""
    long_url = (magic_url or "").strip()
    if not long_url and magic_path:
        long_url = f"{PUBLIC_SITE_URL.rstrip('/')}{magic_path}"

    token = extract_magic_token(magic_path=magic_path, magic_url=long_url)
    if not token or db is None:
        return long_url

    resolved_tab = (tab or "").strip() or extract_tab_from_magic_path(magic_path, long_url)
    cache_key = f"{token}|{resolved_tab}|{(portal_id or '').strip()}"
    now = time.time()
    cached = _GO_URL_CACHE.get(cache_key)
    if cached and cached[1] > now:
        return cached[0]

    try:
        code = get_or_create_short_link_for_magic(
            db,
            magic_token=token,
            portal_id=portal_id,
            tab=resolved_tab,
        )
        url = build_short_go_url(code)
        _GO_URL_CACHE[cache_key] = (url, now + _GO_URL_CACHE_TTL_SEC)
        return url
    except Exception:
        logger.exception("resolve_message_go_url failed")
        return long_url


def resolve_short_link(db, code: str) -> dict | None:
    """유효한 단축 코드 → magicToken 등. 만료·없음 → None."""
    slug = (code or "").strip()
    if not slug or len(slug) > 16:
        return None
    doc = db.collection(SHORT_LINKS_COLLECTION).document(slug).get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    if not _short_link_not_expired(data):
        return None
    token = (data.get("magicToken") or "").strip()
    if not token:
        return None
    return {
        "code": slug,
        "magicToken": token,
        "portalId": (data.get("portalId") or "").strip(),
        "tab": (data.get("tab") or "").strip(),
        "expiresAt": data.get("expiresAt"),
        "issuedAt": data.get("issuedAt"),
    }
