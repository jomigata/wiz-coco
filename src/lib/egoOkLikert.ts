/** TA 이고-오케이 검사 응답 척도 (5점 · 문항당 1~5점 → 척도 10문항 50점 만점) */

export type EgoOkLikertOption = {
  letter: string;
  value: number;
  labelLines: string[];
  circle: 'lg' | 'md' | 'sm';
  py: string;
  rounded: string;
  glowPink?: boolean;
};

export const EGO_OK_LIKERT_OPTIONS: EgoOkLikertOption[] = [
  {
    letter: 'A',
    value: 5,
    labelLines: ['매우', '그렇다'],
    circle: 'lg',
    py: 'py-12',
    rounded: 'rounded-xl',
  },
  {
    letter: 'B',
    value: 4,
    labelLines: ['그렇다'],
    circle: 'md',
    py: 'py-[2.625rem]',
    rounded: 'rounded-[20px]',
  },
  {
    letter: 'C',
    value: 3,
    labelLines: ['모르', '겠다'],
    circle: 'md',
    py: 'py-5',
    rounded: 'rounded-[20px]',
  },
  {
    letter: 'D',
    value: 2,
    labelLines: ['아니다'],
    circle: 'md',
    py: 'py-[2.625rem]',
    rounded: 'rounded-[20px]',
    glowPink: true,
  },
  {
    letter: 'E',
    value: 1,
    labelLines: ['매우', '아니다'],
    circle: 'lg',
    py: 'py-12',
    rounded: 'rounded-[20px]',
    glowPink: true,
  },
];

export const EGO_OK_LIKERT_MIN = 1;
export const EGO_OK_LIKERT_MAX = 5;
