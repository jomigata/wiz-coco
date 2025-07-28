export interface MbtiType {
  type: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  communication: string;
}

export interface RelationshipAnalysis {
  compatibility: number;
  strengths: string[];
  challenges: string[];
  tips: string[];
}

// MBTI 유형 데이터
export const mbtiData: Record<string, MbtiType> = {
  "ISTJ": {
    type: "논리주의자 (Inspector)",
    description: "현실적이고 사실적이며 책임감이 강합니다. 논리적으로 조직화하여 체계적으로 일을 처리합니다.",
    strengths: ["책임감이 강함", "현실적이고 실용적임", "정확하고 체계적임", "약속을 중요시함"],
    weaknesses: ["변화에 저항할 수 있음", "감정 표현이 서툴 수 있음", "융통성이 부족할 수 있음"],
    communication: "명확하고 구체적인 정보와 사실을 중심으로 소통합니다."
  },
  "ISFJ": {
    type: "수호자 (Protector)",
    description: "책임감이 강하고 온화하며 헌신적입니다. 다른 사람의 필요와 감정에 주의를 기울입니다.",
    strengths: ["헌신적이고 충성스러움", "세심하고 배려심 깊음", "관찰력이 뛰어남", "실용적이고 책임감 있음"],
    weaknesses: ["자신의 필요를 무시할 수 있음", "변화를 불편해함", "비판에 민감할 수 있음"],
    communication: "따뜻하고 개인적인 접근 방식을 선호하며 조화를 중시합니다."
  },
  "INFJ": {
    type: "옹호자 (Counselor)",
    description: "통찰력이 있고 창의적이며 이상주의적입니다. 깊은 사고와 강한 직관으로 타인을 이해합니다.",
    strengths: ["깊은 통찰력", "창의적이고 독창적임", "헌신적이고 열정적임", "타인의 성장을 도움"],
    weaknesses: ["지나치게 이상적일 수 있음", "완벽주의 성향", "비판에 민감할 수 있음"],
    communication: "깊고 의미 있는 대화를 선호하며 공감적으로 소통합니다."
  },
  "INTJ": {
    type: "전략가 (Mastermind)",
    description: "독립적이고 분석적이며 전략적입니다. 복잡한 문제를 해결하는 능력이 뛰어납니다.",
    strengths: ["뛰어난 분석력", "독립적이고 자기주도적", "전략적 사고", "지식 추구"],
    weaknesses: ["감정 표현이 서툴 수 있음", "때로는 냉담해 보일 수 있음", "지나치게 완벽주의적일 수 있음"],
    communication: "논리적이고 효율적인 대화를 선호하며 감정보다 사실과 아이디어를 중시합니다."
  },
  "ISTP": {
    type: "장인 (Craftsman)",
    description: "관찰력이 뛰어나고 논리적이며 실용적입니다. 문제 해결에 능숙하고 위기 상황에서 침착합니다.",
    strengths: ["뛰어난 문제 해결 능력", "실용적이고 현실적", "적응력이 뛰어남", "위기에 강함"],
    weaknesses: ["장기적 계획에 흥미가 적을 수 있음", "감정적 표현이 제한적일 수 있음", "약속에 제한적일 수 있음"],
    communication: "간결하고 직접적인 의사소통을 선호하며 불필요한 대화를 피합니다."
  },
  "ISFP": {
    type: "예술가 (Composer)",
    description: "따뜻하고 감성적이며 예술적입니다. 현재에 충실하고 자신만의 방식으로 일합니다.",
    strengths: ["예술적이고 창의적", "온화하고 배려심 깊음", "유연하고 개방적", "현재에 충실함"],
    weaknesses: ["장기 계획을 어려워할 수 있음", "갈등을 피하려 함", "자신을 과소평가할 수 있음"],
    communication: "부드럽고 비판적이지 않은 방식으로 소통하며 조화를 중시합니다."
  },
  "INFP": {
    type: "중재자 (Healer)",
    description: "이상주의적이고 창의적이며 공감 능력이 뛰어납니다. 깊은 가치관을 가지고 있습니다.",
    strengths: ["강한 공감 능력", "창의적이고 독창적", "가치 중심적", "적응력이 있음"],
    weaknesses: ["현실적 문제에 어려움을 겪을 수 있음", "비판에 민감함", "자기비판적일 수 있음"],
    communication: "진정성 있는 대화와 깊은 개인적 연결을 중시합니다."
  },
  "INTP": {
    type: "논리학자 (Architect)",
    description: "분석적이고 논리적이며 창의적입니다. 복잡한 이론과 아이디어에 관심이 많습니다.",
    strengths: ["뛰어난 분석력", "창의적 문제 해결", "객관적이고 논리적", "지적 호기심"],
    weaknesses: ["실행에 어려움을 겪을 수 있음", "사회적 상호작용에 어색함을 느낄 수 있음", "실용성을 간과할 수 있음"],
    communication: "논리적이고 지적인 대화를 선호하며 정확성을 중시합니다."
  },
  "ESTP": {
    type: "모험가 (Promoter)",
    description: "활동적이고 적응력이 뛰어나며 실용적입니다. 현재에 집중하고 즉흥적으로 문제를 해결합니다.",
    strengths: ["뛰어난 위기 대처 능력", "현실적이고 실용적", "에너지가 넘침", "적응력이 뛰어남"],
    weaknesses: ["장기 계획에 어려움을 겪을 수 있음", "지루함을 참지 못할 수 있음", "규칙을 무시할 수 있음"],
    communication: "직접적이고 활발하게 소통하며 실용적인 정보를 선호합니다."
  },
  "ESFP": {
    type: "연예인 (Performer)",
    description: "열정적이고 외향적이며 즐거움을 추구합니다. 사람들과 함께하는 것을 좋아하고 현재에 충실합니다.",
    strengths: ["사교적이고 매력적", "실용적인 문제 해결사", "적응력이 뛰어남", "긍정적이고 열정적"],
    weaknesses: ["장기 계획을 어려워할 수 있음", "갈등을 피하려 함", "심각한 상황에 불편함을 느낄 수 있음"],
    communication: "활기차고 재미있는 대화를 즐기며 즉각적인 반응을 선호합니다."
  },
  "ENFP": {
    type: "활동가 (Champion)",
    description: "열정적이고 창의적이며 사교적입니다. 새로운 가능성을 찾고 다양한 관심사를 가집니다.",
    strengths: ["창의적이고 혁신적", "뛰어난 의사소통 능력", "열정적이고 에너지가 넘침", "사람들과 쉽게 연결됨"],
    weaknesses: ["집중력 유지에 어려움을 겪을 수 있음", "지나치게 이상주의적일 수 있음", "일상적인 세부사항을 간과할 수 있음"],
    communication: "열정적이고 표현력이 풍부하며 가능성과 아이디어에 초점을 맞춥니다."
  },
  "ENTP": {
    type: "변론가 (Inventor)",
    description: "혁신적이고 창의적이며 논쟁을 즐깁니다. 새로운 아이디어와 도전에 흥미를 느낍니다.",
    strengths: ["혁신적이고 창의적", "빠른 사고력", "적응력이 뛰어남", "논쟁과 토론에 능함"],
    weaknesses: ["일을 마무리하는 데 어려움을 겪을 수 있음", "인내심이 부족할 수 있음", "민감한 감정을 간과할 수 있음"],
    communication: "지적인 대화와 논쟁을 즐기며 새로운 아이디어를 탐색합니다."
  },
  "ESTJ": {
    type: "경영자 (Supervisor)",
    description: "체계적이고 실용적이며 책임감이 강합니다. 질서와 구조를 중요시하고 목표 달성에 집중합니다.",
    strengths: ["체계적이고 조직적", "책임감이 강함", "결단력 있음", "실용적인 문제 해결"],
    weaknesses: ["융통성이 부족할 수 있음", "타인의 감정에 둔감할 수 있음", "변화에 저항할 수 있음"],
    communication: "명확하고 직접적이며, 체계적인 소통을 선호합니다."
  },
  "ESFJ": {
    type: "집정관 (Provider)",
    description: "배려심이 깊고 사교적이며 협력적입니다. 조화와 안정을 중요시하고 타인을 돕는 것을 좋아합니다.",
    strengths: ["세심하고 배려심 깊음", "헌신적이고 신뢰할 수 있음", "실용적이고 협력적", "사회적 기술이 뛰어남"],
    weaknesses: ["비판에 민감할 수 있음", "갈등을 피하려 함", "타인의 인정에 의존할 수 있음"],
    communication: "따뜻하고 개인적인 접근 방식을 선호하며 감정과 경험에 중점을 둡니다."
  },
  "ENFJ": {
    type: "선도자 (Teacher)",
    description: "카리스마 있고 공감 능력이 뛰어나며 영감을 줍니다. 다른 사람의 성장과 발전을 돕는 것을 좋아합니다.",
    strengths: ["뛰어난 의사소통 능력", "공감 능력이 높음", "영감을 주고 동기부여함", "관계 형성에 능함"],
    weaknesses: ["자기 자신을 소홀히 할 수 있음", "비판에 민감할 수 있음", "갈등을 피하려 함"],
    communication: "따뜻하고 영감을 주는 방식으로 소통하며 타인의 성장에 초점을 맞춥니다."
  },
  "ENTJ": {
    type: "통솔자 (Field Marshal)",
    description: "결단력 있고 전략적이며 리더십이 강합니다. 효율성과 논리를 중요시하고 목표 달성에 집중합니다.",
    strengths: ["전략적 사고", "결단력 있고 효율적", "뛰어난 리더십", "자신감 있고 직접적"],
    weaknesses: ["감정적 필요에 둔감할 수 있음", "지나치게 독단적으로 보일 수 있음", "참을성이 부족할 수 있음"],
    communication: "직접적이고 효율적인 의사소통을 선호하며 논리와 결과에 초점을 맞춥니다."
  }
};

