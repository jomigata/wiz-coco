export interface Question {
  id: number;
  text: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  direction: 'positive' | 'negative';
}

export type AgeGroup = 'children' | 'teenager' | 'adult' | 'senior';

interface AgeGroupInfo {
  id: AgeGroup;
  label: string;
  description: string;
  ageRange: string;
}

export const ageGroups: AgeGroupInfo[] = [
  { 
    id: 'children', 
    label: '아동기', 
    description: '7-12세 아동의 성격 유형을 파악하는 검사입니다.', 
    ageRange: '7-12세' 
  },
  { 
    id: 'teenager', 
    label: '청소년기', 
    description: '13-19세 청소년의 성격 유형을 파악하는 검사입니다.', 
    ageRange: '13-19세' 
  },
  { 
    id: 'adult', 
    label: '성인기', 
    description: '20-59세 성인의 성격 유형을 파악하는 검사입니다.', 
    ageRange: '20-59세' 
  },
  { 
    id: 'senior', 
    label: '노년기', 
    description: '60세 이상 노년층의 성격 유형을 파악하는 검사입니다.', 
    ageRange: '60세 이상' 
  }
];

export const mbtiAgeQuestions: Question[] = [
  // 외향성(E) vs 내향성(I) 질문 (6문항)
  {
    id: 1,
    text: "모르는 사람들과 대화를 시작하는 것이 편하다.",
    dimension: "EI",
    direction: "positive" // E 성향
  },
  {
    id: 2,
    text: "여러 사람들과 함께 있을 때보다 혼자 있을 때 더 많은 에너지를 얻는다.",
    dimension: "EI",
    direction: "negative" // I 성향
  },
  {
    id: 3,
    text: "사람들과 어울리는 자리에서 다양한 사람들과 대화하는 것을 즐긴다.",
    dimension: "EI",
    direction: "positive" // E 성향
  },
  {
    id: 4,
    text: "혼자만의 시간과 공간이 필요하다.",
    dimension: "EI",
    direction: "negative" // I 성향
  },
  {
    id: 5,
    text: "처음 보는 사람들에게 자신을 소개하거나 먼저 말을 거는 것이 어렵지 않다.",
    dimension: "EI",
    direction: "positive" // E 성향
  },
  {
    id: 6,
    text: "많은 사람들과 함께 있으면 에너지가 소진되는 느낌이 든다.",
    dimension: "EI",
    direction: "negative" // I 성향
  },
  
  // 감각(S) vs 직관(N) 질문 (6문항)
  {
    id: 7,
    text: "현실적이고 구체적인 정보를 더 신뢰한다.",
    dimension: "SN",
    direction: "positive" // S 성향
  },
  {
    id: 8,
    text: "가능성과 미래에 대해 생각하는 것을 즐긴다.",
    dimension: "SN",
    direction: "negative" // N 성향
  },
  {
    id: 9,
    text: "세부사항에 주의를 기울이고 사실에 근거한 정보를 중요시한다.",
    dimension: "SN",
    direction: "positive" // S 성향
  },
  {
    id: 10,
    text: "새로운 아이디어를 떠올리고 창의적인 방법을 탐색하는 것을 좋아한다.",
    dimension: "SN",
    direction: "negative" // N 성향
  },
  {
    id: 11,
    text: "실용적이고 현실적인 해결책을 선호한다.",
    dimension: "SN",
    direction: "positive" // S 성향
  },
  {
    id: 12,
    text: "사물이나 상황의 숨은 의미와 패턴을 찾아내는 것을 좋아한다.",
    dimension: "SN",
    direction: "negative" // N 성향
  },
  
  // 사고(T) vs 감정(F) 질문 (6문항)
  {
    id: 13,
    text: "결정을 내릴 때 객관적인 사실과 논리를 더 중요하게 생각한다.",
    dimension: "TF",
    direction: "positive" // T 성향
  },
  {
    id: 14,
    text: "다른 사람의 감정을 고려하여 결정을 내리는 경향이 있다.",
    dimension: "TF",
    direction: "negative" // F 성향
  },
  {
    id: 15,
    text: "감정보다는 이성적인 판단이 더 중요하다고 생각한다.",
    dimension: "TF",
    direction: "positive" // T 성향
  },
  {
    id: 16,
    text: "사람들 간의 조화와 공감을 중요시한다.",
    dimension: "TF",
    direction: "negative" // F 성향
  },
  {
    id: 17,
    text: "직접적이고 솔직한 의견을 표현하는 것을 선호한다.",
    dimension: "TF",
    direction: "positive" // T 성향
  },
  {
    id: 18,
    text: "다른 사람들의 기분을 상하게 하지 않도록 말과 행동에 주의한다.",
    dimension: "TF",
    direction: "negative" // F 성향
  },
  
  // 판단(J) vs 인식(P) 질문 (6문항)
  {
    id: 19,
    text: "계획을 세우고 그에 따라 일을 진행하는 것을 선호한다.",
    dimension: "JP",
    direction: "positive" // J 성향
  },
  {
    id: 20,
    text: "계획보다는 상황에 따라 유연하게 대처하는 것을 선호한다.",
    dimension: "JP",
    direction: "negative" // P 성향
  },
  {
    id: 21,
    text: "일정과 마감 시간을 지키는 것이 중요하다고 생각한다.",
    dimension: "JP",
    direction: "positive" // J 성향
  },
  {
    id: 22,
    text: "계획을 세우기보다 즉흥적으로 일을 처리하는 것이 더 편하다.",
    dimension: "JP",
    direction: "negative" // P 성향
  },
  {
    id: 23,
    text: "체계적이고 조직적인 환경에서 일하는 것을 좋아한다.",
    dimension: "JP",
    direction: "positive" // J 성향
  },
  {
    id: 24,
    text: "새로운 정보와 가능성에 열려있으며 결정을 미루는 것을 선호한다.",
    dimension: "JP",
    direction: "negative" // P 성향
  }
];

