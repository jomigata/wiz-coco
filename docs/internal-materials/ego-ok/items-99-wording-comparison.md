# 이고-오케이 99문항 — 문구 이력 비교

- **최초** 커밋: `9ce0f9c9` (99문항 뱅크 도입)
- **중간** 커밋: `00232c9c` (TA 1차 검토·VRIN 직전)
- **최종**: `items-99-source.tsv` (생활형·리커트 정렬 개정)

- 최초→중간 문항 변경: **98** / 99
- 중간→최종 문항 변경: **99** / 99

**엑셀:** [`items-99-wording-comparison.tsv`](./items-99-wording-comparison.tsv)

**열:** 번호 · 척도 · **구90·첨부** · 최초 · 중간 · 최종 · 비고 · **측정주제·기준점**

**구90·첨부:** `items-90.json`(2020 체크리스트 90) + 시트 하단 타당도(`items-checklist-attachment-validity-ko.json`·96/100 풀). 매칭: **척도코드** + **ego/ok 측정 주제**(또는 타당도는 주제 유사도).

**재생성:** `npm run generate:ego-ok-items-99-measurement-focus` 후 `npm run export:ego-ok-items-99-wording-comparison`

