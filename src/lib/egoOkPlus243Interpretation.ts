import type { EgoOkScaleScore } from '@/lib/egoOkScoring';
import { normalizeEgoOkGender } from '@/lib/egoOkScoring';
import {
  plus243RecommendedRawRange,
  plus243StageBand,
  plus243StageBandLabel,
  plus243TierToAscii,
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

const { min: REC_MIN, max: REC_MAX } = plus243RecommendedRawRange();

function stagePositionText(stage: Plus243Stage): string {
  const band = plus243StageBand(stage);
  if (band === 'normal') {
    return `현재 ${stage}단계는 243+플러스 권장 구간(4~6단계, ${REC_MIN}~${REC_MAX}점)에 해당합니다.`;
  }
  if (band === 'deficit') {
    return `현재 ${stage}단계는 1~3단계(10~23점) 부족 구간입니다. 권장 4~6단계(${REC_MIN}~${REC_MAX}점)를 향해 인접 단계만 목표로 합니다.`;
  }
  return `현재 ${stage}단계는 7~9단계(37~50점) 과잉 구간입니다. 권장 4~6단계(${REC_MIN}~${REC_MAX}점) 쪽으로 한 단계씩 낮추는 것을 목표로 합니다.`;
}

function scaleBlock(s: EgoOkScaleScore, stage: Plus243Stage): string {
  const tier = rawScoreToPlus243Tier(s.raw);
  const band = plus243StageBand(stage);
  const bandKo = plus243StageBandLabel(band);
  const pros =
    band === 'excess'
      ? '추진·영향력은 크나 과잉·소진·관계 부담에 주의가 필요합니다.'
      : band === 'deficit'
        ? '부담은 상대적으로 적으나, 필요할 때 에너지를 키우는 연습이 도움이 됩니다.'
        : '일상·관계에서 무리 없이 에너지를 사용하는 편입니다.';
  const action =
    band === 'excess'
      ? '대책: 강도를 낮추고 휴식·위임·경청을 늘리세요. 「자율치료 및 대책」 탭의 과잉 구간 안내를 참고하세요.'
      : band === 'deficit'
        ? '대책: 4~6단계 권장 구간을 향해 작은 실천을 쌓으세요. 「자율치료 및 대책」 탭의 부족 구간 안내를 참고하세요.'
        : '대책: 현재 리듬을 유지하며 급격한 확대·축소는 피하세요.';
  return [
    `${stage}단계 · ${s.raw}점 · ${plus243TierToAscii(tier)} · ${bandKo}(${stagePositionText(stage)})`,
    pros,
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
  const highTier = plus243TierToAscii(rawScoreToPlus243Tier(high.raw));
  const lowTier = plus243TierToAscii(rawScoreToPlus243Tier(low.raw));

  return [
    `9단계 기준 5이고그램 종합입니다. 최고 사용 ${high.id}(${high.raw}점, ${highTier}), 최저 사용 ${low.id}(${low.raw}점, ${lowTier}) — 한 성격 안에서 에너지가 ${high.id} 쪽으로 기울고 ${low.id}은(는) 상대적으로 약합니다.`,
    `CP와 NP는 한쪽이 늘면 다른 쪽이 줄어드는 상대 관계(약 90% 이상)로 보는 것이 타당합니다. 현재 CP ${cp.raw} · NP ${np.raw} — ${cpUpNpDown ? 'CP가 NP보다 높아 비판·기준 쪽이 두드러집니다.' : 'NP가 CP보다 높아 양육·지지 쪽이 두드러집니다.'}`,
    `FC와 AC도 서로 상대적입니다. FC ${fc.raw} · AC ${ac.raw} — ${fcUpAcDown ? 'FC(자유·창의)가 AC(순응)보다 높습니다.' : 'AC(순응·협력)가 FC보다 높습니다.'} 둘 다 동시에 크게 오르거나 내리면 의도적 표현·역할 연기 가능성을 함께 짚습니다.`,
    `해결·균형: ${low.id}(${low.raw})는 현재 ${rawScoreToPlus243Tier(low.raw).stage}단계 — 의식적 보완, ${high.id}(${high.raw})는 현재 ${rawScoreToPlus243Tier(high.raw).stage}단계 — 과함·소진을 조절하세요. A(${egogram.find((s) => s.id === 'A')!.raw}) 성인 자아로 선택지·현실 검토를 중심에 두면 다섯 에너지가 한 과정으로 엮입니다.`,
  ].join('\n\n');
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
