# OK-Egogram 검사 결과 보고서 생성 규칙 (OK-Egogram Report Rules)

WizCoCo 상담사·내담자 보고서, CST/통합 척도, 자율치료·243+ 해석은 **본 문서와** [validity-100-changelog-ko.md](./validity-100-changelog-ko.md)를 함께 따른다.

## 추가·수정 권장 규칙 (TA · Micro-step)

1. **에너지 전환 법칙(Dusie Rule)** — 7~9단계(과함)를 억지로 깎기보다 **상반·보완 자아(NP↔CP, FC↔AC)를 올려 분산**. “CP를 줄이세요” 단독 금지, 대안 자아 행동 병행.
2. **A(성인) 수준별 솔루션 난이도** — A 1~3: **원터치 액션 1개**만. A 7~9: 계산·완벽주의 경고 + FC/NP 즉시 표현. A 4~6: 성찰·피드백.
3. **프로파일 형태(Contour)** — N·역N·V·M·평탄·복합 (`src/lib/egoOkEgogramContour.ts`) 3~4줄 **종합 역동 요약**을 성격특성 상단에 배치.
4. **비낙인(Non-Stigmatizing) 톤** — 1·9단계를 “결함”이 아니 **에너지 과몰입·잠정 휴지**로 서술, 성장·재배치 관점.

---

## 1. 에너지 9단계 기본 해석 및 조언

구간: **[부족 1~3] · [권장 4~6] · [과함 7~9]**. 목표는 **한 번에 1단계(Micro-step)** 이동.

| 단계 | 구간 | 서술·조언 요지 |
|------|------|----------------|
| 1 | 부족 | 고갈·미사용 — 일상 어려움 짚기 — 2단계용 **아주 사소한 행동 1개** |
| 2 | 부족 | 저하·위축 — 비효율 설명 — 3단계 실행 팁 |
| 3 | 부족 | 권장 직전 — 4단계 진입 행동 |
| 4 | 권장 | 안정 하단 — 유지 + 스트레스 시 3단계 하락 주의 |
| 5 | 권장 | **최적** — 유지·강점 활용 (이동 불필요) |
| 6 | 권장 | 상단 — 7단계 과잉 주의, 5단계 완화 |
| 7 | 과함 | 양면성 — 6단계 + **보완 자아** |
| 8 | 과함 | 번아웃·갈등 — 브레이크, 한 단계 하향 |
| 9 | 과함 | 과잉 집중 — **우회·분산**(상반 자아), 8단계 목표 |

구현 참고: `src/lib/egogramManualNineStage.ts`, `src/lib/egoOkCstBridgeEnergy.ts`

---

## 2. 자아 간 역동 규칙

### CP ↔ NP · FC ↔ AC

- **동시 과함:** 내적 갈등 → 스트레스 큰 쪽 1순위 완화, 다른 쪽 보완.
- **동시 부족:** 무기력 → **난이도 낮은 자아**부터 (NP·FC 등) 연쇄 상승.

### A(성인) 조율

- A 부족: 복잡 계획 금지, Trigger-Action 1개.
- A 과함: 즉시·불완전 시도, 감정·공감 표현.
- A 권장: 균형·성찰 질문.

구현: `buildCounselorPairAndAdultGuidance`, `EgoOkSelfHelpTherapyPanel`

---

## 3. 출력 포맷 · UI

1. **243+ 표기:** 알파벳(A/B/C) + **굵은 단계 숫자** — 숫자 색: 1~3 `#7dd3fc`, 4~6 `#34d399`, 7~9 `#f472b6` (`plus243StageDigitColor`). 컴ponent: `src/components/tests/egoOk/Plus243Display.tsx`
2. **성격특성:** 「종합 성격특성」— 단계 나열 생략, **특성·잘 쓰일 때·주의·곡선(Contour)·역동·복합 장단점** (`egoOkTraitOverviewSummary.ts`)
3. **보고서 구조:** [1] 프로파일 개요 [2] 5자아 심층 [3] CP-NP·FC-AC·A [4] 실천 3가지 (A 난이도 반영)

---

## 4. Cursor / 에이전트

- 보고서·상담 문구 작성 시 **본 파일 우선**.
- `.cursor/rules`에서 ego-ok 작업 시 `docs/internal-materials/ego-ok/ok-egogram-report-rules-ko.md` 링크 유지.

---

## 5. 검사 은행

- **99문항** (90 + 타당도 9): [items-99.json](./items-99.json), [validity-99-changelog-ko.md](./validity-99-changelog-ko.md)
- **100문항** (아카이브): [items-100.json](./items-100.json), [validity-100-changelog-ko.md](./validity-100-changelog-ko.md)