// 연령별로 맞춤 질문을 랜덤하게 선택하는 함수
export function getRandomQuestionsForAgeGroup(ageGroup: AgeGroup, countPerDimension: number = 6): Question[] {
  // 각 차원별 문항 선별 및 랜덤 선택
  const dimensionQuestions: Record<string, Question[]> = {
    EI: mbtiAgeQuestions.filter(q => q.dimension === 'EI'),
    SN: mbtiAgeQuestions.filter(q => q.dimension === 'SN'),
    TF: mbtiAgeQuestions.filter(q => q.dimension === 'TF'),
    JP: mbtiAgeQuestions.filter(q => q.dimension === 'JP')
  };

  const result: Question[] = [];
  
  // 각 차원별로 countPerDimension 개수만큼 문항 선택
  Object.keys(dimensionQuestions).forEach(dimension => {
    // 해당 차원의 문항을 섞고 지정된 개수만큼만 선택
    const shuffled = shuffleArray(dimensionQuestions[dimension]);
    result.push(...shuffled.slice(0, countPerDimension));
  });

  // 문항 순서 랜덤하게 섞기
  return shuffleArray(result);
}

// 배열을 무작위로 섞는 함수
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 연령대 선택 가능한 옵션
export const ageGroupOptions = ['children', 'teenager', 'adult', 'senior'] as const;

// 각 연령대에 해당하는 나이 범위 확인
export function getAgeGroupFromAge(age: number): AgeGroup {
  if (age >= 6 && age <= 9) return 'children';
  if (age >= 10 && age <= 12) return 'teenager';
  if (age >= 13 && age <= 15) return 'adult';
  if (age >= 16 && age <= 18) return 'teenager';
  if (age >= 19 && age <= 30) return 'adult';
  if (age >= 31 && age <= 59) return 'adult';
  return 'senior';
} 