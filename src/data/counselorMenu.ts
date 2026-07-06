import type { TestCategory } from '@/data/psychologyTestMenu';

/** 상담관리 메가 메뉴 — AI 심리검사를 첫 대분류로 포함 */
export const COUNSELOR_AI_TESTS_CATEGORY = 'AI 심리검사';
export const COUNSELOR_PANEL_TITLE = '📋 상담관리';

export const counselorMenuCategories: TestCategory[] = [
  {
    category: COUNSELOR_AI_TESTS_CATEGORY,
    icon: '🧠',
    subcategories: [],
  },
  {
    category: '1. 심리검사 관리',
    icon: '📦',
    subcategories: [
      {
        name: '1a. 검사코드',
        icon: '📋',
        items: [
          {
            name: '검사코드 목록',
            href: '/counselor/assessments',
            description: '검사코드 발급·목록·진행현황',
            icon: '📦',
          },
          {
            name: '새 검사코드 만들기',
            href: '/counselor/assessments/new',
            description: '내담자별 나의코드 검사코드 발급',
            icon: '➕',
          },
          {
            name: '검사 크레딧',
            href: '/counselor/credits',
            description: '보유 크레딧·사용 내역 (협회 지급)',
            icon: '💳',
          },
        ],
      },
      {
        name: '1b. 결과·추천',
        icon: '📊',
        items: [
          {
            name: '검사 결과 분석',
            href: '/counselor/test-results',
            description: '내담자 검사 결과 분석',
            icon: '📊',
          },
          {
            name: '검사 추천',
            href: '/counselor/test-recommendations',
            description: '맞춤 검사 추천',
            icon: '🎯',
          },
        ],
      },
    ],
  },
  {
    category: '2. 내담자 관리',
    icon: '👥',
    subcategories: [
      {
        name: '2a. 내담자',
        icon: '👤',
        items: [
          {
            name: '내담자 목록',
            href: '/counselor/clients',
            description: '담당 내담자 관리',
            icon: '👥',
          },
          {
            name: '검사 할당',
            href: '/counselor/assign-tests',
            description: '내담자에게 검사 할당',
            icon: '📋',
          },
        ],
      },
      {
        name: '2b. 상담 운영',
        icon: '📅',
        items: [
          {
            name: '검사 관리',
            href: '/counselor/test-management',
            description: '신입생 통합 검사 관리',
            icon: '🎓',
          },
          {
            name: '상담 일정',
            href: '/counselor/schedule',
            description: '상담 일정 관리',
            icon: '📅',
          },
          {
            name: '상담 기록',
            href: '/counselor/sessions',
            description: '상담 세션 기록',
            icon: '📝',
          },
        ],
      },
    ],
  },
  {
    category: '3. 상담 도구',
    icon: '💬',
    subcategories: [
      {
        name: '3a. 소통',
        icon: '💬',
        items: [
          {
            name: '1:1 채팅',
            href: '/chat',
            description: '내담자와 실시간 채팅',
            icon: '💬',
          },
          {
            name: '상담 노트',
            href: '/counselor/notes',
            description: '상담 내용 기록',
            icon: '📋',
          },
        ],
      },
      {
        name: '3b. 치료 관리',
        icon: '📈',
        items: [
          {
            name: '치료 계획',
            href: '/counselor/treatment-plans',
            description: '치료 계획 수립',
            icon: '📋',
          },
          {
            name: '진행 상황',
            href: '/counselor/progress',
            description: '치료 진행 상황 추적',
            icon: '📈',
          },
        ],
      },
    ],
  },
  {
    category: '4. 데이터 관리',
    icon: '🤝',
    subcategories: [
      {
        name: '4a. 공유·기록',
        icon: '📊',
        items: [
          {
            name: '데이터 공유',
            href: '/counselor/data-sharing',
            description: '다른 상담사와 데이터 공유',
            icon: '🤝',
          },
          {
            name: '일상 기록 관리',
            href: '/counselor/daily-records',
            description: '내담자 일상 기록 관리',
            icon: '📊',
          },
        ],
      },
    ],
  },
];

export const COUNSELOR_MAIN_HREF = '/counselor';
