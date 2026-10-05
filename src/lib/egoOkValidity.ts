import { likertToItemPoints } from '@/lib/egoOkScoring';

export type ValidityTraffic = 'normal' | 'caution' | 'invalid';

export type ValidityScaleStatus = 'normal' | 'caution' | 'invalid';

export type EgoOkValidityProfile = {
  overall: ValidityTraffic;
  overallTitle: string;
  overallSummary: string;
  imc: {
    itemNos: [number, number];
    failCount: number;
    status: ValidityScaleStatus;
    detail: string;
  };
  lie: {
    itemNos: [number, number];
    raw: number;
    max: number;
    status: ValidityScaleStatus;
    detail: string;
  };
  infreq: {
    itemNos: [number, number];
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

export type ValidityScaleId = 'imc' | 'lie' | 'infreq' | 'vrin';

export type ValidityCounselorNote = {
  scaleId: ValidityScaleId;
  /** 타당도 표의 구분명과 동일 */
  label: string;
  status: ValidityScaleStatus;
  explanation: string;
};

export type ValidityBand = {
  status: ValidityScaleStatus;
  text: string;
};

export type ValidityScaleMeta = {
  label: string;
  /** 이 지표가 무엇을 보는지 */
  functionText: string;
  bands: ValidityBand[];
};

export const VALIDITY_SCALE_META: Record<ValidityScaleId, ValidityScaleMeta> = {
  imc: {
    label: '반응 성실도 (IMC)',
    functionText: '지시된 답을 정확히 골랐는지 확인합니다. 문항을 읽지 않고 응답했는지를 가늠합니다.',
    bands: [
      { status: 'normal', text: '두 문항 모두 지정 응답' },
      { status: 'caution', text: '1개 미준수' },
      { status: 'invalid', text: '2개 모두 미준수' },
    ],
  },
  lie: {
    label: '사회적 바람직성 (L)',
    functionText: '자신을 지나치게 도덕적이거나 완벽한 사람으로 보이려는 응답 경향을 봅니다.',
    bands: [
      { status: 'normal', text: '5점 이하' },
      { status: 'caution', text: '6–7점' },
      { status: 'invalid', text: '8점 이상 · 바람직성 과장' },
    ],
  },
  infreq: {
    label: '비전형 왜곡 (F)',
    functionText: '대부분의 사람이 하지 않는 극단 응답이 얼마나 있는지를 봅니다. 무작위 응답이나 과장, 도움 요청 신호를 가늠합니다.',
    bands: [
      { status: 'normal', text: '3점 이하' },
      { status: 'caution', text: '4–5점' },
      { status: 'invalid', text: '6점 이상 · 극단·무작위 응답' },
    ],
  },
  vrin: {
    label: '일관성 (VRIN)',
    functionText: '뜻이 반대인 문항쌍에 동시에 「그렇다」 이상으로 답했는지를 봅니다. 앞뒤가 맞지 않는 응답인지를 확인합니다.',
    bands: [
      { status: 'normal', text: '불일치 0쌍' },
      { status: 'caution', text: '불일치 1쌍' },
      { status: 'invalid', text: '불일치 2쌍 이상' },
    ],
  },
};

function answerByNo(answers: Record<string, number>, no: number): number {
  const index = no - 1;
  return answers[String(index)] ?? answers[index]!;
}

function statusRank(s: ValidityScaleStatus): number {
  if (s === 'invalid') return 2;
  if (s === 'caution') return 1;
  return 0;
}

function worst(a: ValidityScaleStatus, b: ValidityScaleStatus): ValidityScaleStatus {
  return statusRank(a) >= statusRank(b) ? a : b;
}

/** 대립 문항쌍: 둘 다 4점 이상(5점 척도 · 그렇다 이상)이면 1불일치 */
const VRIN_PAIRS: [number, number][] = [
  [3, 39],
  [5, 65],
  [23, 60],
  [53, 78],
];

function pairMismatch(answers: Record<string, number>, aNo: number, bNo: number): boolean {
  const a = answerByNo(answers, aNo);
  const b = answerByNo(answers, bNo);
  return a >= 4 && b >= 4;
}

export function computeEgoOkValidityProfile(answers: Record<string, number>): EgoOkValidityProfile {
  const imcFails =
    (answerByNo(answers, 30) !== 1 ? 1 : 0) + (answerByNo(answers, 77) !== 5 ? 1 : 0);
  const imcStatus: ValidityScaleStatus =
    imcFails >= 2 ? 'invalid' : imcFails >= 1 ? 'caution' : 'normal';

  const lieRaw =
    likertToItemPoints(answerByNo(answers, 15)) + likertToItemPoints(answerByNo(answers, 63));
  const lieStatus: ValidityScaleStatus =
    lieRaw >= 8 ? 'invalid' : lieRaw >= 6 ? 'caution' : 'normal';

  const infreqRaw =
    likertToItemPoints(answerByNo(answers, 47)) + likertToItemPoints(answerByNo(answers, 90));
  const infreqStatus: ValidityScaleStatus =
    infreqRaw >= 6 ? 'invalid' : infreqRaw >= 4 ? 'caution' : 'normal';

  let vrinMismatch = 0;
  for (const [a, b] of VRIN_PAIRS) {
    if (pairMismatch(answers, a, b)) vrinMismatch += 1;
  }
  const vrinStatus: ValidityScaleStatus =
    vrinMismatch >= 2 ? 'invalid' : vrinMismatch >= 1 ? 'caution' : 'normal';

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
      scaleId: 'imc',
      label: VALIDITY_SCALE_META.imc.label,
      status: imcStatus,
      explanation:
        '반응 성실도(IMC)는 지정된 답을 정확히 골랐는지를 봅니다. 주의이거나 무효이면 피로·집중력 저하로 지문을 제대로 읽지 않았을 가능성이 있습니다. 수검 당시 컨디션을 점검한 뒤 재검사를 권합니다.',
    },
    {
      scaleId: 'lie',
      label: VALIDITY_SCALE_META.lie.label,
      status: lieStatus,
      explanation:
        '사회적 바람직성(L)은 자신을 도덕적이거나 완벽한 사람으로 보이려는 경향입니다. 점수가 높으면 평가에 대한 불안으로 취약함을 숨겼을 수 있습니다. 정답이 없음을 다시 알려 주고, 취약성을 드러내도 비난받지 않는 자리를 만들어 주십시오.',
    },
    {
      scaleId: 'infreq',
      label: VALIDITY_SCALE_META.infreq.label,
      status: infreqStatus,
      explanation:
        '비전형 왜곡(F)은 흔하지 않은 극단 응답이 얼마나 있는지를 봅니다. 실제 증상이 아니라면 도움 요청일 수 있습니다. 점수보다 지금 느끼는 불안·우울의 버거움을 먼저 공감해 주십시오.',
    },
    {
      scaleId: 'vrin',
      label: VALIDITY_SCALE_META.vrin.label,
      status: vrinStatus,
      explanation:
        '일관성(VRIN)은 서로 반대되는 문항에 동시에 동의했는지를 봅니다. 불일치가 있으면 문항을 앞뒤 맞게 읽지 못했을 가능성이 있습니다. 컨디션을 확인한 뒤 재검사를 권합니다.',
    },
  ];

  return {
    overall,
    overallTitle,
    overallSummary,
    imc: {
      itemNos: [30, 77],
      failCount: imcFails,
      status: imcStatus,
      detail: '정상 0개 미준수 · 주의 1개 · 무효 2개',
    },
    lie: {
      itemNos: [15, 63],
      raw: lieRaw,
      max: 10,
      status: lieStatus,
      detail: '정상 5점 이하 · 주의 6–7점 · 무효 8점 이상',
    },
    infreq: {
      itemNos: [47, 90],
      raw: infreqRaw,
      max: 10,
      status: infreqStatus,
      detail: '정상 3점 이하 · 주의 4–5점 · 무효 6점 이상',
    },
    vrin: {
      pairCount: VRIN_PAIRS.length,
      mismatchPairs: vrinMismatch,
      maxPairs: VRIN_PAIRS.length,
      status: vrinStatus,
      detail: '정상 0쌍 · 주의 1쌍 · 무효 2쌍 이상',
    },
    counselorNotes,
  };
}
