# 작업 계획 1~5 — 세부 내역 및 진행 체크리스트

이 문서는 이전에 제안한 5가지 작업 권장 사항을 **실행 가능한 하위 작업**으로 쪼갠 것입니다. 완료 시 체크박스를 갱신하세요.

---

## 1. 변경분 정리·배포 검증

| # | 하위 작업 | 담당/비고 | 완료 |
|---|-----------|-----------|------|
| 1.1 | `deploy-backend.yml`, `backend/README.md`, `docs/DEPLOY_CLOUD_RUN.md` diff 검토 | 로컬 | [ ] |
| 1.2 | 위 파일 + `CODE_REVIEW_CHECKLIST.md`, `TASK_STATUS.md`, `REPORTS.md`, `backend/README.md`, `.gitignore`, `Firebase_GitHub/README.md` 스테이징 | 로컬 | [ ] |
| 1.3 | 커밋 (메시지 예: `docs: add work plan, flask integration, and credential hygiene`) | 로컬 | [ ] |
| 1.4 | `main` 푸시 후 [GitHub Actions](https://github.com/jomigata/wiz-coco/actions)에서 **Deploy WizCoCo**·**Deploy Flask API** 성공 확인 | 원격 | [ ] |
| 1.5 | 백엔드 실패 시 `PERMISSION_DENIED: artifactregistry...` → [DEPLOY_CLOUD_RUN.md](./DEPLOY_CLOUD_RUN.md)대로 IAM 역할 추가 후 Re-run | GCP | [ ] |

> **참고:** Cursor 샌드박스 등에서 `git`이 없을 수 있으므로 1.2~1.3은 개발 PC에서 실행합니다.

---

## 2. TASK_STATUS 후속 (리뷰·자동화·원클릭)

| # | 하위 작업 | 산출물 | 완료 |
|---|-----------|--------|------|
| 2.1 | 코드베이스 대비 점검표 실행 | [CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md) | [ ] |
| 2.2 | UI/UX·심리 콘텐츠 개선 후보를 이슈 또는 `TASK_STATUS.md`에 bullet로 기록 | — | [ ] |
| 2.3 | `npm run deploy:auto`가 현재 환경에서 동작하는지 확인 (변경 없으면 스킵 로그 확인) | — | [ ] |
| 2.4 | [REPORTS.md](../REPORTS.md)의 원클릭 링크가 모두 유효한지 1회 클릭 검증 | — | [ ] |

---

## 3. 프론트–Flask API 연동 명확화

| # | 하위 작업 | 완료 |
|---|-----------|------|
| 3.1 | [FRONTEND_FLASK_INTEGRATION.md](./FRONTEND_FLASK_INTEGRATION.md) 읽고, GitHub Secret `NEXT_PUBLIC_FLASK_API_URL`에 Cloud Run URL 설정 여부 확인 | [ ] |
| 3.2 | Secret 미설정 시 프로덕션에서 `assessmentApi`가 `wiz-coco.web.app` 오리진으로 호출함 → 404 가능성 인지; URL 설정 또는 Hosting 프록시 중 택일 | [ ] |
| 3.3 | Flask `CORS_ORIGINS`에 프론트 도메인 포함 확인 | [ ] |

---

## 4. 운영·보안

| # | 하위 작업 | 완료 |
|---|-----------|------|
| 4.1 | 로컬 키는 `*.json` gitignore로 제외; `Firebase_GitHub/README.md`로 안내 | [x] |
| 4.2 | `docs/current-firebase-tokens.md`에서 실제 토큰·JSON 제거(플레이스홀더 문서로 전환) | [x] |
| 4.3 | 과거 키가 공개된 적이 있다면 Firebase/GCP에서 **키 폐기·재발급** | [ ] |
| 4.4 | `next.config.js`에 하드코딩된 `NEXT_PUBLIC_FIREBASE_*` — 장기적으로는 Secrets·빌드 주입만 쓰도록 이슈화 | [ ] |

---

## 5. 제품·검사 구현 백로그 (`검사_전체_목록_및_상태.md` 기준)

2025-11-06 보고서 요약: 메뉴 검사 88개 중 **완전 구현 5개**, 다수는 페이지만 존재.

### 우선 제안 (가치 대비)

| 순위 | 항목 | 비고 |
|------|------|------|
| P1 | 메뉴에 노출된 검사 중 **미구현 54개** — 노출 정리(숨김) 또는 “준비 중” 처리로 기대치 통일 | UX 혼선 감소 |
| P2 | **부분 구현 29개** 중 상담·교육 시나리오에 필요한 것부터 질문 데이터·결과 로직 보강 | |
| P3 | 관리자·상담사 플로우와 검사 ID·검사코드 목록 동기화 (Flask `testList`와 프론트 메뉴) | |
| P4 | 접근성(키보드·스크린리더)·모바일 레이아웃 공통 점검 | [CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md)와 연계 |

### 완전 구현된 5개 (유지보수)

- `/tests/mbti_pro`, `/tests/mbti`, `/tests/ai-profiling`, `/tests/integrated-assessment`, `/tests/inside-mbti`

상세 목록·파일 경로는 저장소 루트 `검사_전체_목록_및_상태.md`를 기준으로 합니다.

---

## 문서 링크

- [REPORTS.md](../REPORTS.md) — 대시보드·원클릭
- [TASK_STATUS.md](../TASK_STATUS.md) — 전체 태스크 트래킹
- [DEPLOY_CLOUD_RUN.md](./DEPLOY_CLOUD_RUN.md) — Cloud Run IAM
