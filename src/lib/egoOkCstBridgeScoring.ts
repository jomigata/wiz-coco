import {
  CST_DOMAIN_RELATION_MIDDLE_IDS,
  CST_DOMAIN_WELLBEING_MIDDLE_IDS,
  CST_DOMAIN_WORK_MIDDLE_IDS,
  CST_EMOTION_MIDDLE_IDS,
  CST_INTELLECT_MIDDLE_IDS,
  CST_OTHER_ORIENT_MIDDLE_IDS,
  CST_SELF_ORIENT_MIDDLE_IDS,
  CST_VIA_MIDDLE_IDS,
  EGO_OK_ALL_SCALE_MAJORS,
  EGO_OK_CST_MAJORS,
  type CstMajorDef,
  type CstMiddleDef,
} from '@/lib/egoOkCstBridgeCatalog';
import {
  formatEnergyStageLine,
  pctToPlus243EnergyMeta,
  type CstScaleEnergyMeta,
} from '@/lib/egoOkCstBridgeEnergy';
import {
  buildPersonalityScaleBreakdown,
  type PersonalityScaleBreakdownRow,
} from '@/lib/egoOkPersonalityScaleBreakdown';
import type { EgoOkPersonalityScaleType } from '@/lib/egoOkReportScaleTaxonomy';
import type { EgoOkReport } from '@/lib/egoOkScoring';

export type CstMiddleScore = {
  middleId: string;
  label: string;
  raw: number;
  maxScore: number;
  pct: number;
  itemCount: number;
  uniqueItemCount: number;
  formTags: string;
  itemNos: number[];
  reportLine: string;
  minors: { id: string; label: string }[];
  targetItemCount: number;
  quantitySufficiencyPct: number;
  contentSuitabilityPct: number;
  overallSuitabilityPct: number;
  energy: CstScaleEnergyMeta;
};

export type CstMajorScore = {
  majorId: string;
  label: string;
  labelEn: string;
  relatedTabId: CstMajorDef['relatedTabId'];
  raw: number;
  maxScore: number;
  pct: number;
  itemCount: number;
  uniqueItemCount: number;
  formTags: string;
  energy: CstScaleEnergyMeta;
  middles: CstMiddleScore[];
};

function tierLine(pct: number, label: string, energy: CstScaleEnergyMeta): string {
  const base =
    pct >= 72
      ? `${label}: 상대적으로 높은 편(${pct}%)`
      : pct >= 48
        ? `${label}: 보통 수준(${pct}%)`
        : `${label}: 여유·보완 여지(${pct}%)`;
  return `${base} · ${formatEnergyStageLine(energy)} ${energy.balanceComment}`;
}

function computeSuitability(middle: CstMiddleDef, uniqueItemCount: number): {
  targetItemCount: number;
  quantitySufficiencyPct: number;
  contentSuitabilityPct: number;
  overallSuitabilityPct: number;
} {
  const target = middle.targetItemCount ?? 5;
  const quantitySufficiencyPct =
    target > 0 ? Math.min(100, Math.round((uniqueItemCount / target) * 1000) / 10) : 0;
  const scaleTypes = middle.scaleTypes ?? [];
  const fits =
    scaleTypes.length > 0
      ? scaleTypes.map((st) => middle.contentFit?.[st] ?? 0.72)
      : [0.5];
  const contentSuitabilityPct = Math.round((fits.reduce((a, b) => a + b, 0) / fits.length) * 1000) / 10;
  const overallSuitabilityPct =
    Math.round((quantitySufficiencyPct * 0.45 + contentSuitabilityPct * 0.55) * 10) / 10;
  return { targetItemCount: target, quantitySufficiencyPct, contentSuitabilityPct, overallSuitabilityPct };
}

