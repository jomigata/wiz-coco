import type { EgoOkScaleScore } from '@/lib/egoOkScoring';
import { normalizeEgoOkGender } from '@/lib/egoOkScoring';
import {
  formatCurrentStageLeadIn,
  isPlus243RecommendedStage,
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

function formatGuidanceBlock(title: string, scales: EgoOkScaleScore[]): string {
  const body = scales
    .flatMap((s) => buildPlus243StageGuidance(s.id, rawScoreToPlus243Tier(s.raw).stage))
    .join('\n');
  return body ? `${title}\n${body}` : '';
}

function simpleBalanceHint(
  highs: EgoOkScaleScore[],
  lows: EgoOkScaleScore[],
  aStage: Plus243Stage,
): string {
  const lowIds = lows.map((l) => l.id).join(' · ');
  const highIds = highs.map((h) => h.id).join(' · ');
  const lowStages = lows.map((l) => `${l.id} ${rawScoreToPlus243Tier(l.raw).stage}단계`).join(', ');
  const highStages = highs.map((h) => `${h.id} ${rawScoreToPlus243Tier(h.raw).stage}단계`).join(', ');

  const lowNeed = lows.some((l) => !isPlus243RecommendedStage(rawScoreToPlus243Tier(l.raw).stage));
  const highNeed = highs.some((h) => !isPlus243RecommendedStage(rawScoreToPlus243Tier(h.raw).stage));

  let line = `정리하면, 에너지가 가장 약한 쪽은 ${lowIds}(${lowStages})이고, 가장 강한 쪽은 ${highIds}(${highStages})입니다. `;
  if (lowNeed) {
    line += `${lowIds}은(는) 부족 쪽이면 한 단계씩 키우는 실천을, `;
  } else {
    line += `${lowIds}은(는) 권장 구간이면 지금 리듬을 유지하고, `;
  }
  if (highNeed) {
    line += `${highIds}은(는) 과잉 쪽이면 한 단계씩 낮추는 실천을 돕습니다. `;
  } else {
    line += `${highIds}은(는) 권장 구간이면 무리하게 더 올리지 않도록 돕습니다. `;
  }
  line += `A ${aStage}단계(생각·판단)로 「무엇을 한 단계만 바꿀지」를 먼저 말로 정리하면, 다섯 에너지 조절이 한 번에 정리되기 쉽습니다.`;
  return line;
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

  return [
    `9단계 기준 다섯 이고그램을 함께 봅니다. ${highLine} ${lowLine} ${tilt}`,
    `CP ${cpStage}단계 · NP ${npStage}단계 — ${cpUpNpDown ? 'CP가 NP보다 높아 기준·비판 쪽이 두드러집니다.' : 'NP가 CP보다 높아 돌봄·지지 쪽이 두드러집니다.'} CP와 NP는 한쪽이 커지면 다른 쪽이 상대적으로 작아 보이기 쉽다고 설명할 수 있습니다.`,
    `FC ${fcStage}단계 · AC ${acStage}단계 — ${fc.raw > ac.raw ? 'FC(자유·표현)가 AC(배려·순응)보다 높습니다.' : fc.raw < ac.raw ? 'AC(배려·순응)가 FC(자유·표현)보다 높습니다.' : 'FC와 AC가 같은 단계입니다.'} FC와 AC도 서로 상대적으로 비교해 설명합니다.`,
    simpleBalanceHint(highs, lows, aStage),
    formatGuidanceBlock('최고 쪽 단계 안내:', highs),
    formatGuidanceBlock('최저 쪽 단계 안내:', lows),
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
