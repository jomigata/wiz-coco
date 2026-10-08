# 이고-오케이 타당도 10문항(100문항 은행) 변경 요약

**적용일:** 2026-10 · **은행 ID:** `ego-ok-100` · **코드:** `src/lib/egoOkValidity.ts`, `docs/internal-materials/ego-ok/items-100.json`

## 1. 문항 수

| 구분 | 이전 (96) | 이후 (100) |
|------|-----------|------------|
| 성격·오케이 (척도 합산) | 90 | 90 (동일) |
| 타당도 | 6 | **10** (+4) |
| **합계** | 96 | **100** |

### 추가 타당도 문항 (97~100)

| No | scaleType | 목적 | 기대 응답 |
|----|-----------|------|-----------|
| 97 | validity_imc | 지시 따르기(2번) | B · 그렇지 않다 (2) |
| 98 | validity_lie | 사회적 바람직성 | 비현실적 완벽 진술 |
| 99 | validity_infreq | 비전형·비현실 | 비현실적 수면 진술 |
| 100 | validity_imc | 주의력·보통 선택 | C · 보통이다 (3) |

기존 타당도: 15·30·47·63·77·90 (6문항) 유지.

## 2. 채점·판정 변경

### IMC (반응 성실도)

- **4문항:** 30(E=1), 77(A=5), 97(B=2), 100(C=3)
- **판정:** 실패 0=정상, 1=주의, **2 이상=무효**
- **구 세션(96문항):** 97·100 미응답 시 해당 문항은 채점에서 **건너뜀** (하위 호환)

### L (사회적 바람직성)

- **3문항:** 15, 63, **98**
- **판정:** 원점수 합 / **실제 응답 문항 max** 비율  
  - ≥80% 무효 · ≥60% 주의

### F (비전형 왜곡)

- **3문항:** 47, 90, **99**
- **판정:** 원점수 비율 ≥60% 무효 · ≥40% 주의

### VRIN (일관성)

- **4쌍 유지** (3-39, 5-65, 23-60, 53-78)
- 쌍 중 하나라도 미응답이면 해당 쌍은 제외

## 3. 앱·저장소 반영 파일

| 파일 | 변경 |
|------|------|
| `docs/internal-materials/ego-ok/items-100.json` | canonical 100문항 |
| `scripts/sync-ego-ok-questions.mjs` | 100문항 생성 |
| `src/data/egoOkQuestions.ts` | sync 결과 |
| `src/lib/egoOkValidity.ts` | 10문항 타당도 로직 |
| `src/lib/egoOkScoring.ts` | 미응답 메시지 100문항 |
| `src/components/tests/MbtiProTest.tsx` | 제출 검증 문구 |
| `src/lib/egoOkReportScaleTaxonomy.ts` | 타당도 탭 메타 |
| `src/lib/egoOkCstBridgeScoring.ts` | 타당도 블록 문항 수 10 |

## 4. 운영

- 문항 JSON 수정 후: `node scripts/build-items-100.mjs`(필요 시) → `node scripts/sync-ego-ok-questions.mjs`
- 성격 90문항 집계 로직은 **변경 없음** (타당도만 증가)

## 5. 보고서·UI

- 타당도 탭: IMC/L/F 문항 번호 목록이 **동적으로** 10문항 체계 반영
- 종합 요약·CST 타당도(대분류 9): 10문항 기준 문구
