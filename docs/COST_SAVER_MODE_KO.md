# WizCoCo 비용 절감 모드 (제작 단계)

제작·개발 중 GCP/Firebase/Solapi/Gemini 비용을 줄이기 위한 설정입니다.

## 활성화 상태 (현재)

| 항목 | 설정 |
|------|------|
| `COST_SAVER_MODE` | **true** (Cloud Run·Functions 기본값) |
| Cron 워커 4종 | **수동 실행만** (`workflow_dispatch`) |
| `main` 자동 배포 | **변경 경로 있을 때만** (path filter) |
| Cloud Run 메모리 | **256Mi** |
| Solapi SMS·알림톡 | API 호출 **스킵** (로그만) |
| Gemini AI | API 호출 **스킵** (안내 문구 반환) |

## 정식 오픈 전 해제 방법

1. **Cloud Run**: GitHub `deploy-backend.yml`에서  
   `COST_SAVER_MODE=true` → `false`  
   `--memory=256Mi` → 필요 시 `512Mi`
2. **Functions**: `deploy.yml`의 `functions/.env`에 `COST_SAVER_MODE=false`
3. **Cron**: 각 worker yml에 `schedule` cron 복구 (예: notification 15~30분)
4. **배포**: path filter 유지 또는 전체 push 배포로 복구

## Cron 수동 실행

GitHub Actions → 해당 워크플로 → **Run workflow**

- `notification-worker` — 통지 큐 처리
- `cohort-reminder-worker` — 기관 미완료 리마인더
- `care-reminder-worker` — 케어 과제 리마인더
- `individual-reminder-worker` — 개인 미완료 리마인더

## 로컬 백엔드

`.env` 또는 환경 변수:

```bash
COST_SAVER_MODE=true
```

`false`로 두면 Solapi 실발송이 다시 동작합니다 (키가 설정된 경우).
