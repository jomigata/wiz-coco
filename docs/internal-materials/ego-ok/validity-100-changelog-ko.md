# 이고-오케이 타당도 10문항(100문항 은행) 변경 요약

**적용일:** 2026-10 · **은행 ID:** `ego-ok-100` · **코드:** `src/lib/egoOkValidity.ts`, `docs/internal-materials/ego-ok/items-100.json`

## 1. 문항 수

| 구분 | 이전 (96) | 이후 (100) |
|------|-----------|------------|
| 성격·오케이 (척도 합산) | 90 | 90 (동일) |
| 타당도 | 6 | **10** (+4) |
| **합계** | 96 | **100** |

### 추가 타당도 문항 (분산 배치)

| 신 No | scaleType | 삽입 | 목적 |
|-------|-----------|------|------|
| 26 | validity_imc | 구 25 뒤 | B · 그렇지 않다 (2) |
| 52 | validity_lie | 구 50 뒤 | 비현실적 완벽 진술 |
| 78 | validity_infreq | 구 75 뒤 | 비현실적 수면 진술 |
| 100 | validity_vrin | 맨 끝 | 34번(호기심)과 대립 |

기존 타당도 6문항 → 신 번호: **15, 31, 48, 65, 80, 93**.  
번호표: [validity-100-item-order-ko.md](./validity-100-item-order-ko.md)

## 2. 채점·판정 변경

### IMC (반응 성실도)

- **3문항:** **26**(B=2), **31**(E=1), **80**(A=5)
- **판정:** 실패 0=정상, 1=주의, **2 이상=무효**

### L (사회적 바람직성)

- **3문항:** 15, **52**, **65** (구 63)
- **판정:** 원점수 합 / **실제 응답 문항 max** 비율  
  - ≥80% 무효 · ≥60% 주의

### F (비전형 왜곡)

- **3문항:** **48**, **78**, **93** (구 47·90)
- **판정:** 원점수 비율 ≥60% 무효 · ≥40% 주의

### VRIN (일관성)

- **5쌍:** **3-40**, **5-67**, **23-62**, **55-81**, **34-100** (마지막 쌍 = 호기심 대립)
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
