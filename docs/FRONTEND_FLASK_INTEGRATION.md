# 프론트엔드(Next) ↔ Flask API 연동

## 클라이언트 코드

- 모듈: `src/lib/assessmentApi.ts`
- 기준 URL 결정 순서:
  1. `NEXT_PUBLIC_FLASK_API_URL` (빌드 시 주입)
  2. 브라우저 + `production`이면 `window.location.origin` (Hosting에서 동일 오리진으로 API를 프록시할 때만 유효)
  3. 그 외 `http://localhost:5000`

## 프로덕션(Firebase Hosting 정적 배포)

`firebase.json`에는 Cloud Run으로 가는 **외부 리라이트가 없습니다.**  
따라서 상담사·참여 코드 API가 Cloud Run에서 돌아가면 **반드시** GitHub Actions 빌드 단계에서 `NEXT_PUBLIC_FLASK_API_URL`을 Cloud Run 서비스 URL(예: `https://wizcoco-api-xxxxx-an.a.run.app`)로 넣어야 합니다.

- 워크플로: `.github/workflows/deploy.yml`의 “환경 변수 설정”에서 `secrets.NEXT_PUBLIC_FLASK_API_URL`이 있으면 `.env`에 기록 후 `npm run build`에 반영됩니다.
- 로컬 빌드: `.env.production` 또는 환경 변수로 동일 키 설정.

## CORS (Flask)

- `backend/README.md`의 `CORS_ORIGINS`로 허용 오리진을 설정합니다.
- 프로덕션에서는 최소한 `https://wiz-coco.web.app`(및 커스텀 도메인)을 포함해야 브라우저에서 `fetch`가 성공합니다.

## 인증

- 상담사 전용 엔드포인트는 `Authorization: Bearer <Firebase ID Token>`을 사용합니다. (`getCounselorToken()`)

## 헬스 확인

- Flask: `GET /api/health`
- 배포 후: 브라우저 또는 `curl`로 위 URL + `/api/health` 확인

## 관련 파일

| 구분 | 경로 |
|------|------|
| API 클라이언트 | `src/lib/assessmentApi.ts` |
| Next 빌드 env | `next.config.js`의 `env.NEXT_PUBLIC_FLASK_API_URL` |
| CI 주입 | `.github/workflows/deploy.yml` |
| Flask 앱 | `backend/app.py` (및 README) |
| Cloud Run 배포 | `.github/workflows/deploy-backend.yml` |
