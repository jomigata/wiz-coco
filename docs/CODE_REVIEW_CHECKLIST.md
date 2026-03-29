# 코드·운영 점검 체크리스트 (Expert Team 기준 초안)

`TASK_STATUS.md`의 “Team Review”를 실행할 때 사용합니다. 항목마다 [ ]를 채우며 기록하세요.

## 보안

- [ ] 서비스 계정 JSON·장기 토큰이 Git·문서에 없음 ([SECURITY_CREDENTIALS.md](./SECURITY_CREDENTIALS.md))
- [ ] Firestore 보안 규칙이 클라이언트 직접 쓰기와 백엔드(Admin) 역할과 일치
- [ ] 상담사 API는 Firebase ID 토큰 검증 후에만 민감 데이터 반환
- [ ] 비밀번호·PII는 로그/이메일에 불필요하게 남지 않음

## 배포·환경

- [ ] GitHub Secrets에 `NEXT_PUBLIC_FLASK_API_URL` 등 프로덕션 필수 값 설정 ([FRONTEND_FLASK_INTEGRATION.md](./FRONTEND_FLASK_INTEGRATION.md))
- [ ] `deploy.yml` / `deploy-backend.yml` 최근 커밋이 녹색
- [ ] Cloud Run 서비스 `GET /api/health` 정상

## 프론트엔드 (Next 정적 export)

- [ ] 주요 사용자 경로(로그인, 검사 5종, 마이페이지) 브로큰 링크 없음
- [ ] LCP/CLS 등 성능 모니터 워크플로 알림 확인 ([performance-monitor.yml](../.github/workflows/performance-monitor.yml))
- [ ] 모바일 뷰포트에서 네비·폼 사용 가능

## 심리·콘텐츠

- [ ] 완료된 검사의 결과 문구가 진단·의학적 단정을 피하고 안내 문구(전문가 상담 권유 등) 포함
- [ ] “준비 중” 검사가 메뉴에 그대로 노출되지 않거나 명확히 표시됨

## 자동화

- [ ] `npm run deploy:auto` (또는 팀 표준)이 변경 시 의도대로 커밋/푸시 트리거
- [ ] [REPORTS.md](../REPORTS.md) 링크 최신

## 기록

- 검토일: ________  
- 검토자: ________  
- 조치 이슈 번호: ________
