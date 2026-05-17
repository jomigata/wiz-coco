# DOMAINCLUB 기관 이전 후 도메인 연결 (wizcoco.kr / wizcoco.com)

메인 사이트: **https://wizcoco.com** (Firebase Hosting `wiz-coco`)  
`wizcoco.kr` / `www.wizcoco.kr`: **https://wizcoco.com** 으로 **301 리다이렉트** (OAuth·앱은 `.com`만 사용)

관련 문서: [firebase-custom-domain-setup.md](./firebase-custom-domain-setup.md), [kakao-naver-oauth-setup.md](./kakao-naver-oauth-setup.md)

---

## 1. DOMAINCLUB — 네임서버 (필수)

**정보 변경 → 네임서버 변경 → 바로가기**

| 순서 | 네임서버 |
|------|----------|
| 1 | `miles.ns.cloudflare.com` |
| 2 | `jasmine.ns.cloudflare.com` |

- DOMAINCLUB **기본 DNS**로 바꾸지 마세요. Cloudflare zone 설정이 끊깁니다.
- 저장 후 확인:

```bash
nslookup -type=ns wizcoco.kr
```

기대: `miles.ns.cloudflare.com`, `jasmine.ns.cloudflare.com`

**도메인 정보변경**: 등록자·관리자 이메일이 최신인지 확인 (.kr 인증 메일).

---

## 2. Firebase Console — wizcoco.com

1. [Hosting](https://console.firebase.google.com/project/wiz-coco/hosting) → **Custom domains** → **Add custom domain**
2. 추가: `wizcoco.com`, `www.wizcoco.com`
3. 콘솔에 표시된 **A / CNAME / TXT** 값을 Cloudflare에 입력 (아래 3단계)
4. [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/wiz-coco/authentication/settings)  
   - `wizcoco.com`, `www.wizcoco.com` 추가
5. Hosting에서 두 도메인 SSL 상태가 **Connected** 될 때까지 대기 (DNS 전파 후 최대 24–48시간)

**wizcoco.kr은 Firebase 커스텀 도메인에 추가하지 않습니다** (Cloudflare 리다이렉트만 사용).

일반적인 Firebase Hosting 레코드 (콘솔 값이 우선):

| 타입 | 호스트 | 값 |
|------|--------|-----|
| A | `@` | `199.36.153.89` |
| A | `@` | `199.36.153.90` |
| CNAME | `www` | `wiz-coco.web.app` |
| TXT | `@` | `firebase=wiz-coco` (콘솔 안내) |

---

## 3. Cloudflare — wizcoco.com → Firebase

Cloudflare 대시보드 → **wizcoco.com** zone → **DNS**

| 타입 | 이름 | 내용 | 프록시 |
|------|------|------|--------|
| A | `@` | `199.36.153.89` | SSL 문제 시 **DNS only** |
| A | `@` | `199.36.153.90` | 동일 |
| CNAME | `www` | `wiz-coco.web.app` | 동일 |
| TXT | `@` | Firebase 안내 TXT | — |

- 삭제: 파킹 IP `199.36.158.100` 등 Firebase와 무관한 A 레코드
- **SSL/TLS**: 인증서 연결 후 **Full (strict)** 권장

검증:

```bash
node scripts/verify-dns-settings.js
```

---

## 4. Cloudflare — wizcoco.kr → wizcoco.com 리다이렉트

Cloudflare → **wizcoco.kr** zone (또는 동일 계정 zone) → **Rules** → **Redirect Rules** → **Create rule**

**규칙 예시 (Dynamic redirect)**

| 필드 | 값 |
|------|-----|
| Rule name | `kr-to-com` |
| When | Custom filter: `(http.host eq "wizcoco.kr") or (http.host eq "www.wizcoco.kr")` |
| Then | Dynamic: `concat("https://wizcoco.com", http.request.uri.path)` |
| Status | **301** |

경로·쿼리까지 유지하려면 Expression을 Cloudflare UI의 **Preserve query string** 옵션과 함께 조정하세요.

**수동 확인**

```bash
curl.exe -sI --max-redirs 0 https://wizcoco.kr
curl.exe -sI --max-redirs 0 https://www.wizcoco.kr
```

기대: `HTTP/1.1 301` (또는 308) 및 `Location: https://wizcoco.com/...`

`node scripts/verify-dns-settings.js` 의 `.kr` 리다이렉트 검사도 실행하세요.

---

## 5. OAuth·백엔드 (wizcoco.com)

### 카카오 Developers

Redirect URI:

- `https://wizcoco.com/login/kakao-callback/`
- `https://www.wizcoco.com/login/kakao-callback/`

### 네이버 개발자 센터

- 서비스 URL: `https://wizcoco.com`
- Callback URL: 위와 동일 경로 (`naver-callback`)

### 저장소 / 배포

- Functions 허용 목록: `functions/oauthExchange.ts` (이미 `.com` 포함)
- 프로덕션 URL: `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL` → `https://wizcoco.com` 권장 (`env.local.example` 참고)
- Cloud Run: `CORS_ORIGINS`에 `https://wizcoco.com`, `https://www.wizcoco.com` 포함

---

## 6. 체크리스트

- [ ] DOMAINCLUB NS = Cloudflare 2개
- [ ] Firebase Hosting: `wizcoco.com`, `www.wizcoco.com` Connected
- [ ] Firebase Auth: authorized domains 추가
- [ ] Cloudflare `.com` DNS → Firebase A/CNAME/TXT
- [ ] Cloudflare `.kr` → `.com` 301
- [ ] 카카오/네이버 콘솔 Redirect URI
- [ ] `https://wizcoco.com` 접속·로그인 테스트
- [ ] `https://wizcoco.kr` → `.com` 리다이렉트 확인
