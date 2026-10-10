import { EGO_OK_ITEM_BANK_ID } from '@/data/egoOkQuestions';
import { likertToItemPoints } from '@/lib/egoOkScoring';
import { formatItemRefs, formatVrinPairRef } from '@/lib/egoOkValiditySummaries';

export type ValidityTraffic = 'normal' | 'caution' | 'invalid';

export type ValidityScaleStatus = 'normal' | 'caution' | 'invalid';

export type ValidityCounselorNote = {
  label: string;
  body: string;
};

export const VALIDITY_SCALE_LABELS = {
  imc: '1. 반응 성실도 (IMC)',
  lie: '2. 사회적 바람직성 (L)',
  infreq: '3. 비전형 왜곡 (F)',
  vrin: '4. 일관성 (VRIN)',
} as const;

export type EgoOkValidityProfile = {
  overall: ValidityTraffic;
  overallTitle: string;
  overallSummary: string;
  imc: {
    itemNos: number[];
    failCount: number;
    status: ValidityScaleStatus;
    detail: string;
    /** 정상 외 — 측정 문항 키워드 요약 */
    issueBrief?: string;
  };
  lie: {
    itemNos: number[];
    raw: number;
    max: number;
    status: ValidityScaleStatus;
    detail: string;
    issueBrief?: string;
  };
  infreq: {
    itemNos: number[];
    raw: number;
    max: number;
    status: ValidityScaleStatus;
    detail: string;
    issueBrief?: string;
  };
  vrin: {
    pairCount: number;
    mismatchPairs: number;
    maxPairs: number;
    status: ValidityScaleStatus;
    detail: string;
    issueBrief?: string;
  };
  counselorNotes: ValidityCounselorNote[];
};

/** ego-ok-100: 지시형 IMC (정확 응답) */
const IMC_CHECKS_100: { no: number; expected: number }[] = [
  { no: 26, expected: 1 },
  { no: 18, expected: 5 },
  { no: 34, expected: 2 },
];

const LIE_ITEMS_100 = [44, 64, 69] as const;
const INFREQ_ITEMS_100 = [72, 80, 93] as const;

/** ego-ok-99: 첨부 채점 공식 — IMC 3점 이하, F 3점 이상, L 2점 이하 (2문항↑) */
const IMC_ITEMS_99 = [9, 38, 68] as const;
const LIE_ITEMS_99 = [15, 48, 88] as const;
const INFREQ_ITEMS_99 = [26, 58, 78] as const;

const IMC_LOW_MAX_99 = 3;
const INFREQ_HIGH_MIN_99 = 3;
const LIE_LOW_MAX_99 = 2;
const VALIDITY_HIT_INVALID_MIN_99 = 2;

/** 99문항: 성격·타당도 대립 5쌍 (100문항 VRIN 논리를 신번호에 재매핑) */
export const EGO_OK_VRIN_PAIRS_99: [number, number][] = [
  [3, 49],
  [5, 60],
  [11, 46],
  [34, 56],
  [33, 26],
];

export const EGO_OK_VRIN_PAIRS: [number, number][] =
  EGO_OK_ITEM_BANK_ID === 'ego-ok-99'
    ? EGO_OK_VRIN_PAIRS_99
    : [
        [3, 40],
        [5, 67],
        [23, 62],
        [55, 81],
        [33, 100],
      ];

function answerByNo(answers: Record<string, number>, no: number): number | undefined {
  const index = no - 1;
  const v = answers[String(index)] ?? answers[index];
  return v === undefined ? undefined : v;
}

function statusRank(s: ValidityScaleStatus): number {
  if (s === 'invalid') return 2;
  if (s === 'caution') return 1;
  return 0;
}

function worst(a: ValidityScaleStatus, b: ValidityScaleStatus): ValidityScaleStatus {
  return statusRank(a) >= statusRank(b) ? a : b;
}

function pairMismatch(answers: Record<string, number>, aNo: number, bNo: number): boolean {
  const a = answerByNo(answers, aNo);
  const b = answerByNo(answers, bNo);
  if (a === undefined || b === undefined) return false;
  return a >= 4 && b >= 4;
}

function sumLikertPoints(answers: Record<string, number>, itemNos: readonly number[]): { raw: number; max: number } {
  let raw = 0;
  let max = 0;
  for (const no of itemNos) {
    const a = answerByNo(answers, no);
    if (a === undefined) continue;
    raw += likertToItemPoints(a);
    max += 5;
  }
  return { raw, max };
}

