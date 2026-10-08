import { EGO_ENERGY_DISPLAY_NAMES } from '@/lib/egogramEnergyStageComments';
import {
  plus243TierToAscii,
  rawScoreToPlus243Tier,
  type Pattern243Plus,
} from '@/lib/egogram243Plus';
import { buildManualNineStageInsight } from '@/lib/egogramManualNineStage';
import type { EgoOkReport, EgoOkScaleScore } from '@/lib/egoOkScoring';

export function formatReport243PlusCode(pattern243Plus: Pattern243Plus): string {
  return pattern243Plus.codeLabel || pattern243Plus.codeAscii;
}

/** CP~AC 다섯 척도를 통합한 성격특성 요약 (2~3문단) */
export function buildIntegratedEgogramTraitSummary(report: EgoOkReport): string {
  const parts = report.egogram.map((s) => {
    const tier = rawScoreToPlus243Tier(s.raw);
    const manual = buildManualNineStageInsight(s.id, s.raw, 'inRange');
    const name = EGO_ENERGY_DISPLAY_NAMES[s.id];
    return `${s.id}(${name}) ${tier.stage}단계 ${plus243TierToAscii(tier)} — ${manual.trait}`;
  });

  const cp = report.egogram.find((s) => s.id === 'CP')!;
  const np = report.egogram.find((s) => s.id === 'NP')!;
  const a = report.egogram.find((s) => s.id === 'A')!;
  const fc = report.egogram.find((s) => s.id === 'FC')!;
  const ac = report.egogram.find((s) => s.id === 'AC')!;

  const parentLine =
    cp.raw + np.raw >= fc.raw + ac.raw
      ? '부모 에고(CP·NP) 쪽 에너지가 두드러져 규범·돌봄·기준이 대인관계와 자기관리에 크게 작용합니다.'
      : '아이 에고(FC·AC) 쪽 에너지가 상대적으로 두드러져 감정·순응·자유 표현이 행동 선택에 크게 작용합니다.';

  const adultLine =
    a.raw >= 28
      ? '성인(A) 에너지가 충분해 현실 판단과 조율로 위 에너지를 통합하기 쉬운 편입니다.'
      : '성인(A) 에너지가 상대적으로 약하면 CP·NP·FC·AC 간 충돌을 한 번에 정리하기 어려울 수 있어, A를 의식적으로 키우는 것이 도움이 됩니다.';

  const lifeLine = `오케이그램 인생태도 「${report.lifePosition.kind}」와 함께 보면, 대인·자기 축에서 ${report.lifePosition.summary}`;

  return [
    `다섯 이고그램을 종합하면, ${parts.join(' · ')}.`,
    `${parentLine} ${adultLine}`,
    `${lifeLine} 243+ 통합 유형 ${formatReport243PlusCode(report.pattern243Plus)}은 척도별 9단계 에너지 조합으로, 권장 구간(4~6단계)과의 차이는 자율치료·대책 탭에서 조절 방향을 참고할 수 있습니다.`,
  ].join('\n\n');
}

export function formatEnergyLineWith243Plus(
  peakEgograms: EgoOkScaleScore[],
  lowEgograms: EgoOkScaleScore[],
  pattern243Plus: Pattern243Plus,
): string {
  const plus = formatReport243PlusCode(pattern243Plus);
  return `가장 높은 쪽 ${peakEgograms.map((s) => `${s.id} ${EGO_ENERGY_DISPLAY_NAMES[s.id]}`).join(' · ')}, 상대적으로 낮은 쪽 ${lowEgograms.map((s) => `${s.id} ${EGO_ENERGY_DISPLAY_NAMES[s.id]}`).join(' · ')} · 243+ ${plus}`;
}
