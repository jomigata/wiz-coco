# WizCoCo 수익화 실행 계획 (협회·B2B2C 중심)

본 문서는 **첫 번째 기획(WizCoCo·협회 중심)** 을 코드·영업·운영 순서로 쪼갠 실행 로드맵입니다.

## 전체 단계 개요

| 단계 | 기간(목표) | 핵심 목표 | 완료 기준 |
|------|------------|-----------|-----------|
| **1. 기반·파일럿** | 0~12주 | 신뢰·가격 노출, 상담사 크레딧, 파일럿 10명 | 랜딩·크레딧 API·Admin 지급·상담사 10명 |
| **2. B2B2C 정산** | 3~6개월 | 결제 PG, 코드 자동 발급, 상담사 정산 | 토스/Stripe webhook, 월 정산 리포트 |
| **3. B2B 기관** | 6~9개월 | Org Admin, cohort 선결제, 그룹 리포트 | 학교/기업 POC 1건+, 그룹 PDF |
| **4. B2C·확장** | 9~12개월+ | Freemium·티어(선택), API | D2C 전환율 측정 후 확대 |

---

## 1단계 — 기반·파일럿 (지금 진행)

### 1-1. 제품 (코드)

| # | 작업 | 산출물 | 상태 |
|---|------|--------|------|
| 1.1 | 공개 랜딩: 채널·가격·개인정보·파트너 CTA | `Monetization*Section`, `/partners/` | 완료 |
| 1.2 | 가격·상품 카탈로그 (정적) | `src/data/monetizationCatalog.ts` | 완료 |
| 1.3 | 상담사 **검사 크레딧** (협회 Admin 지급) | Flask `/api/commerce/*`, Firestore | 완료 |
| 1.4 | 일괄 발송 시 크레딧 차감 (파일럿: 경고만, `COMMERCE_CREDITS_ENFORCE=true` 시 차단) | `client_portals.bulk_create` | 완료 |
| 1.5 | Admin 크레딧 지급 UI | `/admin/commerce/` | 완료 |
| 1.6 | 상담사 잔액·내역 UI | `/counselor/credits/` | 완료 |

### 1-2. 영업·운영

| # | 작업 | 담당 |
|---|------|------|
| 1.7 | 파일럿 상담사 10명 리스트·협회 공문 템플릿 | 협회 운영 |
| 1.8 | 파일럿 패키지: **무료 50 크레딧** Admin 일괄 지급 | Admin |
| 1.9 | 가격·환불·삭제 정책 1페이지 (`/privacy/` 보강) | 협회·법무 |
| 1.10 | KPI 주간: 지급 크레딧 / 소진 / 활성 상담사 수 | 운영 |

### 1-3. KPI (12주)

- 파일럿 상담사 **≥10명** (크레딧 1회 이상 지급)
- 발급 검사코드(내담자) **≥100건**
- 랜딩→Portal 클릭률 baseline 측정

---

## 2단계 — B2B2C 결제·정산

| # | 작업 |
|---|------|
| 2.1 | 토스페이먼츠(또는 Stripe) 계약·webhook |
| 2.2 | `paymentHistory` Admin SDK 기록, 결제→크레딧 자동 충전 |
| 2.3 | 상담사 SaaS 패키지 (월 N코드, 초과 건당) |
| 2.4 | 협회 정산 대시보드 (수수료 15~30%) |
| 2.5 | PDF 리포트 v2 (Premium gap) |

---

## 3단계 — B2B 기관

| # | 작업 |
|---|------|
| 3.1 | `org_admin` 역할·기관 대시보드 |
| 3.2 | 기관 선결제·0원 입장 (cohort) |
| 3.3 | 익명 그룹 통계 리포트 (별도 과금) |
| 3.4 | 학교/기업 POC 1건 |

---

## 4단계 — B2C·확장 (선택)

| # | 작업 |
|---|------|
| 4.1 | Freemium 미니검사 1종 |
| 4.2 | Basic/Premium/Pro 티어 결제 |
| 4.3 | SNS 캠페인 (협회 브랜드와 분리 검토) |
| 4.4 | API·화이트라벨 |

---

## 환경 변수 (1단계)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `COMMERCE_CREDITS_ENFORCE` | 크레딧 부족 시 일괄발송 차단 | `false` |
| `PILOT_FREE_CREDITS` | 문서·UI 참고용 파일럿 권장 지급량 | `50` |

---

## 관련 파일

- 가격 카탈로그: `src/data/monetizationCatalog.ts`
- API: `backend/routes/commerce.py`, `backend/utils/counselor_credits.py`
- 프론트 API: `src/lib/commerceApi.ts`
