import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';
import {
  formatCurrentStageLeadIn,
  isPlus243RecommendedStage,
  plus243StageBand,
  rawScoreToPlus243Tier,
  type Plus243Stage,
  type Plus243StageBand,
  type Plus243Tier,
} from '@/lib/egogram243Plus';
import {
  buildPlus243StageGuidance,
  buildManualNineStageInsight,
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

function insightRoleForExtreme(stage: Plus243Stage): ManualInsightRole {
  if (isPlus243RecommendedStage(stage)) return 'inRange';
  if (stage >= 7) return 'peak';
  if (stage <= 3) return 'low';
  return 'offRange';
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
  const role = insightRoleForExtreme(tier.stage);
  const manual = buildManualNineStageInsight(scale.id, scale.raw, role);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · ${manual.trait}`;
  const cautions = [...manual.cautions, ...buildPlus243StageGuidance(scale.id, tier.stage)];
  return wrapInsight(manual.tier, comment, manual.strengths, cautions);
}

export function buildLowEgogramEnergyInsight(scale: EgoOkScaleScore): EgogramEnergyInsight {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const role = insightRoleForExtreme(tier.stage);
  const manual = buildManualNineStageInsight(scale.id, scale.raw, role);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const comment = `${scale.id} ${name} · ${manual.trait}`;
  const cautions = [...manual.cautions, ...buildPlus243StageGuidance(scale.id, tier.stage)];
  return wrapInsight(manual.tier, comment, manual.strengths, cautions);
}

export function formatEgogramEnergyHeadline(scale: EgoOkScaleScore): string {
  return `${scale.id} - ${EGO_ENERGY_DISPLAY_NAMES[scale.id]}`;
}

/** 최고·최저가 아닌 척도 — 9단계 4~6단계 밖일 때 */
export function buildOffRangeEgogramComment(scale: EgoOkScaleScore): string | null {
  const tier = rawScoreToPlus243Tier(scale.raw);
  if (isPlus243RecommendedStage(tier.stage)) return null;

  const manual = buildManualNineStageInsight(scale.id, scale.raw, 'offRange');
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const bandLabel =
    tier.stage <= 3
      ? '1~3단계 부족 — 권장 4~6단계보다 낮음'
      : '7~9단계 과잉 — 권장 4~6단계보다 높음';

  const steer =
    tier.stage <= 3
      ? '「자율치료 및 대책」 탭의 상담·설명 안내를 참고하세요.'
      : '「자율치료 및 대책」 탭의 상담·설명 안내를 참고하세요.';

  const hints = buildPlus243StageGuidance(scale.id, tier.stage).join(' ');

  return `${scale.id} ${name} · ${formatCurrentStageLeadIn(tier)}. ${bandLabel}. ${manual.trait} ${hints} ${steer}`;
}
