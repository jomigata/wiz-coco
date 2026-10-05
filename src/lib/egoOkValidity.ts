import { likertToItemPoints } from '@/lib/egoOkScoring';

export type ValidityTraffic = 'normal' | 'caution' | 'invalid';

export type ValidityScaleStatus = 'normal' | 'caution' | 'invalid';

export type ValidityCounselorNote = {
  /** 타당도 표 「구분」과 같은 이름 */
  label: string;
  body: string;
};

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
      label: '반응 성실도 (IMC)',
      body:
        imcStatus === 'normal'
          ? '반응 성실도 (IMC)는 정상입니다. 지시된 답을 고르도록 한 문항을 읽고 응답한 것으로 볼 수 있습니다.'
          : '반응 성실도 (IMC)가 주의 또는 무효입니다. 피로·집중력 저하로 지문을 제대로 읽지 않았을 가능성이 있습니다. 수검 당시 컨디션을 점검한 뒤 재검사를 권장합니다.',
    },
    {
      label: '사회적 바람직성 (L)',
      body:
        lieStatus === 'normal'
          ? '사회적 바람직성 (L)은 정상입니다. 자신을 지나치게 좋게 포장한 응답으로 보기는 어렵습니다.'
          : '사회적 바람직성 (L)이 높게 나온 경우, 평가에 대한 불안으로 자신을 도덕적·완벽한 사람으로 위장하려 했을 가능성이 큽니다. 상담에서는 정답이 없음을 다시 알려 주고, 취약성을 말해도 비난받지 않는 자리를 만들어 주십시오.',
    },
    {
      label: '비전형 왜곡 (F)',
      body:
        infreqStatus === 'normal'
          ? '비전형 왜곡 (F)은 정상입니다. 흔하지 않은 반응을 과도하게 고른 양상은 두드러지지 않습니다.'
          : '비전형 왜곡 (F)이 높게 나온 경우, 실제 증상이 아니라면 도움 요청 신호일 수 있습니다. 점수보다 지금 느끼는 불안·우울의 버거움을 먼저 공감해 주십시오.',
    },
    {
      label: '일관성 (VRIN)',
      body:
        vrinStatus === 'normal'
          ? '일관성 (VRIN)은 정상입니다. 뜻이 반대인 문항에 동시에 동의한 불일치는 없습니다.'
          : '일관성 (VRIN)이 주의 또는 무효입니다. 서로 맞지 않는 답을 함께 골랐을 수 있습니다. 피로·집중력 저하로 지문을 제대로 읽지 않았을 가능성이 있으니, 수검 당시 컨디션을 점검한 뒤 재검사를 권장합니다.',
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
      detail: '지정 번호 미선택 1개 이상 시 주의/무효',
    },
    lie: {
      itemNos: [15, 63],
      raw: lieRaw,
      max: 10,
      status: lieStatus,
      detail: '8점 이상 시 과도한 방어 및 위선',
    },
    infreq: {
      itemNos: [47, 90],
      raw: infreqRaw,
      max: 10,
      status: infreqStatus,
      detail: '6점 이상 시 꾀병 또는 무작위 응답',
    },
    vrin: {
      pairCount: VRIN_PAIRS.length,
      mismatchPairs: vrinMismatch,
      maxPairs: VRIN_PAIRS.length,
      status: vrinStatus,
      detail: '불일치 쌍 2개 이상 시 비일관적',
    },
    counselorNotes,
  };
}
