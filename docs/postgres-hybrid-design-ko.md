# Postgres 하이브리드 설계 (TASK-070)

> **트리거**: Firestore 월 30~50만+ / dispatch p95 > 2s / active counselors > 100.  
> Auth·Hosting은 Firebase 유지. SQL은 **dispatch list read** 전용 POC.

## 옵션

| | Neon | Cloud SQL |
|---|------|-----------|
| 운영 | 서버리스, 브랜치 | GCP 통합 |
| 로컬 | `DATABASE_URL` | docker / proxy |

권장: **로컬 docker-compose.postgres.yml** → staging Neon/Cloud SQL.

## 테이블 (v1)

- `dispatch_recipients` — 목록 row (portal_id PK, assessment_id, counselor_uid, notify/test status, counts)
- (v2) `client_portals_list` — CRM 목록 뷰
- (v2) `test_results_summary` — 검사 완료 집계

## Dual-write

1. **Phase 072**: read `DISPATCH_LIST_SOURCE=postgres|firestore` (staging)
2. **Phase 073**: portal create/update → Firestore + SQL
3. **Phase 074**: prod read primary SQL, Firestore fallback

## ERD (요약)

```text
assessments (Firestore) 1 — N dispatch_recipients (SQL)
clientPortals (Firestore) 1 — 1 dispatch_recipients.portal_id
```

## 비포함

- Firebase Auth migration
- Emulator → prod import
