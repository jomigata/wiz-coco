export type HierarchyCrumb = {
  label: string;
  href?: string;
  /** true이면 router.back()으로 이전 화면 이동 */
  navigateBack?: boolean;
};

export type HierarchyNav = {
  depth: number;
  crumbs: HierarchyCrumb[];
};

function assessmentProgressHref(assessmentId: string): string {
  return `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`;
}

export function resolveCounselorHierarchy(
  pathname: string,
  searchParams: URLSearchParams,
): HierarchyNav | null {
  const assessmentId = (searchParams.get('assessmentId') || '').trim();

  if (pathname.startsWith('/counselor/assessments/deleted-recipients')) {
    const isFullList = !assessmentId;
    return {
      depth: 2,
      crumbs: [
        { label: '검사코드 목록', href: '/counselor/assessments' },
        {
          label: '발송·검사 현황',
          href: assessmentId ? assessmentProgressHref(assessmentId) : undefined,
          navigateBack: isFullList ? true : undefined,
        },
        { label: isFullList ? '전체 삭제된 검사자' : '삭제된 검사자' },
      ],
    };
  }

  if (pathname.startsWith('/counselor/assessments/deleted')) {
    return {
      depth: 1,
      crumbs: [
        { label: '검사코드 목록', href: '/counselor/assessments' },
        { label: '삭제된 검사코드' },
      ],
    };
  }

  if (pathname.startsWith('/counselor/assessments/progress')) {
    return {
      depth: 1,
      crumbs: [
        { label: '검사코드 목록', href: '/counselor/assessments' },
        { label: '발송·검사 현황' },
      ],
    };
  }

  if (pathname.startsWith('/counselor/assessments/new')) {
    return {
      depth: 1,
      crumbs: [
        { label: '검사코드 목록', href: '/counselor/assessments' },
        { label: '새 검사코드 만들기' },
      ],
    };
  }

  if (pathname.startsWith('/counselor/assessments/edit')) {
    return {
      depth: 1,
      crumbs: [
        { label: '검사코드 목록', href: '/counselor/assessments' },
        { label: '검사코드 수정' },
      ],
    };
  }

  if (pathname === '/counselor/assessments') {
    return {
      depth: 0,
      crumbs: [{ label: '검사코드 목록' }],
    };
  }

  if (pathname.startsWith('/counselor/clients/detail') || pathname.startsWith('/counselor/clients/')) {
    if (pathname !== '/counselor/clients') {
      return {
        depth: 1,
        crumbs: [
          { label: '내담자 목록', href: '/counselor/clients' },
          { label: '내담자 상세' },
        ],
      };
    }
    return {
      depth: 0,
      crumbs: [{ label: '내담자 목록' }],
    };
  }

  if (pathname.startsWith('/counselor/assign-tests')) {
    return {
      depth: 1,
      crumbs: [
        { label: '내담자 목록', href: '/counselor/clients' },
        { label: '검사 할당' },
      ],
    };
  }

  return null;
}

export function resolvePortalHierarchy(pathname: string): HierarchyNav | null {
  if (pathname.startsWith('/portal/guide/inquiry')) {
    return {
      depth: 1,
      crumbs: [
        { label: '홈', href: '/' },
        { label: '검사 시작 안내', href: '/portal/guide' },
        { label: '개인 구매 문의' },
      ],
    };
  }

  if (pathname.startsWith('/portal/guide')) {
    return {
      depth: 0,
      crumbs: [
        { label: '홈', href: '/' },
        { label: '검사 시작 안내' },
      ],
    };
  }

  return null;
}
