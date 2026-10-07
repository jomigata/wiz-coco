import type { EgoOkScaleScore, EgoScaleId, ThreeLevel } from '@/lib/egoOkScoring';
import { plus243StageBand, rawScoreToPlus243Tier } from '@/lib/egogram243Plus';
import { bandForScale } from '@/lib/egoOkFormPattern';

const SCALE_ORDER: EgoScaleId[] = ['CP', 'NP', 'A', 'FC', 'AC'];

const CREVASSE_BY_SCALE: Record<EgoScaleId, string> = {
  CP: '느슨한형(CP결핍)',
  NP: '냉정한형(NP결핍)',
  A: '현실 무시형(A결핍)',
  FC: '자폐자형(FC결핍)',
  AC: '제멋대로형(AC결핍)',
};

const PROTRUDE_BY_SCALE: Record<EgoScaleId, string> = {
  CP: '잔소리형(CP주도)',
  NP: '호인형(NP주도)',
  A: '컴퓨터형(A주도)',
  FC: '자유 분방형(FC주도)',
  AC: '자기 비하형(AC주도)',
};

const BANK_ALIASES: { pattern: RegExp; label: string }[] = [
  { pattern: /올\s*B|올비|All\s*B/i, label: '중용형(올B형)' },
  { pattern: /올\s*A|All\s*A/i, label: '하이 레벨형(올A형)' },
  { pattern: /올\s*C|All\s*C/i, label: '원시인형(올C형)' },
  { pattern: /U자|보금자리/i, label: '전형적 보금자리형(U형)' },
  { pattern: /역U|기탄없/i, label: '기탄없이 말하는형(역U형)' },
  { pattern: /V형|두손/i, label: '두손벌린형(V형)' },
  { pattern: /좌상|완고한 아버지/i, label: '완고한 아버지형(좌상·우하형)' },
  { pattern: /좌하|개구쟁이/i, label: '개구쟁이형(좌하·우상형)' },
  { pattern: /염세|W형/i, label: '염세형(W형)' },
  { pattern: /명랑|M형/i, label: '명랑 낙관형(M형)' },
  { pattern: /우유 부단/i, label: '우유 부단형(N형)' },
  { pattern: /역N|하이 파워/i, label: '하이 파워형(역N형)' },
  { pattern: /CP결핍|느슨/i, label: '느슨한형(CP결핍)' },
  { pattern: /NP결핍|냉정/i, label: '냉정한형(NP결핍)' },
  { pattern: /A결핍|Ⓐ결핍|현실 무시/i, label: '현실 무시형(A결핍)' },
  { pattern: /FC결핍|자폐/i, label: '자폐자형(FC결핍)' },
  { pattern: /AC결핍|제멋대로/i, label: '제멋대로형(AC결핍)' },
  { pattern: /잔소리|CP주도/i, label: '잔소리형(CP주도)' },
  { pattern: /호인|NP주도/i, label: '호인형(NP주도)' },
  { pattern: /컴퓨터|A주도/i, label: '컴퓨터형(A주도)' },
  { pattern: /자유 분방|FC주도/i, label: '자유 분방형(FC주도)' },
  { pattern: /자기 비하|AC주도/i, label: '자기 비하형(AC주도)' },
  { pattern: /중용|올B/i, label: '중용형(올B형)' },
  { pattern: /하이 레벨|올A/i, label: '하이 레벨형(올A형)' },
  { pattern: /원시/i, label: '원시인형(올C형)' },
];

function levelOf(egogram: EgoOkScaleScore[], id: EgoScaleId): ThreeLevel {
  return egogram.find((s) => s.id === id)?.threeLevel ?? 'B';
}

function isMidRecommended(egogram: EgoOkScaleScore[], id: EgoScaleId): boolean {
  const s = egogram.find((x) => x.id === id);
  if (!s) return false;
  const st = rawScoreToPlus243Tier(s.raw).stage;
  return st >= 4 && st <= 6;
}

export function parseArchetype23FromBank(bankBasicPattern: string): string | null {
  const t = bankBasicPattern.trim();
  if (!t) return null;
  for (const { pattern, label } of BANK_ALIASES) {
    if (pattern.test(t)) return label;
  }
  const head = t.split(/\s*혹은\s*/)[0]?.trim();
  return head && head.length > 0 ? head : null;
}

/** 이고그램 전형 23패턴 — ABC·9단계·243 bank 보조 */
export function resolveEgogramArchetype23Pattern(
  egogram: EgoOkScaleScore[],
  peakScale: EgoOkScaleScore,
  bankBasicPattern = '',
): string {
  const levels = SCALE_ORDER.map((id) => levelOf(egogram, id));

  if (levels.every((l) => l === 'B')) return '중용형(올B형)';
  if (levels.every((l) => l === 'A')) return '하이 레벨형(올A형)';
  if (levels.every((l) => l === 'C')) return '원시인형(올C형)';

  const cCount = levels.filter((l) => l === 'C').length;
  const aCount = levels.filter((l) => l === 'A').length;
  if (cCount === 1 && aCount >= 3) {
    const idx = levels.indexOf('C');
    return CREVASSE_BY_SCALE[SCALE_ORDER[idx]!]!;
  }

  const cpExcess = bandForScale(egogram, 'CP') === 'excess';
  const npNotDeficit = bandForScale(egogram, 'NP') !== 'deficit';
  const fcNotDeficit = bandForScale(egogram, 'FC') !== 'deficit';
  const acNotExcess = bandForScale(egogram, 'AC') !== 'excess';
  if (cpExcess && npNotDeficit && fcNotDeficit && acNotExcess) {
    return PROTRUDE_BY_SCALE.CP;
  }

  const excessIds = SCALE_ORDER.filter((id) => bandForScale(egogram, id) === 'excess');
  if (excessIds.length === 1) {
    const id = excessIds[0]!;
    const othersMid = SCALE_ORDER.filter((x) => x !== id).every((x) => isMidRecommended(egogram, x));
    if (othersMid) return PROTRUDE_BY_SCALE[id];
  }

  const [cp, np, a, fc, ac] = levels;
  if (cp === 'A' && ac === 'A' && np !== 'A' && fc !== 'A' && a !== 'A') {
    return '전형적 보금자리형(U형)';
  }
  if (np === 'A' && fc === 'A' && a === 'A' && cp !== 'A' && ac !== 'A') {
    return '기탄없이 말하는형(역U형)';
  }
  if (cp === 'A' && ac === 'A' && a === 'C') return '두손벌린형(V형)';
  if (cp === 'A' && np === 'A' && fc === 'C' && ac === 'C') {
    return '완고한 아버지형(좌상·우하형)';
  }
  if (cp === 'C' && np === 'C' && fc === 'A' && ac === 'A') {
    return '개구쟁이형(좌하·우상형)';
  }

  if (peakScale.id === 'CP' && bandForScale(egogram, 'CP') === 'excess') {
    return PROTRUDE_BY_SCALE.CP;
  }

  const fromBank = parseArchetype23FromBank(bankBasicPattern);
  if (fromBank) return fromBank;

  return '—';
}

export function formatEgogramFormWithArchetype23(formLabel: string, archetype23: string): string {
  const form = formLabel.trim();
  const arch = archetype23.trim();
  if (!arch || arch === '—') return form || '—';
  if (!form || form === '—') return arch;
  if (form.includes(arch)) return form;
  const compact = (s: string) => s.replace(/\s/g, '');
  if (compact(form).includes(compact(arch))) return form;
  return `${form} / ${arch}`;
}
