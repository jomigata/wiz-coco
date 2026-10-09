/** TA 이고-오케이 검사 응답 척도 (5점 · 문항당 1~5점 → 척도 10문항 50점 만점) */

export type EgoOkLikertOption = {
  letter: string;
  value: number;
  labelLines: string[];
  circle: 'lg' | 'md' | 'sm';
  rounded: string;
  glowPink?: boolean;
};

/** A/E 끝단 높이 (rem) */
export const EGO_OK_LIKERT_HEIGHT_A_REM = 12.5;

/** C 중앙 높이 (rem) — 기존 8 → 약간 상향 */
export const EGO_OK_LIKERT_HEIGHT_C_REM = 9;

/** B·D = C + (A − C) / 2 */
export const EGO_OK_LIKERT_HEIGHT_BD_REM =
  EGO_OK_LIKERT_HEIGHT_C_REM + (EGO_OK_LIKERT_HEIGHT_A_REM - EGO_OK_LIKERT_HEIGHT_C_REM) / 2;

/** Tailwind arbitrary height (빌드 시 클래스 문자열 고정) */
export const EGO_OK_LIKERT_HEIGHT_BY_LETTER: Record<string, string> = {
  A: 'h-[12.5rem]',
  B: 'h-[10.75rem]',
  C: 'h-[9rem]',
  D: 'h-[10.75rem]',
  E: 'h-[12.5rem]',
};

export const EGO_OK_LIKERT_OPTIONS: EgoOkLikertOption[] = [
  {
    letter: 'A',
    value: 5,
    labelLines: ['매우', '그렇다'],
    circle: 'lg',
    rounded: 'rounded-xl',
  },
  {
    letter: 'B',
    value: 4,
    labelLines: ['대체로', '그런 편이다'],
    circle: 'md',
    rounded: 'rounded-[20px]',
  },
  {
    letter: 'C',
    value: 3,
    labelLines: ['상황에 따라', '다르다'],
    circle: 'md',
    rounded: 'rounded-[20px]',
  },
  {
    letter: 'D',
    value: 2,
    labelLines: ['별로', '그렇지 않다'],
    circle: 'md',
    rounded: 'rounded-[20px]',
    glowPink: true,
  },
  {
    letter: 'E',
    value: 1,
    labelLines: ['전혀', '그렇지 않다'],
    circle: 'lg',
    rounded: 'rounded-[20px]',
    glowPink: true,
  },
];

export const EGO_OK_LIKERT_MIN = 1;
export const EGO_OK_LIKERT_MAX = 5;
