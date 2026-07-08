# Wave 6 — 알림·리마인더 자동화

| ID | 작업 | 상태 |
|----|------|------|
| w6-cron | GitHub Actions 스케줄러 | ✅ |
| w6-email | SMTP 이메일 (기존 + 채널 상태 API) | ✅ |
| w6-kakao | Solapi 카카오 알림톡 (선택) | ✅ |
| w6-cohort | 그룹 cohort 자동 리마인더 | ✅ (Wave 5) |
| w6-reminder-api | 통합 리마인더 API | ✅ |

---

## Cron 워크플로

| 워크플로 | 스케줄 (KST) | API |
|----------|--------------|-----|
| `notification-worker.yml` | 5분마다 | `POST /api/notifications/process` |
| `cohort-reminder-worker.yml` | 매일 09:00 | `POST /api/notifications/cohort-reminders` |
| `individual-reminder-worker.yml` | 매주 월 12:00 | `POST /api/notifications/individual-reminders` |
| `care-reminder-worker.yml` | 매일 13:00 | `POST /api/notifications/care-reminders` |

공통 Secret: `NEXT_PUBLIC_FLASK_API_URL`, `NOTIFICATION_CRON_SECRET`  
설정 가이드: [COHORT_REMINDER_CRON_SETUP_KO.md](./COHORT_REMINDER_CRON_SETUP_KO.md)

---

## 알림 채널

### 이메일 (SMTP)

GitHub Secrets: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` 등 → `deploy-backend.yml`이 Cloud Run에 주입.

### SMS

- **Twilio** (기존): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- **Solapi** (선택): `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER`

### 카카오 알림톡 (Solapi)

GitHub Secrets (선택):

| Secret | 설명 |
|--------|------|
| `SOLAPI_API_KEY` | Solapi API Key |
| `SOLAPI_API_SECRET` | Solapi API Secret |
| `SOLAPI_KAKAO_PF_ID` | 카카오 채널 pfId |
| `SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER` | 검사 미완료 템플릿 ID |
| `SOLAPI_KAKAO_TEMPLATE_CARE` | 케어·과제 템플릿 ID |
| `SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS` | 포털 자격증명 템플릿 ID |

상세 설정: [SOLAPI_KAKAO_ALIMTALK_SETUP_KO.md](./SOLAPI_KAKAO_ALIMTALK_SETUP_KO.md)

발송 우선순위: **이메일 → 알림톡(전화번호) → SMS**

---

## API

| Method | Path | 인증 |
|--------|------|------|
| GET | `/api/notifications/status` | 공개 |
| POST | `/api/notifications/process` | Cron Secret / Admin |
| POST | `/api/notifications/cohort-reminders` | Cron Secret / Admin |
| POST | `/api/notifications/individual-reminders` | Cron Secret / Admin |
| POST | `/api/notifications/care-reminders` | Cron Secret / Admin |
| POST | `/api/notifications/reminders/assessment` | 상담사 Bearer |
| GET | `/api/notifications/alimtalk/templates` | Cron Secret / Admin |
| POST | `/api/notifications/alimtalk/test` | Cron Secret / Admin |

상담사 수동 리마인더는 기존 `POST /api/client-portals/assessments/<id>/dispatch/remind`도 유지됩니다.

---

## 프론트

- `src/lib/notificationApi.ts` — 채널 상태·리마인더 API
- `src/components/counselor/NotificationChannelStatus.tsx` — `/counselor/progress` 채널 배지

---

## 수동 검증

```bash
curl "${FLASK_URL}/api/notifications/status"
gh workflow run individual-reminder-worker.yml
gh workflow run care-reminder-worker.yml
```
