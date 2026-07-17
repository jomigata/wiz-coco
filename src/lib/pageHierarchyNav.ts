export type HierarchyCrumb = {
  label: string;
  href?: string;
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
    if (assessmentId) {
      return {
        depth: 2,
        crumbs: [
          { label: '검사코드 목록', href: '/counselor/assessments' },
          { label: '발송·검사 현황', href: assessmentProgressHref(assessmentId) },
          { label: '삭제된 검사자' },
        ],
      };
    }
    return {
      depth: 1,
      crumbs: [
        { label: '검사코드 목록', href: '/counselor/assessments' },
        { label: '삭제된 검사자' },
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

export function counselorHeaderGradientClass(depth: number): string {
  switch (depth) {
    case 0:
      return 'border-sky-400/20 bg-gradient-to-r from-sky-600/20 via-[#162b4a] to-[#0f172a]';
    case 1:
      return 'border-indigo-400/25 bg-gradient-to-r from-indigo-600/25 via-[#141f38] to-[#0c1220]';
    case 2:
      return 'border-violet-400/25 bg-gradient-to-r from-violet-700/25 via-[#121a2e] to-[#0a0f1a]';
    default:
      return 'border-purple-400/30 bg-gradient-to-r from-purple-800/30 via-[#0f1525] to-[#080c14]';
  }
}

export function portalHeroGradientClass(depth: number): string {
  switch (depth) {
    case 0:
      return 'from-sky-950/40 via-[#0f1628] to-[#0f1628]';
    case 1:
      return 'from-indigo-950/50 via-[#0e1526] to-[#0d1322]';
    default:
      return 'from-violet-950/55 via-[#0c1220] to-[#0b101c]';
  }
}
