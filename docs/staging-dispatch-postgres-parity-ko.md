# Staging — Postgres dispatch parity (TASK-074)

> **prod `DISPATCH_LIST_SOURCE=postgres` 금지** — 아래 체크리스트 전부 통과 후에만 prod 전환 검토.

## 로컬 준비

1. `docker compose -f docker-compose.postgres.yml up -d`
2. `psql $DATABASE_URL -f backend/db/migrations/001_dispatch_recipients.sql`
3. `backend/.env.local`:
   - `DATABASE_URL=postgresql://wizcoco:wizcoco_local@127.0.0.1:5432/wizcoco_dispatch`
   - `DISPATCH_SQL_DUAL_WRITE=true`
   - `DISPATCH_LIST_SOURCE=firestore` (dual-write만 먼저)

## Dual-write 검증 (TASK-073)

1. Emulator에서 상담코드 + 내담자 1명 생성
2. `SELECT * FROM dispatch_recipients WHERE assessment_id = '...';` — 1행 upsert 확인
3. 검사 1건 제출 → `completed_count` 증가
4. 발송/알림 후 → `notify_status` 갱신

## Read parity (staging Cloud Run)

| Variable | 값 |
|----------|-----|
| `DATABASE_URL` | staging Neon/Cloud SQL |
| `DISPATCH_SQL_DUAL_WRITE` | `true` |
| `DISPATCH_LIST_SOURCE` | **`postgres`** (staging만) |

### 체크리스트

- [ ] 동일 counselor + assessment: Firestore flag `firestore` vs `postgres` — recipient 수·이름·notify/test status 일치
- [ ] UI `expandTests=false` 목록 + 행 펼침 API — tests 상세 일치
- [ ] `LOG_FIRESTORE_READS=1` — postgres 모드에서 dispatch list read estimate 감소
- [ ] 48시간 staging soak — 오류 로그 없음

## prod 롤아웃 (TASK-074)

1. GitHub Cloud Run **prod** env: `DISPATCH_LIST_SOURCE=postgres` (수동, 사용자 승인 후)
2. `DISPATCH_SQL_DUAL_WRITE=true` 유지 2주
3. baseline After 표 갱신
4. 문제 시 **즉시** `DISPATCH_LIST_SOURCE=firestore` 롤백

## 관련

- [`postgres-hybrid-design-ko.md`](./postgres-hybrid-design-ko.md)
- [`backend/db/README.md`](../backend/db/README.md)
