import { EGO_OK_QUESTIONS } from '@/data/egoOkQuestions';
import type { EgoOkReport, EgoScaleId, OkScaleId } from '@/lib/egoOkScoring';
import {
  EGO_OK_PERSONALITY_SCALE_TAXONOMY,
  type EgoOkPersonalityScaleType,
  type EgoOkScaleTaxonomyNode,
} from '@/lib/egoOkReportScaleTaxonomy';

export type PersonalityScaleBreakdownRow = EgoOkScaleTaxonomyNode & {
  raw: number;
  pct: number;
  itemNos: number[];
};

const EGO_ID_BY_SCALE: Record<
  Extract<EgoOkPersonalityScaleType, `${string}_${'positive' | 'negative'}`>,
  EgoScaleId
> = {
  cp_positive: 'CP',
  cp_negative: 'CP',
  np_positive: 'NP',
  np_negative: 'NP',
  a_positive: 'A',
  a_negative: 'A',
  fc_positive: 'FC',
  fc_negative: 'FC',
  ac_positive: 'AC',
  ac_negative: 'AC',
};

const OK_ID_BY_SCALE: Record<'u_plus' | 'u_minus' | 'i_plus' | 'i_minus', OkScaleId> = {
  u_plus: 'U+',
  u_minus: 'U-',
  i_plus: 'I+',
  i_minus: 'I-',
};

function itemNosForScaleType(scaleType: EgoOkPersonalityScaleType): number[] {
  return EGO_OK_QUESTIONS.filter((q) => q.scaleType === scaleType).map((q) => q.no);
}

function rawScoreForScaleType(report: EgoOkReport, scaleType: EgoOkPersonalityScaleType): number {
  if (scaleType.endsWith('_positive') || scaleType.endsWith('_negative')) {
    const egoId = EGO_ID_BY_SCALE[scaleType as keyof typeof EGO_ID_BY_SCALE];
    const row = report.egogram.find((s) => s.id === egoId);
    if (!row) return 0;
    return scaleType.endsWith('_negative') ? row.negativeRaw : row.positiveRaw;
  }
  const okId = OK_ID_BY_SCALE[scaleType as keyof typeof OK_ID_BY_SCALE];
  return report.okgram.find((s) => s.id === okId)?.raw ?? 0;
}

export function buildPersonalityScaleBreakdown(report: EgoOkReport): PersonalityScaleBreakdownRow[] {
  return EGO_OK_PERSONALITY_SCALE_TAXONOMY.map((node) => {
    const raw = rawScoreForScaleType(report, node.scaleType);
    const pct = node.maxScore > 0 ? Math.round((raw / node.maxScore) * 1000) / 10 : 0;
    return {
      ...node,
      raw,
      pct,
      itemNos: itemNosForScaleType(node.scaleType),
    };
  });
}

export function groupBreakdownByMajor(
  rows: PersonalityScaleBreakdownRow[],
): { major: string; rows: PersonalityScaleBreakdownRow[] }[] {
  const order: string[] = [];
  const map = new Map<string, PersonalityScaleBreakdownRow[]>();
  for (const row of rows) {
    if (!map.has(row.major)) {
      map.set(row.major, []);
      order.push(row.major);
    }
    map.get(row.major)!.push(row);
  }
  return order.map((major) => ({ major, rows: map.get(major)! }));
}

export function groupBreakdownByMiddle(rows: PersonalityScaleBreakdownRow[]): { middle: string; rows: PersonalityScaleBreakdownRow[] }[] {
  const order: string[] = [];
  const map = new Map<string, PersonalityScaleBreakdownRow[]>();
  for (const row of rows) {
    if (!map.has(row.middle)) {
      map.set(row.middle, []);
      order.push(row.middle);
    }
    map.get(row.middle)!.push(row);
  }
  return order.map((middle) => ({ middle, rows: map.get(middle)! }));
}
