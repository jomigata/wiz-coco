# Cloudflare Email Routing — support@wizcoco.com

`support@wizcoco.com` 으로 온 메일을 **실제 메일함**으로 전달합니다. (무료, **수신 전용**)

---

## 방법 A — 콘솔에서 5분 설정 (권장)

### 1. Cloudflare 로그인

1. [dash.cloudflare.com](https://dash.cloudflare.com) 로그인  
2. **wizcoco.com** zone 선택  

### 2. Email Routing 켜기

1. 왼쪽 **Email** → **Email Routing**  
   (또는 **Compute** → **Email Service** → **Email Routing**)  
2. **Get started** / **Enable Email Routing**  
3. **Add records and enable** → MX·TXT 자동 추가  

> 기존 **다른 메일 서비스 MX**(Zoho/Google)가 있으면 충돌합니다. Email Routing만 쓸 때 진행하세요.

### 3. 전달받을 주소 등록 (Destination)

1. **Destination addresses** 탭  
2. 실제 메일 입력 (예: `jomigata@naver.com`)  
3. **인증 메일** 도착 → **Verify email address** 클릭  

### 4. support@ 주소 만들기

1. **Routing rules** → **Create address** / **Create routing rule**  
2. **Custom address:** `support` → 도메인 `wizcoco.com`  
3. **Action:** Send to an email  
4. **Destination:** 위에서 인증한 주소  
5. 저장  

### 5. 테스트

다른 계정에서 `support@wizcoco.com` 으로 메일 발송 → 전달 메일함 수신 확인.

---

## 방법 B — API 스크립트 (자동)

### 1. API Token 발급

1. [API Tokens](https://dash.cloudflare.com/profile/api-tokens)  
2. **Create Token** → **Edit zone DNS** 템플릿 기반  
3. 권한 추가: **Account** → **Email Routing Addresses** → **Edit**  
4. Zone: **wizcoco.com**  

### 2. 로컬 설정

```bash
copy .env.cloudflare.example .env.cloudflare
```

`.env.cloudflare` 예:

```
CLOUDFLARE_API_TOKEN=발급한_토큰
EMAIL_ROUTING_DESTINATION=jomigata@naver.com
CLOUDFLARE_ZONE_NAME=wizcoco.com
```

### 3. 실행

```bash
npm run setup:cloudflare-email
```

인증 메일 Verify 후 **한 번 더** 실행하면 라우팅 규칙이 생성됩니다.

---

## WizCoCo 사이트 연동

이미 반영됨:

- `src/lib/businessLegal.ts` → `contactEmail: support@wizcoco.com`  
- `/company/` 사업자 정보 페이지  

**발송(SMTP)** 은 Email Routing으로는 불가합니다. 앱 알림 메일은 기존 Gmail SMTP 또는 Google Workspace를 사용하세요.

---

## 자주 묻는 질문

| 질문 | 답 |
|------|-----|
| 발송도 되나요? | ❌ 수신·전달만. 발송은 Gmail/Workspace |
| 비용 | 무료 |
| Google Workspace와 같이? | MX 충돌 — 둘 중 하나만 |
| 카카오 심사용 | ✅ `support@wizcoco.com` 수신 가능하면 충분 |

---

## MX 확인 (PowerShell)

```powershell
nslookup -type=mx wizcoco.com
```

Cloudflare Email Routing 활성 시 `*.mx.cloudflare.net` 형태 MX가 보입니다.
