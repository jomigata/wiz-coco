import { EGO_OK_QUESTIONS } from '@/data/egoOkQuestions';
import { buildPattern243Plus, type Pattern243Plus } from '@/lib/egogram243Plus';
import { classifyOkLifePosition } from '@/lib/egoOkOkLifePosition';
import patternSource from '../../docs/internal-materials/ego-ok/patterns-243-reports.json';

export type EgoOkGender = 'male' | 'female';

export type FiveLevel = 'A' | 'B' | 'C' | 'D' | 'E';
export type ThreeLevel = 'A' | 'B' | 'C';

export type EgoScaleId = 'CP' | 'NP' | 'A' | 'FC' | 'AC';
export type OkScaleId = 'U+' | 'U-' | 'I+' | 'I-';

export type LifePositionKind =
  | '자기긍정'
  | '자기부정'
  | '타인긍정'
  | '타인부정'
  | '자타긍정'
  | '자타부정'
  | '자타평평형';

export type EgoOkScaleScore = {
  id: EgoScaleId;
  label: string;
  raw: number;
  max: number;
  /** 10문항 모두 최저(1점) 응답 시 10 */
  min: number;
  /** 부정 문항 합 (막대 하단·주황) */
  negativeRaw: number;
  /** 긍정 문항 합 (막대 상단·하늘) */
  positiveRaw: number;
  fiveLevel: FiveLevel;
  threeLevel: ThreeLevel;
  negativePercent: number;
};

/** KTAA 종합 그래프 1열 (막대=이고, 선=오케이) */
export type EgoOkCompositeColumn = {
  id: EgoScaleId;
  topLabel: string;
  bottomLabel: string;
  codeLabel: string;
  okTag: string | null;
  egoNegative: number;
  egoPositive: number;
  egoTotal: number;
  okLine: number | null;
};

export type EgoOkOkScore = {
  id: OkScaleId;
  label: string;
  raw: number;
  max: number;
  min: number;
};

export type EgoOkReport = {
  itemBankId: string;
  patternCode: string;
  /** 243Plus 9단계 — CP~AC 각 척도 + 그룹(CP+NP, A, FC+AC) */
  pattern243Plus: Pattern243Plus;
  pattern243: {
    basicPattern: string;
    sections: Record<string, string>;
    sectionLabels: Record<string, string>;
    missing: boolean;
    reportNo: number | null;
  };
  egogram: EgoOkScaleScore[];
  okgram: EgoOkOkScore[];
  okDifference: {
    uDiff: number;
    iDiff: number;
    uGrade: FiveLevel;
    iGrade: FiveLevel;
  };
  lifePosition: {
    uAxis: number;
    iAxis: number;
    kind: LifePositionKind;
    summary: string;
  };
  nonContinuityPercent: number;
  nonContinuityPenalty: number;
  plus243: {
    cpNpSum: number;
    cpNpLevel: string;
    aSum: number;
    aLevel: string;
    fcAcSum: number;
    fcAcLevel: string;
  };
  answeredCount: number;
  compositeChart: EgoOkCompositeColumn[];
};

const COMPOSITE_COLUMN_META: Record<
  EgoScaleId,
  { topLabel: string; bottomLabel: string; codeLabel: string; okTag: string | null; okKey: OkScaleId | null }
> = {
  CP: { topLabel: '비판적 · 지배적', bottomLabel: '느슨함', codeLabel: 'CP', okTag: 'U−', okKey: 'U-' },
  NP: { topLabel: '과보호 · 헌신적', bottomLabel: '방임적', codeLabel: 'NP', okTag: 'U+', okKey: 'U+' },
  A: { topLabel: '기계적 · 현실적', bottomLabel: '즉흥적', codeLabel: 'A', okTag: null, okKey: null },
  FC: { topLabel: '개구쟁이 · 개방적', bottomLabel: '폐쇄적', codeLabel: 'FC', okTag: 'I+', okKey: 'I+' },
  AC: { topLabel: '자기비하 · 의존적', bottomLabel: '독단적', codeLabel: 'AC', okTag: 'I−', okKey: 'I-' },
};

