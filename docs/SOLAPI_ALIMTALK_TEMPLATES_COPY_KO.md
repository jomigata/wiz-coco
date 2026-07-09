# WizCoCo — Solapi 알림톡 템플릿 등록용 (복사·붙여넣기)

Solapi 콘솔 → **카카오톡** → **알림톡 템플릿** → **템플릿 등록**  
아래 3건을 **각각** 등록하세요. 변수명은 반드시 그대로 사용합니다.

---

## 템플릿 1 — 검사 미완료 리마인더

- **템플릿 이름(관리용):** WizCoCo 검사 미완료 안내
- **카테고리:** 기타 / 안내 (콘솔에서 가장 가까운 항목 선택)
- **변수:** `#{name}`, `#{title}`, `#{pending}`, `#{link}`

```
안녕하세요 #{name}님,
WizCoCo 심리검사 미완료 안내입니다.

검사명: #{title}
미완료: #{pending}

바로 시작: #{link}
```

승인 후 templateId → `SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER`

---

## 템플릿 2 — 치료·과제 할당

- **템플릿 이름:** WizCoCo 치료·과제 안내
- **변수:** `#{name}`, `#{title}`, `#{link}`

```
안녕하세요 #{name}님,
담당 전문가가 새 치료·과제를 할당했습니다.

#{title}

바로 보기: #{link}
```

승인 후 templateId → `SOLAPI_KAKAO_TEMPLATE_CARE`

---

## 템플릿 3 — 포털 자격증명 (나의코드·PIN)

- **템플릿 이름:** WizCoCo 검사 접속 안내
- **변수:** `#{name}`, `#{joincode}`, `#{mycode}`, `#{pin}`, `#{link}`

```
안녕하세요 #{name}님,
WizCoCo 검사 접속 안내입니다.

검사코드: #{joincode}
나의코드: #{mycode}
비밀번호: #{pin}

바로 시작: #{link}
```

승인 후 templateId → `SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS`

---

## 등록 시 주의

1. 변수는 `#{변수명}` 형식 — 공백·한글 변수명 금지
2. URL 변수 `#{link}`는 https:// 로 시작하는 링크에 매핑됩니다
3. 심사 반려 시: 문구와 변수 목록이 위와 **완전히 일치**하는지 확인
4. 템플릿 3종 모두 **승인 완료** 후 GitHub Secret 등록 (`npm run secrets:solapi`)
