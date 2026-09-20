# 규모·비용 로드맵 — 에이전트 순차 실행 체크리스트

> 기준 문서: 상담사·내담자 규모(대: ~500 / ~20만+), Firestore 40~300만+ 구간, Postgres 하이브리드, SMS·AI·Run 분리 통제.  
> **에이전트 규칙**: 아래 **Phase 순서**를 지킨다. 각 TASK는 **선행 TASK 완료** 후 시작. TASK 내 `- [ ]`를 모두 끝낸 뒤 다음 TASK로 이동.  
> **Git**: TASK 묶음(Phase 또는 논리 단위)마다 `git commit` (영어 메시지) → `git push origin HEAD`. 배포 필요 시 Actions 확인.

---

## Phase 0 — 기준선·관측 (선행 필수)

### TASK-000 — 로드맵·현황 스냅샷

- [ ] `docs/scale-cost-baseline-ko.md` 생성: 현재 아키텍처(Firestore, Cloud Run, Hosting, Solapi, Gemini), Emulator 로컬 dev 링크(`docs/local-dev-ko.md`), 비용 가드(`docs/gcp-cost-saver-ko.md`) 요약
- [ ] Firestore read/write **후보 핫스팟** 목록 고정 (아래 파일 경로를 baseline에 포함):
  - `backend/utils/assessment_dispatch.py` — `_collect_portals_for_assessment`, dispatch status
  - `src/hooks/useAssessmentDispatchRealtime.ts`
  - `src/hooks/useCounselorTestResultsRealtime.ts`
  - `src/hooks/useCounselorMonitoringRealtime.ts`, `useCounselorCareRealtime.ts`
  - `src/contexts/FirebaseAuthContext.tsx` — heartbeat, `onSnapshot(users)`
  - `src/components/counselor/AssessmentDispatchPanel.tsx` — `setInterval`
- [ ] GCP Billing 예산 알림 절차를 baseline에 1절로 기록 (Console 링크, 권장 금액 단계)

**완료 기준**: baseline 문서만으로 신규 에이전트가 “어디가 비용인지” 파악 가능.

---

### TASK-001 — 월간 운영 체크리스트 (1페이지)

- [ ] `docs/monthly-ops-checklist-ko.md` 생성
- [ ] 포함 항목: Firestore 사용량, Cloud Run 요청/CPU, Hosting, Secret Manager 버전 수, Solapi 건수, AI(Gemini) 호출/크레딧, `AUTO_DEPLOY_ON_PUSH` 상태, Emulator vs prod 데이터 정책
- [ ] “트리거 조건” 표: Firestore 월 30~50만+ → Postgres Phase 착수 검토

**완료 기준**: 운영자·에이전트가 월 1회 같은 항목 점검.

---

## Phase 1 — §1 Firestore/API P0 (최우선)

### TASK-010 — 상담진행 Realtime 기본 OFF + 옵트인 UI

**선행**: TASK-000

- [ ] `AssessmentDispatchPanel.tsx`: `useAssessmentDispatchRealtime` `enabled`를 **기본 false** (또는 `localStorage` / user pref, 기본값 false)
- [ ] UI: “실시간 갱신 켜기” 토글 + 설명( Firestore read 증가 )
- [ ] Realtime OFF일 때: **수동 새로고침** 버튼 유지·강화; 선택 시 `load({ silent: true })`만
- [ ] Realtime ON일 때만 기존 `onSnapshot(testResults)` 동작
- [ ] `npx tsc --noEmit`

**완료 기준**: 기본 진입 시 onSnapshot 미구독; 토글 ON 시만 Live.

**관련 파일**: `src/components/counselor/AssessmentDispatchPanel.tsx`, `src/hooks/useAssessmentDispatchRealtime.ts`

---

### TASK-011 — Realtime OFF 시 저빈도 폴링 (선택적 fallback)

**선행**: TASK-010

- [ ] Realtime OFF + 화면 포커스 시에만 **30~60초** interval poll (`document.visibilityState`), blur 시 clear
- [ ] interval **800ms/1s** dispatch panel 내부 sync는 **제거 또는 30s+** 로 상향 (TASK-012와 중복 제거)
- [ ] `npx tsc --noEmit`

**완료 기준**: progress 화면 장시간 방치 시 API/Firestore 호출이 초당이 아닌 분당 수준.

**관련 파일**: `AssessmentDispatchPanel.tsx` (setInterval 구간 grep)

---

### TASK-012 — Dispatch API 페이지네이션 (백엔드)

**선행**: TASK-000

