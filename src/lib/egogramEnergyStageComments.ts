import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';
import {
  plus243RecommendedRawRange,
  plus243StageBand,
  rawScoreToPlus243Tier,
  type Plus243Stage,
  type Plus243StageBand,
  type Plus243Tier,
} from '@/lib/egogram243Plus';
import { buildManualNineStageInsight } from '@/lib/egogramManualNineStage';

export type EgogramEnergyStageBand = Plus243StageBand;

export type EgogramEnergyInsight = {
  tier: Plus243Tier;
  stage: Plus243Stage;
  band: EgogramEnergyStageBand;
  comment: string;
  strengths: string[];
  cautions: string[];
  measures: string[];
};

export const EGO_ENERGY_DISPLAY_NAMES: Record<EgoScaleId, string> = {
  CP: '비판적 부모',
  NP: '양육적 부모',
  A: '성인 자아',
  FC: '자유로운 아이',
  AC: '순응하는 아이',
};

const { min: RECOMMENDED_RAW_MIN, max: RECOMMENDED_RAW_MAX } = plus243RecommendedRawRange();

function adjacentStageWarning(stage: Plus243Stage, raw: number, kind: 'peak' | 'low'): string[] {
  const lines: string[] = [];
  if (kind === 'peak') {
    if (stage >= 9) {
      lines.push(
        `다섯 이고그램 중 최고 ${stage}단계(${raw}점) — 9단계 최상 구간으로 소진·관계 부담에 유의하세요.`,
      );
    } else if (stage === 8) {
      lines.push(`최고 ${stage}단계(${raw}점) — 9단계로 치솟지 않도록 한 단계 낮추는 여지를 두세요.`);
    } else if (stage === 7) {
      lines.push(`최고 ${stage}단계(${raw}점) — 8단계 이상으로 올라가지 않도록 조절하세요.`);
    } else if (stage === 6) {
      lines.push(
        `최고 6단계(${raw}점) — 4~6단계(24~36점) 권장 안이나, 7단계(37점~)로 올라가면 과한 에너지가 보일 수 있습니다.`,
      );
    } else if (stage === 5) {
      lines.push(
        `최고 5단계(${raw}점) — 권장 구간이나, 한 단계 아래(4단계)로 내려가면 에너지가 약해질 수 있어 유의하세요.`,
      );
    }
  } else {
    if (stage <= 1) {
      lines.push(`최저 ${stage}단계(${raw}점) — 1~3단계(10~23점) 최하 구간으로 에너지 키우기 연습이 필요합니다.`);
    } else if (stage <= 3) {
      lines.push(
        `최저 ${stage}단계(${raw}점) — 4단계(24~27점) 권장 구간을 향해 인접 단계만 목표로 끌어올리세요.`,
      );
    } else if (stage === 4) {
      lines.push(`최저 4단계(${raw}점) — 권장 하단이나, 3단계(19~23점)로 내려가지 않도록 유지하세요.`);
    } else if (stage === 5) {
      lines.push(`최저 5단계(${raw}점) — 권장 구간(4~6단계)에서 안정적으로 활용 중입니다.`);
    }
  }
  return lines;
}

function wrapInsight(
  tier: Plus243Tier,
  comment: string,
  strengths: string[],
  cautions: string[],
  measures: string[],
): EgogramEnergyInsight {
  const band = plus243StageBand(tier.stage);
  return { tier, stage: tier.stage, band, comment, strengths, cautions, measures };
}

export function buildPeakEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const manual = buildManualNineStageInsight(scale.id, scale.raw, 'peak');
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · 합계 ${scale.raw}점 · 9단계 ${manual.stage}단계(${manual.tier.min}~${manual.tier.max}점) · ${manual.trait}`;
  const cautions = [...manual.cautions, ...adjacentStageWarning(manual.stage, scale.raw, 'peak')];
  return wrapInsight(manual.tier, comment, manual.strengths, cautions, manual.measures);
}

export function buildLowEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const manual = buildManualNineStageInsight(scale.id, scale.raw, 'low');
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · 합계 ${scale.raw}점 · 9단계 ${manual.stage}단계(${manual.tier.min}~${manual.tier.max}점) · ${manual.trait}`;
  const cautions = [...manual.cautions, ...adjacentStageWarning(manual.stage, scale.raw, 'low')];
  return wrapInsight(manual.tier, comment, manual.strengths, cautions, manual.measures);
}

export function formatEgogramEnergyHeadline(scale: EgoOkScaleScore): string {
  return `${scale.id} - ${EGO_ENERGY_DISPLAY_NAMES[scale.id]}`;
}

/** 최고·최저가 아닌 척도 — 9단계 4~6단계(24~36점) 밖일 때 */
export function buildOffRangeEgogramComment(scale: EgoOkScaleScore): string | null {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const stage = tier.stage;
  const inRecommended = stage >= 4 && stage <= 6;
  if (inRecommended) return null;

  const manual = buildManualNineStageInsight(scale.id, scale.raw, 'mid');
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const bandLabel =
    stage <= 3
      ? `1~3단계(10~23점) 부족 구간 — 권장 4~6단계(${RECOMMENDED_RAW_MIN}~${RECOMMENDED_RAW_MAX}점)보다 낮음`
      : `7~9단계(37~50점) 과다 구간 — 권장 4~6단계(${RECOMMENDED_RAW_MIN}~${RECOMMENDED_RAW_MAX}점)보다 높음`;

  const steer =
    stage <= 3
      ? '아래 대책으로 인접 단계만 목표로 에너지를 키우세요.'
      : '아래 대책으로 인접 단계만 목표로 에너지를 낮추세요.';

  const measurePreview = manual.measures.slice(0, 3).join(' · ');

  return `${scale.id} ${name} · ${scale.raw}점 · ${tier.stage}단계(${tier.min}~${tier.max}점). 최고·최저는 아닙니다. ${bandLabel}. ${manual.trait} ${steer} ${measurePreview}`;
}
