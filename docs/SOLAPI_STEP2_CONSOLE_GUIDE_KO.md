# Solapi 콘솔 — 2단계 작업 가이드 (회원가입 완료 후)

로그인 상태에서 **아래 순서**로 진행하세요.  
각 단계 완료 시 `backend/.env.solapi`에 값을 적어 두면 마지막에 `npm run secrets:solapi` 한 번으로 끝납니다.

---

## 준비: 로컬 파일

```bash
copy backend\.env.solapi.example backend\.env.solapi
```

회원가입 시 등록한 휴대폰을 발신·테스트 번호로 쓸 경우(본인 번호 승인 후):

```
SOLAPI_SENDER=01051825410
ALIMTALK_TEST_PHONE=01051825410
```

> 발신번호는 Solapi **발신번호 승인**이 끝난 뒤에만 사용 가능합니다.

---

## Step A. API Key 발급 (5분)

1. [Solapi 콘솔](https://console.solapi.com/dashboard) 로그인
2. 왼쪽 **전체 메뉴 검색**에 `API` 또는 `API Key` 입력
3. **API Key 관리** (또는 **개발/연동** → API Key) 이동
4. **새 API Key 생성** → Key·Secret **한 번만** 표시되므로 즉시 복사
5. `.env.solapi`에 저장:
   ```
   SOLAPI_API_KEY=발급받은_Key
   SOLAPI_API_SECRET=발급받은_Secret
   ```

⚠️ Secret은 채팅·GitHub 이슈에 붙여넣지 마세요. `.env.solapi`에만 저장.

---

## Step B. 발신번호 등록 (승인 1~3일)

1. 왼쪽 메뉴 **발신번호** (`contact_phone`) 클릭  
   또는 검색: `발신번호`
2. **발신번호 등록** → 본인 휴대폰 `010-5182-5410` 등록
3. 필요 서류(사업자 또는 개인) 업로드·본인인증
4. 상태가 **승인** 될 때까지 대기
5. 승인 후 `.env.solapi`:
   ```
   SOLAPI_SENDER=01051825410
   ```

**사업자정보 미등록** 상태(프로필 드롭다운 → 사업자정보 **등록**)면 발신번호 심사가 지연될 수 있습니다.  
가능하면 **사업자정보 등록**을 먼저 완료하세요.

---

## Step C. 카카오 채널 연동 → pfId (15분)

### C-1. 카카오 비즈니스 채널 (없으면)

1. [카카오 비즈니스](https://business.kakao.com) 로그인
2. **채널 만들기** → 채널명 예: `WizCoCo` 또는 `위즈코코`
3. 채널 **관리자** 권한 확인 (본인 계정)

### C-2. Solapi에 채널 연동

**먼저 (카카오 관리자센터):** 채널 정보 → **채널 공개 ON**, **검색 허용 ON**  
(비공개·검색불가면 Solapi 연동 오류: 「채널 상태를 확인」)

**콘솔 (클릭):**

1. Solapi 콘솔 → **카카오/네이버/RCS** → **채널 연동**
2. 검색용 아이디: `wizcoco`
3. 카테고리: **교육** → **교육정보/접수대행/자격증**
4. 채널 관리자 휴대폰: `01051825410` → **인증 요청** → 카카오톡 인증번호 입력
5. 연동 후 **pfId(channelId)** 복사 → `.env.solapi`의 `SOLAPI_KAKAO_PF_ID`

**CLI (선택):**

```bash
npm run solapi:kakao:token
npm run solapi:kakao:link -- 받은인증번호
npm run solapi:kakao:list
```

---

## Step D. 알림톡 템플릿 3종 등록 (심사 1~2영업일)

1. Solapi → **카카오/네이버/RCS** → **알림톡 템플릿**
2. [SOLAPI_ALIMTALK_TEMPLATES_COPY_KO.md](./SOLAPI_ALIMTALK_TEMPLATES_COPY_KO.md) 문구를 **3건** 등록
3. 심사 **승인** 후 각 templateId 복사:

```
SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER=KA01TP...
SOLAPI_KAKAO_TEMPLATE_CARE=KA01TP...
SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS=KA01TP...
```

템플릿이 **검수 중**이면 API 연동은 준비만 해 두고, 승인 후 Secret 등록해도 됩니다.

---

## Step E. GitHub Secret 등록 + 배포 (에이전트 또는 직접)

`.env.solapi` **필수 7개**가 채워지면:

```bash
npm run secrets:solapi
gh run watch --workflow deploy-backend.yml
npm run verify:solapi
```

**「.env.solapi 작성 완료」**라고 알려주시면 에이전트가 위 명령을 대신 실행합니다.

---

## 진행 체크리스트

| # | 작업 | .env 키 | 완료 |
|---|------|---------|------|
| A | API Key 발급 | `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` | ☐ |
| B | 발신번호 승인 | `SOLAPI_SENDER` | ☐ |
| C | 카카오 채널 연동 | `SOLAPI_KAKAO_PF_ID` | ☐ |
| D-1 | 템플릿: 검사 미완료 | `SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER` | ☐ |
| D-2 | 템플릿: 치료·과제 | `SOLAPI_KAKAO_TEMPLATE_CARE` | ☐ |
| D-3 | 템플릿: 포털 자격증명 | `SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS` | ☐ |
| E | `npm run secrets:solapi` | — | ☐ |

---

## 지금 바로 할 일 (우선순위)

1. **API Key 발급** (즉시 가능)
2. **발신번호 등록** + **사업자정보 등록** (병행)
3. **카카오 채널 연동**
4. **템플릿 3종 등록** (심사 대기 가능)

API Key만 있어도 Solapi 연동 테스트(SMS)는 가능하지만, **알림톡**은 B·C·D가 모두 필요합니다.