- [ ] `GET` dispatch status API 설계: `limit`, `cursor` (portalId 또는 composite), `sort` 유지
- [ ] `backend/utils/assessment_dispatch.py` + `backend/routes/client_portals.py`(또는 assessments route) — **전량 `_collect_portals` 후 slice 금지**; 쿼리 limit + cursor
- [ ] 응답: `recipients`, `nextCursor`, `totalCount`(optional, 캐시/별도 count 쿼리 — 전량 read count는 P1)
- [ ] 인덱스: `firestore.indexes.json` 필요 시 추가
- [ ] Flask 단위 테스트 또는 기존 test 패턴으로 cursor 2페이지 검증
- [ ] `npx tsc --noEmit` (프론트 타입 동시 수정 시)

**완료 기준**: limit=50 요청 시 Firestore read가 **50+α** 수준(α는 테스트 join 상수), N 전량 아님.

---

### TASK-013 — Dispatch API 페이지네이션 (프론트)

**선행**: TASK-012

- [ ] `fetchAssessmentDispatchStatus` → cursor 파라미터 지원 (`src/lib/clientPortalApi.ts`)
- [ ] `AssessmentDispatchPanel`: 첫 페이지 로드 + “더 보기” 또는 페이지네이션 UI
- [ ] `useAssessmentDispatchRealtime`: **현재 페이지 portalIds** 만 merge 또는 Realtime OFF와 호환
- [ ] 세션 캐시 `counselorSessionCache` 정책 문서화·조정
- [ ] `npx tsc --noEmit`

**완료 기준**: 상담코드 내담 200명이어도 첫 화면은 50명만 로드.

---

## Phase 2 — §1 Firestore/API P1

### TASK-020 — Portal/Assessment 집계 필드 (denormalize)

**선행**: TASK-012 (페이지네이션 후에도 목록 read 줄이기)

- [ ] 스키마 설计: `clientPortals` 또는 `assessments`에 `dispatchSummary` (notifyStatus, testStatus, completedCount, requiredCount, updatedAt)
- [ ] write path 업데이트: 발송, 검사 완료, archive, move (`backend/utils/assessment_dispatch.py`, `notification_worker`, `results` 등)
- [ ] backfill 스크립트: `backend/scripts/backfill_portal_dispatch_summary.py` + `--dry-run`
- [ ] dispatch list API: 가능하면 **summary만** read, expand 시 tests 상세
- [ ] `firestore.rules` 검토 (필드 클라이언트 쓰기 금지 유지)

**완료 기준**: 목록 row 1명당 read **1문서 근처**로 감소(측정은 TASK-030).

---

### TASK-021 — Dispatch fetch 세션 캐시 TTL

**선행**: TASK-013

- [ ] `readCachedDispatchStatus` / `writeCachedDispatchStatus`: TTL 30~60초, assessmentId+uid 키
- [ ] 강제 갱신: 사용자 “새로고침”, mutation 후 `silent reload`
- [ ] `CounselorClientList` expand fetch 중복 호출 dedupe

**완료 기준**: 동일 화면 10초 내 재진입 시 네트워크 dispatch 호출 0~1회.

---

### TASK-022 — Realtime 범위 축소 (P1)

**선행**: TASK-010

- [ ] `useAssessmentDispatchRealtime`: assessmentId 전체 `testResults` → **화면에 있는 portalId 집합**만 where in (Firestore `in` 10개 제한 → 청크 구독 또는 portal별 doc listen 설계)
- [ ] `useCounselorTestResultsRealtime` / monitoring hooks: **enabled 플래그** + 상담사 목록 화면에서 불필요 구독 OFF
- [ ] `FirebaseAuthContext`: heartbeat **30s→60s+** 또는 탭 hidden 시 중지; `users` onSnapshot 필요성 재검토

**완료 기준**: grep `onSnapshot` 호출 경로마다 “언제 enabled” 주석·플래그.

---

## Phase 3 — §1 Firestore/API P2 + §4 Run

### TASK-030 — Firestore read 계측 (개발·스테이징)

**선행**: TASK-020 또는 TASK-013

- [ ] Flask middleware 또는 dispatch 진입점: **요청당 logical read count** 로그 (debug flag `LOG_FIRESTORE_READS=1`)
- [ ] 문서: baseline 대비 before/after 표 템플릿

**완료 기준**: dispatch API 1회 호출 시 로그에 read estimate 출력.

---

### TASK-031 — Cloud Run API 캐시 헤더

**선행**: TASK-021

