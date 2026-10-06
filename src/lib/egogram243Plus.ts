/**
 * 243Plus(+) 9단계 — docs/internal-materials/ego-ok/README.md · plus243-tiers.json
 * 합계 10~50: A9(46~50) … C1(10~14) — UI 표기는 A9,A8,A7,B6,B5,B4,C3,C2,C1
 */
import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';

export type Plus243Letter = 'A' | 'B' | 'C';
export type Plus243Degree = 1 | 2 | 3;
/** 1=가장 낮음(C1) … 9=가장 높음(A9) */
export type Plus243Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Plus243Tier = {
  letter: Plus243Letter;
  degree: Plus243Degree;
  stage: Plus243Stage;
  /** 243+플러스 9단계 표기 (예: A9, B5, C1) */
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

export const EGO_SCALE_PATTERN_ORDER: EgoScaleId[] = ['CP', 'NP', 'A', 'FC', 'AC'];

export function formatPlus243NineStageLabel(tier: Pick<Plus243Tier, 'letter' | 'stage'>): string {
  return `${tier.letter}${tier.stage}`;
}

export function rawScoreToPlus243Tier(raw: number): Plus243Tier {
  const clamped = Math.min(50, Math.max(10, Math.round(raw)));
  const hit = TIER_DEFS.find((t) => clamped >= t.min && clamped <= t.max);
  const def = hit ?? TIER_DEFS[TIER_DEFS.length - 1];
  return {
    letter: def.letter,
    degree: def.degree,
    stage: def.stage,
    label: formatPlus243NineStageLabel(def),
    min: def.min,
    max: def.max,
  };
}

/** 243+ 플러스 9단계 표기 (A9 … C1) */
export function plus243TierToAscii(tier: Plus243Tier): string {
  return formatPlus243NineStageLabel(tier);
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
  return plus243TierToAscii(entry.tier);
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

/** 4~6단계 = 권장 구간 (점수·단계 판정의 단일 기준) */
export function isPlus243RecommendedStage(stage: Plus243Stage): boolean {
  return stage >= PLUS243_RECOMMENDED_STAGE_MIN && stage <= PLUS243_RECOMMENDED_STAGE_MAX;
}

export function isPlus243RecommendedRaw(raw: number): boolean {
  return isPlus243RecommendedStage(rawScoreToPlus243Tier(raw).stage);
}

/** 최초 단계 언급 — 권장 구간이면 (권장구간 4~6단계) 표시 */
export function formatCurrentStageLeadIn(tier: Plus243Tier, raw?: number): string {
  const score = raw != null ? ` · ${raw}점` : '';
  const range = `${tier.min}~${tier.max}점 · ${tier.label}`;
  if (isPlus243RecommendedStage(tier.stage)) {
    return `현재 ${tier.stage}단계(권장구간 4~6단계)${score} · ${range}`;
  }
  if (tier.stage <= 3) {
    return `현재 ${tier.stage}단계(부족 1~3단계)${score} · ${range}`;
  }
  return `현재 ${tier.stage}단계(과잉 7~9단계)${score} · ${range}`;
}

/**
 * 인접 계단(n−1, n+1)만 언급. 5단계면 4·6만, 7·9 등 먼 단계는 넣지 않음.
 */
export function plus243AdjacentStageHints(stage: Plus243Stage): string[] {
  const lines: string[] = [];
  const prev = (stage - 1) as Plus243Stage;
  const next = (stage + 1) as Plus243Stage;

  if (isPlus243RecommendedStage(stage)) {
    if (prev === 3) {
      lines.push('한 단계 아래 3단계(19~23점)는 부족 구간입니다.');
    } else if (isPlus243RecommendedStage(prev)) {
      lines.push(`한 단계 아래 ${prev}단계도 권장 구간(4~6단계) 안입니다.`);
    }
    if (next === 7) {
      lines.push('한 단계 위 7단계(37점~)는 과잉 구간입니다.');
    } else if (next <= 6) {
      lines.push(`한 단계 위 ${next}단계도 권장 구간(4~6단계) 안입니다.`);
    }
    return lines;
  }

  if (stage <= 3 && next >= 1 && next <= 9) {
    lines.push(`인접 ${next}단계를 향해 한 단계씩 에너지를 키우는 것을 목표로 합니다.`);
    return lines;
  }

  if (stage >= 7 && prev >= 1 && prev <= 9) {
    lines.push(`인접 ${prev}단계를 향해 한 단계씩 에너지를 낮추는 것을 목표로 합니다.`);
    if (next <= 9 && stage < 9) {
      lines.push(`한 단계 위 ${next}단계도 과잉 구간(7~9단계)입니다.`);
    }
    return lines.slice(0, 2);
  }

  return lines;
}