const EGO_LABELS: Record<EgoScaleId, string> = {
  CP: '비판적 부모 (CP)',
  NP: '양육적 부모 (NP)',
  A: '성인 (A)',
  FC: '자유로운 아이 (FC)',
  AC: '순응하는 아이 (AC)',
};

export const OK_LABELS: Record<OkScaleId, string> = {
  'U+': '타인 긍정 (U+)',
  'U-': '타인 부정 (U−)',
  'I+': '자기 긍정 (I+)',
  'I-': '자기 부정 (I−)',
};

export const OK_SCALE_HINTS: Record<OkScaleId, string> = {
  'U+': '타인을 긍정적으로 수용·신뢰하는 경향(10문항 합)',
  'U-': '타인을 비판·통제하려는 경향(10문항 합)',
  'I+': '자기 자신을 긍정·수용하는 경향(10문항 합)',
  'I-': '자기 자신을 부정·억압하는 경향(10문항 합)',
};

const FIVE_LEVEL_CUTS: Record<EgoOkGender, Record<EgoScaleId, { min: Record<FiveLevel, number> }>> = {
  male: {
    CP: { min: { A: 43, B: 36, C: 27, D: 16, E: 0 } },
    NP: { min: { A: 47, B: 43, C: 36, D: 27, E: 0 } },
    A: { min: { A: 47, B: 43, C: 35, D: 25, E: 0 } },
    FC: { min: { A: 43, B: 36, C: 28, D: 19, E: 0 } },
    AC: { min: { A: 43, B: 35, C: 27, D: 16, E: 0 } },
  },
  female: {
    CP: { min: { A: 41, B: 34, C: 23, D: 16, E: 0 } },
    NP: { min: { A: 48, B: 44, C: 35, D: 29, E: 0 } },
    A: { min: { A: 45, B: 41, C: 30, D: 22, E: 0 } },
    FC: { min: { A: 46, B: 41, C: 30, D: 19, E: 0 } },
    AC: { min: { A: 46, B: 41, C: 29, D: 18, E: 0 } },
  },
};

const THREE_LEVEL_CUTS: Record<EgoOkGender, Record<EgoScaleId, { aMin: number; bMin: number; cMin: number }>> = {
  male: {
    CP: { aMin: 35, bMin: 15, cMin: 10 },
    NP: { aMin: 44, bMin: 26, cMin: 10 },
    A: { aMin: 42, bMin: 24, cMin: 10 },
    FC: { aMin: 35, bMin: 18, cMin: 10 },
    AC: { aMin: 34, bMin: 15, cMin: 10 },
  },
  female: {
    CP: { aMin: 33, bMin: 15, cMin: 10 },
    NP: { aMin: 45, bMin: 28, cMin: 10 },
    A: { aMin: 40, bMin: 21, cMin: 10 },
    FC: { aMin: 40, bMin: 18, cMin: 10 },
    AC: { aMin: 40, bMin: 17, cMin: 10 },
  },
};

/** KTAA 종합 그래프 배경(C/B/A). redTop=bMin, whiteTop=aMin. 좌=남·우=여 (협회 안내서). */
export type KtaaGraphZoneBounds = { redTop: number; whiteTop: number };

function ktaaGraphZonesFromThreeLevel(
  cuts: Record<EgoScaleId, { aMin: number; bMin: number; cMin: number }>,
): Record<EgoScaleId, KtaaGraphZoneBounds> {
  return (['CP', 'NP', 'A', 'FC', 'AC'] as const).reduce(
    (acc, id) => {
      acc[id] = { redTop: cuts[id].bMin, whiteTop: cuts[id].aMin };
      return acc;
    },
    {} as Record<EgoScaleId, KtaaGraphZoneBounds>,
  );
}

