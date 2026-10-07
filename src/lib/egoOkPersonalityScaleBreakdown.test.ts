import { EGO_OK_QUESTIONS } from '@/data/egoOkQuestions';
import { EGO_OK_PERSONALITY_SCALE_TYPES } from '@/lib/egoOkReportScaleTaxonomy';
import { buildPersonalityScaleBreakdown } from '@/lib/egoOkPersonalityScaleBreakdown';
import type { EgoOkReport } from '@/lib/egoOkScoring';

describe('egoOkPersonalityScaleBreakdown', () => {
  it('counts 90 personality items excluding validity', () => {
    const personality = EGO_OK_QUESTIONS.filter((q) => q.scaleKind !== 'validity');
    expect(personality).toHaveLength(90);
  });

  it('builds 14 scale rows from taxonomy', () => {
    const mock = {
      egogram: ['CP', 'NP', 'A', 'FC', 'AC'].map((id) => ({
        id,
        label: id,
        raw: 30,
        max: 50,
        min: 10,
        positiveRaw: 15,
        negativeRaw: 15,
        fiveLevel: 'C',
        threeLevel: 'B',
        negativePercent: 50,
      })),
      okgram: (['U+', 'U-', 'I+', 'I-'] as const).map((id) => ({
        id,
        label: id,
        raw: 30,
        max: 50,
        min: 10,
      })),
    } as unknown as EgoOkReport;
    const rows = buildPersonalityScaleBreakdown(mock);
    expect(rows).toHaveLength(EGO_OK_PERSONALITY_SCALE_TYPES.length);
    expect(rows).toHaveLength(14);
    const cpPos = rows.find((r) => r.scaleType === 'cp_positive');
    expect(cpPos?.itemCount).toBe(5);
    expect(cpPos?.raw).toBe(15);
    expect(cpPos?.itemNos).toHaveLength(5);
  });
});
