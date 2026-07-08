import type { TestCategory } from '@/data/psychologyTestMenu';

/** 나만의 공간(구 나의 AI 비서) — 3단계 메뉴 */
export const aiMindAssistantMenuCategories: TestCategory[] = [
  {
    category: '1. 일일 체크',
    icon: '📊',
    subcategories: [
      {
        name: '1a. 오늘의 컨디션 체크',
        icon: '📊',
        items: [
          {
            name: '오늘의 컨디션 체크',
            href: '/ai-mind-assistant/daily-mood',
            description: '수면/스트레스/우울/불안 등 통합 체크',
            icon: '📊',
          },
        ],
      },
      {
        name: '1b. 오늘의 감정일기',
        icon: '📝',
        items: [
          {
            name: '오늘의 감정일기',
            href: '/ai-mind-assistant/daily-thought',
            description: 'AI가 분석하는 감정 변화',
            icon: '📝',
          },
        ],
      },
      {
        name: '1c. 나의 목표 관리',
        icon: '🎯',
        items: [
          {
            name: '나의 목표 관리',
            href: '/goals',
            description: '개인 목표 설정 및 추적',
            icon: '🎯',
          },
        ],
      },
      {
        name: '1d. 일정 관리',
        icon: '📅',
        items: [
          {
            name: '일정 관리',
            href: '/calendar',
            description: '상담 예약 및 일정 관리',
            icon: '📅',
          },
        ],
      },
    ],
  },
  {
    category: '2. 마음 SOS',
    icon: '🚨',
    subcategories: [
      {
        name: '2a. 나의 긴급 마음진단',
        icon: '🚨',
        items: [
          {
            name: '나의 긴급 마음진단',
            href: '/ai-mind-assistant/emergency-diagnosis',
            description: '1분 AI 솔루션',
            icon: '🚨',
            badge: '긴급',
          },
        ],
      },
      {
        name: '2b. 나의 번아웃 체크',
        icon: '🔥',
        items: [
          {
            name: '나의 번아웃 체크',
            href: '/ai-mind-assistant/burnout-check',
            description: '번아웃 신호등 확인',
            icon: '🔥',
          },
        ],
      },
    ],
  },
  {
    category: '3. AI 리포트',
    icon: '📋',
    subcategories: [
      {
        name: '3a. 일상 추적',
        icon: '📝',
        items: [
          {
            name: '일상 추적',
            href: '/mypage/daily-tracking',
            description: '매일의 마음 상태 기록',
            icon: '📝',
          },
        ],
      },
      {
        name: '3b. AI 감정/스트레스 분석',
        icon: '📊',
        items: [
          {
            name: 'AI 감정/스트레스 분석',
            href: '/ai-mind-assistant/emotion-report',
            description: '종합 감정 및 스트레스 분석 결과',
            icon: '📊',
          },
        ],
      },
      {
        name: '3c. AI 종합 분석 리포트',
        icon: '🏆',
        items: [
          {
            name: 'AI 종합 분석 리포트',
            href: '/tests/ai-analysis',
            description: '현재 마음 상태 종합 점검',
            icon: '🏆',
          },
        ],
      },
      {
        name: '3d. K-MBTI 궁합',
        icon: '💕',
        items: [
          {
            name: 'K-MBTI 궁합',
            href: '/mbti-compatibility',
            description: 'AI 기반 MBTI 궁합 분석',
            icon: '💕',
          },
        ],
      },
      {
        name: '3e. 성장 리포트',
        icon: '📈',
        items: [
          {
            name: '성장 리포트',
            href: '/progress',
            description: '개인 성장 분석 리포트',
            icon: '📈',
          },
        ],
      },
      {
        name: '3f. AI 프로파일링',
        icon: '🔍',
        items: [
          {
            name: 'AI 프로파일링',
            href: '/tests/ai-profiling',
            description: '캠퍼스 라이프 시크릿 리포트',
            icon: '🔍',
          },
        ],
      },
    ],
  },
  {
    category: '4. 검사 기록',
    icon: '📋',
    subcategories: [
      {
        name: '4a. 나의 검사결과',
        icon: '📊',
        items: [
          {
            name: '나의 검사결과',
            href: '/mypage?tab=records',
            description: '나의 심리검사 결과 모음',
            icon: '📊',
          },
        ],
      },
      {
        name: '4b. 상담사 할당검사',
        icon: '📋',
        items: [
          {
            name: '상담사 할당검사',
            href: '/mypage/assigned-tests',
            description: '상담사가 할당한 검사',
            icon: '📋',
          },
        ],
      },
    ],
  },
  {
    category: '5. 도와줘요 상담사님',
    icon: '💬',
    subcategories: [
      {
        name: '5a. 1:1 채팅',
        icon: '💬',
        items: [
          {
            name: '1:1 채팅',
            href: '/chat',
            description: '상담사와 실시간 채팅',
            icon: '💬',
          },
        ],
      },
      {
        name: '5b. 상담 예약',
        icon: '📅',
        items: [
          {
            name: '상담 예약',
            href: '/counseling/appointments',
            description: '개인/가족/커플 상담 예약',
            icon: '📅',
          },
        ],
      },
    ],
  },
  {
    category: '6. 셀프 치료',
    icon: '🧘',
    subcategories: [
      {
        name: '6a. 학습 치료',
        icon: '📚',
        items: [
          {
            name: '학습 치료',
            href: '/learning',
            description: '심리학 교육 콘텐츠',
            icon: '📚',
          },
        ],
      },
      {
        name: '6b. AI 맞춤 치료',
        icon: '🤖',
        items: [
          {
            name: 'AI 실시간 상담',
            href: '/ai-mind-assistant/counsel',
            description: 'Gemini AI와 대화 상담',
            icon: '💬',
            badge: '신규',
          },
          {
            name: 'AI 맞춤 치료',
            href: '/recommendations',
            description: 'AI 기반 상담 추천',
            icon: '🤖',
          },
        ],
      },
      {
        name: '6c. 상담사 할당 치료',
        icon: '👨‍⚕️',
        items: [
          {
            name: '상담사 할당 치료',
            href: '/counselor/treatment-plans',
            description: '상담사가 할당한 치료 프로그램',
            icon: '👨‍⚕️',
          },
        ],
      },
    ],
  },
];

export const AI_MIND_ASSISTANT_MAIN_HREF = '/ai-mind-assistant';
