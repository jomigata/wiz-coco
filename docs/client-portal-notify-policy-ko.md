# 내담자 포털 알림 정책 (휴대·알림톡 기본)

## 요약

- **내담자** 코드·PIN·리마인더·과제 안내: **휴대폰(카카오 알림톡 → SMS)** + `/go/?c=` 단축 링크.
- **이메일 발송**: UI 숨김·API 차단 (기본). DB `email` 필드는 기록용으로 유지 가능.
- **SMTP**: 상담사 승인·B2C 문의 등 **시스템 메일** — 유지.

## 환경 변수

| 변수 | 기본 | 설명 |
|------|------|------|
| `CLIENT_PORTAL_NOTIFY_EMAIL` | `false` | `true` 시 legacy 이메일 발송 채널 복구 |
| `NEXT_PUBLIC_CLIENT_PORTAL_NOTIFY_EMAIL` | (미설정) | `true` 시 프론트 이메일 채널 UI 복구 |

## 운영

1. Solapi 알림톡·발신번호 prod 설정 — [SOLAPI_QUICKSTART_KO.md](./SOLAPI_QUICKSTART_KO.md)
2. **email-only** 기존 내담자: 연락처 수정으로 **휴대 11자리** 등록 후 발송
3. `/api/notifications/status` → `clientPortalEmailDispatch: false` 확인

## 롤백

Cloud Run·로컬 `.env`에 `CLIENT_PORTAL_NOTIFY_EMAIL=true` 및 (선택) `NEXT_PUBLIC_CLIENT_PORTAL_NOTIFY_EMAIL=true` 후 재배포.
