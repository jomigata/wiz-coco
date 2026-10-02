import type { EgoOkCompositeColumn, EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';
import {
  formatPlus243StageLabel,
  plus243StageBand,
  rawScoreToPlus243Tier,
  type Plus243Stage,
  type Plus243Tier,
} from '@/lib/egogram243Plus';

export type EgogramEnergyStageBand = 'deficit' | 'safe' | 'excess';

export type EgogramEnergyInsight = {
  tier: Plus243Tier;
  stage: Plus243Stage;
  band: EgogramEnergyStageBand;
  stageLabel: string;
  scoreRangeLabel: string;
  comment: string;
  strengths: string[];
  cautions: string[];
};

export const EGO_ENERGY_DISPLAY_NAMES: Record<EgoScaleId, string> = {
  CP: '비판적 부모',
  NP: '양육적 부모',
  A: '성인 자아',
  FC: '자유로운 아이',
  AC: '순응하는 아이',
};

type Dominance = 'positive' | 'negative' | 'even';

function egogramDominance(positive: number, negative: number): Dominance {
  if (positive > negative) return 'positive';
  if (negative > positive) return 'negative';
  return 'even';
}

function dominantTrait(col: EgoOkCompositeColumn, dom: Dominance): string {
  if (dom === 'negative') return col.bottomLabel;
  if (dom === 'positive') return col.topLabel;
  return `${col.topLabel} · ${col.bottomLabel}`;
}

function poleLabel(dom: Dominance): string {
  if (dom === 'negative') return '부정(하단) 소계';
  if (dom === 'positive') return '긍정(상단) 소계';
  return '긍정·부정 소계';
}

const SCALE_ROLE: Record<
  EgoScaleId,
  { benefit: string; excessRisk: string; deficitRisk: string; balanceTip: string }
> = {
  CP: {
    benefit: '원칙·기준·책임을 세우는 힘',
    excessRisk: '비판·통제·완벽주의',
    deficitRisk: '기준·경계·피드백',
    balanceTip: '필요할 때만 기준과 I-메시지로 피드백하기',
  },
  NP: {
    benefit: '돌봄·격려·헌신',
    excessRisk: '과보호·희생·간섭',
    deficitRisk: '지지·위로·관심 표현',
    balanceTip: '상대의 자율을 남겨 두고 구체적으로 돕기',
  },
  A: {
    benefit: '사실·논리·현실 검토',
    excessRisk: '냉정·기계적 판단·감정 배제',
    deficitRisk: '선택지 정리·합리적 결정',
    balanceTip: '감정 인지 후 사실과 선택지 적기',
  },
  FC: {
    benefit: '창의·호기심·유연한 시도',
    excessRisk: '즉흥·산만·약속 경시',
    deficitRisk: '즐거움·표현·새로운 시도',
    balanceTip: '작은 실험·유머를 일정에 허용하기',
  },
  AC: {
    benefit: '협력·배려·규칙 준수',
    excessRisk: '과한 순응·의존·자기 억압',
    deficitRisk: '경청·합의·관계 조율',
    balanceTip: '거절·욕구를 I-메시지로 짧게 표현하기',
  },
};

function deficitIntensity(stage: 1 | 2): '매우' | '뚜렷히' {
  return stage === 1 ? '매우' : '뚜렷히';
}

function excessIntensity(stage: Plus243Stage): string {
  if (stage === 6) return '다소';
  if (stage === 7) return '뚜렷히';
  if (stage === 8) return '강하게';
  return '매우';
}

function safeTone(stage: 3 | 4 | 5): '안전성 하단' | '안전성 중심' | '안전성 상단' {
  if (stage === 3) return '안전성 하단';
  if (stage === 4) return '안전성 중심';
  return '안전성 상단';
}

function buildBandStrengths(id: EgoScaleId, band: EgogramEnergyStageBand, stage: Plus243Stage): string[] {
  const role = SCALE_ROLE[id];
  if (band === 'safe') {
    const tone = safeTone(stage as 3 | 4 | 5);
    const strength =
      stage === 4
        ? `${tone}(243+ 3~5단계): ${role.benefit}을(를) 과하지 않게 쓰기 좋은 구간입니다.`
        : stage === 3
          ? `${tone}: ${role.benefit}이(가) 약하게라도 작동하며, 무리한 확대보다 유지·관찰이 적합합니다.`
          : `${tone}: ${role.benefit}이(가) 비교적 풍부하나, 6단계(243+ B³) 이상으로 치솟지 않도록 의식하면 안정적입니다.`;
    return [strength];
  }
  if (band === 'excess') {
    const inten = excessIntensity(stage);
    if (stage >= 8) {
      return [
        `${inten} 높은 에너지(243+ ${stage}단계)로 ${role.benefit}이(가) 상황을 주도할 수 있으나, ${role.excessRisk}에 쏠릴 수 있습니다.`,
      ];
    }
    return [`${inten} ${role.benefit}이(가) 드러날 때 효과적이나(243+ ${stage}단계), ${role.excessRisk} 신호를 함께 점검하세요.`];
  }
  const inten = deficitIntensity(stage as 1 | 2);
  return [
    `${inten} 낮은 구간(243+ 1~2단계)이므로 ${role.excessRisk} 부담은 적을 수 있으나, ${role.deficitRisk}이(가) 약해질 수 있습니다.`,
  ];
}

function buildBandCautions(
  id: EgoScaleId,
  band: EgogramEnergyStageBand,
  stage: Plus243Stage,
  context: 'peak' | 'low',
): string[] {
  const role = SCALE_ROLE[id];
  if (band === 'safe') {
    const tone = safeTone(stage as 3 | 4 | 5);
    const lines = [
      `${tone}: 243+ 3~5단계는 안전성 구간으로, ${role.excessRisk}·${role.deficitRisk} 모두 극단으로 가지 않도록 유지하는 것이 목표입니다.`,
    ];
    if (stage === 5) {
      lines.push(`5단계(243+ B²)는 안전성 상단이므로, 6단계(B³) 이상으로 올라가지 않도록 ${role.balanceTip}을 권합니다.`);
    } else if (stage === 3) {
      lines.push(`3단계(243+ C³)는 안전성 하단이므로, 2단계(C²)로 내려가지 않도록 ${role.balanceTip}을 권합니다.`);
    }
    return lines;
  }
  if (band === 'excess') {
    const inten = excessIntensity(stage);
    const peakNote =
      context === 'peak'
        ? '다섯 척도 중 최고점이므로 '
        : '절대 점수는 높은 편이나 상대적으로는 덜 쓰는 척도이므로 ';
    return [
      `${peakNote}${inten} ${role.excessRisk}이(가) 과해질 수 있습니다(243+ ${stage}단계 · 6~9 · 과함). ${role.balanceTip}으로 강도를 낮추세요.`,
    ];
  }
  const inten = deficitIntensity(stage as 1 | 2);
  const lowNote =
    context === 'low'
      ? '다섯 척도 중 최저점이므로 '
      : '타 척도 대비 상대 최고이나 절대 점수는 ';
  return [
    `${lowNote}${inten} ${role.deficitRisk}이(가) 부족할 수 있습니다(243+ ${stage}단계 · 1~2 · 부족). ${role.balanceTip}으로 보완을 검토하세요.`,
  ];
}

function wrapInsight(tier: Plus243Tier, comment: string, strengths: string[], cautions: string[]): EgogramEnergyInsight {
  const band = plus243StageBand(tier.stage);
  return {
    tier,
    stage: tier.stage,
    band,
    stageLabel: formatPlus243StageLabel(tier),
    scoreRangeLabel: `${tier.min}~${tier.max}점`,
    comment,
    strengths,
    cautions,
  };
}

/** 최고 사용에너지 — 243+ 9단계(척도 합계 10~50) */
export function buildPeakEgogramEnergyInsight(
  scale: EgoOkScaleScore,
  col: EgoOkCompositeColumn,
): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const band = plus243StageBand(tier.stage);
  const dom = egogramDominance(scale.positiveRaw, scale.negativeRaw);
  const trait = dominantTrait(col, dom);
  const stageText = formatPlus243StageLabel(tier);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];

  let bandComment: string;
  if (band === 'safe') {
    bandComment = `${stageText}에 해당합니다. 243+ 3~5단계는 안전성 구간으로, ${name} 에너지가 과함·부족 극단 없이 쓰이기 쉬운 범위입니다.`;
  } else if (band === 'excess') {
    const inten = excessIntensity(tier.stage);
    bandComment = `${stageText}에 해당하며, ${inten} 과함(243+ 6~9단계) 쪽으로 ${name} 사용이 강하게 나타날 수 있습니다.`;
  } else {
    const inten = deficitIntensity(tier.stage as 1 | 2);
    bandComment = `${stageText}에 해당합니다. 절대적으로는 ${inten} 부족(243+ 1~2단계)이나, 다섯 척도 중에서는 가장 높게 나타납니다.`;
  }

  const comment = `${name}(${scale.raw}/50, 243-${scale.threeLevel}, ${tier.label}) · ${bandComment} ${poleLabel(dom)} 기준 「${trait}」 양상이 두드러집니다.`;

  return wrapInsight(
    tier,
    comment,
    buildBandStrengths(scale.id, band, tier.stage),
    buildBandCautions(scale.id, band, tier.stage, 'peak'),
  );
}

