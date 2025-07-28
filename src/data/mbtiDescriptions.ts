interface MBTIDescription {
  title: string;
  description: string;
  nickname: string;
  traits: string[];
  strengths: string[];
  weaknesses: string[];
  relationships: string;
  compatibleTypes: string[];
  incompatibleTypes: string[];
  careerPaths: {
    description: string;
    recommendations: string[];
  };
}

interface MBTIDescriptions {
  [key: string]: MBTIDescription;
}

export const mbtiDescriptions: MBTIDescriptions = {
  "ISTJ": {
    title: "청렴결백한 논리주의자",
    description: "사실에 근거하여 체계적으로 세상을 이해하고자 합니다. 책임감이 강하고 현실적이며 질서를 중요시합니다. 전통과 안정성을 중시하며 성실하게 임무를 수행합니다.",
    nickname: "현실주의자",
    traits: ["책임감이 강함", "체계적이고 논리적", "성실함", "전통과 질서 중시"],
    strengths: ["철저한 업무 수행", "안정성과 신뢰성", "집중력과 인내심"],
    weaknesses: ["변화에 적응하기 어려움", "융통성 부족", "감정 표현이 어려움"],
    relationships: "신뢰와 책임감을 바탕으로 안정적인 관계를 형성합니다. 약속을 지키고 일관된 행동으로 신뢰를 줍니다.",
    compatibleTypes: ["ESFP", "ESTP"],
    incompatibleTypes: ["ENFP", "ENTP"],
    careerPaths: {
      description: "체계적이고 규칙을 잘 지키는 성향으로 조직과 구조가 잘 잡힌 환경에서 두각을 나타냅니다.",
      recommendations: ["회계사", "행정 관리자", "법률 전문가", "시스템 분석가", "경영자"]
    }
  },
  "ISFJ": {
    title: "용감한 수호자",
    description: "타인을 향한 따뜻한 동정심과 강한 책임감을 가지고 있습니다. 전통과 안정성을 중시하며 다른 사람을 보살피고 보호하는 것을 중요하게 생각합니다.",
    nickname: "수호자",
    traits: ["다른 사람을 보살핌", "충실함", "배려심", "세부 사항에 주의"],
    strengths: ["따뜻한 배려심", "책임감", "실용적인 기술"],
    weaknesses: ["자기 주장 부족", "변화에 대한 거부감", "과도한 책임감"],
    relationships: "헌신적이고 보살피는 성향으로 안정적이고 조화로운 관계를 추구합니다.",
    compatibleTypes: ["ESTP", "ESFP"],
    incompatibleTypes: ["INTJ", "ENTP"],
    careerPaths: {
      description: "사람들을 도울 수 있는 환경에서 장점이 발휘됩니다.",
      recommendations: ["간호사", "초등학교 교사", "사회복지사", "인사관리자", "고객 서비스"]
    }
  },
  "INFJ": {
    title: "선의의 옹호자",
    description: "인류를 위한 더 나은 미래를 그립니다. 이상주의적이며 원칙을 중시하고, 다른 사람의 성장을 돕는 것에 깊은 통찰력을 가지고 있습니다.",
    nickname: "옹호자",
    traits: ["이상주의적", "통찰력이 뛰어남", "창의적", "원칙적"],
    strengths: ["공감 능력", "비전과 창의성", "결단력"],
    weaknesses: ["완벽주의", "지나친 이상주의", "혼자 있기를 선호"],
    relationships: "깊이 있고 의미 있는 관계를 추구하며, 상대방의 내면을 이해하려 노력합니다.",
    compatibleTypes: ["ENFP", "ENTP"],
    incompatibleTypes: ["ESTP", "ISTP"],
    careerPaths: {
      description: "사람들을 돕고 더 나은 세상을 만드는 일에 관심이 많습니다.",
      recommendations: ["상담사", "심리학자", "작가", "교수", "종교 지도자"]
    }
  },
  "INTJ": {
    title: "용의주도한 전략가",
    description: "모든 것에 대해 전략적으로 계획하고 체계화하는 것을 좋아합니다. 독창적인 사고와 강한 의지로 자신의 비전을 실현시키고자 합니다.",
    nickname: "전략가",
    traits: ["분석적", "독립적", "전략적", "결단력 있음"],
    strengths: ["전략적 사고", "지식 추구", "효율성을 중시"],
    weaknesses: ["지나친 비판적 태도", "독립성 과시", "감정에 무관심"],
    relationships: "독립적인 성향으로 자신과 지적 수준이 맞는 사람을 찾습니다. 깊이 있는 대화를 추구합니다.",
    compatibleTypes: ["ENFP", "ENTP"],
    incompatibleTypes: ["ESFJ", "ISFJ"],
    careerPaths: {
      description: "복잡한 문제를 해결하고 전략적 사고가 필요한 직업에 적합합니다.",
      recommendations: ["과학자", "엔지니어", "투자 분석가", "프로그래머", "기업 전략가"]
    }
  },
  "ISTP": {
    title: "만능 재주꾼",
    description: "대담하고 현실적인 성격으로 다양한 도구를 자유자재로 다룰 수 있습니다. 문제 해결에 뛰어나며 위기 상황에서 침착하게 대처합니다.",
    nickname: "장인",
    traits: ["적응력이 뛰어남", "현실적", "논리적", "독립적"],
    strengths: ["문제 해결 능력", "실용적 기술", "위기 대처 능력"],
    weaknesses: ["감정 표현 부족", "장기적 계획 부족", "몰입 부족"],
    relationships: "자유롭고 독립적인 관계를 선호하며, 상대방에게도 자유와 공간을 제공합니다.",
    compatibleTypes: ["ESTJ", "ENTJ"],
    incompatibleTypes: ["INFJ", "ENFJ"],
    careerPaths: {
      description: "손으로 하는 일과 현실적인 문제 해결에 재능이 있습니다.",
      recommendations: ["엔지니어", "정비사", "파일럿", "건축가", "운동선수"]
    }
  },
  "ISFP": {
    title: "호기심 많은 예술가",
    description: "따뜻한 감성을 지닌 예술가 기질의 성격입니다. 자신만의 독특한 미적 감각으로 주변의 아름다움을 발견하고 표현하는 것을 좋아합니다.",
    nickname: "예술가",
    traits: ["창의적", "감각적", "온화함", "조화를 추구"],
    strengths: ["미적 감각", "감정 이해력", "현재에 충실함"],
    weaknesses: ["미래 계획 부족", "갈등 회피", "과도한 겸손"],
    relationships: "조화롭고 평화로운 관계를 추구하며, 개인의 공간과 자유를 중요시합니다.",
    compatibleTypes: ["ESFJ", "ESTJ"],
    incompatibleTypes: ["INTJ", "ENTJ"],
    careerPaths: {
      description: "예술적 표현과 자유로운 환경에서 일하는 것을 선호합니다.",
      recommendations: ["예술가", "디자이너", "음악가", "간호사", "자연 보호 활동가"]
    }
  },
  "INFP": {
    title: "열정적인 중재자",
    description: "이상적인 세상을 추구하며 깊은 통찰력으로 타인을 이해합니다. 창의적이고 독창적인 사고방식으로 자신만의 가치를 추구합니다.",
    nickname: "중재자",
    traits: ["이상주의적", "창의적", "감수성이 풍부함", "독창적"],
    strengths: ["창의력", "열정", "이해심"],
    weaknesses: ["현실감각 부족", "감정 기복", "자기비판"],
    relationships: "깊고 진실된 관계를 추구하며, 상대방의 내면에 관심을 가집니다.",
    compatibleTypes: ["ENFJ", "ENTJ"],
    incompatibleTypes: ["ESTP", "ESTJ"],
    careerPaths: {
      description: "자신의 가치와 이상을 실현할 수 있는 직업에 적합합니다.",
      recommendations: ["작가", "상담사", "심리학자", "교사", "예술가"]
    }
  },
  "INTP": {
    title: "논리적인 사색가",
    description: "끊임없이 새로운 지식을 탐구하며 복잡한 문제 해결을 즐깁니다. 논리적이고 분석적인 사고로 세상의 원리를 이해하고자 합니다.",
    nickname: "사색가",
    traits: ["분석적", "논리적", "독창적", "지적 호기심"],
    strengths: ["논리적 사고", "독창성", "지식 추구"],
    weaknesses: ["실행력 부족", "사회성 부족", "지나친 분석"],
    relationships: "지적 대화와 상호 존중을 중시하며, 자신만의 공간과 자유를 필요로 합니다.",
    compatibleTypes: ["ENTJ", "ESTJ"],
    incompatibleTypes: ["ESFJ", "ISFJ"],
    careerPaths: {
      description: "복잡한 문제를 분석하고 해결하는 일에 적합합니다.",
      recommendations: ["과학자", "프로그래머", "수학자", "철학자", "연구원"]
    }
  },
  "ESTP": {
    title: "모험을 즐기는 사업가",
    description: "순간의 흥분과 위험을 즐기는 성격입니다. 현실적이고 적응력이 뛰어나며, 문제 해결에 있어 실용적인 접근을 선호합니다.",
    nickname: "사업가",
    traits: ["활동적", "모험적", "현실적", "융통성"],
    strengths: ["행동력", "적응력", "문제 해결 능력"],
    weaknesses: ["인내심 부족", "미래 계획 부족", "위험 감수"],
    relationships: "재미있고 활동적인 관계를 추구하며, 상대방에게 자유와 유연성을 제공합니다.",
    compatibleTypes: ["ISFJ", "ISTJ"],
    incompatibleTypes: ["INFJ", "INTJ"],
    careerPaths: {
      description: "행동과 실용적인 문제 해결이 요구되는 직업에 적합합니다.",
      recommendations: ["기업가", "영업사원", "운동선수", "경찰관", "응급 의료 종사자"]
    }
  },
  "ESFP": {
    title: "자유로운 영혼의 연예인",
    description: "분위기 메이커이자 즉흥적인 성격의 소유자입니다. 현재의 즐거움을 중시하며 다른 사람들과 함께 있는 것을 좋아합니다.",
    nickname: "연예인",
    traits: ["활기참", "사교적", "즐거움 추구", "감각적"],
    strengths: ["사교성", "즐거움 창출", "실용적 감각"],
    weaknesses: ["장기적 계획 부족", "집중력 부족", "변덕스러움"],
    relationships: "즐겁고 재미있는 관계를 추구하며, 사람들과 함께하는 시간을 중요시합니다.",
    compatibleTypes: ["ISFJ", "ISTJ"],
    incompatibleTypes: ["INTJ", "INFJ"],
    careerPaths: {
      description: "사람들과 상호작용하고 즐거움을 주는 직업에 적합합니다.",
      recommendations: ["연예인", "영업사원", "이벤트 기획자", "접대 서비스", "스포츠 코치"]
    }
  },
  "ENFP": {
    title: "재기발랄한 활동가",
    description: "열정적이고 창의적인 성격으로 새로운 가능성을 발견하는 것을 좋아합니다. 다양한 사람들과 관계를 맺으며 새로운 아이디어를 공유합니다.",
    nickname: "활동가",
    traits: ["열정적", "창의적", "사교적", "호기심"],
    strengths: ["창의력", "공감 능력", "의사소통 능력"],
    weaknesses: ["집중력 부족", "현실감각 부족", "과도한 이상주의"],
    relationships: "진실되고 깊은 관계를 추구하며, 상대방의 성장과 발전을 돕습니다.",
    compatibleTypes: ["INTJ", "INFJ"],
    incompatibleTypes: ["ISTJ", "ISTP"],
    careerPaths: {
      description: "창의성과 대인관계 기술이 요구되는 직업에 적합합니다.",
      recommendations: ["상담사", "마케팅 전문가", "교사", "예술가", "언론인"]
    }
  },
  "ENTP": {
    title: "논쟁을 즐기는 변론가",
    description: "풍부한 상상력으로 새로운 아이디어를 만들어내는 혁신가입니다. 지적 도전을 즐기며 다양한 관점에서 문제를 바라봅니다.",
    nickname: "변론가",
    traits: ["지적 호기심", "논쟁적", "창의적", "도전적"],
    strengths: ["혁신적 사고", "논리적 분석", "융통성"],
    weaknesses: ["완료 능력 부족", "쉽게 지루해함", "논쟁적"],
    relationships: "지적 자극과 토론을 즐기는 관계를 추구하며, 상대방의 견해를 존중합니다.",
    compatibleTypes: ["INTJ", "INFJ"],
    incompatibleTypes: ["ISFJ", "ISTJ"],
    careerPaths: {
      description: "혁신과 문제 해결이 필요한 직업에 적합합니다.",
      recommendations: ["기업가", "변호사", "컨설턴트", "마케팅 전략가", "발명가"]
    }
  },
  "ESTJ": {
    title: "엄격한 관리자",
    description: "사실에 기반한 논리적인 사고와 체계적인 조직력을 가지고 있습니다. 명확한 규칙과 절차를 중시하며 목표 달성을 위해 노력합니다.",
    nickname: "관리자",
    traits: ["체계적", "실용적", "책임감", "효율성"],
    strengths: ["조직력", "결단력", "명확한 의사소통"],
    weaknesses: ["융통성 부족", "감정적 측면 간과", "독단적"],
    relationships: "명확하고 체계적인 관계를 추구하며, 신뢰와 책임감을 중요시합니다.",
    compatibleTypes: ["ISTP", "ISFP"],
    incompatibleTypes: ["INFP", "ENFP"],
    careerPaths: {
      description: "관리와 체계가 필요한 직업에 적합합니다.",
      recommendations: ["관리자", "경영자", "군인", "재무 분석가", "프로젝트 매니저"]
    }
  },
  "ESFJ": {
    title: "사교적인 외교관",
    description: "타인을 배려하고 도움을 주는 것을 좋아합니다. 조화로운 관계를 중시하며 공동체의 화합을 위해 노력하는 성격입니다.",
    nickname: "외교관",
    traits: ["협조적", "충실함", "배려심", "책임감"],
    strengths: ["대인관계 기술", "실용적 지원", "조화 추구"],
    weaknesses: ["비판에 민감", "갈등 회피", "지나친 자기희생"],
    relationships: "조화롭고 안정적인 관계를 추구하며, 상대방을 지원하고 배려합니다.",
    compatibleTypes: ["ISFP", "ISTP"],
    incompatibleTypes: ["INTP", "INTJ"],
    careerPaths: {
      description: "사람들을 돕고 배려하는 직업에 적합합니다.",
      recommendations: ["교사", "간호사", "사회복지사", "인사 관리자", "고객 서비스"]
    }
  },
  "ENFJ": {
    title: "정의로운 사회운동가",
    description: "카리스마 있는 지도자 성향으로 다른 사람의 성장을 돕는 것에 관심이 많습니다. 사람들을 이끌고 영감을 주는 것을 잘합니다.",
    nickname: "선도자",
    traits: ["영감을 주는", "카리스마", "이타적", "공감 능력"],
    strengths: ["리더십", "의사소통 능력", "공감 능력"],
    weaknesses: ["지나친 이상주의", "비판에 민감", "자기희생"],
    relationships: "깊고 의미 있는 관계를 추구하며, 상대방의 성장과 발전을 지원합니다.",
    compatibleTypes: ["INFP", "ISFP"],
    incompatibleTypes: ["ISTP", "ESTP"],
    careerPaths: {
      description: "사람들을 지도하고 영감을 주는 직업에 적합합니다.",
      recommendations: ["교사", "상담사", "인사 관리자", "정치인", "비영리 단체 운영자"]
    }
  },
  "ENTJ": {
    title: "대담한 통솔자",
    description: "천성적인 리더로 조직을 이끌고 목표를 달성하는 것에 탁월합니다. 논리적이고 객관적인 사고로 효율적인 계획을 수립하고 실행합니다.",
    nickname: "통솔자",
    traits: ["전략적", "결단력", "논리적", "효율성"],
    strengths: ["리더십", "전략적 사고", "결단력"],
    weaknesses: ["불인정", "냉정한 태도", "지나친 비판"],
    relationships: "지적 자극과 목표 지향적인 관계를 추구하며, 상대방의 역량과 발전을 중요시합니다.",
    compatibleTypes: ["INTP", "INFP"],
    incompatibleTypes: ["ISFP", "ESFP"],
    careerPaths: {
      description: "리더십과 전략적 사고가 필요한 직업에 적합합니다.",
      recommendations: ["경영자", "기업가", "컨설턴트", "변호사", "정치인"]
    }
  }
}; 