// AI 심리검사 메뉴 데이터 - 11개 대분류 3단계 구조
export interface TestMenuItem {
  name: string;
  href: string;
  description: string;
  icon: string;
  badge?: string;
}

export interface TestSubcategory {
  name: string;
  icon: string;
  items: TestMenuItem[];
}

export interface TestCategory {
  category: string;
  icon: string;
  subcategories: TestSubcategory[];
}

export const testSubMenuItems: TestCategory[] = [
  {
    category: "개인 심리 및 성장",
    icon: "🚀",
    subcategories: [
      {
        name: "성격 및 기질 탐색",
        icon: "🔍",
        items: [
          { name: "성격 유형 및 강점 분석", href: "/tests/personality-strengths", description: "나의 강점/약점 발견 및 활용, 잠재력 발굴", icon: "👤" },
          { name: "기질적 특성 및 성향 이해", href: "/tests/temperament-traits", description: "타고난 기질과 후천적 성격의 상호작용 이해", icon: "📊" },
          { name: "내면 탐색 및 자기 성찰", href: "/tests/inner-exploration", description: "내면의 목소리 경청, 직관력 개발", icon: "💎" },
          { name: "부정적 사고 습관 개선", href: "/tests/negative-thinking", description: "자기 비판적 사고 패턴 변화", icon: "🗺️" }
        ]
      },
      {
        name: "자아정체감 및 가치관",
        icon: "🎯",
        items: [
          { name: "자아 정체성 확립", href: "/tests/identity-establishment", description: "자아 정체성 혼란 및 방황 해결", icon: "🧠" },
          { name: "개인 핵심 가치관 탐색", href: "/tests/core-values", description: "개인의 가치관 및 신념 체계 재정립", icon: "✨" },
          { name: "자존감 향상 및 자기 돌봄", href: "/tests/self-esteem-care", description: "자존감 향상, 자기 수용 및 자기애 증진", icon: "🧭" },
          { name: "자기 리더십 및 주도성", href: "/tests/self-leadership", description: "자기 주도적 삶의 계획 및 실천 능력 향상", icon: "👑" }
        ]
      },
      {
        name: "잠재력 및 역량 개발",
        icon: "💪",
        items: [
          { name: "목표 설정 및 실행력 강화", href: "/tests/goal-execution", description: "구체적인 개인 목표 설정 및 실행력 증진", icon: "🎯" },
          { name: "창의성 및 문제 해결 능력", href: "/tests/creativity-problem-solving", description: "창의적 사고 증진 및 문제 해결 능력 강화", icon: "💡" },
          { name: "학습 및 지식 습득", href: "/tests/learning-knowledge", description: "새로운 기술/지식 습득을 위한 학습 코칭", icon: "📚" },
          { name: "회복 탄력성 및 위기 관리", href: "/tests/resilience-crisis", description: "위기 관리 및 회복 탄력성 증진", icon: "🛡️" }
        ]
      },
      {
        name: "삶의 의미 및 실존적 문제",
        icon: "🌟",
        items: [
          { name: "삶의 목적과 방향성 탐색", href: "/tests/life-purpose", description: "인생의 의미와 목적 찾기, 삶의 방향성 재설정", icon: "🧭" },
          { name: "죽음, 상실, 존재에 대한 고찰", href: "/tests/death-loss-existence", description: "죽음과 상실에 대한 철학적 성찰 및 수용", icon: "💀" },
          { name: "영적 성장과 내면의 평화", href: "/tests/spiritual-growth", description: "영적 위기 및 가치관 혼란 해소, 내면의 평화 찾기", icon: "🕊️" },
          { name: "실존적 고독과 연결감 형성", href: "/tests/existential-loneliness", description: "존재론적 고독감, 소외감 극복 및 연결감 형성", icon: "🤝" }
        ]
      }
    ]
  },
  {
    category: "대인관계 및 사회적응",
    icon: "💕",
    subcategories: [
      {
        name: "가족 관계",
        icon: "⚡",
        items: [
          { name: "부모-자녀 갈등 및 양육", href: "/tests/parent-child-conflict", description: "영유아, 아동, 청소년기 자녀 양육의 어려움", icon: "👥" },
          { name: "형제자매 및 확대가족", href: "/tests/siblings-extended-family", description: "형제자매 간의 갈등 조정 및 화해 중재", icon: "👨‍👩‍👧‍👦" },
          { name: "가족 내 의사소통", href: "/tests/family-communication", description: "세대 간 가치관 및 소통 방식 차이로 인한 갈등", icon: "💑" },
          { name: "특수 가족 문제", href: "/tests/special-family-issues", description: "재혼 가정의 적응 문제, 새 가족 관계 형성", icon: "💘" }
        ]
      },
      {
        name: "연인 및 부부 관계",
        icon: "🤝",
        items: [
          { name: "관계 갈등 및 소통", href: "/tests/relationship-conflict", description: "잦은 갈등 해결, 효과적인 의사소통 기술 습득", icon: "💬" },
          { name: "이별 및 관계 회복", href: "/tests/breakup-recovery", description: "이별/이혼 후 심리적 회복, 애도 과정 지원", icon: "🏢" },
          { name: "결혼 준비 및 신혼기", href: "/tests/marriage-preparation", description: "결혼 준비, 신혼 부부 관계 이해 및 갈등 예방", icon: "🌐" },
          { name: "친밀감 및 성 문제", href: "/tests/intimacy-sexual", description: "정서적/신체적 친밀감 향상", icon: "💕" }
        ]
      },
      {
        name: "친구 및 동료 관계",
        icon: "🎮",
        items: [
          { name: "직장 내 인간관계", href: "/tests/workplace-relationships", description: "직장 내 인간관계 갈등 해결", icon: "📱" },
          { name: "친구 관계의 어려움", href: "/tests/friendship-difficulties", description: "새로운 친구 사귀기의 어려움", icon: "🛡️" },
          { name: "사회적 고립 및 소외", href: "/tests/social-isolation", description: "자발적 고립 및 은둔형 외톨이의 사회 재적응 지원", icon: "🔍" },
          { name: "집단 내 적응 문제", href: "/tests/group-adaptation", description: "새로운 환경 적응의 어려움", icon: "🤖" }
        ]
      },
      {
        name: "사회적 기술 및 소통",
        icon: "📱",
        items: [
          { name: "의사소통 기술 훈련", href: "/tests/communication-skills", description: "비폭력 대화법, 효과적인 의사소통 스킬 훈련", icon: "🔍" },
          { name: "공감 및 경청 능력", href: "/tests/empathy-listening", description: "공감 능력 및 경청 기술 향상", icon: "🛡️" },
          { name: "자기표현 및 주장 훈련", href: "/tests/self-expression", description: "자기 주장 훈련 및 건강한 경계 설정", icon: "🆔" },
          { name: "네트워크 형성 및 유지", href: "/tests/network-building", description: "효과적인 네트워크 형성 및 유지 전략", icon: "💬" }
        ]
      }
    ]
  },
  {
    category: "정서 문제 및 정신 건강",
    icon: "💙",
    subcategories: [
      {
        name: "우울 및 기분 문제",
        icon: "😌",
        items: [
          { name: "우울감 및 무기력", href: "/tests/depression-lethargy", description: "경미한 우울감, 무기력, 의욕 저하", icon: "😔" },
          { name: "기분 조절의 어려움", href: "/tests/mood-regulation", description: "잦은 기분 변화, 감정 기복 조절 어려움", icon: "😰" },
          { name: "특정 상황 관련 우울", href: "/tests/situational-depression", description: "계절성 정서 장애(SAD) 극복 및 예방", icon: "💪" },
          { name: "상실 및 애도 반응", href: "/tests/loss-grief", description: "가족 사망 등 급작스러운 상실 경험 후 충격 완화", icon: "😠" }
        ]
      },
      {
        name: "불안 및 스트레스",
        icon: "🆘",
        items: [
          { name: "만성적 불안 및 걱정", href: "/tests/chronic-anxiety", description: "일상생활의 만성 불안, 과도한 걱정", icon: "🩹" },
          { name: "사회적 불안 및 공포", href: "/tests/social-anxiety", description: "사회생활에서의 불안감 (대인 공포, 발표 공포)", icon: "⭐" },
          { name: "스트레스 및 번아웃", href: "/tests/stress-burnout", description: "직장/학업 번아웃 증후군", icon: "🔗" },
          { name: "강박적 사고 및 행동", href: "/tests/obsessive-behavior", description: "반복적인 생각이나 행동으로 인한 고통", icon: "⚡" }
        ]
      },
      {
        name: "외상 및 위기 개입",
        icon: "🏠",
        items: [
          { name: "급성 위기 상황 대응", href: "/tests/acute-crisis", description: "예상치 못한 사고, 재난 경험 직후 심리 지원", icon: "🆘" },
          { name: "외상 후 스트레스(PTSD)", href: "/tests/ptsd", description: "외상 후 스트레스(PTSD) 증상 관리 및 회복 지원", icon: "🩹" },
          { name: "폭력 및 학대 피해", href: "/tests/violence-abuse", description: "폭력 피해 초기 대응 및 안전 확보", icon: "🛡️" },
          { name: "복합 트라우마 및 치유", href: "/tests/complex-trauma", description: "만성적이고 반복적인 트라우마 경험", icon: "💔" }
        ]
      },
      {
        name: "중독 및 충동 조절 문제",
        icon: "🪞",
        items: [
          { name: "물질 및 행위 중독", href: "/tests/substance-behavioral-addiction", description: "온라인/오프라인 중독 초기 개입", icon: "🍽️" },
          { name: "디지털 및 미디어 중독", href: "/tests/digital-media-addiction", description: "스마트폰/인터넷 과몰입, SNS 중독", icon: "🩺" },
          { name: "섭식 및 식습관 문제", href: "/tests/eating-disorders", description: "폭식, 제한적 섭식, 특정 음식 갈망 등", icon: "😰" },
          { name: "충동적 행동 및 습관", href: "/tests/impulsive-behavior", description: "충동 구매, 불필요한 지출 등 소비 습관 통제", icon: "🔄" }
        ]
      }
    ]
  },
  {
    category: "현실 문제 및 생활 관리",
    icon: "🔧",
    subcategories: [
      {
        name: "진로 및 직업 문제",
        icon: "💼",
        items: [
          { name: "진로 탐색 및 직업 선택", href: "/tests/career-exploration", description: "개인의 적성 탐색, 직업 선택 및 전환 고민", icon: "🔥" },
          { name: "직무 만족 및 경력 개발", href: "/tests/job-satisfaction", description: "현재 직무 만족도 향상, 직업 재설계 코칭", icon: "⚔️" },
          { name: "직장 내 스트레스 및 소진", href: "/tests/workplace-stress", description: "과도한 업무량, 직무 압박으로 인한 스트레스 관리", icon: "🔄" },
          { name: "실업 및 경력 전환", href: "/tests/unemployment-transition", description: "실업으로 인한 자존감 저하, 무기력, 우울감 극복", icon: "🆓" }
        ]
      },
      {
        name: "경제 및 재정 문제",
        icon: "📈",
        items: [
          { name: "재정 스트레스 및 부채", href: "/tests/financial-stress", description: "부채(빚)로 인한 심리적 압박 및 불안감 해소", icon: "💸" },
          { name: "소비 습관 및 금전 관리", href: "/tests/spending-habits", description: "충동 구매, 과소비 습관 개선 및 금전 관리 태도 변화", icon: "🛒" },
          { name: "재정 목표 및 투자 심리", href: "/tests/financial-goals", description: "재정 목표 설정 및 실행 과정에서의 심리적 어려움 극복", icon: "📉" },
          { name: "돈에 대한 심리적 신념", href: "/tests/money-beliefs", description: "돈에 대한 비합리적 신념 및 태도 탐색", icon: "💔" }
        ]
      },
      {
        name: "건강 및 신체 문제",
        icon: "🏡",
        items: [
          { name: "만성 질환 및 통증 관리", href: "/tests/chronic-pain", description: "암, 당뇨 등 만성 질환 진단 후 심리적 충격 및 수용", icon: "🏘️" },
          { name: "신체 이미지 및 외모 콤플렉스", href: "/tests/body-image", description: "외모에 대한 불만족, 낮은 자존감, 신체 이형 장애", icon: "⏰" },
          { name: "건강하지 못한 생활 습관", href: "/tests/unhealthy-habits", description: "운동 부족, 식습관 문제 등 건강하지 못한 생활 습관 개선", icon: "🏠" },
          { name: "노화 및 신체 변화", href: "/tests/aging-body-changes", description: "노화에 대한 불안감, 젊음에 대한 집착 완화", icon: "🌍" }
        ]
      },
      {
        name: "일상생활 및 자기 관리",
        icon: "🏛️",
        items: [
          { name: "시간 관리 및 생산성", href: "/tests/time-management", description: "효율적인 시간 관리 및 생산성 향상 전략", icon: "⚖️" },
          { name: "주거 환경 및 정리", href: "/tests/housing-environment", description: "미니멀리즘 실천, 물건 정리 및 비움의 어려움 극복", icon: "📋" },
          { name: "건강한 생활 루틴", href: "/tests/healthy-routine", description: "생활 루틴 확립, 건강한 일상 습관 만들기", icon: "🏥" },
          { name: "수면 문제 및 관리", href: "/tests/sleep-problems", description: "수면의 질 저하 (불면증, 과수면)", icon: "🎓" }
        ]
      }
    ]
  },
  {
    category: "문화 및 환경 적응",
    icon: "🌍",
    subcategories: [
      {
        name: "다문화 적응",
        icon: "🏠",
        items: [
          { name: "이주 및 문화 충격", href: "/tests/migration-culture-shock", description: "이주 초기 언어 장벽 및 새로운 문화 적응 스트레스", icon: "🗣️" },
          { name: "다문화 가정 및 자녀", href: "/tests/multicultural-family", description: "문화 차이로 인한 가족 갈등 해소", icon: "⚡" },
          { name: "해외 생활 및 국제 관계", href: "/tests/overseas-living", description: "해외 거주 중 외로움, 고립감, 우울감 관리", icon: "⚖️" },
          { name: "문화적 차별 및 정체성", href: "/tests/cultural-discrimination", description: "문화적 차별 경험에 대한 심리적 지지 및 회복", icon: "🏘️" }
        ]
      },
      {
        name: "디지털 환경 적응",
        icon: "🤝",
        items: [
          { name: "디지털 피로감 및 정보 과부하", href: "/tests/digital-fatigue", description: "스마트폰/PC 과사용으로 인한 눈/뇌 피로", icon: "🛡️" },
          { name: "온라인 관계 및 소통", href: "/tests/online-relationships", description: "온라인 평판 관리 및 부정적 피드백 대처", icon: "👥" },
          { name: "인공지능(AI) 및 기술 변화", href: "/tests/ai-tech-changes", description: "AI 발전에 대한 막연한 두려움, 기대감 관리", icon: "🏢" },
          { name: "가상 세계와 현실 정체성", href: "/tests/virtual-reality-identity", description: "가상 세계와 현실 정체성의 균형 찾기", icon: "🏛️" }
        ]
      },
      {
        name: "생애주기별 적응",
        icon: "👨‍👩‍👧‍👦",
        items: [
          { name: "청소년기 및 학업", href: "/tests/adolescent-academic", description: "학업 스트레스 및 입시 압박", icon: "💑" },
          { name: "청년기 및 사회 진출", href: "/tests/young-adult-social", description: "대학 생활 및 사회 초년생 적응", icon: "👶" },
          { name: "중년기 위기 및 변화", href: "/tests/midlife-crisis", description: "중년기 위기 극복, 자녀 독립", icon: "⚔️" },
          { name: "노년기 및 은퇴", href: "/tests/elderly-retirement", description: "노년기 삶의 재설계, 은퇴 후 심리적 적응", icon: "✈️" }
        ]
      },
      {
        name: "특정 사회·환경 문제",
        icon: "🆔",
        items: [
          { name: "사회적 변화와 소외", href: "/tests/social-change-isolation", description: "초고령화 사회 적응, 노년기 소외감", icon: "🔄" },
          { name: "사회적 불평등 및 갈등", href: "/tests/social-inequality", description: "젠더 갈등, 소수자 차별 등 사회적 불평등", icon: "💔" },
          { name: "환경 문제 및 심리", href: "/tests/environmental-psychology", description: "환경 문제에 대한 개인의 역할 및 책임감", icon: "🏠" },
          { name: "비전통적 삶의 방식", href: "/tests/non-traditional-lifestyle", description: "비혼/비출산 등 비전통적 삶의 방식 선택", icon: "🩹" }
        ]
      }
    ]
  }
];