/** 부족한 사용에너지 — 243+ 9단계 */
export function buildLowEgogramEnergyInsight(
  scale: EgoOkScaleScore,
  col: EgoOkCompositeColumn,
): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const band = plus243StageBand(tier.stage);
  const stageText = formatPlus243StageLabel(tier);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];

  let bandComment: string;
  if (band === 'safe') {
    bandComment = `${stageText}입니다. 상대적으로는 가장 낮은 척도이나, 243+ 3~5단계 안전성 구간에 있어 절대적으로 극단적 부족은 아닐 수 있습니다.`;
  } else if (band === 'deficit') {
    const inten = deficitIntensity(tier.stage as 1 | 2);
    bandComment = `${stageText}으로, ${inten} 부족(243+ 1~2단계)에 해당합니다. 일상에서 ${name} 자아를 덜 의식적으로 쓰는 경향을 시사합니다.`;
  } else {
    const inten = excessIntensity(tier.stage);
    bandComment = `${stageText}으로 절대 점수는 ${inten} 높은 편(243+ 6~9단계)이나, 다섯 척도 중 상대 최저입니다. 과함보다는 다른 척도와의 균형·분배 이슈로 읽는 것이 타당합니다.`;
  }

  const comment = `${name}(${scale.raw}/50, 243-${scale.threeLevel}, ${tier.label}) · ${bandComment} (많이 쓰는 쪽: ${col.topLabel} · 상대적으로 약한 쪽: ${col.bottomLabel})`;

  const strengths =
    band === 'excess'
      ? [
          `243+ ${tier.stage}단계이므로 ${SCALE_ROLE[scale.id].benefit} 자체는 충분히 가용합니다. 다른 척도에 비해 상대적으로만 낮습니다.`,
        ]
      : buildBandStrengths(scale.id, band, tier.stage);

  const cautions = buildBandCautions(scale.id, band, tier.stage, 'low');

  return wrapInsight(tier, comment, strengths, cautions);
}

export function formatEgogramEnergyHeadline(scale: EgoOkScaleScore): string {
  return `${scale.id} - ${EGO_ENERGY_DISPLAY_NAMES[scale.id]} (${scale.raw})`;
}
