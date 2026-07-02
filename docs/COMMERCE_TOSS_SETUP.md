# Commerce · Toss Payments 설정 (2단계)

## Cloud Run / Flask 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `TOSS_SECRET_KEY` | PG 실결제 | 토스 시크릿 키 (결제 승인 API) |
| `TOSS_CLIENT_KEY` | PG 실결제 | 토스 클라이언트 키 (프론트 위젯) |
| `TOSS_WEBHOOK_SECRET` | 권장 | 웹훅 HMAC 검증 (미설정 시 서명 검증 생략) |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 프론트 빌드 | Hosting 빌드 시 클라이언트 키 (선택, API 응답으로도 전달) |
| `COMMERCE_MOCK_PAYMENTS` | 개발 | `true` — Mock 결제·크레딧 충전 (키 없을 때) |
| `PLATFORM_FEE_RATE` | 정산 | 기본 `0.25` (25%) — Admin 정산 요약용 |
| `COMMERCE_CREDITS_ENFORCE` | 운영 | `true` — 크레딧 부족 시 일괄발송 402 |

## 토스 대시보드

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com/)에서 테스트/라이브 키 발급
2. **웹훅 URL**: `https://<Cloud Run 또는 Hosting 프록시>/api/commerce/webhooks/toss`
3. **성공 리다이렉트**: `https://wiz-coco.web.app/counselor/credits/?checkout=success`

## 결제 흐름

1. 상담사 `/counselor/credits/` → 상품 **결제하기**
2. `POST /api/commerce/checkout/prepare` → `orderId` 생성
3. 토스 SDK `requestPayment` → successUrl 리다이렉트
4. `POST /api/commerce/checkout/confirm` → 크레딧 자동 충전 + `paymentHistory` + `subscriptions`(구독)

## Mock 테스트 (키 없이)

```bash
COMMERCE_MOCK_PAYMENTS=true
```

상담사 크레딧 페이지에서 **테스트 결제 (Mock)** 버튼 표시.

## API 요약

- `GET /api/commerce/catalog`
- `POST /api/commerce/checkout/prepare`
- `POST /api/commerce/checkout/confirm`
- `POST /api/commerce/checkout/mock-complete`
- `POST /api/commerce/webhooks/toss`
- `GET /api/commerce/settlement/summary?month=YYYY-MM` (Admin)
- `GET /api/commerce/payments` (Admin)

## Firestore 컬렉션 (Admin SDK 전용)

- `commerceOrders` — 주문
- `paymentHistory` — 결제 이력
- `counselorCredits` / `counselorCreditLedger` — 크레딧
- `subscriptions` — 상담사 구독 (구독 상품 결제 시)
