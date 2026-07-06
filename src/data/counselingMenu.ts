import type { TestCategory } from '@/data/psychologyTestMenu';

/** 상담 프로그램 — AI 심리검사 메뉴와 동일한 3단계 구조 */
export const counselingMenuCategories: TestCategory[] = [
  {
    category: '1. 개인 상담',
    icon: '👤',
    subcategories: [
      {
        name: '1a. 심리 상담',
        icon: '💭',
        items: [
          {
            name: '1:1 심리 상담',
            href: '/counseling/psychology',
            description: '전문 심리상담사와 1:1 상담',
            icon: '💭',
            badge: '24시간',
          },
        ],
      },
      {
        name: '1b. 성장 코칭',
        icon: '🌱',
        items: [
          {
            name: '성장 코칭 프로그램',
            href: '/counseling/growth',
            description: '개인 성장을 위한 코칭',
            icon: '🌱',
          },
        ],
      },
      {
        name: '1c. 관계 상담',
        icon: '💔',
        items: [
          {
            name: '관계 상담',
            href: '/counseling/relationship',
            description: '인간관계 문제 해결',
            icon: '💔',
          },
        ],
      },
    ],
  },
  {
    category: '2. 그룹 상담',
    icon: '👥',
    subcategories: [
      {
        name: '2a. 가족 상담',
        icon: '👨‍👩‍👧‍👦',
        items: [
          {
            name: '가족 상담',
            href: '/counseling/family',
            description: '가족 관계 개선 상담',
            icon: '👨‍👩‍👧‍👦',
          },
        ],
      },
      {
        name: '2b. 커플 상담',
        icon: '💑',
        items: [
          {
            name: '커플 상담',
            href: '/counseling/couple',
            description: '연인/부부 관계 상담',
            icon: '💑',
          },
        ],
      },
      {
        name: '2c. 직장 상담',
        icon: '🏢',
        items: [
          {
            name: '직장 상담',
            href: '/counseling/workplace',
            description: '직장 내 스트레스 관리',
            icon: '🏢',
          },
        ],
      },
    ],
  },
];

export const COUNSELING_MAIN_HREF = '/counseling';
export const COUNSELING_PROGRAM_CATEGORY = '상담 프로그램';

/** 나만의 공간 안 상담 프로그램 — 개인/그룹 상담을 중분류로, 기존 중분류는 호버 leaf(소분류 제거) */
export function buildCounselingProgramCategory(): TestCategory {
  return {
    category: COUNSELING_PROGRAM_CATEGORY,
    icon: '💬',
    subcategories: counselingMenuCategories.map((category) => ({
      name: category.category,
      icon: category.icon,
      items: category.subcategories.map((sub) => {
        const leaf = sub.items[0];
        return {
          name: sub.name,
          href: leaf?.href ?? COUNSELING_MAIN_HREF,
          description: leaf?.description ?? sub.name,
          icon: sub.icon,
          badge: leaf?.badge,
        };
      }),
    })),
  };
}
