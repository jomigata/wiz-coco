# 월간 운영 체크리스트 (TASK-001)

매월 1회 (또는 배포 전) — 담당: 운영/에이전트.

## GCP · Firebase

- [ ] [Billing](https://console.cloud.google.com/billing) — 전월 총액 vs 예산
- [ ] Firestore — read / write / storage (Console → Firestore → Usage)
- [ ] Cloud Run — 요청 수, CPU-time
- [ ] Hosting — 전송량
- [ ] Secret Manager — secret **버전 수** (cleanup workflow 필요 시)
- [ ] Logging 보존 14일 유지

## Solapi · SMS

- [ ] Solapi 콘솔 — 발송 건수, 실패율
- [ ] prod `COST_SAVER_MODE=false` 확인 (실서비스만)

## AI

- [ ] Gemini / Functions 비용 또는 `counselorAiCredits` 소진
- [ ] `AI_CREDITS_ENFORCE` prod 의도대로 동작

## 배포 · dev

- [ ] `AUTO_DEPLOY_ON_PUSH` 의도 (dev: false 권장 / release: true)
- [ ] 로컬 개발은 `npm run dev` + Emulator (push 남발 없음)

## 데이터 정책

- [ ] Emulator 데이터 prod **import 하지 않음**
- [ ] 운영 데이터는 prod에서만 축적

## 트리거 → Postgres 로드맵

하나라도 해당 시 [`scale-cost-roadmap-agent-tasks-ko.md`](./scale-cost-roadmap-agent-tasks-ko.md) **Phase 7** 착수 검토:

- [ ] Firestore 월 **30~50만 원+**
- [ ] dispatch **p95 > 2s**
- [ ] active counselors **> 100**

## 메모

_월/년: ______ | 기록자: _______
