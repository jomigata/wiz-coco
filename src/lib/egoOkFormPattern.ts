import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';
import { plus243StageBand, rawScoreToPlus243Tier } from '@/lib/egogram243Plus';

function bandFor(egogram: EgoOkScaleScore[], id: EgoScaleId) {
  const s = egogram.find((x) => x.id === id);
  if (!s) return 'normal' as const;
  return plus243StageBand(rawScoreToPlus243Tier(s.raw).stage);
}

/** 잔소리형 vs CP 주도형 등 화면용 형태명 */
export function resolveEgogramFormLabel(
  egogram: EgoOkScaleScore[],
  peakScale: EgoOkScaleScore,
  bankBasicPattern: string,
): string {
  const cpExcess = bandFor(egogram, 'CP') === 'excess';
  const npNotDeficit = bandFor(egogram, 'NP') !== 'deficit';
  const fcNotDeficit = bandFor(egogram, 'FC') !== 'deficit';
  const acNotExcess = bandFor(egogram, 'AC') !== 'excess';

  if (cpExcess && npNotDeficit && fcNotDeficit && acNotExcess) {
    return '잔소리형';
  }
  if (peakScale.id === 'CP') {
    return 'CP 주도형';
  }
  return bankBasicPattern.trim() || '—';
}
