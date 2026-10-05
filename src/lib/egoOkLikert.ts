/** TA 이고-오케이 검사 응답 척도 (5점 · 문항당 1~5점 → 척도 10문항 50점 만점) */

export type EgoOkLikertHeightTier = 'tall' | 'mid' | 'short';

export type EgoOkLikertOption = {
  letter: string;
  value: number;
  labelLines: string[];
  circle: 'lg' | 'md' | 'sm';
  heightTier: EgoOkLikertHeightTier;
  rounded: string;
  glowPink?: boolean;
};

/** A/E(높음) · C(낮음) · B/D = (tall+short)/2 — 고정 높이(items-stretch 미사용) */
export const EGO_OK_LIKERT_HEIGHT: Record<EgoOkLikertHeightTier, string> = {
  tall: 'h-[12.5rem]',
  mid: 'h-[9.875rem]',
  short: 'h-[8.75rem]',
};

export const EGO_OK_LIKERT_OPTIONS: EgoOkLikertOption[] = [
  {
    letter: 'A',
    value: 5,
    labelLines: ['매우', '그렇다'],
    circle: 'lg',
    heightTier: 'tall',
    rounded: 'rounded-xl',
  },
  {
    letter: 'B',
    value: 4,
    labelLines: ['대체로', '그런', '편이다'],
    circle: 'md',
    heightTier: 'mid',
    rounded: 'rounded-[20px]',
  },
  {
    letter: 'C',
    value: 3,
    labelLines: ['상황에', '따라', '다르다'],
    circle: 'md',
    heightTier: 'short',
    rounded: 'rounded-[20px]',
  },
  {
    letter: 'D',
    value: 2,
    labelLines: ['별로', '그렇지', '않다'],
    circle: 'md',
    heightTier: 'mid',
    rounded: 'rounded-[20px]',
    glowPink: true,
  },
  {
    letter: 'E',
    value: 1,
    labelLines: ['전혀', '그렇지', '않다'],
    circle: 'lg',
    heightTier: 'tall',
    rounded: 'rounded-[20px]',
    glowPink: true,
  },
];

export const EGO_OK_LIKERT_MIN = 1;
export const EGO_OK_LIKERT_MAX = 5;
