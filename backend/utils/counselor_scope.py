"""상담사 API — admin은 전체 상담사 데이터 조회."""
from __future__ import annotations


def is_admin_scope() -> bool:
    from flask import g

    return getattr(g, "counselor_role", None) == "admin"


def scope_counselor_uid() -> str | None:
    """필터용 counselor uid. admin이면 None(전체)."""
    from flask import g

    if is_admin_scope():
        return None
    return getattr(g, "counselor_uid", None)


def resolve_list_counselor_uid(*, own_only: bool) -> str | None:
    """목록 API scope. admin+ownOnly 이면 본인 생성분만."""
    from flask import g

    if is_admin_scope():
        if own_only:
            return getattr(g, "counselor_uid", None)
        return None
    return getattr(g, "counselor_uid", None)


def resource_owned_by_scope(resource_counselor_id: str | None) -> bool:
    from flask import g

    if is_admin_scope():
        return True
    owner = (resource_counselor_id or "").strip()
    return owner == getattr(g, "counselor_uid", None)
