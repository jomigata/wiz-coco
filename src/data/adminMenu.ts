import type { TestCategory } from '@/data/psychologyTestMenu';

/** 관리자 메뉴 — AI 심리검사와 동일한 3단계 구조 */
export const adminMenuCategories: TestCategory[] = [
  {
    category: '1. 대시보드 & 모니터링',
    icon: '📊',
    subcategories: [
      {
        name: '1a. 현황',
        icon: '📊',
        items: [
          {
            name: '시스템 대시보드',
            href: '/admin/system-dashboard',
            description: '전체 현황 한눈에 보기',
            icon: '📊',
          },
          {
            name: '실시간 모니터링',
            href: '/admin/realtime-monitoring',
            description: '활성 사용자, 상담 진행 상황',
            icon: '⚡',
          },
        ],
      },
      {
        name: '1b. 알림',
        icon: '🔔',
        items: [
          {
            name: '알림 관리',
            href: '/admin/notification-management',
            description: '중요 알림 및 이벤트 관리',
            icon: '🔔',
          },
        ],
      },
    ],
  },
  {
    category: '2. 사용자 & 상담 관리',
    icon: '👥',
    subcategories: [
      {
        name: '2a. 사용자',
        icon: '👥',
        items: [
          {
            name: '사용자 관리',
            href: '/admin/user-management',
            description: '상담사/내담자 통합 관리',
            icon: '👥',
          },
          {
            name: '상담사 관리',
            href: '/admin/counselor-management',
            description: '상담사 인증, 자격 검증, 프로필 관리',
            icon: '👨‍⚕️',
          },
        ],
      },
      {
        name: '2b. 상담·검사',
        icon: '🧠',
        items: [
          {
            name: '상담사 인증 승인',
            href: '/admin/counselor-verification',
            description: '상담사 전환·지원 신청 검토',
            icon: '✅',
          },
          {
            name: '상담 관리',
            href: '/admin/counseling-management',
            description: '상담 일정, 진행 상황, 결과 관리',
            icon: '💭',
          },
          {
            name: '심리검사 관리',
            href: '/admin/psychological-tests',
            description: '검사 생성, 배포, 결과 분석',
            icon: '🧠',
          },
          {
            name: '크레딧 · 수익화',
            href: '/admin/commerce',
            description: '상담사 파일럿 크레딧 지급·조회',
            icon: '💰',
          },
          {
            name: 'B2B 기관 관리',
            href: '/admin/organizations',
            description: '학교·기업 POC · org_admin · 선결제',
            icon: '🏫',
          },
        ],
      },
      {
        name: '2c. 콘텐츠',
        icon: '📚',
        items: [
          {
            name: '콘텐츠 관리',
            href: '/admin/content-management',
            description: '상담 프로그램, 공지사항, 자료 관리',
            icon: '📚',
          },
        ],
      },
    ],
  },
  {
    category: '3. 시스템 & 보안 관리',
    icon: '⚙️',
    subcategories: [
      {
        name: '3a. 시스템',
        icon: '⚙️',
        items: [
          {
            name: '시스템 설정',
            href: '/admin/system-settings',
            description: '기본 설정, 권한 관리',
            icon: '⚙️',
          },
          {
            name: '데이터 관리',
            href: '/admin/data-management',
            description: '백업, 복원, 데이터 분석',
            icon: '💾',
          },
        ],
      },
      {
        name: '3b. 보안',
        icon: '🔐',
        items: [
          {
            name: '보안 관리',
            href: '/admin/security-management',
            description: '보안 설정, 로그 관리, 접근 제어',
            icon: '🔐',
          },
        ],
      },
    ],
  },
];

export const ADMIN_MAIN_HREF = '/admin';
export const ADMIN_COUNSELOR_VERIFICATION_HREF = '/admin/counselor-verification';

/** 대기 중인 상담사 신청 수를 메뉴 배지로 반영 */
export function withAdminMenuBadges(categories: TestCategory[], pendingCounselorCount: number): TestCategory[] {
  if (pendingCounselorCount <= 0) return categories;

  const badge =
    pendingCounselorCount > 99 ? '99+' : String(pendingCounselorCount);

  return categories.map((category) => ({
    ...category,
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      items: subcategory.items.map((item) =>
        item.href === ADMIN_COUNSELOR_VERIFICATION_HREF
          ? { ...item, badge }
          : item
      ),
    })),
  }));
}
