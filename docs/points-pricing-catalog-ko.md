# WizCoCo 포인트 단가표

> **2025-09 적용** — UI·API 표기는 **포인트**, Firestore DB는 기존 **크레딧(정수)** 필드 유지  
> **1포인트 = 10원** · **DB 크레딧 1건 = 10포인트**

## 환산 규칙

| 구분 | DB (레거시) | 포인트 | 원화 |
|------|-------------|--------|------|
| 기본 단위 | — | 1 | ₩10 |
| 검사 지갑 1건 | 1 credit | 10 | ₩100 |
| AI 지갑 1건 | 1 AI credit | 10 | ₩100 |

## 검사(포털) 차감

| 기능 | DB 차감 | 포인트 | 비고 |
|------|---------|--------|------|
| 내담자 1명 발급·발송 | 1 | 10 | 포털 1개 |
| 공개 claim — 휴대폰 | 1 | 10 | 카톡/문자 |
| 공개 claim — 이메일 | 0 | 0 | 무료 |
| 첫 1명 발송 체험 | 0 | 0 | 1회 한정 |

## AI 기능 차감

| 기능 | DB AI credit | 포인트 |
|------|--------------|--------|
| AI 상담 메시지 | 0 | 0 (파일럿 무료) |
| 상담 세션 요약 | 0 | 0 (파일럿 무료) |
| 검사 결과 AI 해석 | 4 | 40 |
| 맞춤 검사 추천 | 1 | 10 |
| AI 종합 리포트 | 5 | 50 |
| 재생성 | 50% | 50% (포인트 기준 반올림) |

## 파일럿 지급

| 대상 | DB | 포인트 |
|------|-----|--------|
| 검사 지갑 | 50 credits | 500 |
| AI 지갑 | 20 AI credits | 200 |

## 충전 상품 (B2B2C)

| 상품 ID | 표시명 | DB credits | 포인트 | 금액 |
|---------|--------|------------|--------|------|
| credit-pack-10 | 포인트 100팩 | 10 | 100 | ₩75,000 |
| credit-pack-50 | 포인트 500팩 | 50 | 500 | ₩300,000 |
| counselor-starter | 스타터 월 구독 | 20/월 | 200/월 | ₩150,000 |
| counselor-pro | 프로 월 구독 | 50/월 | 500/월 | ₩250,000 |

초과 사용: 스타터 **₩7,500/건(10포인트)**, 프로 **₩6,000/건(10포인트)** — DB는 여전히 1 credit 단위 차감.

## API 필드 (하위 호환)

- `balance` — DB 크레딧 정수 (유지)
- `pointsBalance` — UI용 포인트 (신규)
- `pointsDelta`, `pointsBalanceAfter` — 원장 행 (신규)
- `creditUnit` — deprecated, `pointUnit` / `pointsPerAssessmentCredit` 참고

## 코드 위치

| 영역 | 파일 |
|------|------|
| 프론트 단가표 | `src/lib/pointsCatalog.ts` |
| 백엔드 표기 | `backend/utils/points_display.py` |
| 공개 claim | `src/lib/publicClaimDelivery.ts`, `backend/utils/public_claim_delivery.py` |

## 마이그레이션 주의

1. **Firestore 컬렉션/필드명 변경 없음** — `counselorCredits`, `counselorAiCredits`, `balance` 유지  
2. **과거 원장 `reason` 문자열** — 그대로 보존  
3. **상품 ID** `credit-pack-*` — PG·주문 호환을 위해 유지  
4. **3개 지갑 분리** — 검사 포인트 / AI 포인트 / 기관 포인트 혼동 주의  
5. **Cloud Functions** 내부 `creditsCharged` 필드는 API 응답 그대로; UI에서 포인트 환산 표시
