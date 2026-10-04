import type { EgoOkScaleScore } from '@/lib/egoOkScoring';
import { normalizeEgoOkGender } from '@/lib/egoOkScoring';
import {
  plus243StageBand,
  rawScoreToPlus243Tier,
  type Pattern243Plus,
  type Plus243Stage,
} from '@/lib/egogram243Plus';

const SCALE_ORDER: EgoOkScaleScore['id'][] = ['CP', 'NP', 'A', 'FC', 'AC'];

const SECTION_LABELS: Record<string, string> = {
  '1': 'CP (비판적 부모)',
  '2': 'NP (양육적 부모)',
  '3': '성인 자아 (A)',
  '4': 'FC (자유로운 아이)',
  '5': 'AC (순응하는 아이)',
  '6': '9단계 기준 종합 평가',
};

function scaleBlock(s: EgoOkScaleScore, stage: Plus243Stage): string {
  const pros =
    plus243StageBand(stage) === 'excess'
      ? '추진·영향력이 크나 과잉·소진에 주의하세요.'
      : plus243StageBand(stage) === 'deficit'
        ? '부담은 적으나 필요할 때 에너지를 키우는 연습이 필요합니다.'
        : '일상·관계에서 무리 없이 에너지를 잘 사용하고 있습니다.';
  const action =
    plus243StageBand(stage) === 'excess'
      ? '대책: 강도를 낮추고 휴식·위임을 늘리세요.'
      : plus243StageBand(stage) === 'deficit'
        ? '대책: 4~6단계 권장 구간을 목표로 작은 실천을 쌓으세요.'
        : '대책: 현재 리듬을 유지하며 급격한 확대·축소는 피하세요.';
  return [
    `${stage}단계-${s.raw}점 · ${s.label} · 9단계 중 ${stage}단계로 에너지의 사용이 적절한 단계로, 균형/권장단계는 4~6단계입니다. ${pros}`,
    action,
  ].join('\n');
}

function pickExtreme(scales: EgoOkScaleScore[], mode: 'max' | 'min'): EgoOkScaleScore {
  return scales.reduce((a, b) => (mode === 'max' ? (b.raw > a.raw ? b : a) : b.raw < a.raw ? b : a));
}

function comprehensive(egogram: EgoOkScaleScore[]): string {
  const cp = egogram.find((s) => s.id === 'CP')!;
  const np = egogram.find((s) => s.id === 'NP')!;
  const fc = egogram.find((s) => s.id === 'FC')!;
  const ac = egogram.find((s) => s.id === 'AC')!;
  const high = pickExtreme(egogram, 'max');
  const low = pickExtreme(egogram, 'min');
  const cpUpNpDown = cp.raw > np.raw;
  const fcUpAcDown = fc.raw > ac.raw;

  return [
    `9단계 기준 5이고그램 종합입니다. 최고 ${high.id}(${high.raw}점), 최저 ${low.id}(${low.raw}점) — 한 성격 안에서 에너지가 ${high.label} 쪽으로 기울고 ${low.label}은(는) 상대적으로 약합니다.`,
    `CP와 NP는 한쪽이 늘면 다른 쪽이 줄어드는 상대 관계(약 90% 이상)로 보는 것이 타당합니다. 현재 CP ${cp.raw} · NP ${np.raw} — ${cpUpNpDown ? 'CP가 NP보다 높아 비판·기준 쪽이 두드러집니다.' : 'NP가 CP보다 높아 양육·지지 쪽이 두드러집니다.'}`,
    `FC와 AC도 서로 상대적입니다. FC ${fc.raw} · AC ${ac.raw} — ${fcUpAcDown ? 'FC(자유·창의)가 AC(순응)보다 높습니다.' : 'AC(순응·협력)가 FC보다 높습니다.'} 둘 다 동시에 크게 오르거나 내리면 의도적 표현·역할 연기 가능성을 함께 짚습니다.`,
    `해결·균형: ${low.id}(${low.raw})는 ${rawScoreToPlus243Tier(low.raw).stage}단계 — 의식적 보완, ${high.id}(${high.raw})는 ${rawScoreToPlus243Tier(high.raw).stage}단계 — 과함·소진을 조절하세요. A(${egogram.find((s) => s.id === 'A')!.raw}) 성인 자아로 선택지·현실 검토를 중심에 두면 다섯 에너지가 한 과정으로 엮입니다.`,
  ].join('\n\n');
}

export function buildPlus243InterpretationSections(
  pattern243Plus: Pattern243Plus,
  egogram: EgoOkScaleScore[],
  genderInput: string | undefined,
  pattern243Snippet?: { sections: Record<string, string>; sectionLabels: Record<string, string> },
): { sectionLabels: Record<string, string>; sections: Record<string, string> } {
  void normalizeEgoOkGender(genderInput);
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s]));
  const sections: Record<string, string> = {};

  const mapScaleToSection: Record<string, string> = { CP: '1', NP: '2', A: '3', FC: '4', AC: '5' };
  for (const id of SCALE_ORDER) {
    const s = byId[id];
    if (!s) continue;
    const stage = pattern243Plus.byScale[id].tier.stage;
    sections[mapScaleToSection[id]] = scaleBlock(s, stage);
  }
  sections['6'] = comprehensive(egogram);

  if (pattern243Snippet?.sections['1']) {
    sections['6'] += `\n\n[243패턴 참고]\n${pattern243Snippet.sections['1']?.slice(0, 400) ?? ''}`;
  }

  return { sectionLabels: SECTION_LABELS, sections };
}
