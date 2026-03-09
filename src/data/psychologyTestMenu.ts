// AI 심리검사 메뉴 데이터 - 11개 대분류 3단계 구조
// hidden: true 인 항목/카테고리는 네비에서 숨김. NEXT_PUBLIC_SHOW_LEGACY_TESTS=true 시 복원 가능.
export interface TestMenuItem {
  name: string;
  href: string;
  description: string;
  icon: string;
  badge?: string;
  /** true면 네비에서 숨김. 추후 "기존 검사" 메뉴로 복원 가능 */
  hidden?: boolean;
}

export interface TestSubcategory {
  name: string;
  icon: string;
  items: TestMenuItem[];
  /** true면 네비에서 숨김 */
  hidden?: boolean;
}

export interface TestCategory {
  category: string;
  icon: string;
  subcategories: TestSubcategory[];
  /** true면 기존 완료 검사(보관용). 네비 기본 숨김, 환경변수로 복원 */
  hidden?: boolean;
}

/** 환경변수 NEXT_PUBLIC_SHOW_LEGACY_TESTS=true 이면 기존(레거시) 검사 메뉴도 노출 (Next.js에서 빌드 시 인라인됨) */
const showLegacyTests =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_SHOW_LEGACY_TESTS === 'true';

/** 네비/사이드바에 표시할 메뉴만 반환. hidden 카테고리 제외 (레거시 노출 시에는 전체) */
export function getVisibleTestMenuItems(): TestCategory[] {
  if (showLegacyTests) return testSubMenuItems;
  return testSubMenuItems.filter((c) => !c.hidden);
}

