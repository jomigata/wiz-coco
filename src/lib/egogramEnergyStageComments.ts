import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';
import {
  formatCurrentStageLeadIn,
  isPlus243RecommendedStage,
  plus243AdjacentStageHints,
  plus243RecommendedRawRange,
  plus243StageBand,
  rawScoreToPlus243Tier,
  type Plus243Stage,
  type Plus243StageBand,
  type Plus243Tier,
} from '@/lib/egogram243Plus';
import {
  buildManualNineStageInsight,
  resolveManualInsightRole,
  type ManualInsightRole,
} from '@/lib/egogramManualNineStage';

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

const { min: RECOMMENDED_RAW_MIN, max: RECOMMENDED_RAW_MAX } = plus243RecommendedRawRange();

function insightRoleForExtreme(stage: Plus243Stage, kind: 'peak' | 'low'): ManualInsightRole {
  if (isPlus243RecommendedStage(stage)) return 'inRange';
  if (stage >= 7) return 'peak';
  if (stage <= 3) return 'low';
  return kind === 'peak' ? 'offRange' : 'offRange';
}

function wrapInsight(
  tier: Plus243Tier,
  comment: string,
  strengths: string[],
  cautions: string[],
): EgogramEnergyInsight {
  const band = plus243StageBand(tier.stage);
  return { tier, stage: tier.stage, band, comment, strengths, cautions };
}

export function buildPeakEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const role = insightRoleForExtreme(tier.stage, 'peak');
  const manual = buildManualNineStageInsight(scale.id, scale.raw, role);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · 합계 ${scale.raw}점 · ${manual.trait}`;
  const cautions = [...manual.cautions, ...plus243AdjacentStageHints(tier.stage)];
  return wrapInsight(manual.tier, comment, manual.strengths, cautions);
}

export function buildLowEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const role = insightRoleForExtreme(tier.stage, 'low');
  const manual = buildManualNineStageInsight(scale.id, scale.raw, role);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · 합계 ${scale.raw}점 · ${manual.trait}`;
  const cautions = [...manual.cautions, ...plus243AdjacentStageHints(tier.stage)];
  return wrapInsight(manual.tier, comment, manual.strengths, cautions);
}

export function formatEgogramEnergyHeadline(scale: EgoOkScaleScore): string {
  return `${scale.id} - ${EGO_ENERGY_DISPLAY_NAMES[scale.id]}`;
}

/** 최고·최저가 아닌 척도 — 9단계 4~6단계(24~36점) 밖일 때 */
export function buildOffRangeEgogramComment(scale: EgoOkScaleScore): string | null {
  const tier = rawScoreToPlus243Tier(scale.raw);
  if (isPlus243RecommendedStage(tier.stage)) return null;

  const manual = buildManualNineStageInsight(scale.id, scale.raw, 'offRange');
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const bandLabel =
    tier.stage <= 3
      ? `1~3단계(10~23점) 부족 — 권장 4~6단계(${RECOMMENDED_RAW_MIN}~${RECOMMENDED_RAW_MAX}점)보다 낮음`
      : `7~9단계(37~50점) 과잉 — 권장 4~6단계(${RECOMMENDED_RAW_MIN}~${RECOMMENDED_RAW_MAX}점)보다 높음`;

  const steer =
    tier.stage <= 3
      ? '「자율치료 및 대책」 탭(상담사용 · 내담자용)에서 부족 구간 안내를 확인하세요.'
      : '「자율치료 및 대책」 탭(상담사용 · 내담자용)에서 과잉 구간 안내를 확인하세요.';

  const hints = plus243AdjacentStageHints(tier.stage).join(' ');

  return `${scale.id} ${name} · ${formatCurrentStageLeadIn(tier, scale.raw)}. ${bandLabel}. ${manual.trait} ${hints} ${steer}`;
}
