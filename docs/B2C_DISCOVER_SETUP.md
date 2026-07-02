# B2C Discover · 공개 API 설정 (4단계)

## 개요

- **Discover** (`/discover/`) — 협회 B2B2C와 분리된 D2C 브랜드
- **Freemium** — `/discover/mini-check/` 6문항 무료 (로그인 불필요)
- **티어 결제** — Basic 5,000 / Premium 15,000 / Pro 50,000원
- **공개 API** — 화이트라벨 카탈로그 (`/api/v1/public/`)

## 경로

| 경로 | 설명 |
|------|------|
| `/discover/` | Discover 랜딩 · SNS 공유 안내 |
| `/discover/mini-check/` | Freemium 미니 검사 |
| `/discover/shop/` | B2C 결제 (로그인 필요) |
| `/admin/developer/` | Admin API 키 발급 |

## API

### B2C (인증: Firebase Bearer — 일반 로그인 사용자)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/b2c/catalog` | B2C 상품 |
| GET | `/api/b2c/mini-check/questions` | 미니 검사 문항 |
| POST | `/api/b2c/mini-check/score` | 점수·밴드 (PII 없음) |
| GET | `/api/b2c/entitlements/me` | 내 이용 등급 |
| POST | `/api/b2c/checkout/prepare` | 주문 생성 |
| POST | `/api/b2c/checkout/confirm` | 토스 confirm |
| POST | `/api/b2c/checkout/mock-complete` | Mock (`COMMERCE_MOCK_PAYMENTS=true`) |

### 공개 API v1 (헤더 `X-Api-Key`)

```bash
curl -H "X-Api-Key: wiz_live_..." \
  "https://wiz-coco.web.app/api/v1/public/catalog?channel=b2c"
```

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/public/health` | 헬스 (키 불필요) |
| GET | `/api/v1/public/catalog` | 상품 카탈로그 |
| GET | `/api/v1/public/mini-check/questions` | 미니 검사 문항 |

Admin에서 `POST /api/admin/developer/api-keys` 로 키 생성.

## Firestore

| 컬렉션 | 용도 |
|--------|------|
| `b2cEntitlements/{uid}` | activeTier · purchases |
| `apiKeys` | 화이트라벨 API 키 |
| `commerceOrders` | `channel: b2c`, `buyerUid` |

## SNS 캠페인 (4.3)

- 미니 검사 결과 화면 **링크 공유** 버튼
- UTM: `?utm_source=instagram&utm_campaign=discover_mini`
- 협회 공식 채널과 **톤·비주얼 분리** (Discover = violet 계열)

## 환경 변수

기존 2단계 PG 변수 동일 + `COMMERCE_MOCK_PAYMENTS` (개발).

## 관련 파일

- Backend: `backend/routes/b2c.py`, `backend/routes/public_api.py`
- Frontend: `src/app/discover/`, `src/lib/b2cApi.ts`
- 상품: `backend/data/commerce_products.py`