export const testSubMenuItems: TestCategory[] = [
  {
    category: "임시 검사",
    icon: "🔬",
    hidden: true, // 기존 완료 기능 보관. 메뉴에서 숨김, 추후 복원 가능
    subcategories: [
      {
        name: "임시 검사",
        icon: "🧪",
        items: [
          { name: "MBTI Pro 검사", href: "/tests/mbti_pro", description: "전문가용 MBTI 성격 유형 검사", icon: "🧠" },
          { name: "MBTI 검사", href: "/tests/mbti", description: "개인용 MBTI 성격 유형 검사", icon: "🔍" },
          { name: "AI 프로파일링 검사", href: "/tests/ai-profiling", description: "AI 기반 종합 성격 프로파일링 검사", icon: "🤖" },
          { name: "통합 평가 검사", href: "/tests/integrated-assessment", description: "종합 심리 평가 검사", icon: "📊" }
        ]
      },
      {
        name: "통합 심리검사",
        icon: "🎓",
        items: [
          { name: "통합 심리검사", href: "/tests/integrated-assessment", description: "신입생 통합 심리검사", icon: "🎓" }
        ]
      }
    ]
  },
  {
    category: "개인 심리 및 성장",
    icon: "🚀",
    subcategories: [
      {
        name: "성격 및 기질 탐색",
        icon: "🔍",
        items: [
          { name: "MBTI 성격 유형 분석", href: "/tests/mbti-analysis", description: "16가지 성격 유형을 통한 나만의 특성 발견", icon: "🧠" },
          { name: "강점 기반 성장 계획", href: "/tests/strengths-growth", description: "개인 강점을 활용한 맞춤형 성장 로드맵", icon: "💪" },
          { name: "감정 지능(EQ) 측정", href: "/tests/emotional-intelligence", description: "감정 인식, 조절, 활용 능력 종합 평가", icon: "❤️" },
          { name: "스트레스 대응 패턴 분석", href: "/tests/stress-response", description: "개인별 스트레스 반응 방식과 대처 전략", icon: "🛡️" }
        ]
      },
      {
        name: "자아정체감 및 가치관",
        icon: "🎯",
        items: [
          { name: "핵심 가치관 정립", href: "/tests/core-values", description: "나만의 핵심 가치관 발견 및 삶의 방향 설정", icon: "⭐" },
          { name: "자존감 회복 프로그램", href: "/tests/self-esteem", description: "건강한 자존감 형성을 위한 단계별 프로그램", icon: "👑" },
          { name: "자기 수용과 사랑", href: "/tests/self-acceptance", description: "완벽하지 않은 나를 있는 그대로 받아들이기", icon: "🤗" },
          { name: "삶의 목적과 의미 찾기", href: "/tests/life-purpose", description: "개인만의 삶의 목적과 의미 탐색", icon: "🌟" }
        ]
      },
      {
        name: "잠재력 및 역량 개발",
        icon: "💪",
        items: [
          { name: "목표 달성 시스템", href: "/tests/goal-achievement", description: "SMART 목표 설정부터 실행까지 완벽 가이드", icon: "🎯" },
          { name: "창의적 사고 훈련", href: "/tests/creative-thinking", description: "창의성 발현을 위한 두뇌 훈련 프로그램", icon: "💡" },
          { name: "학습 효율성 최적화", href: "/tests/learning-optimization", description: "개인 맞춤형 학습법과 기억력 향상", icon: "📚" },
          { name: "회복 탄력성 강화", href: "/tests/resilience-building", description: "어려움을 극복하는 내적 힘 기르기", icon: "🔄" }
        ]
      },
      {
        name: "삶의 의미 및 실존적 문제",
        icon: "🌟",
        items: [
          { name: "삶의 방향성 재설정", href: "/tests/life-direction", description: "현재 삶의 방향성 점검 및 새로운 방향 모색", icon: "🧭" },
          { name: "상실과 애도 과정", href: "/tests/loss-grief", description: "상실 경험을 통한 성장과 치유 과정", icon: "💔" },
          { name: "내면의 평화 찾기", href: "/tests/inner-peace", description: "마음의 평온과 조화로운 삶을 위한 명상", icon: "🕊️" },
          { name: "연결감과 소속감", href: "/tests/connection-belonging", description: "타인과의 건강한 연결과 소속감 형성", icon: "🤝" }
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
        icon: "👨‍👩‍👧‍👦",
        items: [
          { name: "부모-자녀 관계 개선", href: "/tests/parent-child-relationship", description: "세대 간 소통과 이해를 통한 건강한 가족 관계", icon: "👶" },
          { name: "형제자매 갈등 해결", href: "/tests/sibling-conflict", description: "형제자매 간 경쟁과 갈등 조정 및 화해", icon: "👫" },
          { name: "가족 의사소통 훈련", href: "/tests/family-communication", description: "효과적인 가족 내 소통 기술과 갈등 해결", icon: "💬" },
          { name: "확대가족 적응", href: "/tests/extended-family", description: "시부모, 처가 등 확대가족과의 관계 조화", icon: "🏠" }
        ]
      },
      {
        name: "연인 및 부부 관계",
        icon: "💑",
        items: [
          { name: "연인 관계 갈등 해결", href: "/tests/romantic-conflict", description: "연인 간 갈등 해결과 건강한 관계 유지", icon: "💕" },
          { name: "부부 관계 회복", href: "/tests/marriage-recovery", description: "부부 간 소통 개선과 관계 회복 프로그램", icon: "💍" },
          { name: "이별 후 회복", href: "/tests/breakup-recovery", description: "이별의 아픔을 극복하고 새로운 시작을 위한 치유", icon: "💔" },
          { name: "친밀감 향상", href: "/tests/intimacy-enhancement", description: "정서적, 신체적 친밀감 증진을 위한 프로그램", icon: "🤗" }
        ]
      },
      {
        name: "친구 및 동료 관계",
        icon: "👥",
        items: [
          { name: "직장 내 인간관계", href: "/tests/workplace-relationships", description: "직장에서의 효과적인 인간관계 구축과 유지", icon: "💼" },
          { name: "새로운 친구 만들기", href: "/tests/making-friends", description: "성인기 새로운 친구 관계 형성과 유지", icon: "🤝" },
          { name: "사회적 고립 극복", href: "/tests/social-isolation", description: "사회적 고립감과 외로움 극복하기", icon: "🏠" },
          { name: "집단 내 적응", href: "/tests/group-adaptation", description: "새로운 집단이나 환경에의 적응과 소속감 형성", icon: "🌐" }
        ]
      },
      {
        name: "사회적 기술 및 소통",
        icon: "💬",
        items: [
          { name: "효과적인 소통 기술", href: "/tests/communication-skills", description: "비폭력 대화법과 효과적인 의사소통 기술", icon: "🗣️" },
          { name: "공감 능력 향상", href: "/tests/empathy-skills", description: "타인의 감정을 이해하고 공감하는 능력 개발", icon: "❤️" },
          { name: "자기주장 훈련", href: "/tests/assertiveness-training", description: "건강한 자기주장과 경계 설정 기술", icon: "✊" },
          { name: "네트워킹 스킬", href: "/tests/networking-skills", description: "효과적인 인맥 형성과 유지 전략", icon: "🌐" }
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
        icon: "😔",
        items: [
          { name: "우울감 완화 프로그램", href: "/tests/depression-relief", description: "경미한 우울감과 무기력감 극복을 위한 단계별 프로그램", icon: "🌅" },
          { name: "기분 조절 훈련", href: "/tests/mood-regulation", description: "감정 기복 조절과 안정적인 기분 유지 기술", icon: "⚖️" },
          { name: "계절성 우울 극복", href: "/tests/seasonal-depression", description: "계절성 정서 장애(SAD) 예방과 관리", icon: "☀️" },
          { name: "상실과 애도 치유", href: "/tests/grief-healing", description: "상실 경험 후 정상적인 애도 과정과 치유", icon: "🕊️" }
        ]
      },
      {
        name: "불안 및 스트레스",
        icon: "😰",
        items: [
          { name: "불안 완화 기법", href: "/tests/anxiety-relief", description: "일상 불안감과 걱정을 줄이는 실용적 기법", icon: "🧘" },
          { name: "사회적 불안 극복", href: "/tests/social-anxiety", description: "사회생활에서의 불안감과 두려움 극복", icon: "👥" },
          { name: "스트레스 관리 시스템", href: "/tests/stress-management", description: "효과적인 스트레스 인식, 관리, 완화 전략", icon: "🛡️" },
          { name: "번아웃 예방 및 회복", href: "/tests/burnout-recovery", description: "직장/학업 번아웃 예방과 회복 프로그램", icon: "🔄" }
        ]
      },
      {
        name: "외상 및 위기 개입",
        icon: "🆘",
        items: [
          { name: "위기 상황 대응", href: "/tests/crisis-intervention", description: "예상치 못한 위기 상황에서의 심리적 지원", icon: "🚨" },
          { name: "외상 후 스트레스 관리", href: "/tests/ptsd-management", description: "외상 경험 후 정상적인 회복 과정 지원", icon: "🩹" },
          { name: "폭력 피해 회복", href: "/tests/violence-recovery", description: "폭력 피해 후 안전 확보와 심리적 회복", icon: "🛡️" },
          { name: "복합 외상 치유", href: "/tests/complex-trauma", description: "만성적이고 반복적인 외상 경험의 치유", icon: "💔" }
        ]
      },
      {
        name: "중독 및 충동 조절",
        icon: "🔄",
        items: [
          { name: "디지털 중독 관리", href: "/tests/digital-addiction", description: "스마트폰, 인터넷, SNS 중독 예방과 관리", icon: "📱" },
          { name: "물질 중독 회복", href: "/tests/substance-recovery", description: "알코올, 약물 등 물질 중독의 예방과 회복", icon: "🍷" },
          { name: "섭식 문제 해결", href: "/tests/eating-disorders", description: "폭식, 거식 등 섭식 문제의 인식과 개선", icon: "🍽️" },
          { name: "충동 조절 훈련", href: "/tests/impulse-control", description: "충동적 행동과 습관의 인식 및 조절", icon: "⏰" }
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
          { name: "진로 탐색 및 설계", href: "/tests/career-exploration", description: "개인의 적성과 흥미를 바탕으로 한 진로 탐색", icon: "🔍" },
          { name: "직업 만족도 향상", href: "/tests/job-satisfaction", description: "현재 직업의 만족도 향상과 직무 재설계", icon: "😊" },
          { name: "직장 스트레스 관리", href: "/tests/workplace-stress", description: "직장 내 스트레스 요인 파악과 대처 전략", icon: "⚡" },
          { name: "경력 전환 준비", href: "/tests/career-transition", description: "새로운 분야로의 경력 전환 준비와 적응", icon: "🔄" }
        ]
      },
      {
        name: "경제 및 재정 문제",
        icon: "💰",
        items: [
          { name: "재정 스트레스 해결", href: "/tests/financial-stress", description: "부채와 경제적 압박으로 인한 스트레스 관리", icon: "💸" },
          { name: "건강한 소비 습관", href: "/tests/healthy-spending", description: "충동 구매 방지와 합리적인 소비 습관 형성", icon: "🛒" },
          { name: "재정 목표 달성", href: "/tests/financial-goals", description: "개인 재정 목표 설정과 달성을 위한 계획", icon: "📈" },
          { name: "돈과의 건강한 관계", href: "/tests/money-relationship", description: "돈에 대한 올바른 인식과 태도 형성", icon: "💎" }
        ]
      },
      {
        name: "건강 및 신체 문제",
        icon: "🏥",
        items: [
          { name: "만성 질환 적응", href: "/tests/chronic-illness", description: "만성 질환 진단 후 심리적 적응과 관리", icon: "🩺" },
          { name: "신체 이미지 개선", href: "/tests/body-image", description: "건강한 신체 이미지 형성과 자존감 향상", icon: "💪" },
          { name: "건강한 생활 습관", href: "/tests/healthy-habits", description: "운동, 식습관 등 건강한 생활 습관 형성", icon: "🏃" },
          { name: "노화 수용과 적응", href: "/tests/aging-acceptance", description: "노화 과정에 대한 수용과 긍정적 적응", icon: "👴" }
        ]
      },
      {
        name: "일상생활 및 자기 관리",
        icon: "📅",
        items: [
          { name: "시간 관리 시스템", href: "/tests/time-management", description: "효율적인 시간 관리와 생산성 향상", icon: "⏰" },
          { name: "생활 공간 정리", href: "/tests/living-space", description: "미니멀 라이프와 정리정돈을 통한 마음의 평온", icon: "🏠" },
          { name: "건강한 루틴 만들기", href: "/tests/healthy-routine", description: "규칙적이고 건강한 일상 루틴 구축", icon: "🌅" },
          { name: "수면 질 향상", href: "/tests/sleep-quality", description: "양질의 수면을 위한 환경과 습관 개선", icon: "😴" }
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
        icon: "🌏",
        items: [
          { name: "문화 충격 극복", href: "/tests/culture-shock", description: "새로운 문화 환경 적응과 문화 충격 극복", icon: "🌊" },
          { name: "다문화 가족 조화", href: "/tests/multicultural-family", description: "문화적 차이를 가진 가족 간의 이해와 조화", icon: "👨‍👩‍👧‍👦" },
          { name: "해외 생활 적응", href: "/tests/overseas-living", description: "해외 거주 시 외로움과 적응 어려움 극복", icon: "✈️" },
          { name: "문화적 정체성 탐색", href: "/tests/cultural-identity", description: "다문화 환경에서의 정체성 형성과 수용", icon: "🎭" }
        ]
      },
      {
        name: "디지털 환경 적응",
        icon: "💻",
        items: [
          { name: "디지털 피로 완화", href: "/tests/digital-fatigue", description: "디지털 기기 과사용으로 인한 피로와 스트레스 관리", icon: "📱" },
          { name: "온라인 관계 관리", href: "/tests/online-relationships", description: "온라인 환경에서의 건강한 관계 형성과 유지", icon: "💬" },
          { name: "AI 시대 적응", href: "/tests/ai-adaptation", description: "인공지능 시대의 변화에 대한 적응과 준비", icon: "🤖" },
          { name: "가상-현실 균형", href: "/tests/virtual-reality-balance", description: "가상 세계와 현실 세계의 건강한 균형 유지", icon: "🎮" }
        ]
      },
      {
        name: "생애주기별 적응",
        icon: "🔄",
        items: [
          { name: "청소년기 성장", href: "/tests/adolescent-growth", description: "청소년기의 정체성 형성과 학업 스트레스 관리", icon: "🎓" },
          { name: "청년기 진로 탐색", href: "/tests/young-adult-career", description: "대학 생활과 사회 진출 시기의 적응과 성장", icon: "🚀" },
          { name: "중년기 위기 극복", href: "/tests/midlife-crisis", description: "중년기 위기와 자녀 독립에 따른 적응", icon: "⚖️" },
          { name: "노년기 삶의 재설계", href: "/tests/elderly-life-redesign", description: "노년기 삶의 의미 재발견과 은퇴 후 적응", icon: "🌅" }
        ]
      },
      {
        name: "사회 환경 적응",
        icon: "🏘️",
        items: [
          { name: "사회 변화 적응", href: "/tests/social-change", description: "급변하는 사회 환경에 대한 적응과 대응", icon: "🌊" },
          { name: "사회적 불평등 대처", href: "/tests/social-inequality", description: "사회적 불평등과 차별에 대한 심리적 대처", icon: "⚖️" },
          { name: "환경 문제 인식", href: "/tests/environmental-awareness", description: "환경 문제에 대한 개인의 역할과 책임감", icon: "🌱" },
          { name: "비전통적 삶의 방식", href: "/tests/non-traditional-lifestyle", description: "비혼, 비출산 등 새로운 삶의 방식 선택과 적응", icon: "🆕" }
        ]
      }
    ]
  }
];