// 관계 유형 데이터
export const relationshipTypeData: Record<string, string> = {
  "couple": "연인 관계",
  "friend": "친구 관계",
  "family": "가족 관계",
  "colleague": "직장 동료",
  "team": "팀 관계"
};

// MBTI 조합 분석 함수
export const analyzeMbtiCombination = (mbti1: string, mbti2: string, relationshipType: string): RelationshipAnalysis => {
  // 간단한 호환성 점수 계산 (실제로는 더 복잡한 알고리즘 필요)
  let compatibility = 60; // 기본 점수
  
  // 동일 유형인 경우
  if (mbti1 === mbti2) {
    compatibility += 15;
  }
  
  // 서로 정반대 유형인 경우 (예: INTJ vs ESFP)
  const opposites = [
    ['I', 'E'], ['N', 'S'], ['T', 'F'], ['J', 'P']
  ];
  
  let oppositesCount = 0;
  for (let i = 0; i < 4; i++) {
    if ((mbti1[i] === opposites[i][0] && mbti2[i] === opposites[i][1]) || 
        (mbti1[i] === opposites[i][1] && mbti2[i] === opposites[i][0])) {
      oppositesCount++;
    }
  }
  
  if (oppositesCount === 4) {
    compatibility -= 10; // 정반대는 도전적일 수 있음
  } else if (oppositesCount === 3) {
    compatibility -= 5;
  }
  
  // 공통점이 있는 경우
  let commonCount = 0;
  for (let i = 0; i < 4; i++) {
    if (mbti1[i] === mbti2[i]) {
      commonCount++;
      compatibility += 5;
    }
  }
  
  // NF 조합이나 NT 조합처럼 직관형(N)끼리는 대화가 잘 통함
  if ((mbti1.includes('NF') && mbti2.includes('NF')) || 
      (mbti1.includes('NT') && mbti2.includes('NT'))) {
    compatibility += 10;
  }
  
  // ST나 SF처럼 감각형(S)끼리도 실용적인 면에서 잘 맞음
  if ((mbti1.includes('ST') && mbti2.includes('ST')) || 
      (mbti1.includes('SF') && mbti2.includes('SF'))) {
    compatibility += 8;
  }
  
  // 감각형(S)과 직관형(N)의 조합은 서로 보완할 수 있지만 소통 방식이 다름
  if ((mbti1.includes('S') && mbti2.includes('N')) ||
      (mbti1.includes('N') && mbti2.includes('S'))) {
    compatibility -= 3;
  }
  
  // T와 F의 조합은 결정 방식이 다르지만 균형을 이룰 수 있음
  if ((mbti1.includes('T') && mbti2.includes('F')) ||
      (mbti1.includes('F') && mbti2.includes('T'))) {
    compatibility += 5;
  }
  
  // J와 P의 조합은 계획과 유연성 측면에서 서로 보완할 수 있지만 갈등도 생길 수 있음
  if ((mbti1.includes('J') && mbti2.includes('P')) ||
      (mbti1.includes('P') && mbti2.includes('J'))) {
    compatibility += 3;
  }
  
  // 호환성 점수 조정 (0-100 범위로)
  compatibility = Math.max(40, Math.min(98, compatibility));
  
  // 강점 분석
  const strengths = [];
  if (commonCount > 0) {
    strengths.push(`${commonCount}개의 공통 선호 요소로 서로에 대한 이해도가 높음`);
  }
  
  if ((mbti1.includes('N') && mbti2.includes('N'))) {
    strengths.push('두 사람 모두 아이디어와 가능성에 관심이 있어 깊은 대화가 가능함');
  }
  
  if ((mbti1.includes('S') && mbti2.includes('S'))) {
    strengths.push('두 사람 모두 실용적이고 현실적인 접근 방식을 선호함');
  }
  
  if ((mbti1.includes('T') && mbti2.includes('F')) ||
      (mbti1.includes('F') && mbti2.includes('T'))) {
    strengths.push('논리적 분석과 감정적 고려 사이의 균형을 이룰 수 있음');
  }
  
  if ((mbti1.includes('J') && mbti2.includes('P')) ||
      (mbti1.includes('P') && mbti2.includes('J'))) {
    strengths.push('계획과 즉흥성 사이의 균형을 이룰 수 있음');
  }
  
  if (mbti1 === mbti2) {
    strengths.push('같은 MBTI 유형으로 서로의 사고방식과 행동 패턴을 쉽게 이해할 수 있음');
  }
  
  // 도전 분석
  const challenges = [];
  if (oppositesCount >= 3) {
    challenges.push('너무 다른 접근 방식으로 인한 오해와 갈등 가능성이 있음');
  }
  
  if ((mbti1.includes('S') && mbti2.includes('N')) ||
      (mbti1.includes('N') && mbti2.includes('S'))) {
    challenges.push('정보 수집과 처리 방식의 차이로 의사소통에 어려움이 있을 수 있음');
  }
  
  if ((mbti1.includes('J') && mbti2.includes('P')) ||
      (mbti1.includes('P') && mbti2.includes('J'))) {
    challenges.push('일과 생활에 대한 접근 방식의 차이(계획적 vs 유연함)로 인한 갈등 가능성');
  }
  
  if ((mbti1.includes('E') && mbti2.includes('I')) ||
      (mbti1.includes('I') && mbti2.includes('E'))) {
    challenges.push('사회적 에너지와 충전 방식의 차이로 인한 오해가 있을 수 있음');
  }
  
  if (mbti1 === mbti2) {
    challenges.push('같은 약점을 공유하여 서로 보완하지 못할 수 있음');
  }
  
  // 관계 유형별 팁
  const tips = [];
  
  // 공통 팁
  tips.push('서로의 MBTI 유형과 선호 경향을 이해하고 존중하는 시간을 가지세요');
  
  if ((mbti1.includes('I') && mbti2.includes('E')) ||
      (mbti1.includes('E') && mbti2.includes('I'))) {
    tips.push('내향적인 사람에게 혼자만의 시간이 필요함을 이해하고, 외향적인 사람에게 사회적 활동이 중요함을 인정하세요');
  }
  
  if ((mbti1.includes('S') && mbti2.includes('N')) ||
      (mbti1.includes('N') && mbti2.includes('S'))) {
    tips.push('감각형(S)은 구체적으로 설명하고, 직관형(N)은 전체적인 맥락을 함께 제공해 보세요');
  }
  
  if ((mbti1.includes('T') && mbti2.includes('F')) ||
      (mbti1.includes('F') && mbti2.includes('T'))) {
    tips.push('사고형(T)은 감정을 더 고려하고, 감정형(F)은 논리적 측면도 균형 있게 바라보세요');
  }
  
  if ((mbti1.includes('J') && mbti2.includes('P')) ||
      (mbti1.includes('P') && mbti2.includes('J'))) {
    tips.push('판단형(J)은 가끔 계획을 유연하게 하고, 인식형(P)은 기한과 약속을 지키기 위해 노력해 보세요');
  }
  
  // 관계 유형별 특화 팁
  if (relationshipType === 'couple') {
    tips.push('서로의 표현 방식과 사랑의 언어를 이해하고 존중하는 시간을 가지세요');
  } else if (relationshipType === 'friend') {
    tips.push('서로의 관심사와 취미를 공유하되, 개인의 공간과 선호도 존중하세요');
  } else if (relationshipType === 'family') {
    tips.push('가족 내 역할과 책임에 대한 기대치를 명확히 하고 정기적으로 소통하세요');
  } else if (relationshipType === 'colleague') {
    tips.push('업무 스타일과 의사소통 방식의 차이를 인정하고, 프로젝트에서 각자의 강점을 활용하세요');
  } else if (relationshipType === 'team') {
    tips.push('팀 내 역할 분담 시 각자의 MBTI 강점을 고려하고, 정기적인 피드백 세션을 통해 협업을 개선하세요');
  }
  
  return {
    compatibility,
    strengths,
    challenges,
    tips
  };
}; 