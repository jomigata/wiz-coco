import { buildSelfHelpTherapyScalePlan } from '@/lib/egogramManualNineStage';
import {
  isPlus243RecommendedRaw,
  isPlus243RecommendedStage,
  plus243AdjacentStageHints,
  rawScoreToPlus243Tier,
} from '@/lib/egogram243Plus';

describe('243+ recommended stage (single source of truth)', () => {
  it('30 points is stage 5 and inside recommended 4~6', () => {
    const tier = rawScoreToPlus243Tier(30);
    expect(tier.stage).toBe(5);
    expect(isPlus243RecommendedStage(tier.stage)).toBe(true);
    expect(isPlus243RecommendedRaw(30)).toBe(true);
  });

  it('self-help plan for 30 points must not say outside recommended', () => {
    const plan = buildSelfHelpTherapyScalePlan({
      id: 'A',
      label: '성인 자아',
      raw: 30,
      max: 50,
      min: 10,
      threeLevel: 'B',
      fiveLevel: 'C',
      positiveRaw: 0,
      negativeRaw: 0,
      negativePercent: 0,
    });
    expect(plan.inRecommended).toBe(true);
    expect(plan.summary).toMatch(/권장구간 4~6단계/);
    expect(plan.summary).not.toMatch(/권장 밖/);
    expect(plan.stageLeadIn).toMatch(/현재 5단계\(권장구간 4~6단계\)/);
  });

  it('stage 5 adjacent hints mention only 4 and 7 (not 3 or 9)', () => {
    const hints = plus243AdjacentStageHints(5);
    expect(hints.some((h) => h.includes('3단계'))).toBe(false);
    expect(hints.some((h) => h.includes('9단계'))).toBe(false);
    expect(hints.some((h) => h.includes('4단계'))).toBe(true);
    expect(hints.some((h) => h.includes('7단계') || h.includes('6단계'))).toBe(true);
  });
});
