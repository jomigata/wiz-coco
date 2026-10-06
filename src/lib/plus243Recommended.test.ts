import {
  buildPlus243StageGuidance,
  buildSelfHelpTherapyScalePlan,
} from '@/lib/egogramManualNineStage';
import {
  formatCurrentStageLeadIn,
  isPlus243RecommendedRaw,
  isPlus243RecommendedStage,
  rawScoreToPlus243Tier,
} from '@/lib/egogram243Plus';
import { buildPlus243InterpretationSections } from '@/lib/egoOkPlus243Interpretation';

const sampleScale = {
  id: 'A' as const,
  label: '성인 자아',
  raw: 30,
  max: 50,
  min: 10,
  threeLevel: 'B' as const,
  fiveLevel: 'C' as const,
  positiveRaw: 0,
  negativeRaw: 0,
  negativePercent: 0,
};

describe('243+ recommended stage (single source of truth)', () => {
  it('30 points is stage 5 and inside recommended 4~6', () => {
    const tier = rawScoreToPlus243Tier(30);
    expect(tier.stage).toBe(5);
    expect(isPlus243RecommendedStage(tier.stage)).toBe(true);
    expect(isPlus243RecommendedRaw(30)).toBe(true);
  });

  it('stage lead-in avoids raw score', () => {
    const tier = rawScoreToPlus243Tier(30);
    const lead = formatCurrentStageLeadIn(tier);
    expect(lead).toMatch(/현재 5단계\(권장구간 4~6단계\)/);
    expect(lead).not.toMatch(/점/);
  });

  it('self-help plan for stage 5 includes maintain benefits', () => {
    const plan = buildSelfHelpTherapyScalePlan(sampleScale);
    expect(plan.inRecommended).toBe(true);
    expect(plan.summary).not.toMatch(/권장 밖/);
    expect(plan.guidanceLines.some((l) => l.includes('유지'))).toBe(true);
    expect(plan.guidanceLines.some((l) => l.includes('4·5·6'))).toBe(true);
  });

  it('stage 5 has maintain only; stage 6 warns on move to 7', () => {
    const g5 = buildPlus243StageGuidance('A', 5);
    expect(g5).toHaveLength(1);
    expect(g5[0]).toMatch(/A ·.*유지/);
    const g6 = buildPlus243StageGuidance('A', 6);
    expect(g6.some((l) => l.includes('7단계'))).toBe(true);
  });

  it('stage 4 warns when stepping down to deficit', () => {
    const hints = buildPlus243StageGuidance('A', 4);
    expect(hints.some((h) => h.includes('3단계'))).toBe(true);
  });

  it('stage 2 still outside recommended after one step up', () => {
    const g = buildPlus243StageGuidance('FC', 2);
    expect(g.some((l) => l.includes('권장:') && l.includes('아직 부족'))).toBe(true);
  });

  it('243+ FC excess uses stage guidance', () => {
    const egogram = [
      { ...sampleScale, id: 'CP' as const, raw: 28, label: 'CP' },
      { ...sampleScale, id: 'NP' as const, raw: 28, label: 'NP' },
      sampleScale,
      { ...sampleScale, id: 'FC' as const, raw: 38, label: 'FC' },
      { ...sampleScale, id: 'AC' as const, raw: 28, label: 'AC' },
    ];
    const { sections } = buildPlus243InterpretationSections(
      { codeAscii: '', codeLabel: '', byScale: {} as never, groups: {} as never },
      egogram,
      'male',
    );
    const fc = sections['4'] ?? '';
    expect(fc).not.toMatch(/\d+점/);
    expect(fc).toMatch(/7단계|과잉/);
    expect(fc).toMatch(/FC ·.*권장:|FC ·.*주의:/);
  });
});
