# 규모·비용 — 현황 스냅샷 (TASK-000)

> 상세 실행 목록: [`scale-cost-roadmap-agent-tasks-ko.md`](./scale-cost-roadmap-agent-tasks-ko.md)

## 아키텍처 (2026)

| 계층 | prod | 로컬 dev |
|------|------|----------|
| UI | Firebase Hosting (`wiz-coco.web.app`) | Next `next dev` :3000 |
| API | Cloud Run (Flask) | Flask :5000 |
| DB | Firestore | Firestore Emulator :8080 |
| Auth | Firebase Auth | Auth Emulator :9099 |
| SMS | Solapi | `COST_SAVER_MODE=true` 스킵 |
| AI | Functions/Gemini | 로컬·saver 정책 |

## Firestore read 후보 핫스pot (우선 점검)

1. `backend/utils/assessment_dispatch.py` — `_collect_portals_for_assessment`, dispatch status 조립
2. `src/hooks/useAssessmentDispatchRealtime.ts` — `testResults` assessmentId 전체 `onSnapshot`
3. `src/components/counselor/AssessmentDispatchPanel.tsx` — 짧은 `setInterval`, Realtime enabled
4. `src/hooks/useCounselorTestResultsRealtime.ts`, `useCounselorMonitoringRealtime.ts`, `useCounselorCareRealtime.ts`
5. `src/contexts/FirebaseAuthContext.tsx` — `users` doc snapshot, heartbeat interval
6. `CounselorClientList` — expand 시 `fetchAssessmentDispatchStatus`

## 비용 트리거 (Postgres Phase 7)

- Firestore **월 30~50만 원+** (또는 read 급증)
- dispatch API **p95 > 2s**
- active counselors **> 100**

## GCP 예산 알림

- [Cloud Billing Budgets](https://console.cloud.google.com/billing/budgets) — ₩30k / ₩50k / ₩100k 단계
- 로컬 dev: [`local-dev-ko.md`](./local-dev-ko.md) · 배포 절감: [`gcp-cost-saver-ko.md`](./gcp-cost-saver-ko.md)

## After (TASK-080)

| 지표 | Before | After | 날짜 |
|------|--------|-------|------|
| dispatch API reads/req (limit=50) | N portals + bulk | **~limit + α** (ordered page query) | 2026-09-20 |
| Realtime default (상담진행) | ON (full testResults) | **OFF** + opt-in; scoped portalIds | 2026-09-20 |
| idle poll (progress) | 1–3s | 45s visible-only | 2026-09-20 |
| dispatch session cache TTL | 24h fresh gate | **45s** | 2026-09-20 |
| SMS duplicate enqueue | possible | 45s dedupe window | 2026-09-20 |
| prod AI_CREDITS_ENFORCE | false | **true** (Cloud Run deploy) | 2026-09-20 |
