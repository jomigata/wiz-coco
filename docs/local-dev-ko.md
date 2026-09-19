# 로컬 풀스택 개발 (GCP 배포 0회)

개발 중 UI·API·DB 확인은 **localhost + Firebase Emulator** 로 하고,  
**`git push`로 prod 배포**는 기능 마무리·스모크 테스트 때만 하세요 (`AUTO_DEPLOY_ON_PUSH=false` 권장).

## 사전 요구

- **Node.js** 18+ (프로젝트 `engines` 참고)
- **Python** 3.10+ (`python` / `python3`)
- **Java JDK 11+** (Firestore Emulator용 — `java -version` 확인)

## 1회 설정

```powershell
npm install
npm run setup:local
```

- `backend/.venv` 생성 및 `requirements.txt` 설치
- `.env.local`, `backend/.env` 템플릿 복사 (이미 있으면 건너뜀)

## 실행 (한 번에)

```powershell
npm run dev
```

| 서비스 | URL |
|--------|-----|
| Next.js UI | http://localhost:3000 |
| Flask API | http://localhost:5000 |
| Health | http://localhost:5000/api/health |
| Emulator UI | http://localhost:4000 |

저장하면 Next는 **HMR**로 바로 반영됩니다. Flask는 `FLASK_ENV=development`로 코드 변경 시 재시작합니다.

## 개별 실행

```powershell
npm run dev:emulators   # Auth + Firestore Emulator만
npm run dev:flask       # Emulator가 떠 있어야 함 (8080)
npm run dev:next        # API 5000 떠 있으면 Next만
```

## 환경 요약

| 파일 | 역할 |
|------|------|
| `.env.local` | `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`, API URL |
| `backend/.env` | `USE_FIREBASE_EMULATOR=true`, `COST_SAVER_MODE=true` |

- **Firestore/Auth Emulator**: prod GCP Firestore·Auth **과금·데이터 오염 없음**
- **COST_SAVER_MODE**: Solapi/SMS **실발송 스킵**
- CORS: `localhost:3000` 허용 (`backend/utils/cors_config.py`)

## Emulator 로그인

Auth Emulator는 **빈 DB**에서 시작합니다.

1. http://localhost:4000 → Authentication에서 테스트 사용자 추가  
2. 또는 앱 회원가입/로그인 UI로 Emulator 계정 생성  
3. `backend/.env`의 `BOOTSTRAP_ADMIN_EMAILS` 이메일이면 상담사/관리자 bootstrap 가능

## prod 데이터가 꼭 필요할 때 (비용 주의)

`backend/.env`에서:

```env
USE_FIREBASE_EMULATOR=false
FIREBASE_CREDENTIALS_PATH=../Firebase_GitHub/<service-account>.json
```

→ **클라oud Firestore 읽기/쓰기 과금**이 다시 붙습니다. 일상 개발에는 Emulator 권장.

## prod 배포와 분리

- 개발: **`npm run dev`** 만 사용 → GitHub Actions / Cloud Build / Hosting 배포 **없음**
- 확인: Variable **`AUTO_DEPLOY_ON_PUSH=false`** ([비용 절감 가이드](./gcp-cost-saver-ko.md))
- 배포: 주 1~2회 수동 workflow 또는 오픈 전에만 `true`

## CI·로컬 빌드

- `npm run dev:build` / `npm run build` — 정적 export 검증 (Hosting과 동일 산출물)
- AI **Cloud Functions** 로컬은 `functions/` 참고 (상담 API 대부분은 Flask)
