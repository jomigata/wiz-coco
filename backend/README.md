# WizCoCo Flask API

상담사/내담자용 REST API.

**프론트(Next) 연동:** [docs/FRONTEND_FLASK_INTEGRATION.md](../docs/FRONTEND_FLASK_INTEGRATION.md) — `NEXT_PUBLIC_FLASK_API_URL`, CORS, 프로덕션 시 Cloud Run URL 필수 여부를 정리했습니다.

**검사코드**(`accessCode`) 기반 세트 생성·진행 현황 조회, 결과 제출·조회·수정·삭제를 제공합니다. 신규 코드는 자음-모음-자음(CVC, L/I/O 제외) + 숫자(2~9만) **3자리부터** 발급하며, 전역 조합이 부족하면 **4·5… 자리**로 확장합니다. 기존 **영숫자 6자리** 코드는 그대로 유효합니다.

## 요구 사항

- Python 3.10+
- Firebase 프로젝트 (Firestore, Authentication)
- 서비스 계정 키(JSON) 또는 `GOOGLE_APPLICATION_CREDENTIALS`

## 설치 및 실행

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env에서 FIREBASE_CREDENTIALS_PATH 등 설정
python app.py
```

기본 포트: `5000`. `PORT` 환경 변수로 변경 가능.

## 환경 변수 (.env)

| 변수 | 설명 |
|------|------|
| `FIREBASE_CREDENTIALS_PATH` | Firebase 서비스 계정 JSON 파일 경로 (또는 `GOOGLE_APPLICATION_CREDENTIALS` 사용) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | (선택) 향후 다른 알림용으로 예약 |
| `RATE_LIMIT_ACCESS_CODE` | 검사 코드 API 분당 요청 제한 (기본 30, 0=비활성화) |
| `RATE_LIMIT_PASSWORD_API` | 비밀번호 확인 API 분당 제한 (기본 20) |
| `FLASK_ENV` | `development` / `production` |
| `SECRET_KEY` | Flask 시크릿 키 |
| `CORS_ORIGINS` | 허용 오리진 (쉼표 구분, 기본 `*`) |

## API 개요

### 상담사 (Authorization: Bearer \<Firebase ID Token\>)

- `POST /api/assessments` — 검사코드(세트) 생성, 고유 `accessCode`만 발급·저장 (내담자 접속용 PIN 미사용)
- `GET /api/assessments` — 내 활성 검사코드 목록 (`archived` 제외). 각 항목에 `emailsNotCompletedAllTestsCount`(1건 이상 제출했으나 세트 미전체 완료 이메일 수), `emailsCompletedAllTestsCount`(세트 전부 완료 이메일 수) 포함
- `GET /api/assessments/<assessmentId>` — 단일 조회 (수정 폼용, 본인·활성만)
- `PUT /api/assessments/<assessmentId>` — 수정 (`title`, `targetAudience`, `welcomeMessage`, `testList`; `accessCode` 불변)
- `DELETE /api/assessments/<assessmentId>` — 비활성화 (`status=archived`, 신규 공개 조회 불가)
- `GET /api/assessments/<assessmentId>/progress` — 해당 검사코드 진행 현황 (내담자별)

### 내담자 (공개)

- `POST /api/assessments/public/lookup` — 본문 `{ "accessCode" }` 로 활성 세트 조회 (구문서에 `joinPinHash`가 있어도 검증하지 않음)
- `GET /api/assessments/public/<accessCode>` — 활성 검사코드 공개 메타 조회 (구 호환)

### 결과

- `POST /api/results` — **Bearer** 필수. 본문 `{ accessCode, testId, responses }` → `clientEmail`은 토큰 이메일과 동일하게 저장. **신규 제출은 결과용 4자리 비밀번호를 저장·반환하지 않음** (로그인 소유자만 수정·삭제).
- `GET /api/results?accessCode=` — **Bearer** 필수. 토큰 이메일과 일치하는 `testResults` 목록
- `GET /api/results/mine` — **Bearer** 필수. 해당 이메일로 제출한 모든 `testResults`(검사코드 세트) 목록, `assessmentTitle` 포함
- `GET /api/results/<resultId>` — **Bearer** 소유자(`clientEmail` 일치)면 비밀번호 없이 전체 조회. **구 데이터(`passwordHash` 있음)** 만 `?password=` 로 조회 가능(레거시).
- `PUT /api/results/<resultId>` — 소유자는 **Bearer**만으로 `responses` 수정. 레거시 문서는 `password` + `responses`.
- `DELETE /api/results/<resultId>` — 소유자는 **Bearer**만으로 삭제. 레거시는 body `password`.

### 기타

- `GET /api/health` — 헬스 체크

## Firestore

- `assessments`: accessCode, counselorId, title, targetAudience, welcomeMessage, testList, createdAt, updatedAt?, archivedAt?, status (`active` \| `archived`) — 구 데이터에만 `joinPinHash` / `joinPin` 이 남을 수 있음(공개 조회에는 미사용)
- `testResults`: accessCode, assessmentId, testId, clientEmail, status, responses, resultData, completedAt — `passwordHash`는 구 제출분만 (신규는 미저장)

규칙은 프로젝트 루트의 `firestore.rules` 참고. 쓰기는 백엔드(Admin SDK)에서 수행합니다.

## 보안

- **레거시 결과 비밀번호**: 구 제출분에만 Firestore `passwordHash`가 있을 수 있으며 bcrypt로 검증합니다. 신규 제출·검사코드 세트에는 결과용·접속용 PIN을 저장하지 않습니다.
- **Rate Limiting**: 검사 코드 조회·결과 제출 등에는 `limit_access_code`, 결과 단건 `GET/PUT/DELETE`에는 `limit_password_api`가 적용됩니다.
- **내담자 결과 API**: `POST/GET /api/results`는 Firebase ID 토큰(이메일 클레임 포함)이 있어야 하며, 제출·목록의 식별자는 토큰 이메일과 검사코드입니다.

## 배포 (Cloud Run + GitHub Actions)

`.github/workflows/deploy-backend.yml`이 `main` 푸시 시 이미지 빌드 후 Cloud Run에 배포합니다.

### GitHub Actions용 서비스 계정 권한

GitHub Secrets에 넣는 서비스 계정(`GCP_SA_KEY`)에 아래 역할이 있어야 합니다. **Deploy to Cloud Run** 단계에서 `PERMISSION_DENIED: artifactregistry.repositories.downloadArtifacts` 오류가 나면, 해당 서비스 계정에 Artifact Registry 읽기 권한을 부여하세요.

| 역할 | 목적 |
|------|------|
| **Cloud Run Admin** (`roles/run.admin`) | 서비스 배포·수정 |
| **Service Account User** (`roles/iam.serviceAccountUser`) | Cloud Run 서비스가 사용할 SA로 배포 |
| **Artifact Registry Reader** (`roles/artifactregistry.reader`) | 배포 시 컨테이너 이미지 다운로드 (오류 시 추가) |
| **Storage Object Viewer** (`roles/storage.objectViewer`) | GCR 이미지 사용 시 (gcr.io 저장소인 경우) |

GCP 콘솔 → IAM → 해당 서비스 계정(예: `wizcoco-github-ci@...`)에 위 역할 추가.
