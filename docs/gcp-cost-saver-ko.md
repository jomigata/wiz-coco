# GCP / Firebase 비용 절감 (준비 단계)

## push 시 GCP 과금을 **0원**으로 유지

| 동작 | GCP 과금 | 설명 |
|------|----------|------|
| `git push origin main` | **없음** (기본) | `ci.yml`만 실행 — lint·타입·테스트·빌드 검증 |
| Actions → **Deploy (Firebase)** 수동 실행 | 있음 | Hosting / Functions 배포 |
| Actions → **Deploy Flask API** 수동 실행 | 있음 | Cloud Build + Cloud Run |
| Actions → **GCP artifact cleanup** 수동 실행 | 거의 없음 | 저장소·로그 정리 |

### 원리

- `deploy.yml`, `deploy-backend.yml`은 **push만으로는 배포하지 않음**
- 배포 게이트: GitHub 저장소 **Variable** `AUTO_DEPLOY_ON_PUSH` 가 **`true`** 일 때만 push → 자동 배포
- **준비 단계 기본값: Variable 미설정 또는 `false`** → push = CI만

### 설정 위치

GitHub → **Settings** → **Secrets and variables** → **Actions** → **Variables**

| Variable | 준비 단계 | 정식 오픈 후 |
|----------|-----------|--------------|
| `AUTO_DEPLOY_ON_PUSH` | *(비움 또는 `false`)* | 필요 시 `true` |

---

## 수동 배포 방법

### 1) 프론트(UI)만 변경했을 때 — **hosting-only** (가장 저렴)

1. GitHub → **Actions** → **🚀 WizCoCo Deploy (Firebase)**
2. **Run workflow** → `deploy_mode`: **hosting-only**
3. Functions·Firestore·Storage 재배포 **없음** → Cloud Build/GCS 아티팩트 비용 최소

### 2) Functions 변경 시

- `deploy_mode`: **hosting-functions** 또는 **auto**

### 3) 백엔드(API) 변경 시

- **🚀 Deploy Flask API to Cloud Run** → Run workflow

### 4) 8월 누적 아티팩트 정리 (1회)

- **🧹 GCP artifact cleanup** → Run workflow  
- 또는 로컬: `GCP_PROJECT_ID=... bash scripts/gcp-cleanup-artifacts.sh`

---

## 배포 범위 자동 분기 (`deploy_mode: auto`)

| 변경 경로 | 배포 대상 |
|-----------|-----------|
| `src/**`, `public/**` | `hosting` |
| `functions/**` | `hosting` + `functions` |
| `firestore.rules` | + `firestore` |
| `storage.rules` | + `storage` |

프론트만 수정하면 **Functions 재배포 생략** (이전 대비 20~40% 절감).

---

## GCP Console 추가 설정 (1회)

### 예산 알림

[Cloud Console → Billing → Budgets](https://console.cloud.google.com/billing/budgets)

- ₩30,000 / ₩50,000 / ₩100,000 단계 알림 권장

### 로그 보존 7~14일

- **Logging** → **Log storage** → `_Default` → Retention **14 days**
- cleanup 워크플로 실행 시 스크립트가 14일로 맞춤 시도

### GCS 수동 확인

Console → **Cloud Storage** → `gcf-sources-*`, `gcf-artifacts-*`, `*_cloudbuild`  
→ 30일 이상 된 객체 삭제 (cleanup 스크립트 참고)

---

## 이미 적용된 절감

- `COST_SAVER_MODE=true` — Gemini API 차단
- Cloud Run `min-instances=0`
- Cron 워커 — `workflow_dispatch`만 (자동 스케줄 없음)
- Artifact Registry — API 이미지 최근 5개만 유지

---

## `npm run deploy:auto` 와의 관계

로컬 `deploy:auto`는 **git push**만 수행합니다.  
`AUTO_DEPLOY_ON_PUSH=false`(기본)이면 push 후 **CI만** 돌고 GCP 배포는 **하지 않습니다**.  
배포가 필요할 때 Actions에서 수동 Run 하세요.

---

## 정식 오픈 후

1. `AUTO_DEPLOY_ON_PUSH=true` 로 자동 배포 복구 (선택)
2. 그래도 `deploy_mode: auto`로 Functions 불필요 재배포는 줄어듦
3. AI·문자 비용은 별도(SOLAPI, Gemini) — 인프라와 분리 모니터링