function aggregateRows(rows: PersonalityScaleBreakdownRow[]): {
  raw: number;
  maxScore: number;
  pct: number;
  itemCount: number;
  uniqueItemCount: number;
  formTags: string;
  itemNos: number[];
} {
  const raw = rows.reduce((s, r) => s + r.raw, 0);
  const maxScore = rows.reduce((s, r) => s + r.maxScore, 0);
  const pct = maxScore > 0 ? Math.round((raw / maxScore) * 1000) / 10 : 0;
  const itemCount = rows.reduce((s, r) => s + r.itemCount, 0);
  const itemNos = Array.from(new Set(rows.flatMap((r) => r.itemNos))).sort((a, b) => a - b);
  const formTags = Array.from(new Set(rows.map((r) => r.formTag))).join(' · ');
  return { raw, maxScore, pct, itemCount, uniqueItemCount: itemNos.length, formTags, itemNos };
}

function rowsForScaleTypes(
  breakdown: PersonalityScaleBreakdownRow[],
  scaleTypes: EgoOkPersonalityScaleType[],
): PersonalityScaleBreakdownRow[] {
  const set = new Set(scaleTypes);
  return breakdown.filter((r) => set.has(r.scaleType));
}

function enrichMiddle(middle: CstMiddleDef, agg: ReturnType<typeof aggregateRows>): CstMiddleScore {
  const suit = computeSuitability(middle, agg.uniqueItemCount);
  const energy = pctToPlus243EnergyMeta(agg.pct);
  return {
    middleId: middle.id,
    label: middle.label,
    ...agg,
    ...suit,
    energy,
    reportLine: tierLine(agg.pct, middle.label, energy),
    minors: middle.minors,
  };
}

function scoreScaleMapMiddle(
  middle: CstMiddleDef,
  breakdown: PersonalityScaleBreakdownRow[],
): CstMiddleScore {
  const rows = rowsForScaleTypes(breakdown, middle.scaleTypes ?? []);
  return enrichMiddle(middle, aggregateRows(rows));
}

