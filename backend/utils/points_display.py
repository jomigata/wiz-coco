"""포인트 표기 — DB는 검사/AI '크레딧' 정수 유지, API·UI는 포인트 노출."""
from __future__ import annotations

# 1포인트 = 10원
WON_PER_POINT = 10

# 검사 지갑: DB 크레딧 1건 = 10포인트 (= 100원)
POINTS_PER_ASSESSMENT_CREDIT = 10

# AI 지갑: DB AI크레딧 1건 = 10포인트 (동일 환산)
POINTS_PER_AI_CREDIT = 10

# --- 검사(포털) 차감 ---
POINT_COST_PORTAL_RECIPIENT = 10  # 내담자 1명 발급·발송
POINT_COST_PUBLIC_CLAIM_PHONE = 10
POINT_COST_PUBLIC_CLAIM_EMAIL = 0

# --- AI 기능 차감 (DB AI credit × POINTS_PER_AI_CREDIT) ---
AI_CREDIT_COST_INTERPRET = 4
AI_CREDIT_COST_RECOMMEND = 1
AI_CREDIT_COST_REPORT = 5
AI_CREDIT_COST_COUNSEL_MESSAGE = 0
AI_CREDIT_COST_SESSION_SUMMARY = 0

AI_POINT_COST_INTERPRET = AI_CREDIT_COST_INTERPRET * POINTS_PER_AI_CREDIT
AI_POINT_COST_RECOMMEND = AI_CREDIT_COST_RECOMMEND * POINTS_PER_AI_CREDIT
AI_POINT_COST_REPORT = AI_CREDIT_COST_REPORT * POINTS_PER_AI_CREDIT

# 하위 호환 (public claim 모듈)
POINTS_PER_CREDIT = POINTS_PER_ASSESSMENT_CREDIT
PUBLIC_CLAIM_PHONE_POINT_COST = POINT_COST_PUBLIC_CLAIM_PHONE
PUBLIC_CLAIM_PHONE_CREDIT_COST = 1
PUBLIC_CLAIM_EMAIL_CREDIT_COST = 0
PUBLIC_CLAIM_PHONE_POINTS = POINT_COST_PUBLIC_CLAIM_PHONE


def assessment_credits_to_points(credits: int) -> int:
    try:
        n = int(credits)
    except (TypeError, ValueError):
        n = 0
    return max(0, n * POINTS_PER_ASSESSMENT_CREDIT)


def ai_credits_to_points(credits: int) -> int:
    try:
        n = int(credits)
    except (TypeError, ValueError):
        n = 0
    return max(0, n * POINTS_PER_AI_CREDIT)


def format_points_ko(points: int) -> str:
    return f"{max(0, int(points)):,}포인트"


def enrich_assessment_ledger_row(row: dict) -> dict:
    out = dict(row)
    try:
        delta = int(out.get("delta") or 0)
    except (TypeError, ValueError):
        delta = 0
    try:
        balance_after = int(out.get("balanceAfter") or 0)
    except (TypeError, ValueError):
        balance_after = 0
    out["pointsDelta"] = delta * POINTS_PER_ASSESSMENT_CREDIT
    out["pointsBalanceAfter"] = assessment_credits_to_points(balance_after)
    return out


def enrich_ai_ledger_row(row: dict) -> dict:
    out = dict(row)
    try:
        delta = int(out.get("delta") or 0)
    except (TypeError, ValueError):
        delta = 0
    try:
        balance_after = int(out.get("balanceAfter") or 0)
    except (TypeError, ValueError):
        balance_after = 0
    out["pointsDelta"] = delta * POINTS_PER_AI_CREDIT
    out["pointsBalanceAfter"] = ai_credits_to_points(balance_after)
    return out


def enrich_assessment_wallet_response(payload: dict, *, ledger_key: str = "ledger") -> dict:
    out = dict(payload)
    try:
        balance = int(out.get("balance") or 0)
    except (TypeError, ValueError):
        balance = 0
    out["pointsBalance"] = assessment_credits_to_points(balance)
    out["pointsUnit"] = "assessment"
    out["wonPerPoint"] = WON_PER_POINT
    out["pointsPerAssessmentCredit"] = POINTS_PER_ASSESSMENT_CREDIT
    if ledger_key in out and isinstance(out[ledger_key], list):
        out[ledger_key] = [enrich_assessment_ledger_row(r) for r in out[ledger_key]]
    return out


def enrich_ai_wallet_response(payload: dict, *, ledger_key: str = "ledger") -> dict:
    out = dict(payload)
    try:
        balance = int(out.get("balance") or 0)
    except (TypeError, ValueError):
        balance = 0
    out["pointsBalance"] = ai_credits_to_points(balance)
    out["pointsUnit"] = "ai"
    out["wonPerPoint"] = WON_PER_POINT
    out["pointsPerAiCredit"] = POINTS_PER_AI_CREDIT
    if ledger_key in out and isinstance(out[ledger_key], list):
        out[ledger_key] = [enrich_ai_ledger_row(r) for r in out[ledger_key]]
    return out


def product_credits_to_points(credits: int) -> int:
    return assessment_credits_to_points(credits)
