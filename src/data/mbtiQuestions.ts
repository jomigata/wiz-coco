interface Question {
  question: string;
  type: string;
}

export const questions: Question[] = [
  // E-I 질문들
  {
    question: "새로운 사람들과 만나는 것을 즐깁니다.",
    type: "E-I"
  },
  {
    question: "대화를 먼저 시작하는 편입니다.",
    type: "E-I"
  },
  {
    question: "많은 사람들과 어울리는 것이 에너지가 됩니다.",
    type: "E-I"
  },
  {
    question: "혼자만의 시간이 필요합니다.",
    type: "E-I"
  },
  {
    question: "조용한 환경에서 더 집중이 잘 됩니다.",
    type: "E-I"
  },

  // S-N 질문들
  {
    question: "구체적이고 실제적인 것을 선호합니다.",
    type: "S-N"
  },
  {
    question: "현재에 집중하는 편입니다.",
    type: "S-N"
  },
  {
    question: "세부사항에 주의를 기울입니다.",
    type: "S-N"
  },
  {
    question: "미래의 가능성을 상상하는 것을 좋아합니다.",
    type: "S-N"
  },
  {
    question: "직관적인 판단을 자주 합니다.",
    type: "S-N"
  },

  // T-F 질문들
  {
    question: "결정을 내릴 때 논리적으로 분석합니다.",
    type: "T-F"
  },
  {
    question: "객관적인 사실을 중요하게 생각합니다.",
    type: "T-F"
  },
  {
    question: "감정보다는 이성을 따르는 편입니다.",
    type: "T-F"
  },
  {
    question: "다른 사람의 감정을 잘 공감합니다.",
    type: "T-F"
  },
  {
    question: "조화로운 관계를 중요하게 생각합니다.",
    type: "T-F"
  },

  // J-P 질문들
  {
    question: "계획을 세우고 그대로 실행하는 것을 좋아합니다.",
    type: "J-P"
  },
  {
    question: "체계적으로 일을 처리하는 편입니다.",
    type: "J-P"
  },
  {
    question: "마감기한을 정확히 지킵니다.",
    type: "J-P"
  },
  {
    question: "상황에 따라 유연하게 대처하는 것을 선호합니다.",
    type: "J-P"
  },
  {
    question: "즉흥적인 활동을 즐깁니다.",
    type: "J-P"
  }
]; 