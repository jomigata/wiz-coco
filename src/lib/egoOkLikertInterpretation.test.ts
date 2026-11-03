import { explainEgogramPolarityLikert, likertLabelForValue } from '@/lib/egoOkLikertInterpretation';

describe('egoOkLikertInterpretation', () => {
  it('maps likert values to UI labels', () => {
    expect(likertLabelForValue(5)).toContain('거의 항상');
    expect(likertLabelForValue(3)).toContain('보통');
    expect(likertLabelForValue(1)).toContain('거의');
  });

  it('explains polarity pct from raw sums', () => {
    const ex = explainEgogramPolarityLikert('CP', 20, 10, 67, 33);
    expect(ex.positivePctExplain).toContain('67%');
    expect(ex.positivePctExplain).toContain('20');
    expect(ex.negativePctExplain).toContain('33%');
    expect(ex.scaleContext).toContain('CP');
  });
});
