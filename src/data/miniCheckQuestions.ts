/**
 * 3분 마음 체크 — 상담코드(generic)용 6문항
 * backend/data/mini_check.py 와 동기화
 */
export type MiniCheckChoice = {
  value: number;
  label: string;
};

export type MiniCheckQuestion = {
  id: string;
  question: string;
  type: 'mini_check';
  choices: MiniCheckChoice[];
};

export const MINI_CHECK_QUESTIONS: MiniCheckQuestion[] = [
  {
    id: 'm1',
    question: '최근 2주간 평소보다 피로감을 많이 느꼈다.',
    type: 'mini_check',
    choices: [
      { value: 0, label: '전혀 아니다' },
      { value: 1, label: '가끔' },
      { value: 2, label: '자주' },
      { value: 3, label: '거의 항상' },
    ],
  },
  {
    id: 'm2',
    question: '일상에서 집중하기 어려웠다.',
    type: 'mini_check',
    choices: [
      { value: 0, label: '전혀 아니다' },
      { value: 1, label: '가끔' },
      { value: 2, label: '자주' },
      { value: 3, label: '거의 항상' },
    ],
  },
  {
    id: 'm3',
    question: '걱정이나 불안이 부담스러웠다.',
    type: 'mini_check',
    choices: [
      { value: 0, label: '전혀 아니다' },
      { value: 1, label: '가끔' },
      { value: 2, label: '자주' },
      { value: 3, label: '거의 항상' },
    ],
  },
  {
    id: 'm4',
    question: '수면의 질이 좋지 않았다.',
    type: 'mini_check',
    choices: [
      { value: 0, label: '전혀 아니다' },
      { value: 1, label: '가끔' },
      { value: 2, label: '자주' },
      { value: 3, label: '거의 항상' },
    ],
  },
  {
    id: 'm5',
    question: '대인관계에서 에너지가 소진되었다.',
    type: 'mini_check',
    choices: [
      { value: 0, label: '전혀 아니다' },
      { value: 1, label: '가끔' },
      { value: 2, label: '자주' },
      { value: 3, label: '거의 항상' },
    ],
  },
  {
    id: 'm6',
    question: '스스로를 통제하기 어려웠다.',
    type: 'mini_check',
    choices: [
      { value: 0, label: '전혀 아니다' },
      { value: 1, label: '가끔' },
      { value: 2, label: '자주' },
      { value: 3, label: '거의 항상' },
    ],
  },
];

export function scoreMiniCheckClient(answers: Record<string, number>): {
  hookMessage: string;
  counselorNote: string;
} {
  const maxScore = MINI_CHECK_QUESTIONS.length * 3;
  let total = 0;
  for (const q of MINI_CHECK_QUESTIONS) {
    const raw = answers[q.id];
    const val = typeof raw === 'number' ? Math.max(0, Math.min(3, raw)) : 0;
    total += val;
  }
  const ratio = maxScore ? total / maxScore : 0;
  let hookMessage: string;
  if (ratio >= 0.72) {
    hookMessage = '최근 스트레스·피로 신호가 많이 보입니다.';
  } else if (ratio >= 0.45) {
    hookMessage = '주의가 필요한 부분이 조금 보입니다.';
  } else {
    hookMessage = '전반적으로 안정적인 편으로 보입니다.';
  }
  return {
    hookMessage,
    counselorNote: '담당 상담사가 곧 확인해 드립니다.',
  };
}
