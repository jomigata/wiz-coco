import { likertToItemPoints } from '@/lib/egoOkScoring';

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
  };
  lie: {
    itemNos: number[];
    raw: number;
    max: number;
    status: ValidityScaleStatus;
    detail: string;
  };
  infreq: {
    itemNos: number[];
    raw: number;
    max: number;
    status: ValidityScaleStatus;
    detail: string;
  };
  vrin: {
    pairCount: number;
    mismatchPairs: number;
    maxPairs: number;
    status: ValidityScaleStatus;
    detail: string;
  };
  counselorNotes: ValidityCounselorNote[];
};

/** items-100.json 분산 배치 (reorder-items-100.mjs) — 구 96번 기준 삽입: after 25·50·75 */
const IMC_CHECKS: { no: number; expected: number }[] = [
  { no: 26, expected: 1 },
  { no: 18, expected: 5 },
  { no: 34, expected: 2 },
];

const LIE_ITEMS = [44, 64, 69] as const;
const INFREQ_ITEMS = [72, 80, 93] as const;

/** 대립 문항쌍: 둘 다 4점 이상(5점 척도)이면 1불일치 — 5쌍 */
export const EGO_OK_VRIN_PAIRS: [number, number][] = [
  [3, 40],
  [5, 67],
  [23, 62],
  [55, 81],
  [33, 100],
];

const VRIN_PAIRS = EGO_OK_VRIN_PAIRS;

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

export function computeEgoOkValidityProfile(answers: Record<string, number>): EgoOkValidityProfile {
  let imcFails = 0;
  let imcAnswered = 0;
  for (const { no, expected } of IMC_CHECKS) {
    const a = answerByNo(answers, no);
    if (a === undefined) continue;
    imcAnswered += 1;
    if (a !== expected) imcFails += 1;
  }
  const imcStatus: ValidityScaleStatus =
    imcFails >= 2 ? 'invalid' : imcFails >= 1 ? 'caution' : imcAnswered === 0 ? 'caution' : 'normal';

  const lie = sumLikertPoints(answers, LIE_ITEMS);
  const lieMax = lie.max || 15;
  const lieRatio = lieMax > 0 ? lie.raw / lieMax : 0;
  const lieStatus: ValidityScaleStatus =
    lieRatio >= 0.8 ? 'invalid' : lieRatio >= 0.6 ? 'caution' : 'normal';

  const infreq = sumLikertPoints(answers, INFREQ_ITEMS);
  const infreqMax = infreq.max || 15;
  const infreqRatio = infreqMax > 0 ? infreq.raw / infreqMax : 0;
  const infreqStatus: ValidityScaleStatus =
    infreqRatio >= 0.6 ? 'invalid' : infreqRatio >= 0.4 ? 'caution' : 'normal';

  let vrinMismatch = 0;
  let vrinChecked = 0;
  for (const [a, b] of VRIN_PAIRS) {
    const av = answerByNo(answers, a);
    const bv = answerByNo(answers, b);
    if (av === undefined || bv === undefined) continue;
    vrinChecked += 1;
    if (pairMismatch(answers, a, b)) vrinMismatch += 1;
  }
  const vrinStatus: ValidityScaleStatus =
    vrinMismatch >= 2 ? 'invalid' : vrinMismatch >= 1 ? 'caution' : vrinChecked === 0 ? 'caution' : 'normal';

  let overall: ValidityTraffic = 'normal';
  const worstScale = [imcStatus, lieStatus, infreqStatus, vrinStatus].reduce(worst, 'normal');
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

  const counselorNotes: ValidityCounselorNote[] = [
    {
      label: VALIDITY_SCALE_LABELS.imc,
      body:
        imcStatus === 'normal'
          ? `반응 성실도 (IMC)는 정상입니다. 지시 문항(${IMC_CHECKS.map((c) => c.no).join('·')})을 읽고 응답한 것으로 볼 수 있습니다.`
          : '반응 성실도 (IMC)가 주의 또는 무효입니다. 피로·집중력 저하로 지문을 제대로 읽지 않았을 가능성이 있습니다. 수검 당시 컨디션을 점검한 뒤 재검사를 권장합니다.',
    },
    {
      label: VALIDITY_SCALE_LABELS.lie,
      body:
        lieStatus === 'normal'
          ? '사회적 바람직성 (L)은 정상입니다. 자신을 지나치게 좋게 포장한 응답으로 보기는 어렵습니다.'
          : '사회적 바람직성 (L)이 높게 나온 경우, 평가 불안으로 자신을 과도하게 긍정적으로 그렸을 수 있습니다. 정답이 없음을 안내하고 솔직한 응답을 장려하세요.',
    },
    {
      label: VALIDITY_SCALE_LABELS.infreq,
      body:
        infreqStatus === 'normal'
          ? '비전형 왜곡 (F)은 정상입니다. 비현실적·비전형 반응이 두드러지지 않습니다.'
          : '비전형 왜곡 (F)이 높게 나온 경우, 무작위 응답·과장된 신체/경험 진술 또는 도움 요청 신호일 수 있습니다. 점수보다 현재 부담감을 먼저 공감하세요.',
    },
    {
      label: VALIDITY_SCALE_LABELS.vrin,
      body:
        vrinStatus === 'normal'
          ? '일관성 (VRIN)은 정상입니다. 대립 문항에 동시에 강하게 동의한 불일치는 없습니다.'
          : '일관성 (VRIN)이 주의 또는 무효입니다. 서로 맞지 않는 답을 함께 골랐을 수 있습니다. 컨디션·속도를 점검한 뒤 재검사를 고려하세요.',
    },
  ];

  return {
    overall,
    overallTitle,
    overallSummary,
    imc: {
      itemNos: IMC_CHECKS.map((c) => c.no),
      failCount: imcFails,
      status: imcStatus,
      detail: `지시 응답 실패 2개 이상 무효 · 1개 주의 (3문항 IMC: ${IMC_CHECKS.map((c) => c.no).join('·')})`,
    },
    lie: {
      itemNos: [...LIE_ITEMS],
      raw: lie.raw,
      max: lieMax,
      status: lieStatus,
      detail: `원점수 비율 60% 이상 주의 · 80% 이상 무효 (3문항 L: ${LIE_ITEMS.join('·')})`,
    },
    infreq: {
      itemNos: [...INFREQ_ITEMS],
      raw: infreq.raw,
      max: infreqMax,
      status: infreqStatus,
      detail: `원점수 비율 40% 이상 주의 · 60% 이상 무효 (3문항 F: ${INFREQ_ITEMS.join('·')})`,
    },
    vrin: {
      pairCount: VRIN_PAIRS.length,
      mismatchPairs: vrinMismatch,
      maxPairs: VRIN_PAIRS.length,
      status: vrinStatus,
      detail: `불일치 쌍 2개 이상 무효 · 1개 주의 (5쌍 VRIN: ${VRIN_PAIRS.map(([a, b]) => `${a}-${b}`).join(', ')})`,
    },
    counselorNotes,
  };
}
