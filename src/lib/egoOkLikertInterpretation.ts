import { EGO_OK_LIKERT_MAX, EGO_OK_LIKERT_MIN, EGO_OK_LIKERT_OPTIONS } from '@/lib/egoOkLikert';
import type { EgoScaleId } from '@/lib/egoOkScoring';

/** 선택지 값(1~5) → 화면과 동일한 짧은 라벨 */
export function likertLabelForValue(value: number): string {
  const v = Math.round(value);
  const opt = EGO_OK_LIKERT_OPTIONS.find((o) => o.value === v);
  if (opt) return `${opt.letter} ${opt.labelLines.join(' ')}`;
  if (v <= EGO_OK_LIKERT_MIN) return 'E 거의 그렇지 않다';
  if (v >= EGO_OK_LIKERT_MAX) return 'A 거의 항상 그렇다';
  return `${v}점`;
}

/** 보고서·상담 공통 — 5점 척도 한 줄 요약 */
export const EGO_OK_LIKERT_SCALE_ONE_LINER =
  'A 거의 항상 그렇다(5) · B 자주 그렇다(4) · C 보통 그렇다(3) · D 가끔 그렇다(2) · E 거의 그렇지 않다(1)';

/** 문항별 점수 = 선택 번호와 동일 (구 6점 저장분만 5로 환산) */
export const EGO_OK_ITEM_SCORING_NOTE =
  '각 문항은 위 5지선다를 고른 값 그대로 1~5점으로 합산합니다(과거 6점 저장값은 5점으로만 환산).';

/** 긍정·부정 문항 의미 */
export const EGO_OK_POSITIVE_ITEM_MEANING =
  '「긍정」5문항: 해당 척도의 건설적·바람직한 쪽 행동·태도에 대한 진술입니다. 「거의 항상 그렇다」에 가깝게 답할수록 긍정 합·긍정 %가 커집니다.';

export const EGO_OK_NEGATIVE_ITEM_MEANING =
  '「부정」5문항: 같은 척도의 경직·과잉·회피 등 주의가 필요한 쪽 진술입니다. 「그렇다」 쪽(특히 A·B)에 가깝게 답할수록 부정 합·부정 %가 커집니다.';

export const EGO_OK_POLARITY_FORMULA =
  '긍정 % = 긍정 5문항 점수 합 ÷ (긍정 합 + 부정 합) × 100 · 부정 % = 100 − 긍정 %(반올림). 각 합은 5~25점(문항당 1~5).';

const SCALE_POLE_HINT: Record<EgoScaleId, { positive: string; negative: string }> = {
  CP: {
    positive: '원칙·책임·기준을 건강하게 쓰는 CP',
    negative: '비판·통제·독선 쪽 CP',
  },
  NP: {
    positive: '돌봄·격려·공감 NP',
    negative: '과보호·희생·거절 guilt NP',
  },
  A: {
    positive: '사실·분석·중재 A',
    negative: '냉정·감정 단절·과잉 이성화 A',
  },
  FC: {
    positive: '창의·유희·진솔한 표현 FC',
    negative: '충동·회피·무모한 즉흥 FC',
  },
  AC: {
    positive: '협력·예의·조화 AC',
    negative: '과순응·억압·자기비하 AC',
  },
};

export type EgogramPolarityLikertExplain = {
  positivePctExplain: string;
  negativePctExplain: string;
  scaleContext: string;
};

/** 긍·부정 %와 원점수에 대한 Likert 기준 설명 */
export function explainEgogramPolarityLikert(
  scaleId: EgoScaleId,
  positiveRaw: number,
  negativeRaw: number,
  positivePct: number,
  negativePct: number,
): EgogramPolarityLikertExplain {
  const hint = SCALE_POLE_HINT[scaleId];
  const total = positiveRaw + negativeRaw;
  return {
    scaleContext: `${scaleId}: 긍정 문항은 ${hint.positive}, 부정 문항은 ${hint.negative}을 가리킵니다.`,
    positivePctExplain:
      total > 0
        ? `긍정 ${positivePct}% — 긍정 5문항 합 ${positiveRaw}점이 전체 ${total}점 중 차지하는 비중입니다. 높을수록 긍정 진술에 동의(그렇다 쪽)가 많습니다.`
        : '긍정 % — 응답 데이터 없음',
    negativePctExplain:
      total > 0
        ? `부정 ${negativePct}% — 부정 5문항 합 ${negativeRaw}점의 비중입니다. 높을수록 부정 진술에 동의가 많아, ${scaleId}의 주의·대책 구간 해석에 반영됩니다.`
        : '부정 % — 응답 데이터 없음',
  };
}

/** 타당도·VRIN 등 임계 설명용 (3점 = C 보통 그렇다) */
export function likertThresholdPhrase(atMost: number): string {
  return `${atMost}점 이하(${likertLabelForValue(atMost)} 이하)`;
}

export function likertThresholdPhraseAtLeast(atLeast: number): string {
  return `${atLeast}점 이상(${likertLabelForValue(atLeast)} 이상)`;
}

/** 99문항 타당도 표 — 구간 설명(5지선다와 동일) */
export const EGO_OK_VALIDITY_BANDS_99 = {
  imc: [
    `정상: ${likertThresholdPhrase(3)} 0개`,
    `주의: ${likertThresholdPhrase(3)} 1개`,
    `무효: ${likertThresholdPhrase(3)} 2개 이상`,
  ],
  lie: [
    `정상: ${likertThresholdPhrase(2)} 0–1개`,
    `주의: ${likertThresholdPhrase(2)} 2개 (도덕적 포장)`,
    '— (L 단독 무효 없음)',
  ],
  infreq: [
    `정상: ${likertThresholdPhraseAtLeast(3)} 0–1개`,
    `주의: ${likertThresholdPhraseAtLeast(3)} 1개`,
    `무효: ${likertThresholdPhraseAtLeast(3)} 2개 이상`,
  ],
} as const;

/** 오케이 10문항 척도(U±, I±) — 긍·부 분할 없음 */
export const EGO_OK_OKGRAM_SCORING_NOTE =
  '오케이 U+/U−/I+/I−는 각 10문항 합(10~50점)입니다. 문항마다 「나/타인에 대한 태도」 진술에 대한 동의 정도를 1~5점으로 더합니다.';

/** 보고서 상단·KTAA 등에 넣을 방법론 블록 (문단 배열) */
export function egoOkReportMethodologyParagraphs(): string[] {
  return [
    `응답 척도(전 문항 동일): ${EGO_OK_LIKERT_SCALE_ONE_LINER}.`,
    EGO_OK_ITEM_SCORING_NOTE,
    EGO_OK_POSITIVE_ITEM_MEANING,
    EGO_OK_NEGATIVE_ITEM_MEANING,
    EGO_OK_POLARITY_FORMULA,
    EGO_OK_OKGRAM_SCORING_NOTE,
  ];
}