- [ ] dispatch GET: `Cache-Control: private, max-age=30` (mutation 후 무효화는 클라이언트)
- [ ] ETag optional (P2)

**완료 기준**: 브라우저 repeat visit 시 304 또는 클라 cache hit 정책 문서화.

---

### TASK-032 — AssessmentDispatchPanel interval 정리

**선행**: TASK-011

- [ ] grep `setInterval` in counselor components — 2s poll은 **job 완료까지**만; 상시 poll 제거
- [ ] `IndividualAssessmentCreateForm` poll: max duration + backoff

**완료 기준**: idle 상태에서 5초 미만 interval 없음 (Realtime ON 제외).

---

## Phase 4 — §2 SMS (Solapi)

### TASK-040 — SMS 발송 가드·중복 방지

**선행**: TASK-001

- [ ] `notification_worker` / dispatch notify: 동일 portal+kind **짧은 시간 중복 enqueue** 차단
- [ ] 실패 재시도 **exponential backoff** (config 상수)
- [ ] `docs/sms-cost-policy-ko.md`: prod `COST_SAVER_MODE=false`만 실발송, dev true

**완료 기준**: 동일 버튼 연타 시 Solapi 1건 (또는 queue 1건).

---

### TASK-041 — SMS 모니터링 문서·(선택) admin 카운터

**선행**: TASK-040

- [ ] 월간 체크리스트에 Solapi 콘솔 링크·건수 기록란
- [ ] (선택) Firestore `monthlyUsage/sms` 카운터 increment on send

**완료 기준**: 운영자가 월 SMS 건수 추적 가능.

---

## Phase 5 — §3 AI (Gemini)

### TASK-050 — prod AI 크레딧 enforce

**선행**: TASK-001

- [ ] `deploy-backend.yml` / Cloud Run env: `AI_CREDITS_ENFORCE=true` (prod), staging false 유지 가능
- [ ] `backend/routes/ai_credits.py` + 호출부: 한도 초과 시 402/403 명확 메시지
- [ ] UI: 상담사 AI 잔량 표시 (있으면 강화)

**완료 기준**: 크레딧 0일 때 Gemini 경로 호출 불가.

---

### TASK-051 — AI 캐시·모델 tier

**선행**: TASK-050

- [ ] interpret/recommend 경로: **입력 해시 → Firestore or Redis cache** (TTL 7d) 설계·최소 1 feature 적용
- [ ] config: `GEMINI_MODEL_FAST` / `GEMINI_MODEL_DEEP` env
- [ ] `docs/ai-cost-policy-ko.md`: 기능별 AI on/off

**완료 기준**: 동일 프롬프트 2회째 cache hit 로그.

---

### TASK-052 — AI 사용 로그

**선행**: TASK-050

- [ ] `aiUsageLogs` 컬렉션 또는 structured log: uid, feature, tokensEstimate, at
- [ ] 월간 체크리스트 연동

**완료 기준**: feature별 집계 쿼리 1개 동작.

---

## Phase 6 — §5 개발·배포 프로세스 (이미 부분 적용 → 정합)

### TASK-060 — 로컬 dev 정합 검증

**선행**: 없음 (병렬 가능)

- [ ] `docs/local-dev-ko.md` ↔ `package.json` scripts 일치 확인
- [ ] `setup:local` Java check 동작
- [ ] `.env.local.example` / `backend/.env.local.example` 최신

**완료 기준**: 신규 클론 → setup:local → dev 성공 문서와 일치.

---

### TASK-061 — 배포 정책 문서 통합

**선행**: TASK-060

- [ ] `docs/gcp-cost-saver-ko.md`에 **로컬 daily / prod weekly** 배포 권장 명시
- [ ] `AUTO_DEPLOY_ON_PUSH` 변수 설명 + 에이전트 규칙 링크

**완료 기준**: 한 문서에서 dev vs prod 배포 읽기.

---

### TASK-062 — Emulator → prod 데이터 금지

**선행**: TASK-061

- [ ] `docs/local-dev-ko.md` “prod import 금지” + TASK-070 전까지 export는 backup만

**완료 기준**: 에이전트가 prod import 스크립트 작성하지 않도록 명시.

---

## Phase 7 — §1 Postgres 하이브리드 로드맵 (트리거 후)

> **착수 트리거** (하나라도 해당): Firestore 월 30~50만+ / dispatch p95 >2s / active counselors >100 / TASK-030 read count 목표 미달.

### TASK-070 — Postgres POC 설계 문서

**선행**: 트리거 충족 + TASK-012 완료

