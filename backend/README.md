# WizCoCo Flask API

상담사/내담자용 REST API.

**프론트(Next) 연동:** [docs/FRONTEND_FLASK_INTEGRATION.md](../docs/FRONTEND_FLASK_INTEGRATION.md) — `NEXT_PUBLIC_FLASK_API_URL`, CORS, 프로덕션 시 Cloud Run URL 필수 여부를 정리했습니다.

--- 참여 코드(accessCode) 기반 검사 패키지 생성·진행 현황 조회, 결과 제출·조회·수정·삭제를 제공합니다.

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
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | 결과 제출 시 이메일 발송용 (비워두면 발송 생략) |
| `RATE_LIMIT_ACCESS_CODE` | 참여 코드 API 분당 요청 제한 (기본 30, 0=비활성화) |
| `RATE_LIMIT_PASSWORD_API` | 비밀번호 확인 API 분당 제한 (기본 20) |
| `FLASK_ENV` | `development` / `production` |
| `SECRET_KEY` | Flask 시크릿 키 |
| `CORS_ORIGINS` | 허용 오리진 (쉼표 구분, 기본 `*`) |

## API 개요

### 상담사 (Authorization: Bearer \<Firebase ID Token\>)

- `POST /api/assessments` — 패키지 생성, 6자리 참여 코드 발급
- `GET /api/assessments` — 내 assessments 목록
- `GET /api/assessments/<assessmentId>/progress` — 해당 참여 코드 진행 현황 (내담자별)

### 내담자 (공개)

- `GET /api/assessments/public/<accessCode>` — 코드 유효 시 제목·안내 메시지·검사 목록

### 결과

- `POST /api/results` — 제출 (accessCode, testId, clientEmail, responses) → 채점, 4자리 비밀번호 생성·이메일 발송
- `GET /api/results?accessCode=&clientEmail=` — 해당 코드·이메일의 결과 목록
- `PUT /api/results/<resultId>` — 비밀번호 + responses 로 수정·재채점
- `DELETE /api/results/<resultId>` — 비밀번호 확인 후 삭제

### 기타

- `GET /api/health` — 헬스 체크

## Firestore

- `assessments`: accessCode, counselorId, title, targetAudience, welcomeMessage, testList, createdAt, status
- `testResults`: accessCode, assessmentId, testId, clientEmail, status, responses, resultData, passwordHash, completedAt

규칙은 프로젝트 루트의 `firestore.rules` 참고. 쓰기는 백엔드(Admin SDK)에서 수행합니다.

## 보안

- **비밀번호**: 4자리 숫자 비밀번호는 bcrypt로 해싱하여 Firestore의 `passwordHash`에만 저장합니다. 평문은 저장하지 않습니다.
- **Rate Limiting**: 참여 코드 조회·결과 제출(`GET /api/assessments/public/<code>`, `POST/GET /api/results`)에는 `limit_access_code`, 비밀번호 확인(`GET/PUT/DELETE /api/results/<id>`)에는 `limit_password_api`가 적용됩니다. 분당 제한은 환경 변수로 조정 가능합니다.
- **이메일 정책**: 결과 이메일에는 비밀번호·요약(summary)만 포함하며, 상세 결과는 이메일에 넣지 않고 "상세 결과는 상담사와 논의하세요" 안내만 포함합니다.

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
