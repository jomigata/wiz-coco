export interface DepressionLevel {
  title: string;
  description: string;
  recommendations: string[];
  characteristics: string[];
  riskFactors: string[];
  selfCare: string[];
  range: {
    min: number;
    max: number;
  };
}

export interface DepressionDescriptions {
  [key: string]: DepressionLevel;
}

export const depressionDescriptions: DepressionDescriptions = {
  MINIMAL: {
    title: '정상 범위',
    description: '현재 임상적으로 유의미한 우울 증상을 보이지 않습니다. 일상적인 기분 변화는 있을 수 있으나, 이는 정상적인 범위 내에 있습니다.',
    recommendations: [
      '현재의 긍정적인 상태를 유지하세요',
      '규칙적인 운동과 건강한 생활습관을 지속하세요',
      '스트레스 관리 기술을 계속 실천하세요',
      '주기적으로 자신의 감정 상태를 점검하세요'
    ],
    characteristics: [
      '일상적인 활동에 흥미와 즐거움을 느낌',
      '적절한 수면과 식사 패턴 유지',
      '긍정적인 자아상 유지',
      '미래에 대한 희망적인 태도'
    ],
    riskFactors: [
      '급격한 생활환경의 변화',
      '과도한 스트레스 상황',
      '중요한 인간관계의 상실',
      '건강 상태의 악화'
    ],
    selfCare: [
      '규칙적인 운동하기',
      '충분한 수면 취하기',
      '사회적 관계 유지하기',
      '취미 활동 즐기기'
    ],
    range: {
      min: 0,
      max: 13
    }
  },
  MILD: {
    title: '가벼운 우울상태',
    description: '경미한 수준의 우울 증상이 나타나고 있습니다. 일상생활에 약간의 어려움을 느낄 수 있으나, 심각한 기능 저하는 없는 상태입니다.',
    recommendations: [
      '가까운 사람들과 대화를 나누어 보세요',
      '일상적인 활동을 유지하도록 노력하세요',
      '가벼운 운동이나 산책을 시작해보세요',
      '필요하다면 전문가와 상담을 고려해보세요'
    ],
    characteristics: [
      '가벼운 수준의 의욕 저하',
      '때때로 나타나는 슬픔이나 우울감',
      '일상생활은 대체로 유지됨',
      '수면이나 식욕의 경미한 변화'
    ],
    riskFactors: [
      '지속적인 스트레스 상황',
      '사회적 지지체계의 부족',
      '불규칙한 생활습관',
      '과거의 우울 경험'
    ],
    selfCare: [
      '규칙적인 일상 유지하기',
      '긍정적인 활동 늘리기',
      '스트레스 관리하기',
      '건강한 식습관 유지하기'
    ],
    range: {
      min: 14,
      max: 19
    }
  },
  MODERATE: {
    title: '중등도 우울상태',
    description: '상당한 수준의 우울 증상이 나타나고 있습니다. 일상생활에서 어려움을 경험하고 있으며, 전문적인 도움이 필요할 수 있습니다.',
    recommendations: [
      '정신건강 전문가와의 상담을 적극 고려하세요',
      '가족이나 친구들에게 도움을 요청하세요',
      '과도한 업무나 스트레스를 줄이세요',
      '규칙적인 생활패턴을 유지하도록 노력하세요'
    ],
    characteristics: [
      '뚜렷한 우울감과 의욕 저하',
      '수면과 식욕의 현저한 변화',
      '집중력과 기억력 저하',
      '사회적 활동의 감소'
    ],
    riskFactors: [
      '심각한 스트레스 사건',
      '사회적 고립',
      '만성적인 건강 문제',
      '부정적인 사고패턴'
    ],
    selfCare: [
      '전문가 상담 받기',
      '지지체계 강화하기',
      '일상생활 구조화하기',
      '점진적인 활동 증가시키기'
    ],
    range: {
      min: 20,
      max: 28
    }
  },
  SEVERE: {
    title: '심한 우울상태',
    description: '심각한 수준의 우울 증상이 나타나고 있습니다. 전문적인 치료적 개입이 반드시 필요한 상태입니다.',
    recommendations: [
      '즉시 정신건강 전문가의 도움을 받으세요',
      '자살 생각이 있다면 즉시 전문가나 신뢰할 수 있는 사람에게 알리세요',
      '혼자 있는 것을 피하고 가족이나 친구와 함께 있으세요',
      '현재 상태가 일시적임을 기억하세요'
    ],
    characteristics: [
      '지속적인 강한 우울감',
      '심각한 수면장애',
      '식욕 저하나 체중 변화',
      '자살 생각이나 시도'
    ],
    riskFactors: [
      '이전의 자살 시도 경험',
      '심각한 사회적 고립',
      '주요 상실 경험',
      '동반된 정신건강 문제'
    ],
    selfCare: [
      '전문적 치료 받기',
      '24시간 지지체계 구축하기',
      '안전 계획 세우기',
      '기본적인 자기관리 유지하기'
    ],
    range: {
      min: 29,
      max: 63
    }
  }
};

interface MbtiTypeDescription {
  title: string;
  description: string;
  recommendations: string[];
}

interface MbtiProDescriptions {
  [key: number]: MbtiTypeDescription;
}

export const mbtiProDescriptions: MbtiProDescriptions = {
  0: {
    title: '외향적이고 직관적인 성향',
    description: '당신은 외향적이며 직관적인 성향을 가지고 있습니다. 새로운 아이디어를 창출하고 다른 사람들과 소통하는 것을 즐깁니다.',
    recommendations: [
      '팀 프로젝트나 그룹 활동에 참여해보세요',
      '창의적인 취미 활동을 시작해보세요',
      '새로운 사람들과의 네트워킹을 확장해보세요'
    ]
  },
  1: {
    title: '내향적이고 감각적인 성향',
    description: '당신은 내향적이며 감각적인 성향을 가지고 있습니다. 세부사항에 주의를 기울이고 혼자만의 시간을 중요하게 생각합니다.',
    recommendations: [
      '독서나 명상과 같은 개인 활동을 즐겨보세요',
      '체계적인 일정 관리를 시도해보세요',
      '깊이 있는 대화를 나눌 수 있는 소규모 모임에 참여해보세요'
    ]
  },
  2: {
    title: '사고형 판단 성향',
    description: '당신은 논리적이고 객관적인 판단을 선호하는 성향을 가지고 있습니다. 효율성과 체계성을 중요하게 생각합니다.',
    recommendations: [
      '전략 게임이나 퍼즐을 풀어보세요',
      '업무나 학습에서 체계적인 접근법을 시도해보세요',
      '목표 지향적인 프로젝트에 참여해보세요'
    ]
  },
  3: {
    title: '감정형 인식 성향',
    description: '당신은 감정적이고 유연한 성향을 가지고 있습니다. 다른 사람들의 감정을 잘 이해하고 상황에 따라 유연하게 대처합니다.',
    recommendations: [
      '예술이나 음악 활동에 참여해보세요',
      '자원봉사나 사회활동에 참여해보세요',
      '즉흥적인 여행이나 새로운 경험을 시도해보세요'
    ]
  }
}; 