export const KTAA_GRAPH_ZONES: Record<EgoOkGender, Record<EgoScaleId, KtaaGraphZoneBounds>> = {
  male: ktaaGraphZonesFromThreeLevel(THREE_LEVEL_CUTS.male),
  female: ktaaGraphZonesFromThreeLevel(THREE_LEVEL_CUTS.female),
};

const NEGATIVE_PERCENT_BANDS: Record<FiveLevel, { min: number; max: number }> = {
  A: { min: 76, max: 100 },
  B: { min: 51, max: 75 },
  C: { min: 31, max: 50 },
  D: { min: 16, max: 30 },
  E: { min: 0, max: 15 },
};

export function normalizeEgoOkGender(gender: string | undefined): EgoOkGender {
  const g = (gender || '').trim();
  if (g === '여성' || g.toLowerCase() === 'female' || g === 'F') return 'female';
  return 'male';
}

function scaleFromType(scaleType: string): EgoScaleId | OkScaleId | null {
  if (scaleType.startsWith('cp_')) return 'CP';
  if (scaleType.startsWith('np_')) return 'NP';
  if (scaleType.startsWith('ac_')) return 'AC';
  if (scaleType.startsWith('fc_')) return 'FC';
  if (scaleType.startsWith('a_')) return 'A';
  if (scaleType === 'u_plus') return 'U+';
  if (scaleType === 'u_minus') return 'U-';
  if (scaleType === 'i_plus') return 'I+';
  if (scaleType === 'i_minus') return 'I-';
  return null;
}

/** 6점 척도(1~6) → 문항 1~5점 (협회 KTAA 환산) */
const ITEM_POINTS_BY_LIKERT: Record<number, number> = {
  1: 1,
  2: 2,
  3: 2.75,
  4: 3.25,
  5: 4,
  6: 5,
};

export function likertToItemPoints(rawAnswer: number): number {
  const v = Math.round(rawAnswer);
  if (v <= 1) return ITEM_POINTS_BY_LIKERT[1];
  if (v >= 6) return ITEM_POINTS_BY_LIKERT[6];
  return ITEM_POINTS_BY_LIKERT[v] ?? 1;
}

/** 척도 합계: 소수 합산 후 0.5 이상 반올림(정수) */
export function roundScaleTotal(sum: number): number {
  return Math.round(sum);
}

export function isEgoOkLikertAnswer(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 6;
}

/** 미응답·범위 밖 문항 번호(1-based). 없으면 빈 배열 */
export function findEgoOkIncompleteQuestionNumbers(answers: Record<string, number>): number[] {
  const missing: number[] = [];
  for (let index = 0; index < EGO_OK_QUESTIONS.length; index += 1) {
    const raw = answers[String(index)] ?? answers[index];
    if (!isEgoOkLikertAnswer(raw)) missing.push(index + 1);
  }
  return missing;
}

function reconcileEgoSubtotals(
  raw: number,
  positiveRounded: number,
  negativeRounded: number,
): { positiveRaw: number; negativeRaw: number } {
  let positiveRaw = positiveRounded;
  let negativeRaw = negativeRounded;
  if (positiveRaw + negativeRaw !== raw) {
    negativeRaw = raw - positiveRaw;
  }
  if (negativeRaw < 0) {
    negativeRaw = 0;
    positiveRaw = raw;
  }
  return { positiveRaw, negativeRaw };
}

function sumInRange(score: number, cuts: { aMin: number; bMin: number; cMin: number }): ThreeLevel {
  if (score >= cuts.aMin) return 'A';
  if (score >= cuts.bMin) return 'B';
  return 'C';
}

function toFiveLevel(score: number, gender: EgoOkGender, scale: EgoScaleId): FiveLevel {
  const mins = FIVE_LEVEL_CUTS[gender][scale].min;
  if (score >= mins.A) return 'A';
  if (score >= mins.B) return 'B';
  if (score >= mins.C) return 'C';
  if (score >= mins.D) return 'D';
  return 'E';
}