function avgPct(middleScores: Map<string, CstMiddleScore>, ids: readonly string[]): number {
  const vals = ids.map((id) => middleScores.get(id)?.pct).filter((v): v is number => v != null);
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function syntheticMiddle(
  middle: CstMiddleDef,
  pct: number,
  raw: number,
  maxScore: number,
  itemCount: number,
  uniqueItemCount: number,
  formTags: string,
  reportLine: string,
): CstMiddleScore {
  const suit = computeSuitability(middle, uniqueItemCount);
  const energy = pctToPlus243EnergyMeta(pct);
  return {
    middleId: middle.id,
    label: middle.label,
    raw,
    maxScore,
    pct,
    itemCount,
    uniqueItemCount,
    formTags,
    itemNos: [],
    ...suit,
    energy,
    reportLine: reportLine.includes('단계') ? reportLine : `${reportLine} · ${formatEnergyStageLine(energy)}`,
    minors: middle.minors,
  };
}

function buildViaMiddleMap(breakdown: PersonalityScaleBreakdownRow[]): Map<string, CstMiddleScore> {
  const map = new Map<string, CstMiddleScore>();
  for (const major of EGO_OK_CST_MAJORS) {
    if (major.id < '1' || major.id > '6') continue;
    for (const middle of major.middles) {
      if (middle.kind === 'scale-map') {
        map.set(middle.id, scoreScaleMapMiddle(middle, breakdown));
      }
    }
  }
  return map;
}

function scoreMajor7(middle: CstMiddleDef, viaMap: Map<string, CstMiddleScore>): CstMiddleScore {
  if (middle.derivedKey === 'relationship-dimension') {
    const selfPct = avgPct(viaMap, CST_SELF_ORIENT_MIDDLE_IDS);
    const otherPct = avgPct(viaMap, CST_OTHER_ORIENT_MIDDLE_IDS);
    const total = selfPct + otherPct || 1;
    const selfShare = Math.round((selfPct / total) * 1000) / 10;
    const line = `자기지향 ${selfPct}% · 타인지향 ${otherPct}% — 편중 ${selfShare >= 50 ? '자기 성취' : '관계·공동체'} 쪽 ${Math.max(selfShare, 100 - selfShare)}%`;
    return syntheticMiddle(middle, (selfPct + otherPct) / 2, selfPct + otherPct, 200, 0, 0, 'VIA·오케이 근사', line);
  }
  const intellect = avgPct(viaMap, CST_INTELLECT_MIDDLE_IDS);
  const emotion = avgPct(viaMap, CST_EMOTION_MIDDLE_IDS);
  const total = intellect + emotion || 1;
  const intellectShare = Math.round((intellect / total) * 1000) / 10;
  const line = `지성 ${intellect}% · 감성 ${emotion}% — ${intellectShare >= 50 ? '인지·사고' : '정서·체험'} 우선형 ${Math.max(intellectShare, 100 - intellectShare)}%`;
  return syntheticMiddle(middle, (intellect + emotion) / 2, intellect + emotion, 200, 0, 0, 'VIA·오케이 근사', line);
}

function scoreMajor8(middle: CstMiddleDef, viaMap: Map<string, CstMiddleScore>): CstMiddleScore {
  const ranked = CST_VIA_MIDDLE_IDS.map((id) => viaMap.get(id)!)
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct);
  const top5 = ranked.slice(0, 5);
  const allSum = ranked.reduce((s, r) => s + r.pct, 0);
  const topSum = top5.reduce((s, r) => s + r.pct, 0);
  const concentration = allSum > 0 ? Math.round((topSum / allSum) * 1000) / 10 : 0;
  const mean = ranked.length ? ranked.reduce((s, r) => s + r.pct, 0) / ranked.length : 0;
  const variance =
    ranked.length > 1
      ? ranked.reduce((s, r) => s + (r.pct - mean) ** 2, 0) / (ranked.length - 1)
      : 0;
  const sd = Math.round(Math.sqrt(variance) * 10) / 10;

  if (middle.derivedKey === 'strength-profile') {
    const names = top5.map((r) => r.label).join(' → ');
    const flat = sd < 8 ? '고른 발달형' : '특정 강점 몰입형';
    return syntheticMiddle(
      middle,
      topSum / 5,
      topSum,
      500,
      0,
      0,
      '24 VIA 근사',
      `상위 5: ${names}. 집중도 ${concentration}%, 표준편차 ${sd} — ${flat}.`,
    );
  }

  const work = avgPct(viaMap, CST_DOMAIN_WORK_MIDDLE_IDS);
  const rel = avgPct(viaMap, CST_DOMAIN_RELATION_MIDDLE_IDS);
  const well = avgPct(viaMap, CST_DOMAIN_WELLBEING_MIDDLE_IDS);
  return syntheticMiddle(
    middle,
    (work + rel + well) / 3,
    work + rel + well,
    300,
    0,
    0,
    '영역 복합',
    `직무·학업 ${work}% · 대인·조직 ${rel}% · 웰빙·회복 ${well}%.`,
  );
}

