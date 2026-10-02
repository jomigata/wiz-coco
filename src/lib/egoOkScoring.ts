import { EGO_OK_QUESTIONS } from '@/data/egoOkQuestions';
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
};

export type EgoOkReport = {
  itemBankId: string;
  patternCode: string;
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

const OK_LABELS: Record<OkScaleId, string> = {
  'U+': '타인 긍정 (U+)',
  'U-': '타인 부정 (U−)',
  'I+': '자기 긍정 (I+)',
  'I-': '자기 부정 (I−)',
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

/** 6점 척도(1~6) → 문항 0~5점 */
function itemPoints(rawAnswer: number): number {
  const v = Math.round(rawAnswer);
  if (v <= 1) return 0;
  if (v >= 6) return 5;
  return v - 1;
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

function classifyLifePosition(uAxis: number, iAxis: number): { kind: LifePositionKind; summary: string } {
  const uFlat = uAxis >= -1 && uAxis <= 1;
  const iFlat = iAxis >= -1 && iAxis <= 1;
  if (uFlat && iAxis > 1) {
    return { kind: '자기긍정', summary: '타인 축은 중립에 가깝고, 자기 축(FC−AC)이 양수입니다.' };
  }
  if (uFlat && iAxis < -1) {
    return { kind: '자기부정', summary: '타인 축은 중립에 가깝고, 자기 축이 음수입니다.' };
  }
  if (uAxis > 1 && iFlat) {
    return { kind: '타인긍정', summary: '타인 축(NP−CP)이 양수이고, 자기 축은 중립에 가깝습니다.' };
  }
  if (uAxis < -1 && iFlat) {
    return { kind: '타인부정', summary: '타인 축이 음수이고, 자기 축은 중립에 가깝습니다.' };
  }
  if (uAxis > 1 && iAxis > 1) {
    return { kind: '자타긍정', summary: '타인·자기 축 모두 긍정 방향입니다.' };
  }
  if (uAxis < -1 && iAxis < -1) {
    return { kind: '자타부정', summary: '타인·자기 축 모두 부정 방향입니다.' };
  }
  return { kind: '자타평평형', summary: '타인·자기 축 모두 −1~+1 범위의 평형에 가깝습니다.' };
}

function plus243Label(sum: number): string {
  if (sum >= 46) return 'A³';
  if (sum >= 41) return 'A²';
  if (sum >= 37) return 'A¹';
  if (sum >= 33) return 'B³';
  if (sum >= 28) return 'B²';
  if (sum >= 24) return 'B¹';
  if (sum >= 19) return 'C³';
  if (sum >= 15) return 'C²';
  if (sum >= 10) return 'C¹';
  return '—';
}

export function computeEgoOkReport(
  answers: Record<string, number>,
  genderInput: string | undefined,
): EgoOkReport {
  const gender = normalizeEgoOkGender(genderInput);
  const egoSums: Record<EgoScaleId, number> = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };
  const egoNeg: Record<EgoScaleId, number> = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };
  const egoPos: Record<EgoScaleId, number> = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };
  const okSums: Record<OkScaleId, number> = { 'U+': 0, 'U-': 0, 'I+': 0, 'I-': 0 };
  const orderedAnswers: number[] = [];

  EGO_OK_QUESTIONS.forEach((q, index) => {
    const raw = answers[String(index)] ?? answers[index];
    if (raw === undefined) {
      orderedAnswers.push(0);
      return;
    }
    orderedAnswers.push(raw);
    const pts = itemPoints(raw);
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
    const raw = egoSums[id];
    const fiveLevel = toFiveLevel(raw, gender, id);
    return {
      id,
      label: EGO_LABELS[id],
      raw,
      max: 50,
      negativeRaw: egoNeg[id],
      positiveRaw: egoPos[id],
      fiveLevel,
      threeLevel: sumInRange(raw, THREE_LEVEL_CUTS[gender][id]),
      negativePercent: negativePercentForLevel(fiveLevel),
    };
  });

  const okgram: EgoOkOkScore[] = (['U+', 'U-', 'I+', 'I-'] as OkScaleId[]).map((id) => ({
    id,
    label: OK_LABELS[id],
    raw: okSums[id],
    max: 50,
  }));

  const np = egoSums.NP;
  const cp = egoSums.CP;
  const fc = egoSums.FC;
  const ac = egoSums.AC;
  const uAxis = np - cp;
  const iAxis = fc - ac;
  const uOkDiff = okSums['U+'] - okSums['U-'];
  const iOkDiff = okSums['I+'] - okSums['I-'];

  const patternCode = egogram.map((s) => s.threeLevel).join('');
  const bank = patternSource as {
    sectionLabels: Record<string, string>;
    items: Array<{ no?: number; code: string; basicPattern?: string; sections?: Record<string, string> }>;
    missingCodes?: string[];
  };
  const hit = bank.items.find((item) => item.code === patternCode);
  const missing = !hit || (bank.missingCodes || []).includes(patternCode);

  const { percent, penalty } = computeNonContinuity(orderedAnswers);
  const life = classifyLifePosition(uAxis, iAxis);

  const cpNpSum = cp + np;
  const fcAcSum = fc + ac;

  const compositeChart: EgoOkCompositeColumn[] = (['CP', 'NP', 'A', 'FC', 'AC'] as EgoScaleId[]).map(
    (id) => {
      const meta = COMPOSITE_COLUMN_META[id];
      const ego = egogram.find((s) => s.id === id)!;
      const okLine = meta.okKey != null ? okSums[meta.okKey] : null;
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
      cpNpLevel: plus243Label(cpNpSum),
      fcAcSum,
      fcAcLevel: plus243Label(fcAcSum),
    },
    answeredCount: orderedAnswers.filter((v) => v > 0).length,
    compositeChart,
  };
}
