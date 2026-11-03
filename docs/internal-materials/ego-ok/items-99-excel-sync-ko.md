# 99문항 Excel 동기화 (2026 설문지)

## 원본

- 저장소: `docs/internal-materials/ego-ok/이고-오케이 설문지 99문항.xlsx` (시트 `99문항`)
- 외부 원본 경로 예: `E:\02. 교류분석\TA\!! 2026 WizCoCo\분류중\243패턴\…`

## 한 번에 반영

```bash
npm run refresh:ego-ok-items-99-from-xlsx
```

1. `items-99-source.tsv` — `현척도코드` + `99 문항` (타당도 IMC 문구는 Likert A/E 라벨 정규화)
2. `items-99-scale-criteria-ko.json` — 척도기준점·활용팁·추가 활용팁
3. `items-99.json` → `src/data/egoOkQuestions.ts`
4. `items-99-measurement-focus-ko.json`

외부 xlsx만 수정한 경우:

```bash
set EGO_OK_99_XLSX=E:\path\to\file.xlsx
npm run refresh:ego-ok-items-99-from-xlsx
```

## 검사·채점

- 응답 척도: `src/lib/egoOkLikert.ts` (A~E, 1~5점 동일 가중)
- 척도 합·243/타당도: `egoOkScoring.ts`, `egoOkValidity.ts` (문항 **번호·scaleType 배치** 불변)

## 결과 보고

- **90문항 척도별 분석** 탭: Excel 척도기준점·활용팁 (`egoOkItemScaleCriteria.ts`)
