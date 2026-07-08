# Cohort 리마인더 Cron — GitHub Secrets 설정 가이드

Wave 5 **그룹 미완료 자동 리마인더** (`cohort-reminder-worker.yml`)가 동작하려면 아래 두 Secret이 필요합니다.

| Secret | 용도 |
|--------|------|
| `NEXT_PUBLIC_FLASK_API_URL` | Cloud Run Flask API 베이스 URL (끝 슬래시 없음) |
| `NOTIFICATION_CRON_SECRET` | `X-Notification-Cron-Secret` 헤더 값 — GitHub Cron ↔ Cloud Run 공유 |

---

## 1. 현재 저장소 상태 확인

```bash
gh secret list
```

다음 두 항목이 있으면 **이미 등록됨**:

- `NEXT_PUBLIC_FLASK_API_URL`
- `NOTIFICATION_CRON_SECRET`

> **자동 동기화:** `deploy-backend.yml`이 배포 후 Cloud Run URL을 `NEXT_PUBLIC_FLASK_API_URL`에 자동 반영합니다.

---

## 2. `NEXT_PUBLIC_FLASK_API_URL` 설정

### 방법 A — 백엔드 배포 시 자동 (권장)

`main`에 백엔드 변경이 푸시되면 **Deploy Flask API to Cloud Run** 워크플로가:

1. `wizcoco-api` (asia-northeast3) 배포
2. `/api/health` 확인 (최대 6회 재시도)
3. `NEXT_PUBLIC_FLASK_API_URL` Secret 자동 갱신

수동 재동기화:

```bash
gh workflow run deploy-backend.yml
```

### 방법 B — 수동 설정

1. GCP Console → Cloud Run → `wizcoco-api` → **URL** 복사  
   예: `https://wizcoco-api-1088573742018.asia-northeast3.run.app`
2. GitHub → [Actions Secrets](https://github.com/jomigata/wiz-coco/settings/secrets/actions) → **New repository secret**
3. Name: `NEXT_PUBLIC_FLASK_API_URL`  
   Value: 위 URL (**끝에 `/` 없이**)

CLI:

```bash
gh secret set NEXT_PUBLIC_FLASK_API_URL --body "https://wizcoco-api-1088573742018.asia-northeast3.run.app"
```

---

## 3. `NOTIFICATION_CRON_SECRET` 설정

### 3-1. 시크릿 값 생성 (1회)

PowerShell:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
```

또는 OpenSSL/Git Bash:

```bash
openssl rand -hex 32
```

### 3-2. GitHub Secret 등록

```bash
gh secret set NOTIFICATION_CRON_SECRET --body "여기에_생성한_랜덤_문자열"
```

### 3-3. Cloud Run 환경 변수 (자동)

`deploy-backend.yml`이 동일 값을 Cloud Run `NOTIFICATION_CRON_SECRET` env로 주입합니다.  
**GitHub Secret만 맞추면** 다음 백엔드 배포 후 API와 Cron이 같은 값을 사용합니다.

로컬 개발 (`backend/.env`):

```env
NOTIFICATION_CRON_SECRET=동일한_값
```

---

## 4. 동작 확인

### 수동 Cron 실행

```bash
gh workflow run cohort-reminder-worker.yml
gh run list --workflow cohort-reminder-worker.yml --limit 1
gh run watch
```

성공 시 로그 예:

```text
POST https://.../api/notifications/cohort-reminders
{"sent":0,"skipped":...,"failed":0,...}
cohort reminders processed
```

### API 직접 호출 (로컬·점검용)

```bash
curl -X POST "${FLASK_URL}/api/notifications/cohort-reminders" \
  -H "Content-Type: application/json" \
  -H "X-Notification-Cron-Secret: ${NOTIFICATION_CRON_SECRET}" \
  -d '{"limit":5}'
```

| HTTP | 의미 |
|------|------|
| 200 | 정상 처리 |
| 403 | `NOTIFICATION_CRON_SECRET` 불일치 또는 Cloud Run 미주입 |
| 503 | Cloud Run 컨테이너 기동 실패 — `deploy-backend` 로그·Cloud Run 로그 확인 |

---

## 5. 스케줄

| 워크플로 | cron (UTC) | KST |
|----------|------------|-----|
| `cohort-reminder-worker.yml` | `0 0 * * *` | 매일 09:00 |
| `notification-worker.yml` | `*/5 * * * *` | 5분마다 |

---

## 6. 관련 파일

- `.github/workflows/cohort-reminder-worker.yml` — 일 1회 리마인더 Cron
- `.github/workflows/notification-worker.yml` — 통지 큐 (동일 Secret 사용)
- `.github/workflows/deploy-backend.yml` — Secret·Cloud Run env 동기화
- `backend/routes/notifications.py` — `POST /api/notifications/cohort-reminders`
- `backend/utils/cohort_reminder_worker.py` — 미완료 cohort 대상 발송

---

## 7. 문제 해결 체크리스트

- [ ] `gh secret list`에 두 Secret 존재
- [ ] `deploy-backend` 최근 실행 성공 + `/api/health` OK
- [ ] `GET ${NEXT_PUBLIC_FLASK_API_URL}/api/health` → `{"status":"ok",...}`
- [ ] Cloud Run env에 `NOTIFICATION_CRON_SECRET` 표시 (GCP Console)
- [ ] `cohort-reminder-worker` 수동 실행 성공

관련: [CREDENTIAL_SETUP_AND_ROTATION_KO.md](./CREDENTIAL_SETUP_AND_ROTATION_KO.md), [FRONTEND_FLASK_INTEGRATION.md](./FRONTEND_FLASK_INTEGRATION.md)