function computeImcFor100(answers: Record<string, number>) {
  let imcFails = 0;
  let imcAnswered = 0;
  for (const { no, expected } of IMC_CHECKS_100) {
    const a = answerByNo(answers, no);
    if (a === undefined) continue;
    imcAnswered += 1;
    if (a !== expected) imcFails += 1;
  }
  const status: ValidityScaleStatus =
    imcFails >= 2 ? 'invalid' : imcFails >= 1 ? 'caution' : imcAnswered === 0 ? 'caution' : 'normal';
  return {
    itemNos: IMC_CHECKS_100.map((c) => c.no),
    failCount: imcFails,
    status,
    detail: `지시 응답 실패 2개 이상 무효 · 1개 주의 (3문항 IMC: ${IMC_CHECKS_100.map((c) => c.no).join('·')})`,
    issueBrief: undefined,
  };
}

function flaggedImcNos99(answers: Record<string, number>): number[] {
  return IMC_ITEMS_99.filter((no) => {
    const a = answerByNo(answers, no);
    return a !== undefined && a >= 1 && a <= IMC_LOW_MAX_99;
  });
}

function computeImcFor99(answers: Record<string, number>) {
  const flagged = flaggedImcNos99(answers);
  const imcFails = flagged.length;
  const status: ValidityScaleStatus =
    imcFails >= VALIDITY_HIT_INVALID_MIN_99
      ? 'invalid'
      : imcFails >= 1
        ? 'caution'
        : 'normal';
  const issueBrief =
    imcFails > 0
      ? `현실·주의 반응 이상 — ${formatItemRefs(flagged)}에 3점 이하(무성의·부정)`
      : undefined;
  return {
    itemNos: [...IMC_ITEMS_99],
    failCount: imcFails,
    status,
    detail: `3점 이하 ${VALIDITY_HIT_INVALID_MIN_99}개 이상 무효 · 1개 주의 (IMC: ${IMC_ITEMS_99.join('·')})`,
    issueBrief,
  };
}

function flaggedInfreqNos99(answers: Record<string, number>): number[] {
  return INFREQ_ITEMS_99.filter((no) => {
    const a = answerByNo(answers, no);
    return a !== undefined && a >= INFREQ_HIGH_MIN_99;
  });
}

function computeInfreqFor99(answers: Record<string, number>) {
  const flagged = flaggedInfreqNos99(answers);
  const hits = flagged.length;
  const status: ValidityScaleStatus =
    hits >= VALIDITY_HIT_INVALID_MIN_99 ? 'invalid' : hits >= 1 ? 'caution' : 'normal';
  const issueBrief =
    hits > 0
      ? `비현실·과장 동의 — ${formatItemRefs(flagged)}에 3점 이상`
      : undefined;
  return {
    itemNos: [...INFREQ_ITEMS_99],
    raw: hits,
    max: VALIDITY_HIT_INVALID_MIN_99,
    status,
    detail: `3점 이상 ${VALIDITY_HIT_INVALID_MIN_99}개 이상 무효 · 1개 주의 (F: ${INFREQ_ITEMS_99.join('·')})`,
    issueBrief,
  };
}

function flaggedLieNos99(answers: Record<string, number>): number[] {
  return LIE_ITEMS_99.filter((no) => {
    const a = answerByNo(answers, no);
    return a !== undefined && a >= 1 && a <= LIE_LOW_MAX_99;
  });
}

function computeLieFor99(answers: Record<string, number>) {
  const flagged = flaggedLieNos99(answers);
  const hits = flagged.length;
  const status: ValidityScaleStatus =
    hits >= VALIDITY_HIT_INVALID_MIN_99 ? 'caution' : 'normal';
  const issueBrief =
    hits > 0
      ? `도덕적 포장 — ${formatItemRefs(flagged)}에 2점 이하(경험 부인)`
      : undefined;
  return {
    itemNos: [...LIE_ITEMS_99],
    raw: hits,
    max: VALIDITY_HIT_INVALID_MIN_99,
    status,
    detail: `2점 이하 ${VALIDITY_HIT_INVALID_MIN_99}개 이상 도덕적 포장 주의 (L: ${LIE_ITEMS_99.join('·')})`,
    issueBrief,
  };
}

