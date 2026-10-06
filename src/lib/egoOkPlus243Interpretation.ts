import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';
import { normalizeEgoOkGender } from '@/lib/egoOkScoring';
import {
  formatCurrentStageLeadIn,
  plus243TierToAscii,
  rawScoreToPlus243Tier,
  type Pattern243Plus,
  type Plus243Stage,
} from '@/lib/egogram243Plus';
import { buildPlus243StageGuidance } from '@/lib/egogramManualNineStage';

const SCALE_ORDER: EgoOkScaleScore['id'][] = ['CP', 'NP', 'A', 'FC', 'AC'];

const SECTION_LABELS: Record<string, string> = {
  '1': 'CP (비판적 부모)',
  '2': 'NP (양육적 부모)',
  '3': '성인 자아 (A)',
  '4': 'FC (자유로운 아이)',
  '5': 'AC (순응하는 아이)',
  '6': '9단계 기준 종합 평가',
};

function pickTiedExtremeScales(scales: EgoOkScaleScore[], mode: 'max' | 'min'): EgoOkScaleScore[] {
  if (!scales.length) return [];
  const value = mode === 'max' ? Math.max(...scales.map((s) => s.raw)) : Math.min(...scales.map((s) => s.raw));
  return SCALE_ORDER.flatMap((id) => {
    const s = scales.find((x) => x.id === id);
    return s && s.raw === value ? [s] : [];
  });
}

function formatExtremeGroup(scales: EgoOkScaleScore[]): string {
  const stage = rawScoreToPlus243Tier(scales[0]!.raw).stage;
  const ids = scales.map((s) => s.id).join(' · ');
  const codes = Array.from(new Set(scales.map((s) => plus243TierToAscii(rawScoreToPlus243Tier(s.raw))))).join('/');
  return `${ids} (현재 ${stage}단계, ${codes})`;
}

function scaleBlock(s: EgoOkScaleScore, stage: Plus243Stage): string {
  const tier = rawScoreToPlus243Tier(s.raw);
  const lead = formatCurrentStageLeadIn(tier);
  const guidance = buildPlus243StageGuidance(s.id, stage);
  return [lead, ...guidance].join('\n\n');
}

function comprehensive(egogram: EgoOkScaleScore[]): string {
  const cp = egogram.find((s) => s.id === 'CP')!;
  const np = egogram.find((s) => s.id === 'NP')!;
  const fc = egogram.find((s) => s.id === 'FC')!;
  const ac = egogram.find((s) => s.id === 'AC')!;
  const a = egogram.find((s) => s.id === 'A')!;
  const highs = pickTiedExtremeScales(egogram, 'max');
  const lows = pickTiedExtremeScales(egogram, 'min');
  const cpStage = rawScoreToPlus243Tier(cp.raw).stage;
  const npStage = rawScoreToPlus243Tier(np.raw).stage;
  const fcStage = rawScoreToPlus243Tier(fc.raw).stage;
  const acStage = rawScoreToPlus243Tier(ac.raw).stage;
  const aStage = rawScoreToPlus243Tier(a.raw).stage;
  const cpUpNpDown = cp.raw > np.raw;

  const highLine =
    highs.length > 1
      ? `최고 사용 에너지는 ${formatExtremeGroup(highs)}로, 같은 높이입니다.`
      : `최고 사용 에너지는 ${formatExtremeGroup(highs)}입니다.`;
  const lowLine =
    lows.length > 1
      ? `최저 사용 에너지는 ${formatExtremeGroup(lows)}로, 같은 낮이입니다.`
      : `최저 사용 에너지는 ${formatExtremeGroup(lows)}입니다.`;

  const tilt =
    highs.length === 1 && lows.length === 1 && highs[0]!.id === lows[0]!.id
      ? '다섯 척도가 한 줄로 묶여 극단 비교가 어렵습니다.'
      : `한 성격 안에서 에너지가 ${highs.map((h) => h.id).join('·')} 쪽으로 기울고, ${lows.map((l) => l.id).join('·')}은(는) 상대적으로 약합니다.`;

  const highGuidance = highs
    .flatMap((h) => buildPlus243StageGuidance(h.id, rawScoreToPlus243Tier(h.raw).stage))
    .slice(0, 3)
    .join('\n');
  const lowGuidance = lows
    .flatMap((l) => buildPlus243StageGuidance(l.id, rawScoreToPlus243Tier(l.raw).stage))
    .slice(0, 3)
    .join('\n');

  return [
    `9단계 기준 다섯 이고그램을 함께 봅니다. ${highLine} ${lowLine} ${tilt}`,
    `CP ${cpStage}단계 · NP ${npStage}단계 — ${cpUpNpDown ? 'CP가 NP보다 높아 기준·비판 쪽이 두드러집니다.' : 'NP가 CP보다 높아 돌봄·지지 쪽이 두드러집니다.'} (CP와 NP는 서로 줄고 늘기 쉬운 관계로 봅니다.)`,
    `FC ${fcStage}단계 · AC ${acStage}단계 — ${fc.raw > ac.raw ? 'FC(자유·표현)가 AC(배려·순응)보다 높습니다.' : 'AC가 FC보다 높습니다.'} 둘 다 동시에 크게 오르거나 내리면, 맞추려는 표현일 수 있어 함께 짚습니다.`,
    `균형 힌트: ${lows.map((l) => `${l.id} ${rawScoreToPlus243Tier(l.raw).stage}단계`).join(' · ')}는 보완·키우기, ${highs.map((h) => `${h.id} ${rawScoreToPlus243Tier(h.raw).stage}단계`).join(' · ')}는 쉬어 가기·조절하기. A ${aStage}단계(생각·판단)로 선택지를 정리하면 다섯 에너지가 한 흐름으로 이어집니다.`,
    highGuidance ? `최고 쪽 단계 안내:\n${highGuidance}` : '',
    lowGuidance ? `최저 쪽 단계 안내:\n${lowGuidance}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildPlus243InterpretationSections(
  pattern243Plus: Pattern243Plus,
  egogram: EgoOkScaleScore[],
  genderInput: string | undefined,
): { sectionLabels: Record<string, string>; sections: Record<string, string> } {
  void normalizeEgoOkGender(genderInput);
  void pattern243Plus;
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s]));
  const sections: Record<string, string> = {};

  const mapScaleToSection: Record<string, string> = { CP: '1', NP: '2', A: '3', FC: '4', AC: '5' };
  for (const id of SCALE_ORDER) {
    const s = byId[id];
    if (!s) continue;
    const stage = rawScoreToPlus243Tier(s.raw).stage;
    sections[mapScaleToSection[id]] = scaleBlock(s, stage);
  }
  sections['6'] = comprehensive(egogram);

  return { sectionLabels: SECTION_LABELS, sections };
}
