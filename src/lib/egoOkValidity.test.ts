import { EGO_OK_ITEM_BANK_ID } from '@/data/egoOkQuestions';
import { computeEgoOkValidityProfile } from '@/lib/egoOkValidity';

const is99 = EGO_OK_ITEM_BANK_ID === 'ego-ok-99';

function answersForNos(entries: [number, number][]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [no, score] of entries) {
    out[String(no - 1)] = score;
  }
  return out;
}

describe('computeEgoOkValidityProfile (99-item bank)', () => {
  beforeAll(() => {
    if (!is99) {
      console.warn('Skipping 99-bank tests: current bank is', EGO_OK_ITEM_BANK_ID);
    }
  });

  it('IMC: two items at 3 or below → invalid', () => {
    if (!is99) return;
    const v = computeEgoOkValidityProfile(
      answersForNos([
        [9, 3],
        [38, 2],
        [68, 5],
      ]),
    );
    expect(v.imc.failCount).toBe(2);
    expect(v.imc.status).toBe('invalid');
    expect(v.overall).toBe('invalid');
  });

  it('Infreq: two items at 3 or above → invalid', () => {
    if (!is99) return;
    const v = computeEgoOkValidityProfile(
      answersForNos([
        [26, 4],
        [58, 3],
        [78, 1],
      ]),
    );
    expect(v.infreq.raw).toBe(2);
    expect(v.infreq.status).toBe('invalid');
  });

  it('Lie: two items at 2 or below → caution only (not invalid)', () => {
    if (!is99) return;
    const v = computeEgoOkValidityProfile(
      answersForNos([
        [15, 1],
        [48, 2],
        [88, 5],
      ]),
    );
    expect(v.lie.raw).toBe(2);
    expect(v.lie.status).toBe('caution');
    expect(v.overall).not.toBe('invalid');
  });
});
