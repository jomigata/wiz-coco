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

const CP_SEVEN_SOFT =
  '7단계에 가까워지면 지나치게 엄하거나 규정에 얽매여 딱딱해 보이거나, 유연성이 줄어 관계가 경직될 수 있어 강도 조절이 필요합니다.';

function peakCautions(id: EgoScaleId, stage: Plus243Stage, raw: number): string[] {
  if (stage >= 9) {
    return [
      `다섯 이고그램 중에 최고 높은 ${stage}단계(${raw})로 9단계 에너지 사용에 대한 소진·관계 부담에 주의가 필요합니다.`,
    ];
  }
  if (stage === 8) {
    return [
      `다섯 이고그램 중에 최고 높은 ${stage}단계(${raw})로 9단계로 치솟지 않도록 주의가 필요합니다.`,
      id === 'CP' ? CP_SEVEN_SOFT : `${SCALE_ROLE[id].excessRisk} 쪽 부작용이 커질 수 있습니다.`,
    ];
  }
  if (stage === 7) {
    return [
      `다섯 이고그램 중에 최고 높은 ${stage}단계(${raw})로 8단계 이상의 에너지 사용이 되지 않도록 주의가 필요합니다.`,
      id === 'CP' ? CP_SEVEN_SOFT : `${SCALE_ROLE[id].excessRisk}가 두드러질 수 있어 한 단계 낮추는 여지를 두세요.`,
    ];
  }
  if (stage === 6) {
    return [
      `다섯 이고그램 중에 최고 높은 6단계(${raw})로 5단계는 권장(4~6단계) 범위이므로 일상 조절만으로 충분합니다. 다만 7단계로 올라가면 과한 에너지가 보일 수 있어 주의가 필요합니다.`,
      id === 'CP' ? CP_SEVEN_SOFT : `7단계로 올라가면 ${SCALE_ROLE[id].excessRisk}가 부각될 수 있습니다.`,
    ];
  }
  if (stage === 5) {
    const role = SCALE_ROLE[id];
    return [
      `다섯 이고그램 중에 최고 높은 5단계(${raw})입니다. 4단계는 여전히 권장 구간이지만, ${role.benefit} 에너지가 더 약해지면 ${role.deficitRisk}이(가) 부족해질 수 있어 4단계 아래로 내려가지 않도록 주의가 필요합니다.`,
    ];
  }
  return [
    `다섯 이고그램 중에 최고 높은 ${stage}단계(${raw})로 다음 단계보다 낮은 권장 구간을 유지하도록 주의가 필요합니다.`,
  ];
}

function lowStrength(id: EgoScaleId, stage: Plus243Stage, raw: number, band: Plus243StageBand): string[] {
  const role = SCALE_ROLE[id];
  const lines: string[] = [];
  if (band === 'normal' && stage === 5 && id === 'FC') {
    lines.push(
      '일상·업무에서 안정적으로 잘 활용하고 있습니다.',
      `${role.benefit}을 ${stage}단계(${raw}) 권장 구간에서 잘 활용하고 있어 좋습니다.`,
      '현재 5단계(권장)이므로 위·아래로 1단계 정도 이동해도 큰 문제는 없습니다. 다만 활발함·즐거움이 필요한 환경에서는 1단계 위 수준의 에너지가, 차분한 분위기가 요구되는 곳에서는 1단계 아래 수준이 더 맞을 수 있습니다.',
    );
    return lines;
  }
  const lead =
    band === 'normal'
      ? '일상·업무에서 안정적으로 잘 활용하고 있습니다.'
      : band === 'deficit'
        ? '에너지는 낮지만 부담이 적은 면이 있습니다.'
        : '절대 에너지는 높은 편이나 상대적으로는 낮게 나타납니다.';
  lines.push(`${lead} ${role.benefit}을 ${stage}단계(${raw}) 권장 구간에서 잘 활용하고 있어 좋습니다.`);
  if (band === 'normal' && stage === 5) {
    lines.push(
      '5단계(권장)이므로 1단계 정도 위·아래 이동은 환경에 따라 조절해도 무방합니다.',
    );
  }
  return lines;
}

function lowCautions(id: EgoScaleId, stage: Plus243Stage, raw: number): string[] {
  if (id === 'FC' && stage <= 3) {
    return [
      `다섯 이고그램 중에 가장 낮은 ${stage}단계(${raw})로, 자신감과 자유로운·창의적 표현이 줄어들면 생활이 폐쇄적으로 흐를 수 있어 주의가 필요합니다.`,
      '4~6단계 권장 구간을 향해 작은 표현·시도를 의식적으로 늘려 보세요.',
    ];
  }
  if (id === 'FC' && stage === 5) {
    return [
      '4단계는 여전히 권장 구간이므로 특별한 경고는 필요 없으나, 삶의 활력·생기 유지를 위해 한 단계 아래로 빠지지 않도록 주의하세요.',
    ];
  }
  if (stage <= 1) {
    return [
      `다섯 이고그램 중에 가장 낮은 ${stage}단계(${raw})로, ${SCALE_ROLE[id].deficitRisk}이(가) 더 약해질 수 있어 에너지를 키우는 연습이 필요합니다.`,
    ];
  }
  const prev = (stage - 1) as Plus243Stage;
  if (prev >= 4) {
    return [
      `다섯 이고그램 중에 가장 낮은 ${stage}단계(${raw})입니다. ${prev}단계는 권장 구간이지만, ${SCALE_ROLE[id].benefit}이(가) 더 약해지면 ${SCALE_ROLE[id].deficitRisk} 부족으로 이어질 수 있어 ${prev}단계 아래로 내려가지 않도록 주의가 필요합니다.`,
    ];
  }
  return [
    `다섯 이고그램 중에 가장 낮은 ${stage}단계(${raw})로 ${prev}단계로 내려가면 ${SCALE_ROLE[id].deficitRisk}이(가) 더 부족해질 수 있어 내려가지 않도록 주의가 필요합니다.`,
  ];
}

function wrapInsight(tier: Plus243Tier, comment: string, strengths: string[], cautions: string[]): EgogramEnergyInsight {
  const band = plus243StageBand(tier.stage);
  return { tier, stage: tier.stage, band, comment, strengths, cautions };
}

export function buildPeakEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const stage = tier.stage;
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · 이고그램 합계 ${scale.raw}점 · 다섯 이고그램 중 최고 사용 에너지입니다.`;
  return wrapInsight(tier, comment, [peakStrength(scale.id, stage, scale.raw)], peakCautions(scale.id, stage, scale.raw));
}

export function buildLowEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const stage = tier.stage;
  const band = plus243StageBand(stage);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · 이고그램 합계 ${scale.raw}점 · 다섯 이고그램 중 상대적으로 낮은 사용 에너지입니다.`;
  return wrapInsight(
    tier,
    comment,
    lowStrength(scale.id, stage, scale.raw, band),
    lowCautions(scale.id, stage, scale.raw),
  );
}

export function formatEgogramEnergyHeadline(scale: EgoOkScaleScore): string {
  return `${scale.id} - ${EGO_ENERGY_DISPLAY_NAMES[scale.id]}`;
}
