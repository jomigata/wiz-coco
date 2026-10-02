import type { EgoOkCompositeColumn, EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';
import {
  formatPlus243StageLabel,
  plus243StageBand,
  plus243StageBandLabel,
  rawScoreToPlus243Tier,
  type Plus243Stage,
  type Plus243StageBand,
  type Plus243Tier,
} from '@/lib/egogram243Plus';

export type EgogramEnergyStageBand = Plus243StageBand;

export type EgogramEnergyInsight = {
  tier: Plus243Tier;
  stage: Plus243Stage;
  band: EgogramEnergyStageBand;
  stageLabel: string;
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

const STAGE_DETAIL: Record<
  Plus243Stage,
  { strength: string; caution: string; peakLead: string; lowLead: string }
> = {
  1: {
    strength: '에너지가 매우 낮아 부담·압박이 적고, 관계에서 가벼운 편일 수 있습니다.',
    caution: '필요한 순간에도 자아가 잘 올라오지 않아 회피·공백으로 읽힐 수 있습니다.',
    peakLead: '다섯 척도 중 상대 최고이나, 243+ 1단계(부족)로 절대적으로는 매우 낮은 편입니다.',
    lowLead: '243+ 1단계(부족)로, 이 자아를 거의 쓰지 않는 경향이 뚜렷합니다.',
  },
  2: {
    strength: '과한 사용 부담은 적으나, 상황에 맞춰 키우기 위한 여지가 남아 있습니다.',
    caution: '기능이 약해 중요한 장면에서 준비·표현이 늦어질 수 있습니다.',
    peakLead: '상대적으로는 최고점이나 2단계(부족)에 해당합니다.',
    lowLead: '2단계(부족)로, 일상에서 이 자아를 뚜렷하게 쓰지 않는 편입니다.',
  },
  3: {
    strength: '부족 구간이지만 최저 수준은 아니어서, 의식적 연습으로 회복 가능성이 있습니다.',
    caution: '3단계(부족 상단)이므로 4단계(보통)로 올리지 않으면 습관적으로 비활성화될 수 있습니다.',
    peakLead: '다섯 척도 중 최고이나 3단계(부족)에 머물러 있습니다.',
    lowLead: '3단계(부족)로, 다른 척도 대비 가장 낮게 나타납니다.',
  },
  4: {
    strength: '보통 구간 하단으로, 과하지 않게 기능을 쓰기 시작하기 좋습니다.',
    caution: '4단계(보통)이므로 급격한 확대·축소보다는 리듬을 유지하는 것이 좋습니다.',
    peakLead: '4단계(보통)로, 에너지가 균형에 가깝게 쓰입니다.',
    lowLead: '상대 최저이나 4단계(보통)라 절대적으로 극단적 부족은 아닐 수 있습니다.',
  },
  5: {
    strength: '보통 구간 중심으로, 일상·업무에서 안정적으로 활용하기 쉽습니다.',
    caution: '5단계(보통)에서 6단계(보통 상단)로 넘어갈 때 과함 전조를 점검하세요.',
    peakLead: '5단계(보통)로, 가장 많이 쓰는 에너지가 무리 없이 작동합니다.',
    lowLead: '상대적으로는 낮지만 5단계(보통)로 기능 자체는 유지되고 있습니다.',
  },
  6: {
    strength: '보통 구간 상단으로, 역할 수행·관계 기여에 힘이 실립니다.',
    caution: '6단계(보통 상단)이므로 7단계(과함)로 치솟지 않도록 강도를 조절하세요.',
    peakLead: '6단계(보통 상단)로, 다섯 척도 중 두드러지게 높게 나타납니다.',
    lowLead: '상대 최저이나 6단계(보통 상단)로 절대적으로는 충분한 편입니다.',
  },
  7: {
    strength: '과함 구간 하단으로, 상황 주도·추진력이 분명히 드러날 수 있습니다.',
    caution: '7단계(과함)이므로 과잉·고집·소진 신호를 함께 봐야 합니다.',
    peakLead: '7단계(과함)로, 이 자아 사용이 강하게 나타납니다.',
    lowLead: '상대적으로는 낮지만 7단계(과함)라 절대 에너지는 높은 편입니다.',
  },
  8: {
    strength: '과함 구간에서 리더십·영향력이 크게 작용할 수 있습니다.',
    caution: '8단계(과함)로 주변에 부담·저항을 줄 수 있어 강도 조절이 필요합니다.',
    peakLead: '8단계(과함)로, 에너지가 매우 강하게 쓰입니다.',
    lowLead: '8단계(과함)이나 타 척도와의 분배·균형 이슈로 읽는 것이 타당합니다.',
  },
  9: {
    strength: '과함 최상단으로, 위기·변화 상황에서 강한 추진·통제가 가능합니다.',
    caution: '9단계(과함)는 번아웃·관계 마찰 위험이 커서 의식적 완화·위임이 필요합니다.',
    peakLead: '9단계(과함)로, 이 자아가 압도적으로 높게 나타납니다.',
    lowLead: '9단계(과함)로, 상대적으로만 낮고 절대적으로는 매우 높은 편입니다.',
  },
};

function roleStrength(id: EgoScaleId, band: Plus243StageBand, stage: Plus243Stage): string {
  const role = SCALE_ROLE[id];
  const detail = STAGE_DETAIL[stage].strength;
  if (band === 'deficit') {
    return `${detail} ${role.excessRisk} 부담은 적을 수 있으나, ${role.benefit}·${role.deficitRisk}이(가) 약해질 수 있습니다.`;
  }
  if (band === 'normal') {
    return `${detail} ${role.benefit}을(를) 과하지 않게 활용하기 좋습니다.`;
  }
  return `${detail} ${role.benefit}이(가) 강하게 드러날 수 있으나 ${role.excessRisk}에 쏠릴 수 있습니다.`;
}

function roleCaution(id: EgoScaleId, band: Plus243StageBand, stage: Plus243Stage, context: 'peak' | 'low'): string {
  const role = SCALE_ROLE[id];
  const detail = STAGE_DETAIL[stage].caution;
  const ctx =
    context === 'peak' ? '다섯 척도 중 최고점 기준으로 ' : '다섯 척도 중 최저점 기준으로 ';
  if (band === 'deficit') {
    return `${ctx}${detail} ${role.balanceTip}으로 4단계(보통) 쪽 회복을 검토하세요.`;
  }
  if (band === 'normal') {
    return `${ctx}${detail} ${role.balanceTip}을 유지하면 3단계(부족)·7단계(과함)로의 이탈을 줄일 수 있습니다.`;
  }
  return `${ctx}${detail} ${role.balanceTip}으로 강도를 낮추세요.`;
}

function wrapInsight(tier: Plus243Tier, comment: string, strengths: string[], cautions: string[]): EgogramEnergyInsight {
  const band = plus243StageBand(tier.stage);
  return {
    tier,
    stage: tier.stage,
    band,
    stageLabel: formatPlus243StageLabel(tier),
    comment,
    strengths,
    cautions,
  };
}

/** 최고 사용에너지 — 243+ 플러스 9단계 */
export function buildPeakEgogramEnergyInsight(
  scale: EgoOkScaleScore,
  col: EgoOkCompositeColumn,
): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const stage = tier.stage;
  const band = plus243StageBand(stage);
  const bandKo = plus243StageBandLabel(band);
  const dom = egogramDominance(scale.positiveRaw, scale.negativeRaw);
  const trait = dominantTrait(col, dom);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const lead = STAGE_DETAIL[stage].peakLead;

  const comment = `${name} · 243+ 플러스 ${stage}단계(${bandKo}) · ${lead} ${poleLabel(dom)} 기준 「${trait}」 양상이 두드러집니다.`;

  return wrapInsight(tier, comment, [roleStrength(scale.id, band, stage)], [roleCaution(scale.id, band, stage, 'peak')]);
}

/** 부족한 사용에너지 — 243+ 플러스 9단계 */
export function buildLowEgogramEnergyInsight(
  scale: EgoOkScaleScore,
  col: EgoOkCompositeColumn,
): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const stage = tier.stage;
  const band = plus243StageBand(stage);
  const bandKo = plus243StageBandLabel(band);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const lead = STAGE_DETAIL[stage].lowLead;

  const comment = `${name} · 243+ 플러스 ${stage}단계(${bandKo}) · ${lead} (많이 쓰는 쪽: ${col.topLabel} · 상대적으로 약한 쪽: ${col.bottomLabel})`;

  return wrapInsight(tier, comment, [roleStrength(scale.id, band, stage)], [roleCaution(scale.id, band, stage, 'low')]);
}

export function formatEgogramEnergyHeadline(scale: EgoOkScaleScore): string {
  return `${scale.id} - ${EGO_ENERGY_DISPLAY_NAMES[scale.id]}`;
}