function okDiffToFiveLevel(diff: number): FiveLevel {
  if (diff >= 7) return 'A';
  if (diff >= 3) return 'B';
  if (diff >= -2) return 'C';
  if (diff >= -6) return 'D';
  return 'E';
}

function negativePercentForLevel(level: FiveLevel): number {
  const band = NEGATIVE_PERCENT_BANDS[level];
  return Math.round((band.min + band.max) / 2);
}

function runPenalty(length: number): number {
  if (length < 5) return 0;
  if (length === 5) return 4;
  if (length === 6) return 6;
  if (length === 7) return 9;
  if (length === 8) return 13;
  if (length === 9) return 20;
  if (length === 10) return 30;
  if (length <= 16) return 30 + (length - 10) * 10;
  return 100;
}

function computeNonContinuity(answersInOrder: number[]): { percent: number; penalty: number } {
  if (answersInOrder.length === 0) return { percent: 100, penalty: 0 };
  let penalty = 0;
  let run = 1;
  for (let i = 1; i < answersInOrder.length; i += 1) {
    if (answersInOrder[i] === answersInOrder[i - 1]) {
      run += 1;
    } else {
      penalty += runPenalty(run);
      run = 1;
    }
  }
  penalty += runPenalty(run);
  const percent = Math.max(0, 100 - penalty);
  return { percent, penalty };
}

