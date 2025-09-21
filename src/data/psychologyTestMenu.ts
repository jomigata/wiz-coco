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
    category: "AI 성장 잠재력 분석",
    icon: "🚀",
    subcategories: [
      {
        name: "AI 자아 심층 분석",
        icon: "🔍",
        items: [
          { name: "성격 프로파일링", href: "/tests/personality-profiling", description: "AI 기반 성격 심층 분석", icon: "👤" },
          { name: "기질·행동 패턴 분석", href: "/tests/behavior-pattern", description: "행동 패턴 및 기질 분석", icon: "📊" },
          { name: "가치관·동기 코어 분석", href: "/tests/values-motivation", description: "핵심 가치관과 동기 분석", icon: "💎" },
          { name: "자아 정체성 맵핑", href: "/tests/identity-mapping", description: "자아 정체성 종합 분석", icon: "🗺️" }
        ]
      },
      {
        name: "AI 역량 개발 코칭",
        icon: "🎯",
        items: [
          { name: "인지·학습능력 최적화", href: "/tests/cognitive-optimization", description: "학습 능력 향상 분석", icon: "🧠" },
          { name: "잠재 재능 스캐닝", href: "/tests/talent-scanning", description: "숨겨진 재능 발견", icon: "✨" },
          { name: "커리어 네비게이션", href: "/tests/career-navigation", description: "AI 기반 진로 가이드", icon: "🧭" },
          { name: "리더십·의사결정 시뮬레이션", href: "/tests/leadership-simulation", description: "리더십 역량 분석", icon: "👑" }
        ]
      }
    ]
  },
  {
    category: "AI 관계 개선 솔루션",
    icon: "💕",
    subcategories: [
      {
        name: "AI 관계 갈등 진단",
        icon: "⚡",
        items: [
          { name: "친구·동료 관계 다이나믹스", href: "/tests/peer-relationships", description: "동료 관계 분석", icon: "👥" },
          { name: "가족 시스템 분석", href: "/tests/family-system", description: "가족 관계 패턴 분석", icon: "👨‍👩‍👧‍👦" },
          { name: "연인 애착·갈등 패턴 분석", href: "/tests/romantic-attachment", description: "연인 관계 심층 분석", icon: "💑" },
          { name: "이성 관계·데이팅 전략", href: "/tests/dating-strategy", description: "데이팅 성공 전략", icon: "💘" }
        ]
      },
      {
        name: "AI 소셜 스킬 강화",
        icon: "🤝",
        items: [
          { name: "소통 능력 진단 및 코칭", href: "/tests/communication-skills", description: "소통 능력 향상", icon: "💬" },
          { name: "조직·팀워크 시너지 분석", href: "/tests/team-synergy", description: "팀워크 최적화", icon: "🏢" },
          { name: "소셜 네트워크 빌더", href: "/tests/social-network", description: "인맥 관리 전략", icon: "🌐" }
        ]
      }
    ]
  },
  {
    category: "AI 심리·정서 케어",
    icon: "💙",
    subcategories: [
      {
        name: "AI 감정·스트레스 관리",
        icon: "😌",
        items: [
          { name: "우울·무기력감 트래킹", href: "/tests/depression-tracking", description: "우울 증상 모니터링", icon: "😔" },
          { name: "불안·공황 증상 완화 코칭", href: "/tests/anxiety-relief", description: "불안 완화 프로그램", icon: "😰" },
          { name: "스트레스 회복탄력성 증진", href: "/tests/resilience-building", description: "스트레스 대처 능력", icon: "💪" },
          { name: "분노·충동성 조절 솔루션", href: "/tests/anger-management", description: "분노 관리 프로그램", icon: "😠" }
        ]
      },
      {
        name: "AI 심리 위기 극복",
        icon: "🆘",
        items: [
          { name: "트라우마·외상 후 회복 지원", href: "/tests/trauma-recovery", description: "트라우마 회복 지원", icon: "🩹" },
          { name: "자존감 회복 및 강화 프로그램", href: "/tests/self-esteem", description: "자존감 향상", icon: "⭐" },
          { name: "중독·의존성 패턴 분석", href: "/tests/addiction-patterns", description: "중독 패턴 분석", icon: "🔗" },
          { name: "성인 ADHD 성향 분석 및 관리", href: "/tests/adhd-management", description: "ADHD 관리 전략", icon: "⚡" },
          { name: "차별·미세공격 상처 분석", href: "/tests/microaggression", description: "차별 경험 분석", icon: "🛡️" }
        ]
      },
      {
        name: "AI 환경 부적응 진단",
        icon: "🏠",
        items: [
          { name: "학교·학업 스트레스 진단", href: "/tests/academic-stress", description: "학업 스트레스 분석", icon: "📚" },
          { name: "은퇴·노년기 적응 분석", href: "/tests/retirement-adaptation", description: "노년기 적응 지원", icon: "👴" },
          { name: "사회적 고립·소외감 분석", href: "/tests/social-isolation", description: "사회적 고립 분석", icon: "🏝️" },
          { name: "성소수자 정체성 지원", href: "/tests/lgbtq-support", description: "성소수자 지원", icon: "🏳️‍🌈" }
        ]
      }
    ]
  },
  {
    category: "AI 삶의 의미·목적 탐색",
    icon: "🌟",
    subcategories: [
      {
        name: "AI 실존적 성장 가이드",
        icon: "🔮",
        items: [
          { name: "존재 의미·허무감 탐색", href: "/tests/existential-meaning", description: "삶의 의미 탐구", icon: "❓" },
          { name: "죽음 불안·상실 애도 분석", href: "/tests/death-anxiety", description: "죽음 불안 완화", icon: "💀" },
          { name: "영적 성장·내면 탐색", href: "/tests/spiritual-growth", description: "영적 성장 가이드", icon: "🕊️" },
          { name: "삶의 전환점·위기 성장 분석", href: "/tests/life-transitions", description: "인생 전환점 분석", icon: "🔄" }
        ]
      }
    ]
  },
  {
    category: "AI 윤리적 딜레마 분석",
    icon: "⚖️",
    subcategories: [
      {
        name: "AI 가치관 충돌 분석",
        icon: "⚔️",
        items: [
          { name: "도덕적 갈등·의사결정 분석", href: "/tests/moral-dilemmas", description: "윤리적 의사결정", icon: "🤔" }
        ]
      }
    ]
  },
  {
    category: "AI 신체·건강 심리 분석",
    icon: "💪",
    subcategories: [
      {
        name: "AI 신체 이미지 진단",
        icon: "🪞",
        items: [
          { name: "외모 불만·신체상 왜곡 분석", href: "/tests/body-image", description: "신체 이미지 분석", icon: "👤" },
          { name: "섭식 행동·식습관 패턴 분석", href: "/tests/eating-behavior", description: "식습관 패턴 분석", icon: "🍽️" }
        ]
      },
      {
        name: "AI 질병 스트레스 관리",
        icon: "🏥",
        items: [
          { name: "만성질환 심리 적응 코칭", href: "/tests/chronic-illness", description: "만성질환 적응", icon: "🩺" },
          { name: "건강염려증·의료 불안 분석", href: "/tests/health-anxiety", description: "건강 불안 분석", icon: "😰" }
        ]
      }
    ]
  },
  {
    category: "AI 재정·생활 관리",
    icon: "💰",
    subcategories: [
      {
        name: "AI 재정 심리 진단",
        icon: "💳",
        items: [
          { name: "재정 스트레스·불안 분석", href: "/tests/financial-stress", description: "재정 스트레스 분석", icon: "💸" }
        ]
      },
      {
        name: "AI 생활 습관 디자인",
        icon: "📅",
        items: [
          { name: "습관 형성·자기조절 코칭", href: "/tests/habit-formation", description: "건강한 습관 형성", icon: "🔄" },
          { name: "디지털 웰빙 플래너", href: "/tests/digital-wellness", description: "디지털 라이프 밸런스", icon: "📱" }
        ]
      }
    ]
  },
  {
    category: "AI 현실 문제 해결",
    icon: "🔧",
    subcategories: [
      {
        name: "AI 직장·커리어 솔루션",
        icon: "💼",
        items: [
          { name: "번아웃 예측 및 회복 플랜", href: "/tests/burnout-recovery", description: "번아웃 예방 및 회복", icon: "🔥" },
          { name: "직장 내 관계·갈등 분석", href: "/tests/workplace-conflicts", description: "직장 갈등 해결", icon: "⚔️" },
          { name: "커리어 전환·성장 시뮬레이션", href: "/tests/career-transition", description: "커리어 전환 가이드", icon: "🔄" },
          { name: "불안정 노동·프리랜서 코칭", href: "/tests/freelancer-coaching", description: "프리랜서 성공 전략", icon: "🆓" },
          { name: "창업 스트레스·리스크 분석", href: "/tests/entrepreneurship-stress", description: "창업 스트레스 관리", icon: "🚀" },
          { name: "조직 내 세대·문화 갈등 진단", href: "/tests/generational-conflicts", description: "세대 갈등 분석", icon: "👴👦" }
        ]
      },
      {
        name: "AI 경제적 스트레스 분석",
        icon: "📈",
        items: [
          { name: "부채·재정 압박감 진단", href: "/tests/debt-stress", description: "부채 스트레스 분석", icon: "💸" },
          { name: "소비·투자 심리 프로파일링", href: "/tests/consumption-psychology", description: "소비 심리 분석", icon: "🛒" },
          { name: "경제적 미래 불안도 측정", href: "/tests/economic-anxiety", description: "경제 불안 분석", icon: "📉" },
          { name: "경제적 트라우마 분석", href: "/tests/economic-trauma", description: "경제적 트라우마", icon: "💔" },
          { name: "가족 자산 갈등 분석", href: "/tests/family-asset-conflicts", description: "가족 재산 갈등", icon: "🏠" },
          { name: "돌봄 노동 부담감 진단", href: "/tests/caregiving-burden", description: "돌봄 부담 분석", icon: "👵" }
        ]
      },
      {
        name: "AI 주거·일상 환경 최적화",
        icon: "🏡",
        items: [
          { name: "주거 스트레스·이웃 갈등 분석", href: "/tests/housing-stress", description: "주거 환경 스트레스", icon: "🏘️" },
          { name: "일상 루틴·생활 패턴 디자인", href: "/tests/daily-routine", description: "일상 루틴 최적화", icon: "⏰" },
          { name: "1인 가구 리스크 분석", href: "/tests/single-household", description: "1인 가구 지원", icon: "🏠" },
          { name: "환경·생태 불안도 분석", href: "/tests/eco-anxiety", description: "환경 불안 분석", icon: "🌍" }
        ]
      },
      {
        name: "AI 사회 시스템 적응 지원",
        icon: "🏛️",
        items: [
          { name: "법적 분쟁 스트레스 관리", href: "/tests/legal-stress", description: "법적 문제 스트레스", icon: "⚖️" },
          { name: "행정 시스템 스트레스 분석", href: "/tests/administrative-stress", description: "행정 절차 스트레스", icon: "📋" },
          { name: "의료 시스템 소통 분석", href: "/tests/medical-communication", description: "의료진 소통", icon: "🏥" },
          { name: "교육 시스템 적응도 분석", href: "/tests/education-adaptation", description: "교육 시스템 적응", icon: "🎓" },
          { name: "소비자 권리·분쟁 대응", href: "/tests/consumer-rights", description: "소비자 권리 보호", icon: "🛡️" }
        ]
      }
    ]
  },
  {
    category: "AI 디지털 심리 분석",
    icon: "💻",
    subcategories: [
      {
        name: "AI 온라인 자아 분석",
        icon: "🌐",
        items: [
          { name: "SNS 비교·자존감 분석", href: "/tests/sns-comparison", description: "SNS 자존감 영향", icon: "📱" },
          { name: "사이버 폭력 트라우마 분석", href: "/tests/cyber-bullying", description: "사이버 폭력 회복", icon: "🛡️" },
          { name: "디지털 정체성 맵핑", href: "/tests/digital-identity", description: "온라인 정체성 분석", icon: "🆔" }
        ]
      },
      {
        name: "AI 디지털 관계 진단",
        icon: "💬",
        items: [
          { name: "디지털 소진·고립감 진단", href: "/tests/digital-burnout", description: "디지털 피로 분석", icon: "😵" },
          { name: "온라인 데이팅 패턴 분석", href: "/tests/online-dating", description: "온라인 데이팅 분석", icon: "💕" },
          { name: "팬덤·파라소셜 관계 분석", href: "/tests/parasocial-relationships", description: "팬덤 관계 분석", icon: "⭐" }
        ]
      },
      {
        name: "AI 디지털 라이프 코칭",
        icon: "🎮",
        items: [
          { name: "디지털 과의존도 분석", href: "/tests/digital-dependency", description: "디지털 중독 분석", icon: "📱" },
          { name: "정보 분별력·리터러시 진단", href: "/tests/information-literacy", description: "정보 판별 능력", icon: "🔍" },
          { name: "AI 시대 기술 불안도 분석", href: "/tests/tech-anxiety", description: "기술 불안 분석", icon: "🤖" }
        ]
      }
    ]
  },
  {
    category: "AI 생애주기 발달 분석",
    icon: "👶",
    subcategories: [
      {
        name: "AI 아동·청소년 성장 분석",
        icon: "🧒",
        items: [
          { name: "영유아 애착 안정도 분석", href: "/tests/infant-attachment", description: "영유아 애착 분석", icon: "👶" },
          { name: "아동기 사회성·적응도 분석", href: "/tests/child-social-skills", description: "아동 사회성 분석", icon: "👦" },
          { name: "청소년기 정체성·진로 탐색", href: "/tests/teen-identity", description: "청소년 정체성", icon: "👧" },
          { name: "청소년기 학업 스트레스 분석", href: "/tests/teen-academic-stress", description: "청소년 학업 스트레스", icon: "📚" }
        ]
      },
      {
        name: "AI 청년기 과업 분석",
        icon: "👨",
        items: [
          { name: "대학·진로 적응도 분석", href: "/tests/college-adaptation", description: "대학 적응 분석", icon: "🎓" },
          { name: "사회초년생 적응 스트레스", href: "/tests/young-adult-adaptation", description: "사회초년생 지원", icon: "👔" },
          { name: "결혼·친밀감 형성 분석", href: "/tests/marriage-intimacy", description: "결혼 관계 분석", icon: "💒" },
          { name: "부모 준비도·양육 스트레스", href: "/tests/parenting-readiness", description: "부모 준비도 분석", icon: "👨‍👩‍👧‍👦" }
        ]
      },
      {
        name: "AI 중년기 위기 진단",
        icon: "👨‍💼",
        items: [
          { name: "중년기 역할·정체성 위기 진단", href: "/tests/midlife-crisis", description: "중년기 위기 분석", icon: "😰" },
          { name: "갱년기 심리·신체 변화 분석", href: "/tests/menopause-psychology", description: "갱년기 심리 분석", icon: "🌡️" },
          { name: "빈 둥지·관계 재설정 진단", href: "/tests/empty-nest", description: "빈 둥지 증후군", icon: "🏠" }
        ]
      },
      {
        name: "AI 노년기 통합 분석",
        icon: "👴",
        items: [
          { name: "은퇴 후 삶의 질 분석", href: "/tests/retirement-quality", description: "은퇴 후 적응", icon: "🏖️" },
          { name: "노년기 건강·죽음 불안 분석", href: "/tests/elderly-health-anxiety", description: "노년기 건강 불안", icon: "🏥" },
          { name: "노년기 관계·고립감 분석", href: "/tests/elderly-isolation", description: "노년기 고립감", icon: "👥" },
          { name: "삶의 통합·마무리 지원", href: "/tests/life-integration", description: "인생 마무리 지원", icon: "✨" }
        ]
      }
    ]
  },
  {
    category: "AI 다문화 적응 솔루션",
    icon: "🌍",
    subcategories: [
      {
        name: "AI 초기 정착 지원",
        icon: "🏠",
        items: [
          { name: "언어·소통 스트레스 진단", href: "/tests/language-communication", description: "언어 소통 스트레스", icon: "🗣️" },
          { name: "문화 충격·가치관 충돌 분석", href: "/tests/cultural-shock", description: "문화 충격 분석", icon: "⚡" },
          { name: "체류·법률 불안정성 분석", href: "/tests/legal-uncertainty", description: "법적 불안정성", icon: "⚖️" },
          { name: "생활 환경 적응도 분석", href: "/tests/living-environment", description: "생활 환경 적응", icon: "🏘️" }
        ]
      },
      {
        name: "AI 사회·문화 관계 분석",
        icon: "🤝",
        items: [
          { name: "차별·편견 스트레스 분석", href: "/tests/discrimination-stress", description: "차별 경험 분석", icon: "🛡️" },
          { name: "대인관계 형성 패턴 분석", href: "/tests/relationship-formation", description: "인간관계 형성", icon: "👥" },
          { name: "직장 문화 적응도 진단", href: "/tests/workplace-culture", description: "직장 문화 적응", icon: "🏢" },
          { name: "공공 시스템 접근성 분석", href: "/tests/public-system-access", description: "공공 서비스 접근", icon: "🏛️" }
        ]
      },
      {
        name: "AI 다문화 가족 진단",
        icon: "👨‍👩‍👧‍👦",
        items: [
          { name: "국제부부 문화 갈등 진단", href: "/tests/international-marriage", description: "국제부부 갈등", icon: "💑" },
          { name: "다문화 자녀 양육 코칭", href: "/tests/multicultural-parenting", description: "다문화 자녀 양육", icon: "👶" },
          { name: "세대·문화 갈등 패턴 분석", href: "/tests/generational-cultural-conflict", description: "세대 문화 갈등", icon: "⚔️" },
          { name: "중도입국자녀 적응 분석", href: "/tests/immigrant-children", description: "중도입국자녀 지원", icon: "✈️" }
        ]
      },
      {
        name: "AI 다문화 정체성 통합",
        icon: "🆔",
        items: [
          { name: "이중문화 정체성 맵핑", href: "/tests/bicultural-identity", description: "이중문화 정체성", icon: "🔄" },
          { name: "이주·상실 스트레스 분석", href: "/tests/migration-loss", description: "이주 상실감", icon: "💔" },
          { name: "귀환·재적응 시뮬레이션", href: "/tests/return-adaptation", description: "귀환 적응 지원", icon: "🏠" },
          { name: "이주 트라우마 심층 분석", href: "/tests/migration-trauma", description: "이주 트라우마", icon: "🩹" }
        ]
      }
    ]
  }
];
