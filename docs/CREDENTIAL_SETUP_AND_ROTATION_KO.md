# 자격 증명 — 단계별 실행 가이드 (WizCoCo)

비밀 값은 이 문서에 적지 않습니다. 각 단계에서 **콘솔·터미널에만** 붙여 넣으세요.

---

## 사전 준비

- GitHub 저장소 관리 권한 (Secrets 편집)
- [Firebase Console](https://console.firebase.google.com/project/wiz-coco) 프로젝트 `wiz-coco` 접근
- (Cloud Run 배포 시) GCP 프로젝트 IAM 편집 권한

**Secrets 관리 페이지:**  
https://github.com/jomigata/wiz-coco/settings/secrets/actions

---

## A. 최초 설정 — GitHub Actions용

### A-1. Firebase 서비스 계정 → `FIREBASE_SERVICE_ACCOUNT`

1. 브라우저에서 열기:  
   `https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk`
2. **Generate new private key** → JSON 파일 다운로드 (PC에만 보관).
3. GitHub → 저장소 **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
4. Name: `FIREBASE_SERVICE_ACCOUNT`  
   Value: 다운로드한 JSON 파일 **전체 내용**을 한 번에 붙여 넣기 (줄바꿈 포함).
5. **Add secret** 저장.

### A-2. Firebase CI 토큰 → `FIREBASE_TOKEN`

1. PC에 Firebase CLI 설치 후 로그인되어 있어야 합니다.  
   `npm install -g firebase-tools` → `firebase login`
2. 터미널 실행: `firebase login:ci`
3. 출력된 **긴 토큰 문자열**만 복사 (한 줄).
4. GitHub Secrets에 **New repository secret**  
   - Name: `FIREBASE_TOKEN`  
   - Value: 위 토큰 붙여 넣기.

### A-3. 웹 앱(Firebase 클라이언트) → `NEXT_PUBLIC_*`

1. Firebase Console → **프로젝트 설정**(톱니) → **일반** 탭 → **내 앱**에서 웹 앱 선택.
2. **SDK 설정 및 구성**에서 `firebaseConfig` 객체 값 확인.
3. GitHub에 각각 Secret으로 추가 (이름은 워크플로와 동일해야 함):

| Secret 이름 | 출처 (firebaseConfig 필드) |
|-------------|-----------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `measurementId` (없으면 빈 값은 워크플로에 맞게 처리) |

### A-4. Flask API URL (선택, 권장)

1. Cloud Run 배포 후 서비스 URL 확인 (예: `https://wizcoco-api-....run.app`).
2. Secret: `NEXT_PUBLIC_FLASK_API_URL` = 위 URL (끝에 슬래시 없이).

자세한 연동: [FRONTEND_FLASK_INTEGRATION.md](./FRONTEND_FLASK_INTEGRATION.md)

### A-5. GCP → Cloud Run 배포용

1. GCP Console → **IAM 및 관리자** → **서비스 계정** → CI 전용 계정 생성 또는 선택.
2. 키 **JSON 추가** → 다운로드 (로컬만 보관).
3. GitHub Secrets:
   - `GCP_SA_KEY`: JSON **전체**
   - `GCP_PROJECT_ID`: GCP 프로젝트 ID (숫자 아닌 문자열 ID)

권한 오류 시: [DEPLOY_CLOUD_RUN.md](./DEPLOY_CLOUD_RUN.md)

---

## B. 노출 의심 시 — Firebase 서비스 계정 키 로테이션

**언제:** JSON이 Git·문서·스크린샷·채팅에 노출되었을 때. 히스토리 삭제만으로는 부족하고 **키 폐기**가 필수입니다.

### B-1. 새 키 발급

1. Firebase Console → **프로젝트 설정** → **서비스 계정** → **Firebase Admin SDK**
2. **새 비공개 키 만들기** → JSON 다운로드.

### B-2. GitHub Secret 갱신

1. GitHub → `FIREBASE_SERVICE_ACCOUNT` Secret **Update** (또는 삭제 후 재생성).
2. Value에 **새 JSON 전체** 붙여 넣기.

### B-3. 구(舊) 키 폐기

1. **Google Cloud Console** (동일 프로젝트) → **IAM 및 관리자** → **서비스 계정**
2. `firebase-adminsdk-...@...iam.gserviceaccount.com` 선택 → **키** 탭.
3. 노출된 **이전 키 ID**에 해당하는 키 **삭제**.

### B-4. 로컬 파일 정리

1. `Firebase_GitHub/` 등에 있는 **옛 JSON 파일 삭제**.
2. 새 JSON만 로컬 전용 경로에 저장 (Git에 올리지 않음).

### B-5. 파이프라인 확인

1. GitHub Actions에서 **Deploy** 워크플로 **Re-run** 또는 `main`에 빈 커밋 푸시.
2. 실패 시 로그에 `permission denied` / `invalid_grant` 등이 없는지 확인.

---

## C. `FIREBASE_TOKEN` 재발급

1. 로컬: `firebase logout` (선택) 후 `firebase login` → `firebase login:ci`
2. 출력 토큰으로 GitHub Secret `FIREBASE_TOKEN` **Update**.
3. 예전 토큰은 Firebase/Google 쪽에서 별도 “목록”이 없을 수 있으나, **새 토큰으로 교체**하면 이후 배포는 새 토큰만 사용합니다.

---

## D. GCP CI 서비스 계정 키 로테이션 (`GCP_SA_KEY`)

1. GCP → 해당 서비스 계정 → **키** → **새 키 만들기 (JSON)**.
2. GitHub `GCP_SA_KEY` Secret을 새 JSON으로 **Update**.
3. **이전 JSON 키**는 GCP 콘솔에서 **삭제**.

---

## E. 로컬 개발용 키 두는 방법

1. JSON을 `Firebase_GitHub/` 등 팀이 정한 폴더에만 저장.
2. `git status`로 **추적 대상에 JSON이 없는지** 확인 (저장소는 `*.json`으로 대부분 제외).
3. 애플리케이션은 환경 변수로 경로 지정 (예: `GOOGLE_APPLICATION_CREDENTIALS` 또는 프로젝트 문서에 맞는 변수).

---

## F. 설정이 맞는지 확인

| 확인 항목 | 방법 |
|-----------|------|
| GitHub Secrets 이름 | `.github/workflows/deploy.yml` 등에서 `${{ secrets.이름 }}`과 대소문자 일치 |
| 프론트 빌드 | Actions에서 **build** 단계 성공, 배포 후 브라우저에서 로그인·Firestore 동작 |
| Flask | Cloud Run URL로 `GET /api/health` (또는 문서에 적힌 헬스 경로) |
| 비밀 재노출 방지 | 문서·이슈·PR 본문에 JSON/토큰 붙여 넣지 않기 |

---

## 관련 문서

- [SECURITY_CREDENTIALS.md](./SECURITY_CREDENTIALS.md) — 원칙 요약
- [current-firebase-tokens.md](./current-firebase-tokens.md) — Secrets 이름·링크만 (값 없음)
- [FRONTEND_FLASK_INTEGRATION.md](./FRONTEND_FLASK_INTEGRATION.md)
- [DEPLOY_CLOUD_RUN.md](./DEPLOY_CLOUD_RUN.md)
