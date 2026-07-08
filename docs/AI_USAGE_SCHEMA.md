# AI 크레딧·토큰 사용 원장 스키마 (T-3-01)

Wave 3 AI 워크벤치의 기반 데이터 모델입니다. **검사 크레딧**(`counselorCredits`)과 **AI 크레딧**(`counselorAiCredits`)은 **분리 지갑**으로 운영합니다.

## 컬렉션

| 컬렉션 | 문서 ID | 용도 |
|--------|---------|------|
| `counselorAiCredits` | `counselorUid` | AI 전용 잔액 |
| `aiUsageLedger` | auto | 사용·지급·차감 원장 (append-only) |
| `aiReports` | auto | AI 리포트 캐시 (T-4에서 사용) |

모든 컬렉션은 **Flask Admin SDK / Cloud Functions 전용** (`firestore.rules`: `read, write: if false`).

---

## 1. counselorAiCredits

```typescript
{
  counselorUid: string
  balance: number          // AI 크레딧 (정수, 0 이상)
  updatedAt: Timestamp
}
```

---

## 2. aiUsageLedger

```typescript
{
  counselorUid: string
  feature: AiUsageFeature
  delta: number            // 음수=차감, 양수=지급
  balanceAfter: number
  reason: string
  tokensPrompt?: number
  tokensCompletion?: number
  tokensTotal?: number
  modelId?: string
  sessionId?: string       // AI 상담 세션
  portalId?: string
  resultId?: string        // 검사 결과
  reportId?: string        // aiReports 연결
  actorUid?: string
  metadata?: object
  createdAt: Timestamp
}
```

### feature / reason enum

| 값 | 설명 |
|----|------|
| `counsel_message` | AI 상담 1회 메시지 |
| `session_summary` | 상담 세션 요약 |
| `assessment_interpret` | 검사 결과 AI 해석 |
| `test_recommendation` | 맞춤 검사 추천 |
| `report_generate` | AI 리포트 생성 |
| `admin_grant` | 관리자 지급 |
| `admin_adjustment` | 관리자 조정 |
| `commerce_purchase` | AI 크레딧 구매 |
| `refund` | 환불 |
| `pilot_grant` | 파일럿 무료 지급 |

---

## 3. aiReports (T-4 스키마 예약)

```typescript
{
  counselorUid: string
  portalId?: string
  resultId?: string
  feature: 'assessment_interpret' | 'report_generate'
  title: string
  content: string
  modelId?: string
  creditsCharged: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## API (T-3-01)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/ai/schema` | — | 스키마·enum 메타 |
| GET | `/api/ai/credits/me` | 상담사 Bearer | 잔액 + 최근 원장 |
| GET | `/api/ai/reports?resultId=` | 상담사 Bearer | 캐시된 AI 리포트 목록 |
| GET | `/api/ai/reports/<reportId>` | 상담사 Bearer | AI 리포트 단건 (재열람 무료) |

### Callable — `interpretAssessmentResult` (T-3-05)

상담사 Firebase Auth로 호출. 검사 결과 1건 AI 해석 생성·`aiReports` 캐시.

```json
{ "resultId": "testResults-doc-id", "forceRegenerate": false }
```

- 최초 생성: 4 AI 크레딧
- 재생성: 2 AI 크레딧 (50%)
- 캐시 재열람: 0 크레딧

### POST /api/ai/credits/grant

```json
{
  "counselorUid": "firebase-uid",
  "amount": 10,
  "reason": "admin_grant",
  "metadata": { "note": "pilot bonus" }
}
```

---

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `AI_CREDITS_ENFORCE` | `false` | `true` 시 잔액 부족하면 차감 거부 |
| `PILOT_FREE_AI_CREDITS` | `20` | 파일럿 안내용 (자동 지급은 T-3-03) |

---

## 과금 정책 (제안, T-3-04에서 단가표화)

| 기능 | AI 크레딧 |
|------|-----------|
| AI 검사 해석 리포트 | 3~5 |
| 맞춤 검사 추천 | 1 |
| AI 상담 1세션(10메시지) | 2 |
| 리포트 재열람 | 0 (캐시) |
| 리포트 재생성 | 50% 할인 |

---

## Wave 3 후속 작업

| ID | 작업 | 상태 |
|----|------|------|
| T-3-01 | `aiUsageLedger` + `counselorAiCredits` 스키마 | ✅ |
| T-3-02 | Functions Gemini 토큰 기록 | ✅ |
| T-3-03 | `/counselor/credits` AI 탭 | ✅ |
| T-3-04 | `aiPricingCatalog.ts` | ✅ |
| T-3-05 | 검사 결과 AI 해석 Callable | ✅ |
| T-3-06 | 맞춤 검사 추천 | ⬜ |
| T-3-07 | AI → 포털 push | ⬜ |
| T-3-08 | Admin AI 사용량 대시보드 | ⬜ |
