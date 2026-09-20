# SMS 비용 정책 (TASK-040)

| 환경 | `COST_SAVER_MODE` | Solapi |
|------|-------------------|--------|
| 로컬 / Emulator | `true` (기본) | 발송 스킵 |
| prod | **`false`** | 실발송 |

## 중복 방지

- `NOTIFICATION_DEDUPE_WINDOW_SEC` (기본 45s): 동일 `portalId` + `notifyKind` pending 중복 enqueue 차단 (`notification_enqueue_guard.py`).
- 실패 재시도: `NOTIFICATION_RETRY_BACKOFF_BASE_SEC` 기준 exponential backoff.

## 모니터링

- 월간: [`monthly-ops-checklist-ko.md`](./monthly-ops-checklist-ko.md) Solapi 건수
- (선택) Firestore `monthlyUsage/sms` increment — TASK-041
