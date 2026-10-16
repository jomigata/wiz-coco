# 99문항 문장 확정 (2026-10)

- **원본 TSV:** `items-99-source.tsv` — 검사 화면 순서 1~99와 동일
- **반영:** `npm run build:ego-ok-items-99` → `items-99.json`, `src/data/egoOkQuestions.ts`
- **일괄 적용 스크립트:** `scripts/patch-items-99-wording-2026-10.mjs` (재실행 시 동일 문구로 덮어씀)

검사 UI 하단 **이전/다음** 버튼: `MbtiProTest.tsx` (EGO_PROFESSIONAL — 활성 라벨 `text-gray-400`).

## 종료 구간 순서 (인접 유사도 완화)

| 변경 | 내용 | 결과 |
|------|------|------|
| **93↔99** | FC+ 「호기심·상상력…」 ↔ U− 「화가 나면…」 | 93=U−, 99=FC+ |
| **97↔98** | I+ 「낙담하지 않고…」 ↔ I− 「결정 확신 어려…」 | 97=I−, 98=I+ |

92번 NP−(딱해 보이면…)은 유지. 타당도·VRIN 고정 번호 변경 없음.
