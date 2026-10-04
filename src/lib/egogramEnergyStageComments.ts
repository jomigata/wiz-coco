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

const SCALE_ROLE: Record<EgoScaleId, { benefit: string; excessRisk: string; deficitRisk: string }> = {
  CP: {
    benefit: '원칙·기준·책임',
    excessRisk: '비판·통제·완벽주의',
    deficitRisk: '기준·경계·피드백',
  },
  NP: {
    benefit: '돌봄·격려·헌신',
    excessRisk: '과보호·희생·간섭',
    deficitRisk: '지지·위로·관심 표현',
  },
  A: {
    benefit: '사실·논리·현실 검토',
    excessRisk: '냉정·기계적 판단·감정 배제',
    deficitRisk: '선택지 정리·합리적 결정',
  },
  FC: {
    benefit: '창의·호기심·유연한 시도',
    excessRisk: '즉흥·산만·약속 경시',
    deficitRisk: '즐거움·표현·새로운 시도',
  },
  AC: {
    benefit: '협력·배려·규칙 준수',
    excessRisk: '과한 순응·의존·자기 억압',
    deficitRisk: '경청·합의·관계 조율',
  },
};

function peakStrength(id: EgoScaleId, stage: Plus243Stage, raw: number): string {
  const role = SCALE_ROLE[id];
  return `${role.benefit}을 사용하는 에너지는 ${stage}단계(${raw})로서 적당하게 잘 활용하고 있습니다.`;
}

function peakCaution(stage: Plus243Stage, raw: number): string {
  if (stage >= 9) {
    return `다섯 이고그램 중에 최고 높은 ${stage}단계(${raw})로 9단계 에너지 사용에 대한 소진·관계 부담에 주의가 필요합니다.`;
  }
  return `다섯 이고그램 중에 최고 높은 ${stage}단계(${raw})로 다음단계인 ${stage + 1}단계의 에너지사용이 되지 않도록 주의가 필요합니다.`;
}

function lowStrength(id: EgoScaleId, stage: Plus243Stage, raw: number, band: Plus243StageBand): string {
  const role = SCALE_ROLE[id];
  const lead =
    band === 'normal'
      ? '일상·업무에서 안정적으로 잘 활용하고 있습니다.'
      : band === 'deficit'
        ? '에너지는 낮지만 부담이 적은 면이 있습니다.'
        : '절대 에너지는 높은 편이나 상대적으로는 낮게 나타납니다.';
  return `${lead} ${role.benefit}을 ${stage}단계(${raw}) 권장 구간에서 잘 활용하고 있어 좋습니다.`;
}

function lowCaution(stage: Plus243Stage, raw: number): string {
  if (stage <= 1) {
    return `다섯 이고그램 중에 가장 낮은 ${stage}단계(${raw})로 에너지를 키우는 연습이 필요합니다.`;
  }
  return `다섯 이고그램 중에 가장 낮은 ${stage}단계(${raw})로 이전 단계 ${stage - 1}단계로 내려가지 않도록 주의가 필요합니다.`;
}

function wrapInsight(tier: Plus243Tier, comment: string, strengths: string[], cautions: string[]): EgogramEnergyInsight {
  const band = plus243StageBand(tier.stage);
  return { tier, stage: tier.stage, band, comment, strengths, cautions };
}

export function buildPeakEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const stage = tier.stage;
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · 척도 합계 ${scale.raw}점 · 다섯 척도 중 최고 사용 에너지입니다.`;
  return wrapInsight(tier, comment, [peakStrength(scale.id, stage, scale.raw)], [peakCaution(stage, scale.raw)]);
}

export function buildLowEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const stage = tier.stage;
  const band = plus243StageBand(stage);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · 척도 합계 ${scale.raw}점 · 다섯 척도 중 상대적으로 낮은 사용 에너지입니다.`;
  return wrapInsight(
    tier,
    comment,
    [lowStrength(scale.id, stage, scale.raw, band)],
    [lowCaution(stage, scale.raw)],
  );
}

export function formatEgogramEnergyHeadline(scale: EgoOkScaleScore): string {
  return `${scale.id} - ${EGO_ENERGY_DISPLAY_NAMES[scale.id]}`;
}
