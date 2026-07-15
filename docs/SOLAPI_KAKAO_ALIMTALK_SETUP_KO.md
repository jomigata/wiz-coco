# Solapi 카카오 알림톡 연동 가이드

> **처음이신가요?** 단계별 체크리스트: [SOLAPI_QUICKSTART_KO.md](./SOLAPI_QUICKSTART_KO.md)

WizCoCo는 [Solapi](https://solapi.com) REST API로 카카오 알림톡을 발송합니다.  
이메일 실패(또는 미입력) 시 전화번호가 있으면 알림톡을 시도하고, 알림톡도 실패하면 SMS로 대체발송합니다.

---

## 1. 사전 준비 (Solapi 콘솔)

1. [Solapi](https://console.solapi.com) 가입 및 API Key·Secret 발급
2. **발신번호 등록** (`SOLAPI_SENDER`) — SMS 대체발송·`from` 필드에 사용
3. **카카오 비즈니스 채널** 연동 후 **pfId** 확인 (`SOLAPI_KAKAO_PF_ID`)
4. 아래 3종 **알림톡 템플릿**을 Solapi 콘솔에 등록·승인
5. 승인된 각 템플릿의 **templateId**를 GitHub Secrets에 저장

> `messages[].from`은 **발신 전화번호**(`SOLAPI_SENDER`)입니다. pfId는 `kakaoOptions.pfId`에만 넣습니다.

---

## 2. GitHub Secrets (Repository)

| Secret | 설명 |
|--------|------|
| `SOLAPI_API_KEY` | Solapi API Key |
| `SOLAPI_API_SECRET` | Solapi API Secret |
| `SOLAPI_SENDER` | 등록된 발신번호 (예: `01012345678`) |
| `SOLAPI_KAKAO_PF_ID` | 카카오 채널 pfId |
| `SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER` | 검사 미완료 리마인더 템플릿 ID |
| `SOLAPI_KAKAO_TEMPLATE_CARE` | 치료·과제 할당 템플릿 ID |
| `SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS` | 포털 자격증명(나의코드·PIN) 템플릿 ID |

등록 예시 (값은 본인 콘솔에서 확인):

```bash
gh secret set SOLAPI_API_KEY
gh secret set SOLAPI_API_SECRET
gh secret set SOLAPI_SENDER
gh secret set SOLAPI_KAKAO_PF_ID
gh secret set SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER
gh secret set SOLAPI_KAKAO_TEMPLATE_CARE
gh secret set SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS
```

`main` 브랜치에 푸시하면 `deploy-backend.yml`이 Cloud Run 환경 변수로 주입합니다.

---

## 3. 템플릿 문구 (변수명을 그대로 사용)

> **2차 반려 시:** 첫 문장에 **`접수하신`**·**`신청하신`** 등 카카오 예시 표현 필수. 변수 **예시값**도 입력.  
> 전문: [SOLAPI_ALIMTALK_TEMPLATES_COPY_KO.md](./SOLAPI_ALIMTALK_TEMPLATES_COPY_KO.md)

### 3-1. 검사 미완료 (`testReminder`)

**발송 시점:** 검사 참여 접수 후 미완료 시

```
안녕하세요 #{name}님,
고객님께서 접수하신 WizCoCo 심리검사가 아직 완료되지 않았습니다.

검사명: #{title}
미완료: #{pending}

이어서 진행: #{link}
```

### 3-2. 치료·과제 (`careAssignment`)

**발송 시점:** 서비스 이용 접수 내담자에게 상담사가 과제 등록 시

```
안녕하세요 #{name}님,
WizCoCo 상담·검사 서비스 이용을 접수하신 고객님께 안내드립니다.
담당 전문상담사가 등록한 치료·과제 안내입니다.

치료·과제명: #{title}

바로 보기: #{link}
```

### 3-3. 포털 자격증명 (`portalCredentials`)

**발송 시점:** 검사 참여 접수 후 접속 정보 발송 시

```
안녕하세요 #{name}님,
고객님께서 접수하신 WizCoCo 심리검사 참여에 대한 접속 정보입니다.

검사코드: #{joincode}
나의코드: #{mycode}
비밀번호: #{pin}

바로 시작: #{link}
```

---

## 4. 발송 우선순위

| 시나리오 | 순서 |
|----------|------|
| 검사 리마인더 / 케어 / 포털 자격증명 | 이메일 → 알림톡 → SMS |
| 알림톡 실패 시 | `disableSms: false`로 Solapi SMS 대체발송 시도 |
| SMS 단독 (Twilio 없음) | Solapi SMS (`SOLAPI_SENDER`) |

---

## 5. 테스트 API

관리자 Bearer 또는 `X-Notification-Cron-Secret` 헤더 필요.

### 채널 상태

```bash
curl "https://wizcoco-api-1088573742018.asia-northeast3.run.app/api/notifications/status"
```

### 템플릿 가이드 JSON

```bash
curl -H "X-Notification-Cron-Secret: YOUR_SECRET" \
  "https://wizcoco-api-1088573742018.asia-northeast3.run.app/api/notifications/alimtalk/templates"
```

### 테스트 발송

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Notification-Cron-Secret: YOUR_SECRET" \
  -d '{"template":"testReminder","phone":"01012345678","displayName":"홍길동"}' \
  "https://wizcoco-api-1088573742018.asia-northeast3.run.app/api/notifications/alimtalk/test"
```

`template` 값: `testReminder` | `careAssignment` | `portalCredentials`

---

## 6. 프론트 확인

상담사 **진행 현황** (`/counselor/progress`) 화면의 **알림 채널 상태** 카드에서  
이메일·SMS·알림톡(템플릿 3종) 설정 여부를 확인할 수 있습니다.

---

## 7. 트러블슈팅

| 증상 | 확인 사항 |
|------|-----------|
| `alimtalk_not_configured` | API Key·Secret·Sender·pfId·템플릿 ID Secret 누락 |
| `template_not_configured` | 해당 시나리오 템플릿 Secret 미등록 |
| 템플릿 거절 | 변수명 불일치, 또는 **발송 시점·수신자 행동**(`배정받으신` 등) 미기재 |
| 발송 실패 (from) | `SOLAPI_SENDER`가 Solapi에 등록·승인된 번호인지 확인 |
| pfId 오류 | `SOLAPI_KAKAO_PF_ID`가 채널과 일치하는지 확인 |

관련 코드: `backend/utils/solapi_client.py`, `backend/utils/kakao_alimtalk.py`, `backend/utils/notification_worker.py`
