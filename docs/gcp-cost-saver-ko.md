# GCP / Firebase 비용 절감 (준비 단계)

## push 시 GCP 과금을 **0원**으로 유지

**일상 개발:** [로컬 풀스택 가이드](./local-dev-ko.md) — `npm run dev` (Emulator + Flask + Next). **push·배포 없이** 화면 확인.

**배포 권장 (TASK-061):** 로컬 **매일** `npm run dev` · prod 반영 **주 1~2회** (또는 `AUTO_DEPLOY_ON_PUSH=false` + 수동 workflow). 에이전트 자동 푸시 규칙: [`.cursor/rules/git-push-after-edit.mdc`](../.cursor/rules/git-push-after-edit.mdc).

| 동작 | GCP 과금 | 설명 |
|------|----------|------|
| `git push origin main` (프론트·설정 경로 변경) | **Hosting 배포** (Variable `true`일 때) | `deploy.yml` — `src/**` 등 paths 매칭 시 Build & Deploy |
| `git push origin main` (백엔드만) | **Cloud Run** (Variable `true`일 때) | `deploy-backend.yml` |
| `git push origin main` (Variable `false`) | **없음** | `ci.yml`만 — lint·타입·테스트·빌드 검증 |
| Actions → **Deploy (Firebase)** 수동 실행 | 있음 | Hosting / Functions 배포 |
| Actions → **Deploy Flask API** 수동 실행 | 있음 | Cloud Build + Cloud Run |
| Actions → **GCP artifact cleanup** 수동 실행 | 거의 없음 | 저장소·로그 정리 |

### 원리

- `deploy.yml`, `deploy-backend.yml`은 push 시 **Variable `AUTO_DEPLOY_ON_PUSH=true`** 이면 자동 배포
- **현재 저장소 정책: `AUTO_DEPLOY_ON_PUSH=false`** — push는 **CI만** (GCP 배포 없음). 온라인 확인 시 Actions 수동 Run 또는 `npm run deploy:prod:*`
- 자동 배포 복구: GitHub Variables에서 `true` (오픈·릴리스 주기에만 권장)

### 설정 위치

GitHub → **Settings** → **Secrets and variables** → **Actions** → **Variables**

| Variable | 준비 단계 | 정식 오픈 후 |
|----------|-----------|--------------|
| `AUTO_DEPLOY_ON_PUSH` | **`false`** (비용 절감·로컬 1차 검증) | 릴리스 시 `true` 또는 수동 workflow |

---

## 수동 배포 (로컬 검증 후)

1. **로컬:** `npm run dev` · `npx tsc --noEmit` (필요 시 `npm run dev:build`)
2. **코드 반영:** `git push origin main` → **CI만** 실행 (Hosting/Cloud Run 과금 없음)
3. **prod 온라인 확인이 필요할 때** (터미널, `gh` 로그인 필요):

| 명령 | 용도 |
|------|------|
| `npm run deploy:prod:hosting` | UI만 (`hosting-only`, 가장 저렴) |
| `npm run deploy:prod:auto` | Firebase `auto` (변경 경로별) |
| `npm run deploy:prod:api` | Flask → Cloud Run |
| `npm run deploy:prod:all` | hosting-only + API |
| `npm run deploy:prod:status` | Variable + 최근 Actions |

GitHub UI: **Actions** → 해당 workflow → **Run workflow**

---

## 수동 배포 방법 (GitHub UI)

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
- Firebase Deploy — `GEMINI_API_KEY` Secret Manager 동기화는 **수동 배포 + `sync_gemini_secret=true` 일 때만**
- **🧹 GCP artifact cleanup** — Registry + **Secret 구버전 destroy** + 로그 14일

---

## Secret Manager (청구의 80%대일 때)

1. Actions → **🧹 GCP artifact cleanup** 실행 (시크릿당 최신 2버전 유지)
2. 로컬: `GCP_PROJECT_ID=wiz-coco KEEP_SECRET_VERSIONS=2 bash scripts/gcp-cleanup-secret-versions.sh`
3. Gemini 키 로테이션 시에만 Deploy 워크플로에서 **`sync_gemini_secret: true`**
4. [Secret Manager 콘솔](https://console.cloud.google.com/security/secret-manager)에서 버전 수 확인

**Cleanup 워크플로 SA 권한:** `GCP_SA_KEY` 서비스 계정에 `Secret Manager Admin` (`roles/secretmanager.admin`)이 없으면 구버전 destroy가 스킵됩니다. IAM에서 역할 추가 후 **🧹 GCP artifact cleanup** 재실행.

**로그 보존 14일:** SA에 `logging.buckets.update`가 없으면 Console → Logging → Log storage → `_Default` → Retention **14 days** 수동 설정.

---

## `npm run deploy:auto` 와의 관계

로컬 `deploy:auto`는 **git push**만 수행합니다.  
Variable **`AUTO_DEPLOY_ON_PUSH=false`** 이면 push 후 **CI만** 돌고 GCP 배포는 **수동** (`npm run deploy:prod:*` 또는 Actions Run).

---

## 정식 오픈 후

1. `AUTO_DEPLOY_ON_PUSH=true` 로 자동 배포 복구 (선택)
2. 그래도 `deploy_mode: auto`로 Functions 불필요 재배포는 줄어듦
3. AI·문자 비용은 별도(SOLAPI, Gemini) — 인프라와 분리 모니터링
