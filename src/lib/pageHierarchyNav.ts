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
      return 'border-sky-400/30 bg-gradient-to-r from-sky-600/35 via-[#1a3a5c] to-[#12243d]';
    case 1:
      return 'border-indigo-400/35 bg-gradient-to-r from-indigo-600/40 via-[#1a2d4f] to-[#101a30]';
    case 2:
      return 'border-violet-400/40 bg-gradient-to-r from-violet-700/45 via-[#241a42] to-[#120f22]';
    default:
      return 'border-purple-400/45 bg-gradient-to-r from-purple-800/50 via-[#2a1538] to-[#0f0a16]';
  }
}

export function counselorSectionHeaderClass(depth: number): string {
  switch (depth) {
    case 0:
      return 'border-sky-400/30 bg-gradient-to-r from-sky-600/30 via-sky-500/20 to-sky-900/10';
    case 1:
      return 'border-indigo-400/35 bg-gradient-to-r from-indigo-600/35 via-indigo-500/20 to-indigo-950/15';
    case 2:
      return 'border-violet-400/40 bg-gradient-to-r from-violet-700/40 via-violet-500/20 to-violet-950/15';
    default:
      return 'border-purple-400/45 bg-gradient-to-r from-purple-800/45 via-purple-600/20 to-purple-950/15';
  }
}

export function counselorSectionBorderClass(depth: number): string {
  switch (depth) {
    case 0:
      return 'border-sky-400/25';
    case 1:
      return 'border-indigo-400/30';
    case 2:
      return 'border-violet-400/35';
    default:
      return 'border-purple-400/40';
  }
}

export function counselorBreadcrumbBarClass(depth: number): string {
  switch (depth) {
    case 0:
      return 'rounded-lg border border-sky-400/25 bg-sky-950/40 px-3 py-1.5';
    case 1:
      return 'rounded-lg border border-indigo-400/30 bg-indigo-950/45 px-3 py-1.5';
    case 2:
      return 'rounded-lg border border-violet-400/35 bg-violet-950/50 px-3 py-1.5';
    default:
      return 'rounded-lg border border-purple-400/40 bg-purple-950/55 px-3 py-1.5';
  }
}

export function counselorBreadcrumbLinkClass(depth: number): string {
  switch (depth) {
    case 0:
      return 'text-sky-200/90 hover:text-sky-100';
    case 1:
      return 'text-indigo-200/90 hover:text-indigo-100';
    case 2:
      return 'text-violet-200/90 hover:text-violet-100';
    default:
      return 'text-purple-200/90 hover:text-purple-100';
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
