import type { EgoOkScaleScore, OkScaleId } from '@/lib/egoOkScoring';

export type InnerMindPair = {
  egoId: EgoOkScaleScore['id'];
  okId: OkScaleId;
  egoShort: string;
  okShort: string;
  egoScore: number;
  okScore: number;
  /** 속(오케이) − 겉(이고) — 예: (U−)−CP */
  okMinusEgo: number;
  summary: string;
  caution: string;
};

const PAIRS: { egoId: EgoOkScaleScore['id']; okId: OkScaleId; egoShort: string; okShort: string }[] = [
  { egoId: 'CP', okId: 'U-', egoShort: 'CP', okShort: 'U−' },
  { egoId: 'NP', okId: 'U+', egoShort: 'NP', okShort: 'U+' },
  { egoId: 'FC', okId: 'I+', egoShort: 'FC', okShort: 'I+' },
  { egoId: 'AC', okId: 'I-', egoShort: 'AC', okShort: 'I−' },
];

function pairCopy(egoShort: string, okShort: string, okMinusEgo: number): { summary: string; caution: string } {
  const abs = Math.abs(okMinusEgo);
  if (abs <= 2) {
    return {
      summary: `겉(${egoShort})이 속(${okShort})와 별 차이가 없습니다.`,
      caution: '',
    };
  }
  if (okMinusEgo > 0) {
    return {
      summary: `속마음(${okShort})이 겉(${egoShort})보다 ${abs}점 높습니다. 밖으로는 ${egoShort}를 덜 쓰는데 안에서는 ${okShort}가 더 강해, 찜찜함·피로가 남을 수 있습니다.`,
      caution:
        abs >= 6
          ? '스트레스·스탬프가 쌓이기 쉬우니 역할 기대를 줄이고 속마음을 인정하는 대화가 필요합니다.'
          : 'I-메시지·휴식으로 겉맞춤 부담을 낮추세요.',
    };
  }
  return {
    summary: `겉(${egoShort})이 속(${okShort})보다 ${abs}점 높습니다. 의도·직업상 ${egoShort} 행동을 더 보이지만 속마음과 어긋나 스트레스·스탬프가 남을 수 있습니다.`,
    caution:
      abs >= 6
        ? '과한 겉맞춤이 폭발적 표출로 이어질 수 있어 강도 조절·위임이 필요합니다.'
        : '속마음과 맞추는 작은 행동을 일정에 넣어 보세요.',
  };
}

export function buildInnerMindPairs(egogram: EgoOkScaleScore[], okgram: { id: OkScaleId; raw: number }[]): InnerMindPair[] {
  const egoById = Object.fromEntries(egogram.map((s) => [s.id, s]));
  const okById = Object.fromEntries(okgram.map((s) => [s.id, s.raw]));
  return PAIRS.map(({ egoId, okId, egoShort, okShort }) => {
    const egoScore = egoById[egoId]?.raw ?? 0;
    const okScore = okById[okId] ?? 0;
    const okMinusEgo = okScore - egoScore;
    const { summary, caution } = pairCopy(egoShort, okShort, okMinusEgo);
    return {
      egoId,
      okId,
      egoShort,
      okShort,
      egoScore,
      okScore,
      okMinusEgo,
      summary,
      caution,
    };
  });
}
