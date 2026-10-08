import {
  isPlus243RecommendedStage,
  plus243StageBand,
  plus243StageBandLabel,
  plus243TierToAscii,
  rawScoreToPlus243Tier,
  type Plus243Stage,
  type Plus243StageBand,
} from '@/lib/egogram243Plus';

export type CstScaleEnergyMeta = {
  stage: Plus243Stage;
  tierAscii: string;
  band: Plus243StageBand;
  bandLabel: string;
  recommendedNote: string;
  balanceComment: string;
};

/** % → 243+ 9단계 에너지 사용 빈도 (합계 10~50 근사) */
export function pctToPlus243EnergyMeta(pct: number): CstScaleEnergyMeta {
  const raw = Math.round(10 + (Math.min(100, Math.max(0, pct)) / 100) * 40);
  const tier = rawScoreToPlus243Tier(raw);
  const band = plus243StageBand(tier.stage);
  const bandLabel = plus243StageBandLabel(band);
  const recommendedNote = isPlus243RecommendedStage(tier.stage)
    ? '권장 구간(4~6단계)에 해당합니다.'
    : '권장 구간은 4~6단계입니다.';

  let balanceComment: string;
  if (band === 'deficit') {
    balanceComment =
      '에너지 사용이 상대적으로 적습니다 — 필요할 때 쓰기 어렵거나 위축될 수 있으나, 과도한 자극을 줄이는 데는 유리할 수 있습니다.';
  } else if (band === 'excess') {
    balanceComment =
      '에너지 사용이 강한 편입니다 — 추진·집중에 유리하나, 과하면 주변에 부담·갈등·소진으로 이어질 수 있습니다.';
  } else {
    balanceComment =
      '에너지 사용이 균형에 가깝습니다 — 상황에 맞게 조절하기 좋은 구간으로, 강점을 의도적으로 쓰면 안정적입니다.';
  }

  return {
    stage: tier.stage,
    tierAscii: plus243TierToAscii(tier),
    band,
    bandLabel,
    recommendedNote,
    balanceComment,
  };
}

export function formatEnergyStageLine(meta: CstScaleEnergyMeta): string {
  return `${meta.stage}단계(${meta.tierAscii}) · ${meta.bandLabel} · ${meta.recommendedNote}`;
}
