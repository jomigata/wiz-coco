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

## 충전·구독 상품

상담사 B2B2C 충전 팩·월 구독(스타터/프로) 및 파일럿 고정 지급량(검사 500p / AI 200p)은 **제거**되었습니다.  
포인트는 **Admin 수동 지급** 또는 **기관·협회 협의**로 운영합니다.

## API 필드 (하위 호환)

- `balance` — DB 크레딧 정수 (유지)
- `pointsBalance` — UI용 포인트 (신규)
- `pointsDelta`, `pointsBalanceAfter` — 원장 행 (신규)

## 코드 위치

| 영역 | 파일 |
|------|------|
| 프론트 단가표 | `src/lib/pointsCatalog.ts` |
| 백엔드 표기 | `backend/utils/points_display.py` |
| 공개 claim | `src/lib/publicClaimDelivery.ts`, `backend/utils/public_claim_delivery.py` |

## 마이그레이션 주의

1. **Firestore 컬렉션/필드명 변경 없음** — `counselorCredits`, `counselorAiCredits`, `balance` 유지  
2. **과거 원장 `reason` 문자열** — 그대로 보존  
3. **3개 지갑 분리** — 검사 포인트 / AI 포인트 / 기관 포인트 혼동 주의  
4. **Cloud Functions** 내부 `creditsCharged` 필드는 API 응답 그대로; UI에서 포인트 환산 표시
