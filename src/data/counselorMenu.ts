import type { TestCategory } from '@/data/psychologyTestMenu';

export interface CounselorMainCategory extends TestCategory {
  slug: string;
  description: string;
}

/** 상담관리 메가 메뉴 — 3단계 구조 */
export const counselorMenuCategories: CounselorMainCategory[] = [
  {
    slug: 'psych-tests',
    category: '1. 심리검사 관리',
    description: '상담코드·내담자·검사·상담 운영',
    icon: '📦',
    subcategories: [
      {
        name: '1a. 상담코드',
        icon: '📋',
        items: [
          {
            name: '상담코드 목록',
            href: '/counselor/assessments',
            description: '상담코드 발급·목록·진행현황',
            icon: '📦',
          },
          {
            name: '상담코드 생성',
            href: '/counselor/assessments/new',
            description: '내담자별 나의코드 상담코드 발급',
            icon: '➕',
          },
          {
            name: '검사 크레딧',
            href: '/counselor/credits',
            description: '보유 크레딧·사용 내역 (협회 지급)',
            icon: '💳',
          },
          {
            name: '삭제된 상담코드',
            href: '/counselor/assessments/deleted',
            description: '삭제된 상담코드 복구·영구 삭제',
            icon: '🗑️',
          },
        ],
      },
      {
        name: '1b. 내담자 관리',
        icon: '👥',
        items: [
          {
            name: '내담자 목록',
            href: '/counselor/clients',
            description: '발급 내담자 조회·검사·상담코드 연결 추적',
            icon: '👥',
          },
          {
            name: '검사 할당',
            href: '/counselor/assign-tests',
            description: '내담자별 검사 항목 진행·추가 발송',
            icon: '📋',
          },
          {
            name: '검사 결과 분석',
            href: '/counselor/test-results',
            description: '내담자 검사 결과·리포트·AI 해석',
            icon: '📊',
          },
          {
            name: '검사 추천',
            href: '/counselor/test-recommendations',
            description: '결과 기반 맞춤 검사 추천·할당',
            icon: '🎯',
          },
          {
            name: '삭제된 검사자',
            href: '/counselor/assessments/deleted-recipients',
            description: '상담코드별 삭제된 검사자 복구·영구 삭제',
            icon: '🗑️',
          },
        ],
      },
      {
        name: '1c. 상담 운영',
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
    slug: 'tools',
    category: '2. 상담 도구',
    description: '채팅·노트·치료 계획·모니터링',
    icon: '💬',
    subcategories: [
      {
        name: '2a. 소통',
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
        name: '2b. 치료 관리',
        icon: '📈',
        items: [
          {
            name: '치료 계획',
            href: '/counselor/treatment-plans',
            description: '치료 계획 수립',
            icon: '📋',
          },
        ],
      },
    ],
  },
  {
    slug: 'data',
    category: '3. 데이터 관리',
    description: '데이터 공유·일상 기록 관리',
    icon: '🤝',
    subcategories: [
      {
        name: '3a. 공유·기록',
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
  {
    slug: 'sales',
    category: '4. 영업 · 파트너',
    description: '내담자 유입·요금·크레딧 영업 도구',
    icon: '📣',
    subcategories: [
      {
        name: '4a. Discover · D2C',
        icon: '✨',
        items: [
          {
            name: '3분 마음 체크',
            href: '/discover/mini-check/',
            description: '무료 미니 검사 — SNS·내담자 공유',
            icon: '⏱️',
          },
          {
            name: 'Discover 안내',
            href: '/discover/',
            description: 'D2C 랜딩·바이럴 운영 가이드',
            icon: '🌐',
          },
          {
            name: '개인 리포트 · 이용권',
            href: '/discover/shop/',
            description: 'Basic / Premium / Pro 안내·구매',
            icon: '🎫',
          },
        ],
      },
      {
        name: '4b. 요금 · 크레딧',
        icon: '💳',
        items: [
          {
            name: '크레딧 · AI',
            href: '/counselor/credits',
            description: '검사·AI 크레딧 구매·잔액',
            icon: '🤖',
          },
          {
            name: '파트너 프로그램',
            href: '/partners/',
            description: '기관·B2B 요금·파일럿 안내',
            icon: '🏢',
          },
        ],
      },
    ],
  },
];

export function getCounselorCategoryHubHref(slug: string): string {
  // trailingSlash: true (static export / Firebase Hosting)
  return `/counselor/hub/${slug}/`;
}

export const COUNSELOR_MAIN_HREF = '/counselor';

export const COUNSELOR_SALES_HUB_SLUG = 'sales';
export const COUNSELOR_SALES_HUB_HREF = getCounselorCategoryHubHref(COUNSELOR_SALES_HUB_SLUG);

export function getCounselorCategoryBySlug(slug: string): CounselorMainCategory | undefined {
  return counselorMenuCategories.find((category) => category.slug === slug);
}

export function countCounselorCategoryActions(category: CounselorMainCategory): number {
  return category.subcategories.reduce((sum, sub) => sum + sub.items.length, 0);
}
