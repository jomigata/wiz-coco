import { EGO_ENERGY_DISPLAY_NAMES } from '@/lib/egogramEnergyStageComments';
import { buildEgogramContourSummary } from '@/lib/egoOkEgogramContour';
import {
  buildCounselorPairAndAdultGuidance,
  getManualNineStageBlock,
} from '@/lib/egogramManualNineStage';
import { rawScoreToPlus243Tier } from '@/lib/egogram243Plus';
import type { EgoOkReport, EgoOkScaleScore } from '@/lib/egoOkScoring';

export function formatEnergyLineWith243Plus(
  peakEgograms: EgoOkScaleScore[],
  lowEgograms: EgoOkScaleScore[],
): string {
  return `가장 높은 쪽 ${peakEgograms.map((s) => `${s.id} ${EGO_ENERGY_DISPLAY_NAMES[s.id]}`).join(' · ')}, 상대적으로 낮은 쪽 ${lowEgograms.map((s) => `${s.id} ${EGO_ENERGY_DISPLAY_NAMES[s.id]}`).join(' · ')}`;
}

export type IntegratedTraitSection = {
  contour: string;
  scaleBlocks: { id: string; title: string; trait: string; strength: string; caution: string }[];
  dynamics: string[];
  composite: string;
};

export function buildIntegratedTraitSections(report: EgoOkReport): IntegratedTraitSection {
  const scaleBlocks = report.egogram.map((s) => {
    const tier = rawScoreToPlus243Tier(s.raw);
    const block = getManualNineStageBlock(s.id, tier.stage);
    const name = EGO_ENERGY_DISPLAY_NAMES[s.id];
    return {
      id: s.id,
      title: `${s.id} · ${name}`,
      trait: block.trait,
      strength: block.strengths.filter(Boolean).slice(0, 2).join(' '),
      caution: block.cautions.filter(Boolean).slice(0, 2).join(' '),
    };
  });

  const pairLines = buildCounselorPairAndAdultGuidance(report.egogram).slice(0, 4);

  const composite = [
    buildEgogramContourSummary(report.egogram),
    `오케이그램 인생태도 「${report.lifePosition.kind}」 — ${report.lifePosition.summary}`,
    '에너지는 한곳에 과몰입되거나 잠시 쉬는 상태일 수 있으며, 이는 고치려는 결함이라기보다 재배치·조율의 대상으로 이해하는 것이 도움이 됩니다.',
  ].join(' ');

  return {
    contour: buildEgogramContourSummary(report.egogram),
    scaleBlocks,
    dynamics: pairLines,
    composite,
  };
}

/** @deprecated 텍스트-only — UI는 buildIntegratedTraitSections 사용 */
export function buildIntegratedEgogramTraitSummary(report: EgoOkReport): string {
  const sec = buildIntegratedTraitSections(report);
  const scales = sec.scaleBlocks
    .map((b) => `${b.title}: ${b.trait} (강점 ${b.strength || '—'} / 주의 ${b.caution || '—'})`)
    .join('\n');
  return [sec.contour, scales, sec.composite, ...sec.dynamics].join('\n\n');
}
