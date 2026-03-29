# Firebase CI / Secrets 설정 안내 (비밀값 없음)

> **보안:** 이 문서에는 토큰·비밀키·JSON 본문을 넣지 않습니다.  
> 과거에 이 저장소에 실제 키가 포함된 적이 있다면 **Firebase 콘솔에서 해당 서비스 계정 키를 폐기하고 새 키를 발급**하고, `firebase login:ci` 토큰도 **재발급**하세요.

## FIREBASE_TOKEN

- **발급:** 로컬에서 `firebase login:ci` 실행 후 표시되는 토큰만 **GitHub Secret `FIREBASE_TOKEN`**에 저장합니다.
- **문서/저장소:** 토큰 문자열을 커밋하지 않습니다.

## FIREBASE_SERVICE_ACCOUNT

- Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키(JSON) 다운로드.
- JSON **전체**를 GitHub Secret `FIREBASE_SERVICE_ACCOUNT`에 붙여 넣습니다.
- 로컬 전용 파일은 `Firebase_GitHub/` 등 **gitignore된 경로**에만 두고 저장소에 올리지 않습니다.

## Firebase 클라이언트용 Secrets (빌드 시 주입)

Firebase Console의 웹 앱 설정에서 복사해 GitHub Secrets에 설정합니다.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FLASK_API_URL` (선택, Cloud Run URL — [FRONTEND_FLASK_INTEGRATION.md](./FRONTEND_FLASK_INTEGRATION.md) 참고)

## 링크

- [GitHub Actions Secrets](https://github.com/jomigata/wiz-coco/settings/secrets/actions)
- [Firebase Console — wiz-coco](https://console.firebase.google.com/project/wiz-coco/settings/general)
- [GitHub Actions](https://github.com/jomigata/wiz-coco/actions)

## 관련 문서

- [SECURITY_CREDENTIALS.md](./SECURITY_CREDENTIALS.md) — 자격 증명 취급·유출 시 조치
