# 카카오·네이버 로그인 설정 가이드 (WizCoCo)

이 프로젝트는 **정적 호스팅(Firebase Hosting)** 이므로 NextAuth 서버가 없습니다.  
대신 **OAuth 2.0 authorization code** → **Firebase Cloud Functions**에서 토큰 교환 → **Firebase Custom Token**으로 로그인합니다.

## 필요한 것 요약

| 구분 | 카카오 | 네이버 |
|------|--------|--------|
| 개발자 사이트 | [Kakao Developers](https://developers.kakao.com/) | [네이버 개발자 센터](https://developers.naver.com/) |
| 클라이언트에 넣는 값 | REST API 키 → `NEXT_PUBLIC_KAKAO_REST_API_KEY` | Client ID → `NEXT_PUBLIC_NAVER_CLIENT_ID` |
| 서버(Functions)에만 넣는 값 | Client Secret → `KAKAO_CLIENT_SECRET` | Client Secret → `NAVER_CLIENT_SECRET` |
| 콜백 URL | `https://<도메인>/login/kakao-callback/` | `https://<도메인>/login/naver-callback/` |

---

## 1. 카카오 개발자 콘솔

1. [Kakao Developers](https://developers.kakao.com/) 로그인 → **내 애플리케이션** → **애플리케이션 추가하기**.
2. 앱 이름·사업자명 등 필수 정보 입력 후 저장.
3. **앱 키** 메뉴에서 **REST API 키**를 복사 → 웹 프론트 `.env`에 `NEXT_PUBLIC_KAKAO_REST_API_KEY`로 설정 (공개되어도 되는 키이지만, 악용 방지를 위해 도메인 제한 권장).
4. **제품 설정** → **카카오 로그인** → **활성화 ON**.
5. **Redirect URI** 등록 (정확히 일치해야 함, 끝에 슬래시 포함 여부 통일):
   - 운영: `https://wiz-coco.web.app/login/kakao-callback/` (실제 서비스 URL로 변경)
   - 로컬: `http://localhost:3000/login/kakao-callback/`
6. **보안** → **Client Secret** 코드 발급 후 복사 → Firebase Functions 환경에 `KAKAO_CLIENT_SECRET`으로만 설정 (소스·Git에 커밋 금지).
7. **동의항목**: **카카오계정(이메일)** 등 필요 시 설정. 이메일을 받지 못하면 Functions에서 대체 이메일(`wizcoco+...@wiz-coco.web.app` 형태)로 계정을 만듭니다.

참고 문서: [카카오 로그인 REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)

---

## 2. 네이버 개발자 센터

1. [네이버 개발자 센터](https://developers.naver.com/) → **Application** → **애플리케이션 등록**.
2. **사용 API**에서 **네이버 로그인** 선택.
3. **로그인 오픈 API 서비스 환경**에서 **PC 웹** 선택 후 **서비스 URL**·**Callback URL** 입력:
   - Callback URL 예: `https://wiz-coco.web.app/login/naver-callback/`
   - 로컬: `http://localhost:3000/login/naver-callback/`
4. 등록 후 **Client ID**·**Client Secret** 확인.
   - Client ID → `NEXT_PUBLIC_NAVER_CLIENT_ID`
   - Client Secret → Functions 전용 `NAVER_CLIENT_SECRET` (Git 커밋 금지)

참고 문서: [네이버 로그인 개발가이드](https://developers.naver.com/docs/login/overview/)

---

## 3. Firebase Cloud Functions

1. 프로젝트 루트에서 Functions 의존성 설치 및 빌드:
   - `cd functions && npm install && npm run build`
2. 비밀 정보 설정 (택일):
   - **권장 (로컬/CI)**: Firebase 콘솔 → Functions → 환경 변수, 또는 배포 파이프라인 시크릿에 `KAKAO_CLIENT_ID`(REST 키와 동일 가능), `KAKAO_CLIENT_SECRET`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 설정.
   - **레거시**: `firebase functions:config:set kakao.client_id="..." kakao.client_secret="..." naver.client_id="..." naver.client_secret="..."`
3. 배포:
   - `firebase deploy --only functions:socialOAuthExchange`
   - 또는 전체: `firebase deploy --only functions`
4. 배포된 **HTTP 함수 URL** 확인 (예: `https://us-central1-<프로젝트ID>.cloudfunctions.net/socialOAuthExchange`).
   - Hosting에서 `/api/social-oauth`로 **리라이트**해 두었으면, 웹앱과 동일 출처로 호출 가능 → `NEXT_PUBLIC_SOCIAL_AUTH_URL`은 비워도 됨.
   - 리라이트 없이 다른 도메인만 쓸 경우 → `NEXT_PUBLIC_SOCIAL_AUTH_URL`에 위 전체 URL을 넣어야 합니다.

### Functions에서 쓰는 환경 변수 이름 (`oauthExchange.ts`)

- `KAKAO_CLIENT_ID` 또는 `config.kakao.client_id` (미설정 시 `KAKAO_REST_API_KEY`도 허용)
- `KAKAO_CLIENT_SECRET` / `config.kakao.client_secret`
- `NAVER_CLIENT_ID` / `config.naver.client_id`
- `NAVER_CLIENT_SECRET` / `config.naver.client_secret`
- (선택) `OAUTH_REDIRECT_URI_ALLOWLIST` — 쉼표로 구분한 추가 Redirect URI 허용 목록
- (선택) `OAUTH_SYNTHETIC_EMAIL_DOMAIN` — 이메일 미제공 시 합성 이메일 도메인 (기본 `wiz-coco.web.app`)

---

## 4. 프론트엔드(.env / 빌드 시 주입)

- `NEXT_PUBLIC_KAKAO_REST_API_KEY`
- `NEXT_PUBLIC_NAVER_CLIENT_ID`
- `NEXT_PUBLIC_SOCIAL_AUTH_URL` — Hosting 리라이트를 쓰지 않을 때만 필수

`src/env.example`에 동일 항목이 있습니다.

---

## 5. Firebase Hosting

`firebase.json`에 다음 리라이트가 포함되어 있습니다.

- `source`: `/api/social-oauth` → `function`: `socialOAuthExchange`

Hosting과 Functions를 **같이 배포**해야 리라이트가 동작합니다: `firebase deploy --only hosting,functions`

---

## 6. 동작 흐름 (검증 체크리스트)

1. 로그인 화면에서 **카카오로 로그인** → 카카오 동의 화면 → 승인 후 `/login/kakao-callback/?code=...&state=...`
2. 콜백 페이지가 `POST /api/social-oauth`(또는 `NEXT_PUBLIC_SOCIAL_AUTH_URL`)로 `code` 전달
3. Functions가 카카오 토큰 API로 교환 후 사용자 정보 조회 → Firebase Auth에 사용자 생성/조회 → **Custom Token** 발급
4. 브라우저에서 `signInWithCustomToken`으로 Firebase 로그인 완료 → `oauth_return`에 저장된 경로로 이동 (기본 `/mypage`)

네이버도 동일하며, **state**로 CSRF를 완화합니다(세션 스토리지의 `oauth_state`와 비교).

---

## 7. 자주 나는 오류

| 증상 | 확인 |
|------|------|
| redirect_uri_mismatch | 카카오/네이버 콘솔의 Redirect URI가 코드와 **문자 단위로 동일**한지(스킴, 포트, 끝 `/`) |
| 카카오 토큰 실패 | Client Secret 사용 여부, 앱에 Secret이 켜져 있는지 |
| CORS | Functions는 `Access-Control-Allow-Origin`을 설정함. 운영 도메인만 허용하도록 좁히는 것을 권장 |
| 이미 이메일로 가입됨 | 동일 이메일이 다른 UID에 있으면 Firebase가 거절할 수 있음. Functions에서 이메일 충돌 시 이메일 없이 생성하도록 처리함 |

---

## 8. 사업자·법무 (실서비스 시)

- 개인정보 처리방침·이용약관에 **제3자 제공(카카오/네이버)**·**수집 항목** 명시
- 카카오/네이버 앱 검수(필요 시) 및 **도메인·사이트 URL** 등록

이 문서는 저장소 `docs/kakao-naver-oauth-setup.md`에 포함되어 있습니다.
