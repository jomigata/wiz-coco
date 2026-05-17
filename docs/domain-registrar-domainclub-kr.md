# DOMAINCLUB 기관 이전 후 도메인 연결 — 콘솔 작업 상세 가이드

메인 사이트: **https://wizcoco.com** (Firebase Hosting 프로젝트 `wiz-coco`)  
`wizcoco.kr` / `www.wizcoco.kr`: **https://wizcoco.com** 으로 **301 리다이렉트**

> 아래 순서대로 진행하세요. **2단계(Firebase)** 에서 표시되는 DNS 값이 **3단계(Cloudflare)** 보다 우선입니다.

---

## 진행 순서 한눈에 보기

| 순서 | 어디서 | 무엇을 |
|------|--------|--------|
| 1 | DOMAINCLUB | 네임서버 Cloudflare 유지 |
| 2 | Firebase | `wizcoco.com` / `www` 커스텀 도메인 + Auth 허용 도메인 |
| 3 | Cloudflare (`wizcoco.com`) | A / CNAME / TXT → Firebase |
| 4 | Cloudflare (`wizcoco.kr`) | `.com` 으로 301 리다이렉트 |
| 5 | 카카오 / 네이버 | 로그인 콜백 URL 등록 |
| 6 | PC | 접속·로그인 테스트 |

---

## 1단계: DOMAINCLUB — 네임서버 확인

### 1-1. 로그인