function vrinMismatchPairs(answers: Record<string, number>, pairs: readonly [number, number][]): [number, number][] {
  return pairs.filter(([a, b]) => pairMismatch(answers, a, b));
}

export function computeEgoOkValidityProfile(answers: Record<string, number>): EgoOkValidityProfile {
  const is99 = EGO_OK_ITEM_BANK_ID === 'ego-ok-99';

  const imc = is99 ? computeImcFor99(answers) : computeImcFor100(answers);

  const lieBlock = is99
    ? computeLieFor99(answers)
    : (() => {
        const summed = sumLikertPoints(answers, LIE_ITEMS_100);
        const lieMax = summed.max || 15;
        const lieRatio = lieMax > 0 ? summed.raw / lieMax : 0;
        const status: ValidityScaleStatus =
          lieRatio >= 0.8 ? 'invalid' : lieRatio >= 0.6 ? 'caution' : 'normal';
        return {
          itemNos: [...LIE_ITEMS_100],
          raw: summed.raw,
          max: lieMax,
          status,
          detail: `원점수 비율 60% 이상 주의 · 80% 이상 무효 (3문항 L: ${LIE_ITEMS_100.join('·')})`,
          issueBrief: undefined,
        };
      })();

  const infreqBlock = is99
    ? computeInfreqFor99(answers)
    : (() => {
        const summed = sumLikertPoints(answers, INFREQ_ITEMS_100);
        const infreqMax = summed.max || 15;
        const infreqRatio = infreqMax > 0 ? summed.raw / infreqMax : 0;
        const status: ValidityScaleStatus =
          infreqRatio >= 0.6 ? 'invalid' : infreqRatio >= 0.4 ? 'caution' : 'normal';
        return {
          itemNos: [...INFREQ_ITEMS_100],
          raw: summed.raw,
          max: infreqMax,
          status,
          detail: `원점수 비율 40% 이상 주의 · 60% 이상 무효 (3문항 F: ${INFREQ_ITEMS_100.join('·')})`,
          issueBrief: undefined,
        };
      })();

  const lieStatus = lieBlock.status;
  const infreqStatus = infreqBlock.status;

  const vrinPairs = EGO_OK_VRIN_PAIRS;
  let vrinMismatch = 0;
  let vrinChecked = 0;
  for (const [a, b] of vrinPairs) {
    const av = answerByNo(answers, a);
    const bv = answerByNo(answers, b);
    if (av === undefined || bv === undefined) continue;
    vrinChecked += 1;
    if (pairMismatch(answers, a, b)) vrinMismatch += 1;
  }
  const vrinStatus: ValidityScaleStatus =
    vrinMismatch >= 2
      ? 'invalid'
      : vrinMismatch >= 1
        ? 'caution'
        : vrinChecked === 0
          ? 'caution'
          : 'normal';

  const mismatchedPairs = vrinMismatchPairs(answers, vrinPairs);
  const vrinIssueBrief =
    is99 && mismatchedPairs.length > 0
      ? `대립 문항 동시 강동의 — ${mismatchedPairs.map(([a, b]) => formatVrinPairRef(a, b)).join(' · ')}`
      : !is99 && mismatchedPairs.length > 0
        ? `대립 문항 불일치 — ${mismatchedPairs.map(([a, b]) => formatVrinPairRef(a, b)).join(' · ')}`
        : undefined;

  const scalesForOverall = [imc.status, lieStatus, infreqStatus, vrinStatus];

  let overall: ValidityTraffic = 'normal';
  const worstScale = scalesForOverall.reduce(worst, 'normal');
  if (worstScale === 'invalid') overall = 'invalid';
  else if (worstScale === 'caution') overall = 'caution';

  const overallTitle =
    overall === 'normal'
      ? '정상 (유효한 프로파일)'
      : overall === 'caution'
        ? '주의 (조건부 해석)'
        : '무효 (재검사 권고)';

  const overallSummary =
    overall === 'normal'
      ? '수검자의 응답은 신뢰할 수 있는 수준이며, 내담자의 실제 성격 구조와 자아상태를 타당하게 반영하고 있습니다.'
      : overall === 'caution'
        ? '일부 타당도 지표가 주의 구간입니다. 아래 세부 지표를 확인한 뒤 조건부로 해석하세요.'
        : '타당도 지표가 무효 구간입니다. 이고그램·오케이그램 프로파일 해석을 보류하고 재검사·면담을 권장합니다.';

  const imcNoteBody =
    imc.status === 'normal'
      ? is99
        ? `반응 성실도 (IMC)는 정상입니다. 현실·주의 문항(${imc.itemNos.join('·')})에 타당하게 응답한 것으로 볼 수 있습니다.`
        : `반응 성실도 (IMC)는 정상입니다. 지시 문항(${imc.itemNos.join('·')})을 읽고 응답한 것으로 볼 수 있습니다.`
      : is99 && imc.issueBrief
        ? `${imc.issueBrief}. 피로·무성의 응답 가능성을 점검하고 재검사를 고려하세요.`
        : '반응 성실도 (IMC)가 주의 또는 무효입니다. 피로·집중력 저하로 지문을 제대로 읽지 않았을 가능성이 있습니다. 수검 당시 컨디션을 점검한 뒤 재검사를 권장합니다.';

  const counselorNotes: ValidityCounselorNote[] = [
    { label: VALIDITY_SCALE_LABELS.imc, body: imcNoteBody },
    {
      label: VALIDITY_SCALE_LABELS.lie,
      body:
        lieStatus === 'normal'
          ? '사회적 바람직성 (L)은 정상입니다. 자신을 지나치게 좋게 포장한 응답으로 보기는 어렵습니다.'
          : is99 && lieBlock.issueBrief
            ? `${lieBlock.issueBrief}. 프로파일은 조건부 해석하고, 정답이 없음을 안내하세요.`
            : is99
              ? '도덕적 포장(위선) 주의: 평범한 짜증·게으름·섭섭함까지 부인하는 응답이 두드러집니다. 프로파일은 조건부 해석하고, 정답이 없음을 안내하며 솔직한 응답을 장려하세요.'
              : '사회적 바람직성 (L)이 높게 나온 경우, 평가 불안으로 자신을 과도하게 긍정적으로 그렸을 수 있습니다. 정답이 없음을 안내하고 솔직한 응답을 장려하세요.',
    },
    {
      label: VALIDITY_SCALE_LABELS.infreq,
      body:
        infreqStatus === 'normal'
          ? '비전형 왜곡 (F)은 정상입니다. 비현실적·비전형 반응이 두드러지지 않습니다.'
          : is99 && infreqBlock.issueBrief
            ? `${infreqBlock.issueBrief}. 무작위·과장 응답 여부를 점검하고, 부담감을 먼저 공감하세요.`
            : '비전형 왜곡 (F)이 높게 나온 경우, 무작위 응답·과장된 신체/경험 진술 또는 도움 요청 신호일 수 있습니다. 점수보다 현재 부담감을 먼저 공감하세요.',
    },
    {
      label: VALIDITY_SCALE_LABELS.vrin,
      body:
        vrinStatus === 'normal'
          ? '일관성 (VRIN)은 정상입니다. 대립 문항에 동시에 강하게 동의한 불일치는 없습니다.'
          : vrinIssueBrief
            ? `${vrinIssueBrief}. 컨디션·속도를 점검한 뒤 재검사를 고려하세요.`
            : '일관성 (VRIN)이 주의 또는 무효입니다. 서로 맞지 않는 답을 함께 골랐을 수 있습니다. 컨디션·속도를 점검한 뒤 재검사를 고려하세요.',
    },
  ];

  const vrinDetail = `불일치 쌍 2개 이상 무효 · 1개 주의 (VRIN: ${vrinPairs.map(([a, b]) => `${a}-${b}`).join(', ')})`;

  return {
    overall,
    overallTitle,
    overallSummary,
    imc,
    lie: {
      itemNos: lieBlock.itemNos,
      raw: lieBlock.raw,
      max: lieBlock.max,
      status: lieBlock.status,
      detail: lieBlock.detail,
      issueBrief: lieBlock.issueBrief,
    },
    infreq: {
      itemNos: infreqBlock.itemNos,
      raw: infreqBlock.raw,
      max: infreqBlock.max,
      status: infreqBlock.status,
      detail: infreqBlock.detail,
      issueBrief: infreqBlock.issueBrief,
    },
    vrin: {
      pairCount: vrinPairs.length,
      mismatchPairs: vrinMismatch,
      maxPairs: vrinPairs.length,
      status: vrinStatus,
      detail: vrinDetail,
      issueBrief: vrinIssueBrief,
    },
    counselorNotes,
  };
}