function scoreMajor9(
  middle: CstMiddleDef,
  report: EgoOkReport,
  breakdown: PersonalityScaleBreakdownRow[],
): CstMiddleScore {
  const v = report.validity;
  if (middle.derivedKey === 'response-validity') {
    if (!v) {
      return syntheticMiddle(middle, 0, 0, 0, 9, 9, '타당도 9문항', '타당도 프로파일 없음 — validity 탭을 확인하세요.');
    }
    const is99 = report.itemBankId === 'ego-ok-99';
    const imcPct = v.imc.failCount >= 2 ? 100 : v.imc.failCount >= 1 ? 50 : 0;
    const infreqPct =
      v.infreq.status === 'invalid' ? 100 : v.infreq.status === 'caution' ? 50 : 0;
    const liePct = v.lie.status === 'caution' ? 50 : is99 ? 0 : v.lie.max > 0 ? Math.round((v.lie.raw / v.lie.max) * 1000) / 10 : 0;
    const vrinPct =
      v.vrin.maxPairs > 0 ? Math.round((v.vrin.mismatchPairs / v.vrin.maxPairs) * 1000) / 10 : 0;
    const parts = is99 ? [imcPct, infreqPct, liePct] : [liePct, vrinPct, imcPct];
    const avg = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10;
    const summary = is99
      ? `전체 ${v.overallTitle}. IMC 3↓ ${v.imc.failCount}, F 3↑ ${v.infreq.raw}/${v.infreq.max}, L 2↓ ${v.lie.raw}/${v.lie.max} — ${v.overallSummary.slice(0, 100)}`
      : `전체 ${v.overallTitle}. L ${v.lie.raw}/${v.lie.max}, VRIN 불일치 ${v.vrin.mismatchPairs}/${v.vrin.maxPairs}, IMC 실패 ${v.imc.failCount} — ${v.overallSummary.slice(0, 120)}`;
    return syntheticMiddle(
      middle,
      avg,
      parts.reduce((a, b) => a + b, 0),
      300,
      10,
      10,
      is99 ? 'IMC·F·L' : 'IMC·L·F·VRIN',
      summary,
    );
  }

  const agg = aggregateRows(breakdown);
  const rawMean03 = Math.round((agg.pct / 100) * 3 * 100) / 100;
  const tScore = Math.round(50 + (agg.pct - 50) * 0.35);
  const percentile = Math.min(99, Math.max(1, Math.round(agg.pct)));
  return syntheticMiddle(
    middle,
    agg.pct,
    rawMean03,
    3,
    96,
    90,
    '90+6문항',
    `원점수 평균 ${rawMean03.toFixed(2)}/3.00 · T ${tScore} (근사) · 백분위 ${percentile}% (동일 검사 내 상대).`,
  );
}

function scoreMajor(major: CstMajorDef, report: EgoOkReport, breakdown: PersonalityScaleBreakdownRow[]): CstMajorScore {
  const majorNum = Number(major.id);
  const viaMap = majorNum >= 1 && majorNum <= 9 ? buildViaMiddleMap(breakdown) : new Map();

  const middles: CstMiddleScore[] = major.middles.map((middle) => {
    if (middle.kind === 'scale-map') return scoreScaleMapMiddle(middle, breakdown);
    if (major.id === '7') return scoreMajor7(middle, viaMap);
    if (major.id === '8') return scoreMajor8(middle, viaMap);
    if (major.id === '9') return scoreMajor9(middle, report, breakdown);
    return scoreScaleMapMiddle(middle, breakdown);
  });

  const majorScaleTypes = Array.from(
    new Set(major.middles.flatMap((m) => (m.kind === 'scale-map' ? m.scaleTypes ?? [] : []))),
  ) as EgoOkPersonalityScaleType[];

  let agg: ReturnType<typeof aggregateRows>;
  if (majorScaleTypes.length > 0) {
    agg = aggregateRows(rowsForScaleTypes(breakdown, majorScaleTypes));
  } else {
    const itemCount = middles.reduce((s, m) => s + m.itemCount, 0);
    const uniqueItemCount = middles.reduce((s, m) => s + m.uniqueItemCount, 0);
    const pct =
      middles.length > 0
        ? Math.round((middles.reduce((s, m) => s + m.pct, 0) / middles.length) * 10) / 10
        : 0;
    agg = {
      raw: middles.reduce((s, m) => s + m.raw, 0),
      maxScore: middles.reduce((s, m) => s + m.maxScore, 0),
      pct,
      itemCount,
      uniqueItemCount,
      formTags: Array.from(new Set(middles.map((m) => m.formTags).filter(Boolean))).join(' · '),
      itemNos: [],
    };
  }

  const energy = pctToPlus243EnergyMeta(agg.pct);

  return {
    majorId: major.id,
    label: major.label,
    labelEn: major.labelEn,
    relatedTabId: major.relatedTabId,
    ...agg,
    energy,
    middles,
  };
}

export function buildCstBridgeScores(report: EgoOkReport): CstMajorScore[] {
  const breakdown = buildPersonalityScaleBreakdown(report);
  return EGO_OK_ALL_SCALE_MAJORS.map((major) => scoreMajor(major, report, breakdown));
}
