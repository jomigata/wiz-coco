# 99문항 문장 확정 (2026-10)

- **2026-10-22:** 개정 90문항 일괄 반영 — `npm run apply:ego-ok-90-revised-to-99` → [`items-90-revised-review.tsv`](./items-90-revised-review.tsv) + [`items-90-revised-confirmed-overrides.json`](./items-90-revised-confirmed-overrides.json) → `items-99-source.tsv` (타당도 9·제시순서 유지). 매핑 로그: [`items-90-apply-to-99-log.tsv`](./items-90-apply-to-99-log.tsv)
- **원본 TSV:** `items-99-source.tsv` — 검사 화면 순서 1~99와 동일
- **반영:** `npm run build:ego-ok-items-99` → `items-99.json`, `src/data/egoOkQuestions.ts`
- **엑셀 6열:** `npm run export:ego-ok-items-99-excel` → [items-99-excel-export.tsv](./items-99-excel-export.tsv) · [items-99-excel-export.md](./items-99-excel-export.md)
- **일괄 적용 스크립트:** `scripts/patch-items-99-wording-2026-10.mjs` (재실행 시 동일 문구로 덮어씀)

검사 UI 하단 **이전/다음** 버튼: `MbtiProTest.tsx` (EGO_PROFESSIONAL — 활성 라벨 `text-gray-400`).

## 종료 구간 순서 (인접 유사도 완화)

| 변경 | 내용 | 결과 |
|------|------|------|
| **93↔99** | FC+ 「호기심·상상력…」 ↔ U− 「화가 나면…」 | 93=U−, 99=FC+ |
| **97↔98** | I+ 「낙담하지 않고…」 ↔ I− 「결정 확신 어려…」 | 97=I−, 98=I+ |

92번 NP−(딱해 보이면…)은 유지. 타당도 9문항 번호는 유지. **VRIN 5쌍**은 개정 90문항 반영 후 **4↔81**, **7↔26**으로 조정(구 34↔56, 33↔26). 상세: `validity-99-changelog-ko.md`.

### TA 검사 화면 문항 표시 (2026-10-22)

1. 문장당 **쉼표(, )는 1개** 권장(26번 F 문항은 나열은 **·** 로 처리).
2. **쉼표 뒤 줄바꿈** — 화면에서 **3줄 이상**이 되면 쉼표 줄바꿈을 쓰지 않고 **2줄·단어(공백) 경계**로 나눔. 코드: `egoOkQuestionReading.tsx`, `egoOkQuestionBreaks.ts`.
3. 문항 원문·검토 비고 4열 TSV: `items-99-review-list.tsv` (`npm run export:ego-ok-items-99-review-list`).

### 이고·오케이 문체 정렬 (2026-10-22)

- **이고(cp·np·a·fc·ac):** 말·행동·표현·대처·반응 중심 (`~하곤 한다`, `~드러내곤 한다`).
- **오케이(U±·I±):** 생각·느낌·믿음·마음속 기준 (`~생각한다`, `~느낀다`, `~여긴다`).
- **타당도 9:** IMC·L는 **사실/경험 인정**, F는 **비현실 주장**으로 극단(매우 그렇다 / 전혀 그렇지 않다) 선택이 분명하도록 문장 확고화.

### TA 생활형 문장 전면 정렬 (2026-10-22)

- 원칙: 평서문·일상어·주제 명확·리커트 5점에 맞는 강도, 문장당 쉼표 1개 권장.
- **구90·첨부 / 최초 / 중간 / 최종** 비교 TSV(8열): `items-99-wording-comparison.tsv` — `npm run export:ego-ok-items-99-wording-comparison` (선행: `npm run generate:ego-ok-items-99-measurement-focus`). **구90·첨부** = `items-90.json` + 시트 하단 타당도(`items-checklist-attachment-validity-ko.json`), **척도코드·ego/ok 측정 주제** 매칭.
  - 최초: `9ce0f9c9`, 중간: `00232c9c`, 최종: `items-99-source.tsv`
- 비고(일상어): `items-99-notes-plain-ko.json`

## 검사 화면 줄바꿈 (2줄 가독성)

| 단계 | 규칙 |
|------|------|
| **원본 TSV** | 문장은 **한 줄**. 예외적으로 `@` → `\n` (수동 고정). |
| **자동 (`wrapReadingText`)** | **41자 이상**이면 **2줄**( `\n` 1개). **쉼표 `, `가 1개뿐**이면 (53번 등) **항상 그 쉼표 뒤**에서 줄바꿈(줄당 42자 초과 시만 공백 균형 분할). **쉼표 2개 이상**이면 줄당 42자 이내가 되는 **`, ` 후보** 중 양쪽 글자 수 차이가 가장 작은 곳. **3줄**이 될 경우 쉼표 대신 **공백 균형** 2줄. |
| **앱 표시** | `EgoOkQuestionReading`: 저장 `\n` + **ResizeObserver**. 한 줄로 저장된 문항(예 **68**)은 폭이 줄어 **2줄**로 감기면 `, ` **1개**는 그 쉼표 뒤 `\n`, **여러 개**는 2줄·42자 이내 균형 쉼표. 고정 `\n`이 **3줄** 이상이면 `\n` 제거 후 동일 규칙. 점검: `node scripts/audit-ego-ok-flow-comma-items.mjs` |

## 쉼표·줄바꿈 (2026-10 추가)

- **3:** `…아끼고 긍정적으로…` (쉼표 1개)
- **41:** 「함께할 때,」 쉼표 삭제 → `…맞추며, 손발을…`
- **87:** `존중받아야 할, 소중한…`
- **단일 쉼표 + 2줄:** 빌드 규칙으로 전 문항 `,` 직후 줄바꿈 (예 53)
