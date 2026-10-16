# 99문항 문장 확정 (2026-10)

- **원본 TSV:** `items-99-source.tsv` — 검사 화면 순서 1~99와 동일
- **반영:** `npm run build:ego-ok-items-99` → `items-99.json`, `src/data/egoOkQuestions.ts`
- **일괄 적용 스크립트:** `scripts/patch-items-99-wording-2026-10.mjs` (재실행 시 동일 문구로 덮어씀)

검사 UI 하단 **이전/다음** 버튼: `MbtiProTest.tsx` (EGO_PROFESSIONAL 전용 밝기 규칙).
