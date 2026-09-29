import { ADMIN_MAIN_HREF } from '@/data/adminMenu';
import {
  COUNSELOR_ASSESSMENT_CODE_SLUG,
  COUNSELOR_DISPATCH_MGMT_SLUG,
  COUNSELOR_MAIN_HREF,
  getCounselorCategoryEntryHref,
} from '@/data/counselorMenu';
import { shouldShowAdminMenu, shouldShowCounselorMenu } from '@/utils/roleUtils';

export type MypageNavItem = {
  name: string;
  href: string;
  description: string;
  icon: string;
  badge?: number;
};

export type MypageNavSection = {
  id: string;
  title: string;
  items: MypageNavItem[];
};

export type MypageNavVariant = 'sidebar' | 'topNav';

/** 상단 마이페이지 드롭다운에서 숨길 계정 하위 메뉴 (좌측 사이드바에는 유지) */
export const MYPAGE_TOP_NAV_HIDDEN_ACCOUNT_HREFS = [
  '/mypage/account/organization',
  '/mypage/account/counselor-profile',
  '/mypage/account/report',
] as const;

export function buildMypageNavSections(
  role: unknown,
  options?: { settingsBadge?: number; variant?: MypageNavVariant },
): MypageNavSection[] {
  const sections: MypageNavSection[] = [
    {
      id: 'account',
      title: '계정',
      items: [
        {
          name: '개인 정보',
          href: '/mypage/account/info',
          description: '로그인·개인 기본 정보',
          icon: '👤',
          badge: options?.settingsBadge,
        },
        {
          name: '상담사 계정',
          href: '/mypage/account/counselor',
          description: '승인·등록·경력·연락처',
          icon: '👨‍⚕️',
        },
        {
          name: '회사/기관 정보',
          href: '/mypage/account/organization',
          description: '기관명·사업자·연락처·주소',
          icon: '🏢',
        },
        {
          name: '상담사 프로필',
          href: '/mypage/account/counselor-profile',
          description: '전문 분야·소개',
          icon: '📇',
        },
        {
          name: '내담자용 정보',
          href: '/mypage/account/report',
          description: '결과지 표지·표기·전달',
          icon: '📋',
        },
      ],
    },
  ];

  if (shouldShowCounselorMenu(role)) {
    sections.push({
      id: 'counselor',
      title: '상담사',
      items: [
        {
          name: '상담관리 홈',
          href: COUNSELOR_MAIN_HREF,
          description: '상담 운영 대시보드',
          icon: '👨‍⚕️',
        },
        {
          name: '내담자 목록',
          href: getCounselorCategoryEntryHref(COUNSELOR_DISPATCH_MGMT_SLUG),
          description: '발송·진행 현황',
          icon: '📤',
        },
        {
          name: '상담코드 목록',
          href: getCounselorCategoryEntryHref(COUNSELOR_ASSESSMENT_CODE_SLUG),
          description: '코드 발급·관리',
          icon: '📦',
        },
      ],
    });
  }

  if (shouldShowAdminMenu(role)) {
    sections.push({
      id: 'admin',
      title: '관리자',
      items: [
        {
          name: '관리자 홈',
          href: ADMIN_MAIN_HREF,
          description: '운영·모니터링 허브',
          icon: '🔧',
        },
        {
          name: '시스템 대시보드',
          href: '/admin/system-dashboard',
          description: '전체 현황',
          icon: '📊',
        },
        {
          name: '상담 관리',
          href: '/admin/counseling-management',
          description: '상담 일정·기록',
          icon: '💬',
        },
      ],
    });
  }

  if (options?.variant === 'topNav') {
    return sections.map((section) =>
      section.id === 'account'
        ? {
            ...section,
            items: section.items.filter(
              (item) =>
                !MYPAGE_TOP_NAV_HIDDEN_ACCOUNT_HREFS.includes(
                  item.href as (typeof MYPAGE_TOP_NAV_HIDDEN_ACCOUNT_HREFS)[number],
                ),
            ),
          }
        : section,
    );
  }

  return sections;
}
