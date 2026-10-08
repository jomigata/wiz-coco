import { buildCstBridgeScores } from '@/lib/egoOkCstBridgeScoring';
import { EGO_OK_ALL_SCALE_MAJORS } from '@/lib/egoOkCstBridgeCatalog';
import type { EgoOkReport } from '@/lib/egoOkScoring';

function mockReport(): EgoOkReport {
  return {
    egogram: ['CP', 'NP', 'A', 'FC', 'AC'].map((id) => ({
      id,
      label: id,
      raw: 30,
      max: 50,
      min: 10,
      positiveRaw: 18,
      negativeRaw: 12,
      fiveLevel: 'C',
      threeLevel: 'B',
      negativePercent: 40,
    })),
    okgram: (['U+', 'U-', 'I+', 'I-'] as const).map((id) => ({
      id,
      label: id,
      raw: 32,
      max: 50,
      min: 10,
    })),
  } as unknown as EgoOkReport;
}

describe('egoOkCstBridgeScoring', () => {
  it('returns 9 CST major blocks with middle scores', () => {
    const majors = buildCstBridgeScores(mockReport());
    expect(majors).toHaveLength(EGO_OK_ALL_SCALE_MAJORS.length);
    expect(majors[0]?.middles[0]?.energy.stage).toBeGreaterThanOrEqual(1);
    expect(majors[0]?.middles[0]?.overallSuitabilityPct).toBeGreaterThan(0);
    expect(majors[0]?.majorId).toBe('1');
    expect(majors[0]?.middles.length).toBe(5);
    expect(majors[0]?.pct).toBeGreaterThan(0);
    expect(majors[0]?.middles[0]?.itemCount).toBeGreaterThan(0);
    expect(majors[0]?.middles[0]?.reportLine).toMatch(/창의성/);
  });
});