export function computeEgoOkReport(
  answers: Record<string, number>,
  genderInput: string | undefined,
): EgoOkReport {
  const incomplete = findEgoOkIncompleteQuestionNumbers(answers);
  if (incomplete.length > 0) {
    const preview =
      incomplete.length <= 5
        ? incomplete.join(', ')
        : `${incomplete.slice(0, 5).join(', ')} 외 ${incomplete.length - 5}문항`;
    throw new Error(`90문항 모두 응답해야 합니다. 미응답 또는 잘못된 응답: ${preview}`);
  }

  const gender = normalizeEgoOkGender(genderInput);
  const egoSums: Record<EgoScaleId, number> = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };
  const egoNeg: Record<EgoScaleId, number> = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };
  const egoPos: Record<EgoScaleId, number> = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };
  const okSums: Record<OkScaleId, number> = { 'U+': 0, 'U-': 0, 'I+': 0, 'I-': 0 };
  const orderedAnswers: number[] = [];

  EGO_OK_QUESTIONS.forEach((q, index) => {
    const raw = answers[String(index)] ?? answers[index]!;
    orderedAnswers.push(raw);
    const pts = likertToItemPoints(raw);
    const key = scaleFromType(q.scaleType);
    if (!key) return;
    if (key === 'CP' || key === 'NP' || key === 'A' || key === 'FC' || key === 'AC') {
      egoSums[key] += pts;
      if (q.scaleType.endsWith('_negative')) egoNeg[key] += pts;
      else if (q.scaleType.endsWith('_positive')) egoPos[key] += pts;
    } else {
      okSums[key] += pts;
    }
  });

  const egogram: EgoOkScaleScore[] = (['CP', 'NP', 'A', 'FC', 'AC'] as EgoScaleId[]).map((id) => {
    const raw = roundScaleTotal(egoSums[id]);
    const { positiveRaw, negativeRaw } = reconcileEgoSubtotals(
      raw,
      roundScaleTotal(egoPos[id]),
      roundScaleTotal(egoNeg[id]),
    );
    const fiveLevel = toFiveLevel(raw, gender, id);
    return {
      id,
      label: EGO_LABELS[id],
      raw,
      max: 50,
      min: 10,
      negativeRaw,
      positiveRaw,
      fiveLevel,
      threeLevel: sumInRange(raw, THREE_LEVEL_CUTS[gender][id]),
      negativePercent: negativePercentForLevel(fiveLevel),
    };
  });

  const okgram: EgoOkOkScore[] = (['U+', 'U-', 'I+', 'I-'] as OkScaleId[]).map((id) => ({
    id,
    label: OK_LABELS[id],
    raw: roundScaleTotal(okSums[id]),
    max: 50,
    min: 10,
  }));

  const np = egogram.find((s) => s.id === 'NP')!.raw;
  const cp = egogram.find((s) => s.id === 'CP')!.raw;
  const fc = egogram.find((s) => s.id === 'FC')!.raw;
  const ac = egogram.find((s) => s.id === 'AC')!.raw;
  const uAxis = np - cp;
  const iAxis = fc - ac;
  const uPlus = okgram.find((s) => s.id === 'U+')!.raw;
  const uMinus = okgram.find((s) => s.id === 'U-')!.raw;
  const iPlus = okgram.find((s) => s.id === 'I+')!.raw;
  const iMinus = okgram.find((s) => s.id === 'I-')!.raw;
  const uOkDiff = uPlus - uMinus;
  const iOkDiff = iPlus - iMinus;

  const patternCode = egogram.map((s) => s.threeLevel).join('');
  const bank = patternSource as {
    sectionLabels: Record<string, string>;
    items: Array<{ no?: number; code: string; basicPattern?: string; sections?: Record<string, string> }>;
    missingCodes?: string[];
  };
  const hit = bank.items.find((item) => item.code === patternCode);
  const missing = !hit || (bank.missingCodes || []).includes(patternCode);

  const { percent, penalty } = computeNonContinuity(orderedAnswers);
  const uTaOk = uMinus - uPlus;
  const iTaOk = iPlus - iMinus;
  const life = classifyOkLifePosition(uTaOk, iTaOk);

  const cpNpSum = cp + np;
  const fcAcSum = fc + ac;
  const aRaw = egogram.find((s) => s.id === 'A')!.raw;
  const pattern243Plus = buildPattern243Plus(egogram);

  const compositeChart: EgoOkCompositeColumn[] = (['CP', 'NP', 'A', 'FC', 'AC'] as EgoScaleId[]).map(
    (id) => {
      const meta = COMPOSITE_COLUMN_META[id];
      const ego = egogram.find((s) => s.id === id)!;
      const okLine =
        meta.okKey != null ? okgram.find((s) => s.id === meta.okKey)!.raw : null;
      return {
        id,
        topLabel: meta.topLabel,
        bottomLabel: meta.bottomLabel,
        codeLabel: meta.codeLabel,
        okTag: meta.okTag,
        egoNegative: ego.negativeRaw,
        egoPositive: ego.positiveRaw,
        egoTotal: ego.raw,
        okLine,
      };
    },
  );

  return {
    itemBankId: 'ego-ok-90',
    patternCode,
    pattern243Plus,
    pattern243: {
      basicPattern: hit?.basicPattern ?? '',
      sections: hit?.sections ?? {},
      sectionLabels: bank.sectionLabels ?? {},
      missing,
      reportNo: hit?.no ?? null,
    },
    egogram,
    okgram,
    okDifference: {
      uDiff: uOkDiff,
      iDiff: iOkDiff,
      uGrade: okDiffToFiveLevel(uOkDiff),
      iGrade: okDiffToFiveLevel(iOkDiff),
    },
    lifePosition: {
      uAxis,
      iAxis,
      kind: life.kind,
      summary: life.summary,
    },
    nonContinuityPercent: percent,
    nonContinuityPenalty: penalty,
    plus243: {
      cpNpSum,
      cpNpLevel: pattern243Plus.groups.cpNp.tier.label,
      aSum: aRaw,
      aLevel: pattern243Plus.groups.a.tier.label,
      fcAcSum,
      fcAcLevel: pattern243Plus.groups.fcAc.tier.label,
    },
    answeredCount: orderedAnswers.filter((v) => v > 0).length,
    compositeChart,
  };
}
