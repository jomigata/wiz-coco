"""testResults 문서 — 응시자(액터) 식별·표시 (clientUid / portal / participant / guest)."""


def result_actor_key(d: dict, *, result_id: str = "") -> str:
    """결과를 그룹화할 고유 키."""
    uid = str(d.get("clientUid") or "").strip()
    if uid:
        return uid

    portal_id = str(d.get("portalId") or "").strip()
    if portal_id:
        return f"portal:{portal_id}"

    participant_id = str(d.get("participantId") or "").strip()
    if participant_id:
        return f"participant:{participant_id}"

    guest_id = str(d.get("guestId") or "").strip()
    if guest_id:
        return f"guest:{guest_id}"

    email = (d.get("clientEmail") or "").strip().lower()
    if email:
        return f"legacy-email:{email}"

    rid = (result_id or "").strip()
    if rid:
        return f"unknown:{rid}"
    return ""


def result_actor_email(d: dict) -> str | None:
    email = (d.get("clientEmail") or "").strip().lower()
    return email or None


def result_actor_display(
    d: dict,
    actor_key: str,
    portal_labels: dict[str, str] | None = None,
) -> str | None:
    """상담사 UI용 내담자 표시 문자열."""
    profile = d.get("clientProfile") or {}
    display = str(profile.get("displayName") or "").strip()
    if display:
        return display

    email = result_actor_email(d)
    if email:
        return email

    portal_id = str(d.get("portalId") or "").strip()
    if portal_id and portal_labels:
        label = portal_labels.get(portal_id)
        if label:
            return label

    if actor_key.startswith("portal:"):
        return "내 검사실 사용자"
    if actor_key.startswith("participant:"):
        return "검사 참여자"
    if actor_key.startswith("guest:"):
        return "게스트 (미등록)"

    return None
