import type { EgoOkScaleScore, OkScaleId } from '@/lib/egoOkScoring';

export type InnerMindGapLevel = 'aligned' | 'mild' | 'severe';

export type InnerMindPair = {
  egoLabel: string;
  okLabel: string;
  egoScore: number;
  okScore: number;
  /** 겉(이고) − 속(오케이) */
  diff: number;
  gapLevel: InnerMindGapLevel;
  summary: string;
  caution: string;
};

const PAIRS: { egoId: EgoOkScaleScore['id']; okId: OkScaleId; egoName: string; okName: string }[] = [
  { egoId: 'CP', okId: 'U+', egoName: 'CP(비판적 부모)', okName: 'U+(속)' },
  { egoId: 'NP', okId: 'U-', egoName: 'NP(양육적 부모)', okName: 'U−(속)' },
  { egoId: 'FC', okId: 'I+', egoName: 'FC(자유로운 아이)', okName: 'I+(속)' },
  { egoId: 'AC', okId: 'I-', egoName: 'AC(순응하는 아이)', okName: 'I−(속)' },
];

function gapLevel(absDiff: number): InnerMindGapLevel {
  if (absDiff <= 2) return 'aligned';
  if (absDiff <= 5) return 'mild';
  return 'severe';
}

function pairCopy(
  egoName: string,
  okName: string,
  diff: number,
  level: InnerMindGapLevel,
): { summary: string; caution: string } {
  const abs = Math.abs(diff);
  if (level === 'aligned') {
    return {
      summary: `${egoName} 겉마음(이고)과 ${okName} 속마음(오케이) 차이가 ${abs}점으로, 말·행동과 내면이 크게 어긋나지 않는 편입니다.`,
      caution: '일상에서는 속마음과 겉마음을 맞추려는 추가 노력이 크지 않아도 됩니다.',
    };
  }
  const outward = diff > 0;
  const dir = outward
    ? `겉마음(${egoName})이 속마음(${okName})보다 ${abs}점 높아, 밖으로는 그만큼 더 ${egoName.split('(')[0]} 에너지를 드러내는 경향`
    : `속마음(${okName})이 겉마음(${egoName})보다 ${abs}점 높아, 안에서는 더 강한 ${okName} 성향이 작동`;
  if (level === 'mild') {
    return {
      summary: `${dir}이 있습니다. 직업·역할·관계에서 의도적으로 맞추다 보면 가끔 찜찜함·피로가 남을 수 있습니다.`,
      caution: '속마음을 인정하는 I-메시지·짧은 휴식으로 스트레스가 쌓이지 않게 조절하세요.',
    };
  }
  return {
    summary: `${dir}입니다. 차이 ${abs}점은 장기적으로 스트레스·스탬프(찜찜함)가 쌓이기 쉬우며, 억눌린 속마음이나 과한 겉맞춤이 각 에너지 형태대로 갑작스럽게 드러날 여지가 있습니다.`,
    caution: '상담·대화에서 속마음·겉마음 차이를 짚고, 역할 기대를 조정·완화하는 것이 필요합니다.',
  };
}

export function buildInnerMindPairs(egogram: EgoOkScaleScore[], okgram: { id: OkScaleId; raw: number }[]): InnerMindPair[] {
  const egoById = Object.fromEntries(egogram.map((s) => [s.id, s]));
  const okById = Object.fromEntries(okgram.map((s) => [s.id, s.raw]));
  return PAIRS.map(({ egoId, okId, egoName, okName }) => {
    const egoScore = egoById[egoId]?.raw ?? 0;
    const okScore = okById[okId] ?? 0;
    const diff = egoScore - okScore;
    const level = gapLevel(Math.abs(diff));
    const { summary, caution } = pairCopy(egoName, okName, diff, level);
    return {
      egoLabel: egoName,
      okLabel: okName,
      egoScore,
      okScore,
      diff,
      gapLevel: level,
      summary,
      caution,
    };
  });
}
