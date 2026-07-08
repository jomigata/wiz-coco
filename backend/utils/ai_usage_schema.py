"""AI 크레딧·토큰 사용 원장 스키마 검증 (T-3-01)."""
from __future__ import annotations

from typing import Any

SCHEMA_VERSION = 1

AI_USAGE_FEATURES = frozenset(
    {
        "counsel_message",
        "session_summary",
        "assessment_interpret",
        "test_recommendation",
        "report_generate",
        "admin_grant",
        "admin_adjustment",
        "commerce_purchase",
        "refund",
    }
)

AI_USAGE_REASONS = frozenset(
    {
        "counsel_message",
        "session_summary",
        "assessment_interpret",
        "test_recommendation",
        "report_generate",
        "admin_grant",
        "admin_adjustment",
        "commerce_purchase",
        "refund",
        "pilot_grant",
    }
)


class AiUsageValidationError(ValueError):
    """AI 사용·원장 페이로드 검증 실패."""


def _strip(value: Any) -> str:
    return str(value or "").strip()


def feature_label(feature: str) -> str:
    labels = {
        "counsel_message": "AI 상담 메시지",
        "session_summary": "상담 세션 요약",
        "assessment_interpret": "검사 결과 AI 해석",
        "test_recommendation": "맞춤 검사 추천",
        "report_generate": "AI 리포트 생성",
        "admin_grant": "관리자 지급",
        "admin_adjustment": "관리자 조정",
        "commerce_purchase": "AI 크레딧 구매",
        "refund": "환불",
    }
    return labels.get(feature, feature)


def validate_ledger_entry_payload(payload: dict | None) -> dict:
    """aiUsageLedger 항목 검증 (서버 쓰기 전)."""
    if not isinstance(payload, dict):
        raise AiUsageValidationError("ledger payload가 필요합니다.")

    counselor_uid = _strip(payload.get("counselorUid"))
    if not counselor_uid:
        raise AiUsageValidationError("counselorUid가 필요합니다.")

    feature = _strip(payload.get("feature"))
    if feature not in AI_USAGE_FEATURES:
        raise AiUsageValidationError("유효하지 않은 feature입니다.")

    reason = _strip(payload.get("reason")) or feature
    if reason not in AI_USAGE_REASONS:
        raise AiUsageValidationError("유효하지 않은 reason입니다.")

    try:
        delta = int(payload.get("delta"))
    except (TypeError, ValueError) as exc:
        raise AiUsageValidationError("delta는 정수여야 합니다.") from exc

    try:
        balance_after = int(payload.get("balanceAfter"))
    except (TypeError, ValueError) as exc:
        raise AiUsageValidationError("balanceAfter는 정수여야 합니다.") from exc

    out: dict[str, Any] = {
        "counselorUid": counselor_uid,
        "feature": feature,
        "delta": delta,
        "balanceAfter": balance_after,
        "reason": reason,
    }

    for key in (
        "tokensPrompt",
        "tokensCompletion",
        "tokensTotal",
    ):
        if payload.get(key) is not None:
            try:
                out[key] = max(0, int(payload[key]))
            except (TypeError, ValueError) as exc:
                raise AiUsageValidationError(f"{key}는 0 이상 정수여야 합니다.") from exc

    for key in (
        "modelId",
        "sessionId",
        "portalId",
        "resultId",
        "reportId",
        "actorUid",
    ):
        val = _strip(payload.get(key))
        if val:
            out[key] = val

    metadata = payload.get("metadata")
    if metadata is not None:
        if not isinstance(metadata, dict):
            raise AiUsageValidationError("metadata는 객체여야 합니다.")
        out["metadata"] = metadata

    return out


def validate_grant_payload(body: dict | None) -> dict:
    """관리자 AI 크레딧 지급 요청 검증."""
    if not isinstance(body, dict):
        raise AiUsageValidationError("요청 본문이 필요합니다.")

    counselor_uid = _strip(body.get("counselorUid"))
    if not counselor_uid:
        raise AiUsageValidationError("counselorUid가 필요합니다.")

    try:
        amount = int(body.get("amount"))
    except (TypeError, ValueError) as exc:
        raise AiUsageValidationError("amount는 정수여야 합니다.") from exc
    if amount <= 0:
        raise AiUsageValidationError("amount는 1 이상이어야 합니다.")

    reason = _strip(body.get("reason")) or "admin_grant"
    if reason not in AI_USAGE_REASONS:
        raise AiUsageValidationError("유효하지 않은 reason입니다.")

    return {
        "counselorUid": counselor_uid,
        "amount": amount,
        "reason": reason,
        "metadata": body.get("metadata") if isinstance(body.get("metadata"), dict) else None,
    }