1. 브라우저에서 **[DOMAINCLUB](https://www.domainclub.kr/)** 접속
2. 우측 상단 **로그인** (ID: 본인 계정)

### 1-2. 네임서버 변경 화면으로 이동

1. 상단 메뉴 **정보 변경** 클릭  
2. 목록에서 **네임서버 변경** → 오른쪽 **바로가기** 클릭  
3. 도메인 목록에서 **`wizcoco.kr`** 선택

### 1-3. 입력할 값 (복사해서 붙여넣기)

**「도메인클럽 네임서버 사용」체크는 해제**한 상태에서, **1·2차만** 입력합니다. 3·4차는 비워 둡니다.

| 구분 | 네임서버명 | IP (IPv4) |
|------|------------|-----------|
| 1차 | `miles.ns.cloudflare.com` | `108.162.193.207` |
| 2차 | `jasmine.ns.cloudflare.com` | `108.162.192.170` |

> Cloudflare는 네임서버마다 **IP가 여러 개**입니다. DOMAINCLUB이 “IP 불일치”로 거절하면 아래 **대체 IP**로 바꿔 다시 **수정하기** 하세요.  
> 화면의 **「IP가 상이하거나 확인이 어려운 경우 → 조치 방법 보기」** 도 참고하세요.

| 네임서버명 | 대체 IP (택1) |
|------------|----------------|
| `miles.ns.cloudflare.com` | `173.245.59.207` / `172.64.33.207` |
| `jasmine.ns.cloudflare.com` | `173.245.58.170` / `172.64.32.170` |

**본인 PC에서 IP 확인:**

```powershell
nslookup miles.ns.cloudflare.com
nslookup jasmine.ns.cloudflare.com
```

- **「DOMAINCLUB 기본 DNS」로 바꾸지 마세요.** Cloudflare 설정이 끊깁니다.
- 본인 인증(메일) 후 **수정하기** 클릭

### 1-4. (권장) 도메인 연락처 확인

1. **정보 변경** → **도메인 정보변경** → **바로가기**
2. 등록자·관리자 **이메일·전화번호**가 현재 사용 중인지 확인 (.kr 인증 메일 수신용)

### 1-5. 확인

PowerShell에서:

```powershell
nslookup -type=ns wizcoco.kr
```

**기대 결과:** `miles.ns.cloudflare.com`, `jasmine.ns.cloudflare.com`  
(이미 이렇게 나오면 **1단계 완료**, 2단계로 이동)

---

## 2단계: Firebase — wizcoco.com 연결

### 2-1. Hosting에 커스텀 도메인 추가

1. **[Firebase Hosting (wiz-coco)](https://console.firebase.google.com/project/wiz-coco/hosting)** 열기  
2. **Custom domains** (커스텀 도메인) 섹션 찾기  
3. **Add custom domain** (커스텀 도메인 추가) 클릭  

#### 도메인 ① — 루트 도메인

| 항목 | 입력값 |
|------|--------|
| 도메인 | `wizcoco.com` |
| 리다이렉트 | **www로 리다이렉트 안 함** (또는 “이 도메인만 사용” — 나중에 www도 별도 추가) |

4. **Continue** → Firebase가 **DNS 레코드 안내 화면**을 표시함 → **이 화면을 켜 둔 채** 3단계에서 그대로 입력 (값이 다르면 **Firebase 화면 값 우선**)

일반적으로 안내되는 값 (참고용, **콘솔과 다르면 콘솔 따름**):

| 타입 | 호스트/이름 | 값 |
|------|-------------|-----|
| A | `@` (또는 비움) | `199.36.153.89` |
| A | `@` | `199.36.153.90` |
| TXT | `@` | `firebase=wiz-coco` (또는 콘솔에 표시된 문자열) |

5. 상태가 **Needs setup** → DNS 입력 후 **Pending** → **Connected** 로 바뀔 때까지 대기 (수 시간~48시간)

#### 도메인 ② — www

1. 다시 **Add custom domain**  
2. 입력: `www.wizcoco.com`  
3. 안내에 따라 Cloudflare에 추가:

| 타입 | 이름 | 값 |
|------|------|-----|
| CNAME | `www` | `wiz-coco.web.app` |

### 2-2. Authentication 허용 도메인 추가

1. **[Firebase Authentication → Settings](https://console.firebase.google.com/project/wiz-coco/authentication/settings)** 열기  
2. **Authorized domains** (승인된 도메인) 탭  
3. **Add domain** 두 번 클릭하여 각각 추가:

| 추가할 도메인 |
|---------------|
| `wizcoco.com` |
| `www.wizcoco.com` |

> `wizcoco.kr` 은 **추가하지 않습니다** (리다이렉트만 사용).

### 2-3. 완료 기준

- Hosting → Custom domains에서 `wizcoco.com`, `www.wizcoco.com` SSL 상태 **Connected** (또는 녹색 체크)

**wizcoco.kr 은 Firebase에 추가하지 마세요.**

---

## 3단계: Cloudflare — wizcoco.com DNS

### 3-1. DNS Records 화면 열기

1. **[Cloudflare 대시보드](https://dash.cloudflare.com/)** 로그인  
2. 왼쪽 **Websites** → **`wizcoco.com`** 클릭  
3. 왼쪽 메뉴 **DNS** → **Records**

### 3-2. 삭제할 레코드 (있으면)

아래 IP로 가리키는 **불필요한 A 레코드**가 있으면 **Delete**:

| 삭제 대상 예시 | 이유 |
|----------------|------|
| A `@` → `199.36.158.100` | 도메인 파킹 IP, Firebase와 충돌 |
| A `@` → Firebase 안내와 다른 구 IP | |

### 3-3. 추가·수정할 레코드 (한 줄씩)

**Add record** 버튼으로 아래를 **각각** 추가하거나, 기존 레코드가 있으면 **Edit** 로 맞춥니다.

#### 레코드 1 — A (루트)

| Cloudflare 필드 | 값 |
|-----------------|-----|
| Type | `A` |
| Name | `@` |
| IPv4 address | `199.36.153.89` |
| Proxy status | 처음엔 **DNS only (회색 구름)** 권장 → SSL 연결 후 필요 시 Proxied |
| TTL | Auto |

#### 레코드 2 — A (루트, 두 번째)

| Cloudflare 필드 | 값 |
|-----------------|-----|
| Type | `A` |
| Name | `@` |
| IPv4 address | `199.36.153.90` |
| Proxy status | 위와 동일 |
| TTL | Auto |

#### 레코드 3 — CNAME (www)

| Cloudflare 필드 | 값 |
|-----------------|-----|
| Type | `CNAME` |
| Name | `www` |
| Target | `wiz-coco.web.app` |
| Proxy status | 위와 동일 |
| TTL | Auto |

#### 레코드 4 — TXT (Firebase 검증)

Firebase 2-1 단계 화면에 표시된 TXT를 그대로 사용합니다.

| Cloudflare 필드 | 값 (예시) |
|-----------------|-----------|
| Type | `TXT` |
| Name | `@` |
| Content | `firebase=wiz-coco` |

> 이미 `hosting-site=wiz-coco` TXT가 있으면 **유지**하고, Firebase가 요구하는 TXT를 **추가**합니다.

### 3-4. SSL/TLS 설정

1. **`wizcoco.com`** zone → 왼쪽 **SSL/TLS** → **Overview**  
   - **[SSL/TLS Overview](https://dash.cloudflare.com/)** (zone 선택 후)  
2. **Encryption mode**: 인증서 연결 후 **Full (strict)** 권장  
   - 인증서 발급 전 오류가 나면 잠시 **Full** 사용 후 Connected 되면 **Full (strict)** 로 변경

### 3-5. 저장 후 확인

```powershell
cd "e:\04. Cursor\WizCoCo"
node scripts/verify-dns-settings.js
```

브라우저: **https://wizcoco.com** 접속 → WizCoCo 사이트가 보이면 성공

---

## 4단계: Cloudflare — wizcoco.kr → wizcoco.com 리다이렉트

### 4-1. Redirect Rules 화면

1. [Cloudflare 대시보드](https://dash.cloudflare.com/) → **`wizcoco.kr`** zone 선택  
   - `wizcoco.kr` zone이 없으면 **Add a site** 로 zone 추가 후 NS는 DOMAINCLUB과 동일하게 유지  
2. 왼쪽 **Rules** → **Redirect Rules**  
   - 또는 **Rules** → **Overview** → **Redirect Rules** → **Create rule**

### 4-2. 규칙 만들기 (입력값 그대로)

| 항목 | 값 |
|------|-----|
| Rule name | `kr-to-com` |
| If incoming requests match | **Custom filter expression** 선택 |
| Expression | `(http.host eq "wizcoco.kr") or (http.host eq "www.wizcoco.kr")` |
| Then | **Dynamic** 선택 |
| Expression (Target URL) | `concat("https://wizcoco.com", http.request.uri.path)` |
| Status code | **301** |
| Preserve query string | **켜기** (ON) — `?code=...` 등 유지 |

**Save** / **Deploy**

### 4-3. 확인

PowerShell:

```powershell
curl.exe -sI --max-redirs 0 https://wizcoco.kr
curl.exe -sI --max-redirs 0 https://www.wizcoco.kr
```

**기대:**

```
HTTP/1.1 301
Location: https://wizcoco.com/
```

브라우저에서 `https://wizcoco.kr` 입력 → 주소창이 `https://wizcoco.com` 으로 바뀌면 성공

---

## 5단계: 카카오 로그인 — Redirect URI

### 5-1. 개발자 콘솔

1. **[Kakao Developers](https://developers.kakao.com/)** 로그인  
2. **내 애플리케이션** → WizCoCo 앱 선택  
3. **앱 설정** → **플랫폼** → **Web**  
   - 사이트 도메인에 `https://wizcoco.com` 등록 (없으면 추가)  
4. **제품 설정** → **카카오 로그인** → **활성화** ON  
5. **Redirect URI** 에 아래 **두 줄을 각각** 등록 (끝 슬래시 `/` 포함):

```
https://wizcoco.com/login/kakao-callback/
https://www.wizcoco.com/login/kakao-callback/
```

6. **저장**

> 개발용으로 로컬도 쓰면 추가: `http://localhost:3000/login/kakao-callback/`

---

## 6단계: 네이버 로그인 — Callback URL

### 6-1. 개발자 센터

1. **[네이버 개발자 센터](https://developers.naver.com/apps/)** 로그인  
2. WizCoCo **Application** 선택 → **API 설정** (또는 애플리케이션 수정)  
3. **네이버 로그인** 사용 API 체크  
4. **PC 웹** 환경 설정:

| 필드 | 입력값 |
|------|--------|
| 서비스 URL | `https://wizcoco.com` |
| Callback URL (1) | `https://wizcoco.com/login/naver-callback/` |
| Callback URL (2) | `https://www.wizcoco.com/login/naver-callback/` |

5. **저장** / **수정 완료**

> Callback URL은 카카오와 같이 **끝에 `/` 포함**, 등록 문자열과 실제 요청이 **완전히 동일**해야 합니다.

---

## 7단계: 최종 테스트 체크리스트

| # | 확인 | 방법 |
|---|------|------|
| 1 | 메인 사이트 | https://wizcoco.com 브라우저 접속 |
| 2 | www | https://www.wizcoco.com 접속 |
| 3 | kr 리다이렉트 | https://wizcoco.kr → `.com` 으로 이동 |
| 4 | Firebase SSL | Hosting 콘솔에서 Connected |
| 5 | 카카오 로그인 | 로그인 → 카카오 → 동의 후 마이페이지 등 |
| 6 | 네이버 로그인 | 동일 |
| 7 | DNS 스크립트 | `node scripts/verify-dns-settings.js` |

---

## 자주 묻는 문제

| 증상 | 조치 |
|------|------|
| Firebase가 Needs setup에서 안 바뀜 | Cloudflare A/CNAME/TXT 재확인, 24시간 대기 |
| SSL handshake 오류 | Cloudflare `@`/`www` 를 **DNS only** 로 변경 후 Firebase Connected 확인 |
| 카카오 redirect_uri_mismatch | 콘솔 URI와 위 목록이 **한 글자도 같게** (https, 슬래시) |
| wizcoco.kr 이 그대로 사이트만 보임 | 4단계 Redirect Rule 미적용 → 규칙 Deploy 확인 |

---

## 빠른 링크 모음

| 서비스 | 링크 |
|--------|------|
| DOMAINCLUB | https://www.domainclub.kr/ |
| Cloudflare | https://dash.cloudflare.com/ |
| Firebase Hosting | https://console.firebase.google.com/project/wiz-coco/hosting |
| Firebase Auth 설정 | https://console.firebase.google.com/project/wiz-coco/authentication/settings |
| Firebase 프로젝트 개요 | https://console.firebase.google.com/project/wiz-coco/overview |
| 카카오 Developers | https://developers.kakao.com/ |
| 네이버 개발자 | https://developers.naver.com/apps/ |
| KISA WHOIS (.kr) | https://whois.kisa.or.kr/ |

관련 문서: [firebase-custom-domain-setup.md](./firebase-custom-domain-setup.md), [kakao-naver-oauth-setup.md](./kakao-naver-oauth-setup.md)
