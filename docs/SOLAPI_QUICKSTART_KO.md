# Solapi 첫 설정 체크리스트 (WizCoCo)

Solapi 계정이 없을 때 **순서대로** 진행하세요. (약 30~60분, 템플릿 심사는 1~2영업일)

---

## 0. 자동 등록 준비 (로컬)

```bash
copy backend\.env.solapi.example backend\.env.solapi
```

아래 단계에서 확인한 값을 `backend/.env.solapi`에 적어 둡니다. **Git에 올리지 마세요.**

---

## 1. 회원가입

1. [Solapi 콘솔](https://console.solapi.com) → **회원가입**
2. 사업자/개인 정보·본인인증 완료
3. 로그인

---

## 2. API Key 발급

1. 콘솔 → **API Key** (또는 개발자/API 메뉴)
2. **새 API Key** 생성
3. `.env.solapi`에 저장:
   - `SOLAPI_API_KEY`
   - `SOLAPI_API_SECRET`

---

## 3. 발신번호 등록

1. 콘솔 → **발신번호 관리**
2. 사업자 서류로 **발신번호 등록·승인** (SMS 대체발송·알림톡 `from` 필드)
3. `.env.solapi`:
   - `SOLAPI_SENDER=010xxxxxxxx` (하이픈 없이)

---

## 4. 카카오 비즈니스 채널 연동

1. [카카오 비즈니스](https://business.kakao.com)에서 **채널 개설** (또는 기존 채널 사용)
2. Solapi 콘솔 → **카카오톡 / 알림톡** → **채널 연동**
3. 연동 후 **pfId** 복사 → `.env.solapi`:
   - `SOLAPI_KAKAO_PF_ID`

---

## 5. 알림톡 템플릿 3종 등록·승인

Solapi → **알림톡 템플릿**에서 아래 문구를 **변수명 그대로** 등록합니다.  
전문 문구는 [SOLAPI_KAKAO_ALIMTALK_SETUP_KO.md](./SOLAPI_KAKAO_ALIMTALK_SETUP_KO.md) §3 참고.

| 용도 | Secret 이름 | 변수 |
|------|-------------|------|
| 검사 미완료 | `SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER` | `#{name}` `#{title}` `#{pending}` `#{link}` |
| 치료·과제 | `SOLAPI_KAKAO_TEMPLATE_CARE` | `#{name}` `#{title}` `#{link}` |
| 포털 자격증명 | `SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS` | `#{name}` `#{mycode}` `#{pin}` `#{joincode}` `#{link}` |

승인된 각 템플릿의 **templateId**를 `.env.solapi`에 입력합니다.

---

## 6. GitHub Secrets 일괄 등록

`.env.solapi` 7개 값이 모두 채워졌으면:

```bash
npm run secrets:solapi
```

- GitHub Secrets 7개 등록
- `deploy-backend` 워크플로 자동 실행

배포 완료 대기 (약 3분):

```bash
gh run watch --workflow deploy-backend.yml
```

---

## 7. 연동 확인·테스트 발송

`.env.solapi`에 선택 항목 추가:

```
ALIMTALK_TEST_PHONE=010xxxxxxxx
NOTIFICATION_CRON_SECRET=  # GitHub에 이미 있으면 생략 가능
```

```bash
npm run verify:solapi
```

성공 시 Cloud Run `/api/notifications/status`에서 `kakaoAlimtalk.configured: true` 가 됩니다.

---

## 8. 상담사 UI 확인

배포 후 [wizcoco.com/counselor/progress](https://wizcoco.com/counselor/progress) → **알림 채널 상태** 카드에서  
검사·케어·포털 템플릿 ✓ 표시 확인.

---

## 막힐 때

| 단계 | 흔한 이슈 |
|------|-----------|
| 발신번호 | 서류 미비·승인 대기 |
| 채널 연동 | 카카오 채널 관리자 권한 필요 |
| 템플릿 | 변수명 불일치 → 반려 |
| 발송 실패 | `from`이 승인된 발신번호인지 확인 |

도움: [SOLAPI_KAKAO_ALIMTALK_SETUP_KO.md](./SOLAPI_KAKAO_ALIMTALK_SETUP_KO.md)
