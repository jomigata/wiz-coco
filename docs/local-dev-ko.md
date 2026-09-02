# 로컬 개발 (Next.js + Flask)

## 1회 설정

```powershell
npm run setup:local
```

- Python venv: `backend/.venv`
- Flask 의존성 설치
- `.env.local`, `backend/.env` 생성(없을 때)

Firebase Admin JSON: `Firebase_GitHub/*.json` (또는 `backend/serviceAccountKey.json`)

## 실행

```powershell
npm run dev
```

| 서비스 | URL |
|--------|-----|
| Next.js UI | http://localhost:3000 |
| Flask API | http://localhost:5000 |
| Health | http://localhost:5000/api/health |

프론트는 `.env.local`의 `NEXT_PUBLIC_FLASK_API_URL=http://localhost:5000`으로 API를 호출합니다.

## 개별 실행

```powershell
npm run dev:next    # Next.js만
npm run dev:flask   # Flask만
```

## 참고

- `COST_SAVER_MODE=true` — Solapi/SMS 실발송 스킵 (로컬 기본)
- CORS: `localhost:3000`은 `backend/utils/cors_config.py`에 허용됨
- AI Functions는 Cloud Run과 별도 — Firebase Functions 로컬은 `functions/` 폴더 참고
