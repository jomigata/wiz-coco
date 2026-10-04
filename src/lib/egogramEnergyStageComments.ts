import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';
import {
  plus243StageBand,
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

function stageNeighbor(stage: Plus243Stage, delta: -1 | 1): Plus243Stage | null {
  const n = stage + delta;
  if (n < 1 || n > 9) return null;
  return n as Plus243Stage;
}

function isDeficitStage(stage: Plus243Stage): boolean {
  return stage <= 3;
}

function isExcessStage(stage: Plus243Stage): boolean {
  return stage >= 7;
}

function isRecommendedStage(stage: Plus243Stage): boolean {
  return stage >= 4 && stage <= 6;
}

function adjacentProblemDriftStages(stage: Plus243Stage): Plus243Stage[] {
  const risks: Plus243Stage[] = [];
  const down = stageNeighbor(stage, -1);
  const up = stageNeighbor(stage, 1);
  if (down !== null && isDeficitStage(down)) risks.push(down);
  if (up !== null && isExcessStage(up)) risks.push(up);
  return risks;
}

function formatStageList(stages: Plus243Stage[]): string {
  if (stages.length === 0) return '';
  if (stages.length === 1) return `${stages[0]}단계`;
  return `${stages[0]}단계·${stages[1]}단계`;
}

function balanceTipClosing(stage: Plus243Stage, balanceTip: string): string {
  const band = plus243StageBand(stage);
  if (band === 'deficit') {
    const up = stageNeighbor(stage, 1);
    if (up !== null && isDeficitStage(up)) {
      return `${balanceTip}으로 ${up}단계를 거쳐 4단계 쪽으로 올려 보세요.`;
    }
    if (stage === 3) {
      return `${balanceTip}으로 바로 위 4단계 쪽으로 올려 보세요.`;
    }
    return `${balanceTip}으로 단계적으로 4단계 쪽으로 올려 보세요.`;
  }
  if (band === 'excess') {
    const down = stageNeighbor(stage, -1);
    if (down !== null && isRecommendedStage(down)) {
      return `${balanceTip}으로 ${down}단계 쪽 강도를 낮추세요.`;
    }
    return `${balanceTip}으로 6단계 쪽으로 단계적으로 낮추세요.`;
  }
  const drift = adjacentProblemDriftStages(stage);
  if (drift.length === 0) {
    return `${balanceTip}을 유지하면 4~6단계 권장 구간에 머무는 데 도움이 됩니다.`;
  }
  return `${balanceTip}을 유지하면 ${formatStageList(drift)}로의 이탈을 줄일 수 있습니다.`;
}

const STAGE_DETAIL: Record<
  Plus243Stage,
  { strength: string; caution: string; peakLead: string; lowLead: string }
> = {
  1: {
    strength: '에너지가 매우 낮아 부담·압박이 적고, 관계에서 가벼운 편일 수 있습니다.',
    caution: '에너지 사용이 매우 적어 필요한 자아가 잘 올라오지 않을 수 있습니다.',
    peakLead: '다섯 척도 중 상대 최고이나, 절대적으로는 매우 낮은 편입니다.',
    lowLead: '이 자아를 거의 쓰지 않는 경향이 뚜렷합니다.',
  },
  2: {
    strength: '과한 사용 부담은 적으나, 상황에 맞춰 키우기 위한 여지가 남아 있습니다.',
    caution: '에너지 사용이 부족해 중요한 장면에서 준비·표현이 늦어질 수 있습니다.',
    peakLead: '상대적으로는 최고점이나, 전체 9단계 기준으로는 낮은 편입니다.',
    lowLead: '일상에서 이 자아를 뚜렷하게 쓰지 않는 편입니다.',
  },
  3: {
    strength: '부족 구간이지만 최저 수준은 아니어서, 의식적 연습으로 회복 가능성이 있습니다.',
    caution: '4단계로 올리지 않으면 습관적으로 비활성화될 수 있습니다.',
    peakLead: '다섯 척도 중 최고이나, 9단계 기준 하단(1~3)에 머물러 있습니다.',
    lowLead: '다른 척도 대비 가장 낮게 나타납니다.',
  },
  4: {
    strength: '과하지 않게 기능을 쓰기 좋은 수준입니다.',
    caution: '바로 아래 3단계로 내려가지 않도록 리듬을 유지하는 것이 좋습니다.',
    peakLead: '에너지가 균형에 가깝게 쓰입니다.',
    lowLead: '상대 최저이나 절대적으로 극단적 부족은 아닐 수 있습니다.',
  },
  5: {
    strength: '일상·업무에서 안정적으로 활용하기 쉽습니다.',
    caution: '바로 옆 단계(4·6) 안에서 조절하며 급격한 변화는 피하는 것이 좋습니다.',
    peakLead: '가장 많이 쓰는 에너지가 무리 없이 작동합니다.',
    lowLead: '상대적으로는 낮지만 기능 자체는 유지되고 있습니다.',
  },
  6: {
    strength: '역할 수행·관계 기여에 힘이 실리는 수준입니다.',
    caution: '7단계로 치솟지 않도록 강도를 조절하세요.',
    peakLead: '다섯 척도 중 두드러지게 높게 나타납니다.',
    lowLead: '상대 최저이나 절대적으로는 충분한 편입니다.',
  },
  7: {
    strength: '상황 주도·추진력이 분명히 드러날 수 있습니다.',
    caution: '8단계로 치솟지 않도록 과잉·소진 신호를 함께 봐야 합니다.',
    peakLead: '이 자아 사용이 강하게 나타납니다.',
    lowLead: '상대적으로는 낮지만 절대 에너지는 높은 편입니다.',
  },
  8: {
    strength: '리더십·영향력이 크게 작용할 수 있습니다.',
    caution: '9단계로 치솟거나 주변에 부담을 줄 수 있어 강도 조절이 필요합니다.',
    peakLead: '에너지가 매우 강하게 쓰입니다.',
    lowLead: '타 척도와의 분배·균형 이슈로 읽는 것이 타당합니다.',
  },
  9: {
    strength: '위기·변화 상황에서 강한 추진·통제가 가능합니다.',
    caution: '번아웃·관계 마찰 위험이 커서 의식적 완화·위임이 필요합니다.',
    peakLead: '이 자아가 압도적으로 높게 나타납니다.',
    lowLead: '상대적으로만 낮고 절대적으로는 매우 높은 편입니다.',
  },
};

function roleStrength(id: EgoScaleId, band: Plus243StageBand, stage: Plus243Stage): string {
  const role = SCALE_ROLE[id];
  const detail = STAGE_DETAIL[stage].strength;
  if (band === 'deficit') {
    return `${detail} ${role.excessRisk} 부담은 적을 수 있으나, ${role.benefit}·${role.deficitRisk}이(가) 약해질 수 있습니다.`;
  }
  if (band === 'normal') {
    return `${detail} ${role.benefit}을(를) 4~6단계 권장 구간에서 과하지 않게 활용하기 좋습니다.`;
  }
  return `${detail} ${role.benefit}이(가) 강하게 드러날 수 있으나 ${role.excessRisk}에 쏠릴 수 있습니다.`;
}

function roleCaution(id: EgoScaleId, band: Plus243StageBand, stage: Plus243Stage, context: 'peak' | 'low'): string {
  const role = SCALE_ROLE[id];
  const detail = STAGE_DETAIL[stage].caution;
  const ctx =
    context === 'peak' ? '다섯 척도 중 최고점 기준으로 ' : '다섯 척도 중 최저점 기준으로 ';
  const stageHint = stage === 6 || stage === 3 || stage === 7 ? ` (현재 ${stage}단계)` : '';
  return `${ctx}${detail}${stageHint} ${balanceTipClosing(stage, role.balanceTip)}`;
}

function wrapInsight(tier: Plus243Tier, comment: string, strengths: string[], cautions: string[]): EgogramEnergyInsight {
  const band = plus243StageBand(tier.stage);
  return {
    tier,
    stage: tier.stage,
    band,
    comment,
    strengths,
    cautions,
  };
}

export function buildPeakEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const stage = tier.stage;
  const band = plus243StageBand(stage);
  const role = SCALE_ROLE[scale.id];
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const lead = STAGE_DETAIL[stage].peakLead;

  const comment = `${scale.id} ${name} · 척도 합계 ${scale.raw}점 · ${lead} ${role.benefit} 양상이 두드러집니다.`;

  return wrapInsight(tier, comment, [roleStrength(scale.id, band, stage)], [roleCaution(scale.id, band, stage, 'peak')]);
}

export function buildLowEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const stage = tier.stage;
  const band = plus243StageBand(stage);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const lead = STAGE_DETAIL[stage].lowLead;

  const comment = `${scale.id} ${name} · 척도 합계 ${scale.raw}점 · ${lead}`;

  return wrapInsight(tier, comment, [roleStrength(scale.id, band, stage)], [roleCaution(scale.id, band, stage, 'low')]);
}

export function formatEgogramEnergyHeadline(scale: EgoOkScaleScore): string {
  return `${scale.id} - ${EGO_ENERGY_DISPLAY_NAMES[scale.id]}`;
}
