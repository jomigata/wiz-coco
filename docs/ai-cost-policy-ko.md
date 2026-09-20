# AI 비용 정책 (TASK-051)

| env | `AI_CREDITS_ENFORCE` | 설명 |
|-----|----------------------|------|
| prod Cloud Run | `true` | 잔액 0 → Gemini 경로 402/403 |
| 로컬 / staging | `false` (가능) | 개발 편의 |

## 모델 tier

- `GEMINI_MODEL_FAST` — interpret/요약 (기본 flash)
- `GEMINI_MODEL_DEEP` — 심층 리포트

## 캐시

- 동일 입력 해시 + feature → Firestore `aiReports` 또는 ledger metadata TTL 7d (점진 적용)

## 기능별 on/off

| feature | 기본 | 비고 |
|---------|------|------|
| interpret | on | 크레딧 차감 |
| recommend | on | 크레딧 차감 |
| admin | off | 내부 |

## 로그

- `aiUsageLedger` — uid, feature, delta, tokensEstimate(optional), `createdAt` (TASK-052)
