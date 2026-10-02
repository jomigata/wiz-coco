import type { EgoOkScaleKind } from '@/data/egoOkQuestions';

export type EgoOkAnswerOption = {
  value: number;
  letter: string;
  label: string;
  pyClass: string;
  circleClass: string;
};

const EGogram: EgoOkAnswerOption[] = [
  { value: 5, letter: 'A', label: '매우\n그렇다', pyClass: 'py-12', circleClass: 'w-14 h-14' },
  { value: 4, letter: 'B', label: '그렇다', pyClass: 'py-[2.625rem]', circleClass: 'w-12 h-12' },
  { value: 3, letter: 'C', label: '보통', pyClass: 'py-5', circleClass: 'w-10 h-10' },
  { value: 2, letter: 'D', label: '아니다', pyClass: 'py-5', circleClass: 'w-10 h-10' },
  { value: 1, letter: 'E', label: '매우\n아니다', pyClass: 'py-[2.625rem]', circleClass: 'w-12 h-12' },
];

const OKgram: EgoOkAnswerOption[] = [
  { value: 4, letter: 'A', label: '매우\n그렇다', pyClass: 'py-12', circleClass: 'w-14 h-14' },
  { value: 3, letter: 'B', label: '그렇다', pyClass: 'py-[2.625rem]', circleClass: 'w-12 h-12' },
  { value: 2, letter: 'C', label: '아니다', pyClass: 'py-[2.625rem]', circleClass: 'w-12 h-12' },
  { value: 1, letter: 'D', label: '매우\n아니다', pyClass: 'py-12', circleClass: 'w-14 h-14' },
];

export function getEgoOkAnswerOptions(scaleKind: EgoOkScaleKind): EgoOkAnswerOption[] {
  return scaleKind === 'okgram' ? OKgram : EGogram;
}
