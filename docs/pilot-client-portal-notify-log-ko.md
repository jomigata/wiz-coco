# 파일럿: 내담자 포털 휴대(알림톡) 전용 발송

**기간:** 2026-09-28 ~ 2026-10-12  
**prod baseline:** Hosting/API `8e285087` — `clientPortalEmailDispatch: false`

## Day 0 (2026-09-28)

| 항목 | 상태 |
|------|------|
| `/api/notifications/status` | `clientPortalEmailDispatch: false`, Solapi 3템플릿 OK |
| `git push origin main` | notify 정책 커밋 반영됨 |
| prod Hosting SHA | [build-version.json](https://wiz-coco.web.app/build-version.json) 와 일치 확인 |

## 주간 체크 (월·목 권장)

- [ ] Solapi 발송 실패·템플릿 거절 확인
- [ ] CS: 「메일 안 옴」→ [client-portal-notify-policy-ko.md](./client-portal-notify-policy-ko.md) 안내
- [ ] email-only 내담자: 연락처에 휴대 11자리 등록 후 재발송 건수 메모

## 1단계 스모크 잔여 (운영)

- [ ] prod 상담사 로그인 → 발송 UI에 **이메일 채널 없음**
- [ ] 테스트 휴대 1건 발송 → 알림톡 수신, **이메일 미수신**, `/go/?c=` 또는 코드 로그인

## 종료 미팅 (10/13 전후)

P3 백로그: email-only 배지, 발송 UI 라벨, 잔여 공개 카피, (선택) 템플릿 변수 정렬.
