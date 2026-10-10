# 이고-오케이 타당도 9문항(99문항 은행) 변경 요약

**적용일:** 2026-10 · **은행 ID:** `ego-ok-99` · **코드:** `src/lib/egoOkValidity.ts`, `docs/internal-materials/ego-ok/items-99.json`

## 문항 수

- **99문항** = 성격 90 + 타당도 9 (VRIN 전용 문항·쌍 **없음**)
- 타당도 번호(오름차순): **9, 15, 26, 38, 48, 58, 68, 78, 88**

## 타당도 유형

| 유형 | 번호 | 채점 개요 |
|------|------|-----------|
| IMC | 9, 38, 68 | 현실·주의 문항 — **4점 미만**이면 IMC 실패 1건 |
| L | 15, 48, 88 | 평범한 경험 **인정** 문항 — **낮은 동의**일수록 L 점수 상승(역채점) |
| F | 26, 58, 78 | 비현실 진술 — **높은 동의**일수록 F 점수 상승 |

## 배치

- 약 10문항마다 타당도 1문항 교차(블록 인터리빙)
- 말미 97~99는 **일반 성격** 문항 (`i_plus`, `i_minus`, `u_minus`)

## 빌드

```bash
node scripts/build-items-99-final.mjs
npm run sync:ego-ok-questions
node scripts/export-items-99-excel.mjs
```
