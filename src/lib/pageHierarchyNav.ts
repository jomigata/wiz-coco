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
    return null;
  }

  if (pathname.startsWith('/counselor/assessments/deleted')) {
    return null;
  }

  if (pathname.startsWith('/counselor/assessments/progress')) {
    const portalId = (searchParams.get('portalId') || '').trim();
    const fromClients = (searchParams.get('from') || '').trim() === 'clients' || Boolean(portalId);
    if (fromClients) {
      return {
        depth: 1,
        crumbs: [
          { label: '내담자 목록', href: '/counselor/clients' },
          { label: '상담진행 현황' },
        ],
      };
    }
    return {
      depth: 1,
      crumbs: [
        { label: '상담코드 목록', href: '/counselor/assessments' },
        { label: '상담진행 현황' },
      ],
    };
  }

  if (pathname.startsWith('/counselor/assessments/new')) {
    return {
      depth: 1,
      crumbs: [
        { label: '상담코드 목록', href: '/counselor/assessments' },
        { label: '상담코드 생성' },
      ],
    };
  }

  if (pathname.startsWith('/counselor/assessments/edit')) {
    return {
      depth: 1,
      crumbs: [
        { label: '상담코드 목록', href: '/counselor/assessments' },
        { label: '상담코드 수정' },
      ],
    };
  }

  if (pathname === '/counselor/assessments') {
    return {
      depth: 0,
      crumbs: [{ label: '상담코드 목록' }],
    };
  }

  if (pathname === '/counselor/clients' || pathname.startsWith('/counselor/clients/')) {
    return null;
  }

  if (pathname.startsWith('/counselor/assign-tests')) {
    return {
      depth: 0,
      crumbs: [{ label: '검사 할당' }],
    };
  }

  if (pathname.startsWith('/counselor/test-results')) {
    const portalId = (searchParams.get('portalId') || '').trim();
    if (portalId) {
      return {
        depth: 1,
        crumbs: [
          { label: '내담자 목록', href: '/counselor/clients' },
          { label: '검사 결과 분석' },
        ],
      };
    }
    return {
      depth: 0,
      crumbs: [{ label: '검사 결과 분석' }],
    };
  }

  if (pathname.startsWith('/counselor/test-recommendations')) {
    const portalId = (searchParams.get('portalId') || '').trim();
    if (portalId) {
      return {
        depth: 1,
        crumbs: [
          { label: '내담자 목록', href: '/counselor/clients' },
          { label: '검사 추천' },
        ],
      };
    }
    return {
      depth: 0,
      crumbs: [{ label: '검사 추천' }],
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