- [ ] `docs/postgres-hybrid-design-ko.md`: Neon vs Cloud SQL, 테이블 목록 (`client_portals_list`, `dispatch_recipients`, `test_results_summary`), dual-write vs read-replica
- [ ] 마이그레이션 **비**포함: Auth/Hosting Firebase 유지

**완료 기준**: PR 리뷰 가능한 ERD 수준.

---

### TASK-071 — SQL schema + migration v1

**선행**: TASK-070

- [ ] `backend/db/` or `migrations/` — PostgreSQL schema (portals list view table)
- [ ] docker-compose `postgres:16` 로컬 (Emulator **병행**, prod 아님)
- [ ] README: `DATABASE_URL` 로컬

**완료 기준**: `docker compose up` + migrate 성공.

---

### TASK-072 — Read path: dispatch list from SQL

**선행**: TASK-071

- [ ] feature flag `DISPATCH_LIST_SOURCE=firestore|postgres`
- [ ] Cloud Run env staging only postgres
- [ ] parity test: firestore vs postgres same counselor sample

**완료 기준**: staging flag postgres에서 UI 목록 동일.

---

### TASK-073 — Dual-write portals (선택)

**선행**: TASK-072 안정 2주

- [ ] portal create/update/archive → SQL + Firestore
- [ ] reconciliation job daily

**완료 기준**: SQL primary read, Firestore fallback.

---

### TASK-074 — Firestore read 축소 (SQL primary)

**선행**: TASK-073

- [ ] prod `DISPATCH_LIST_SOURCE=postgres`
- [ ] Firestore는 Auth, Functions, legacy fields only
- [ ] baseline 문서 업데이트

**완료 기준**: TASK-030 read count **50%+ 감소** (로그 증거).

---

## Phase 8 — §6·§7 종합 검증·롤아웃

### TASK-080 — 부하·비용 재측정

**선행**: Phase 1~3 TASK 핵심 (010, 012, 013, 021)

- [ ] `docs/scale-cost-baseline-ko.md`에 **After** 섹션: read/request/SMS/AI
- [ ] 미달 시 TASK-020, 022 재개

**완료 기준**: Before/After 표 채움.

---

### TASK-081 — 에이전트 실행 로그 (세션마다)

**선행**: 각 Phase 작업 시

- [ ] 커밋 메시지에 `TASK-0xx` 접두
- [ ] PR 또는 changelog `docs/scale-cost-changelog.md` 한 줄씩

**완료 기준**: TASK ID로 추적 가능.

---

## 의존성 요약 (에이전트 순서)

```text
Phase 0: 000 → 001
Phase 1: 010 → 011 → 012 → 013
Phase 2: 020 (012 후), 021 (013 후), 022 (010 후)
Phase 3: 030, 031 (021 후), 032 (011 후)
Phase 4: 040 → 041
Phase 5: 050 → 051, 052
Phase 6: 060 → 061 → 062  (병렬: Phase 1과 가능)
Phase 7: 070+ (트리거 후만)
Phase 8: 080 (Phase 1~3 후)
```

---

## 에이전트 세션 시작 템플릿

```text
1. docs/scale-cost-roadmap-agent-tasks-ko.md 에서 마지막 완료 TASK 확인
2. 다음 미완료 TASK 선택 (선행 TASK 완료 확인)
3. 해당 TASK `- [ ]` 전부 수행
4. npx tsc --noEmit (프론트/타입 변경 시)
5. backend 변경 시 관련 pytest/스크립트 dry-run
6. commit: "feat: TASK-0xx short description"
7. git push origin HEAD
8. TASK `- [ ]` → `- [x]` 이 문서에 반영 (같은 커밋 또는 docs follow-up)
```

---

## 범위外 (에이전트가 임의로 하지 않음)

- Emulator 데이터 **prod Firestore import**
- `AUTO_DEPLOY_ON_PUSH` 를 사용자 요청 없이 **true** 로 변경
- Firestore 전면 삭제 후 SQL-only **단일 커밋** (Phase 7 단계 없이)
- Solapi/Gemini **prod 키**를 repo에 커밋

---

## 관련 기존 문서

| 문서 | 용도 |
|------|------|
| `docs/local-dev-ko.md` | Emulator 로컬 dev |
| `docs/gcp-cost-saver-ko.md` | 배포·GCP 절감 |
| `docs/scale-cost-roadmap-agent-tasks-ko.md` | **본 체크리스트** |

---

*생성: 규모·비용 권고 1~7절 기준. TASK 완료 시 `- [x]`로 갱신.*
