/**
 * 243Plus(+) 9단계 — docs/internal-materials/ego-ok/README.md · plus243-tiers.json
 * 합계 10~50: A³(46~50), A²(41~45), A¹(37~40), B³(33~36), B²(28~32), B¹(24~27),
 * C³(19~23), C²(15~18), C¹(10~14)
 */
import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';

export type Plus243Letter = 'A' | 'B' | 'C';
export type Plus243Degree = 1 | 2 | 3;
/** 1=가장 낮음(C¹) … 9=가장 높음(A³) */
export type Plus243Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Plus243Tier = {
  letter: Plus243Letter;
  degree: Plus243Degree;
  stage: Plus243Stage;
  /** 유니코드 지수 표기 (A³) */
  label: string;
  min: number;
  max: number;
};

const TIER_DEFS: Array<{
  stage: Plus243Stage;
  letter: Plus243Letter;
  degree: Plus243Degree;
  min: number;
  max: number;
}> = [
  { stage: 9, letter: 'A', degree: 3, min: 46, max: 50 },
  { stage: 8, letter: 'A', degree: 2, min: 41, max: 45 },
  { stage: 7, letter: 'A', degree: 1, min: 37, max: 40 },
  { stage: 6, letter: 'B', degree: 3, min: 33, max: 36 },
  { stage: 5, letter: 'B', degree: 2, min: 28, max: 32 },
  { stage: 4, letter: 'B', degree: 1, min: 24, max: 27 },
  { stage: 3, letter: 'C', degree: 3, min: 19, max: 23 },
  { stage: 2, letter: 'C', degree: 2, min: 15, max: 18 },
  { stage: 1, letter: 'C', degree: 1, min: 10, max: 14 },
];

const SUPER = { 1: '¹', 2: '²', 3: '³' } as const;

export const EGO_SCALE_PATTERN_ORDER: EgoScaleId[] = ['CP', 'NP', 'A', 'FC', 'AC'];

export function rawScoreToPlus243Tier(raw: number): Plus243Tier {
  const clamped = Math.min(50, Math.max(10, Math.round(raw)));
  const hit = TIER_DEFS.find((t) => clamped >= t.min && clamped <= t.max);
  const def = hit ?? TIER_DEFS[TIER_DEFS.length - 1];
  return {
    letter: def.letter,
    degree: def.degree,
    stage: def.stage,
    label: `${def.letter}${SUPER[def.degree]}`,
    min: def.min,
    max: def.max,
  };
}

/** 243+ 플러스 표기 — 글자(A/B/C) + 9단계 숫자(1~9) */
export function plus243TierToAscii(tier: Plus243Tier): string {
  return `${tier.letter}${tier.stage}`;
}

/** 1~3 하늘 · 4~6 녹색 · 7~9 분홍 */
export function plus243StageDigitColor(stage: Plus243Stage): string {
  if (stage <= 3) return '#7dd3fc';
  if (stage <= 6) return '#34d399';
  return '#f472b6';
}

export type Plus243ScaleEntry = {
  tier: Plus243Tier;
  /** 243패턴(A/B/C) — 척도별 threeLevel */
  pattern243Letter: 'A' | 'B' | 'C';
};

export type Pattern243Plus = {
  /** CP→NP→A→FC→AC — 243글자+9단계 (예: B⁵B⁶…) */
  codeAscii: string;
  codeLabel: string;
  byScale: Record<EgoScaleId, Plus243ScaleEntry>;
  /** CP+NP, A 단독, FC+AC 그룹 (243Plus 요약) */
  groups: {
    cpNp: { sum: number; tier: Plus243Tier };
    a: { sum: number; tier: Plus243Tier };
    fcAc: { sum: number; tier: Plus243Tier };
  };
};

export function plus243DisplayAscii(entry: Plus243ScaleEntry): string {
  return `${entry.pattern243Letter}${entry.tier.stage}`;
}

export function buildPattern243Plus(egogram: EgoOkScaleScore[]): Pattern243Plus {
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s])) as Record<EgoScaleId, EgoOkScaleScore>;
  const byScale = {} as Record<EgoScaleId, Plus243ScaleEntry>;
  for (const id of EGO_SCALE_PATTERN_ORDER) {
    const three = byId[id].threeLevel;
    const letter = three === 'A' || three === 'B' || three === 'C' ? three : 'C';
    byScale[id] = {
      tier: rawScoreToPlus243Tier(byId[id].raw),
      pattern243Letter: letter,
    };
  }
  const codeAscii = EGO_SCALE_PATTERN_ORDER.map((id) => plus243DisplayAscii(byScale[id])).join('');
  const codeLabel = codeAscii;

  const cp = byId.CP.raw;
  const np = byId.NP.raw;
  const aRaw = byId.A.raw;
  const fc = byId.FC.raw;
  const ac = byId.AC.raw;
  const cpNpSum = cp + np;
  const fcAcSum = fc + ac;

  return {
    codeAscii,
    codeLabel,
    byScale,
    groups: {
      cpNp: { sum: cpNpSum, tier: rawScoreToPlus243Tier(cpNpSum) },
      a: { sum: aRaw, tier: rawScoreToPlus243Tier(aRaw) },
      fcAc: { sum: fcAcSum, tier: rawScoreToPlus243Tier(fcAcSum) },
    },
  };
}

export type Plus243StageBand = 'deficit' | 'normal' | 'excess';

/**
 * 보고서 설명 기준 (계단 이동 가정)
 * - 1~3: 에너지 사용 부족 · 4~6: 권장 · 7~9: 에너지 사용 과다
 * - 이탈 언급은 현재 단계의 ±1 계단만 (egogramEnergyStageComments)
 */
export function plus243StageBand(stage: Plus243Stage): Plus243StageBand {
  if (stage <= 3) return 'deficit';
  if (stage <= 6) return 'normal';
  return 'excess';
}

export function plus243StageBandLabel(band: Plus243StageBand): string {
  if (band === 'deficit') return '부족';
  if (band === 'normal') return '보통';
  return '과함';
}

export function formatPlus243StageLabel(tier: Plus243Tier): string {
  return `243+ 플러스 ${tier.stage}단계`;
}

/** 4~6단계(243+플러스 권장) — 9단계 점수표만 사용 */
export const PLUS243_RECOMMENDED_STAGE_MIN = 4 as Plus243Stage;
export const PLUS243_RECOMMENDED_STAGE_MAX = 6 as Plus243Stage;

export function plus243RecommendedRawRange(): { min: number; max: number } {
  const low = TIER_DEFS.find((t) => t.stage === PLUS243_RECOMMENDED_STAGE_MIN)!;
  const high = TIER_DEFS.find((t) => t.stage === PLUS243_RECOMMENDED_STAGE_MAX)!;
  return { min: low.min, max: high.max };
}
