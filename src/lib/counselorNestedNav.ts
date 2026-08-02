/** 중분류 하위 — 상담코드 목록 소분류 및 이동형 메뉴 */

export type CounselorNestedNavItem = {
  /** counselorMenu subcategories[].name 과 일치 */
  parentSubcategoryName: string;
  /** 이 href 메뉴 바로 아래에 소분류 표시 */
  insertAfterHref: string;
  order: number;
  label: string;
  match: (path: string) => boolean;
  buildHref: (path: string, search: string) => string;
};

export type AssessmentListNestedNavItem = {
  label: string;
  order: number;
  href: string;
  isActive: (path: string) => boolean;
};

const ASSESSMENT_CONTEXT_KEY = 'counselorAssessmentContextId';
const ASSESSMENT_LIST_HREF = '/counselor/assessments';
export const DELETED_ASSESSMENTS_HREF = '/counselor/assessments/deleted';

export const counselorNestedNavItems: CounselorNestedNavItem[] = [
  {
    parentSubcategoryName: '1b. 내담자 관리',
    insertAfterHref: '/counselor/clients',
    order: 1,
    label: '내담자 상세',
    match: (path) => path.startsWith('/counselor/clients/detail'),
    buildHref: (path, search) => `${path}${search}`,
  },
];

export function normalizeCounselorPath(pathname: string): string {
  return (pathname || '').split('?')[0].replace(/\/+$/, '') || '';
}

function normalizeHref(href: string): string {
  return href.replace(/\/+$/, '');
}

export function rememberCounselorAssessmentContext(assessmentId: string) {
  const id = (assessmentId || '').trim();
  if (!id || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ASSESSMENT_CONTEXT_KEY, id);
  } catch {
    // ignore
  }
}

export function resolveAssessmentContextId(pathname: string, search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const fromProgress = (params.get('assessmentId') || '').trim();
  if (fromProgress) return fromProgress;
  const path = normalizeCounselorPath(pathname);
  if (path.startsWith('/counselor/assessments/edit')) {
    const fromEdit = (params.get('id') || '').trim();
    if (fromEdit) return fromEdit;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = (sessionStorage.getItem(ASSESSMENT_CONTEXT_KEY) || '').trim();
      if (stored) return stored;
    } catch {
      // ignore
    }
  }
  return null;
}

/** 해당 화면이 직접 열렸을 때만 — 발송·검사 현황 / 상담코드 수정 */
export function getAssessmentListContextNestedItems(
  pathname: string,
  search: string,
): AssessmentListNestedNavItem[] {
  const path = normalizeCounselorPath(pathname);
  const assessmentId = resolveAssessmentContextId(pathname, search);
  const items: AssessmentListNestedNavItem[] = [];

  if (path.startsWith('/counselor/assessments/progress')) {
    items.push({
      order: 1,
      label: '발송·검사 현황',
      href: assessmentId
        ? `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`
        : ASSESSMENT_LIST_HREF,
      isActive: (p) => p.startsWith('/counselor/assessments/progress'),
    });
  }

  if (path.startsWith('/counselor/assessments/edit')) {
    items.push({
      order: 2,
      label: '상담코드 수정',
      href: assessmentId
        ? `/counselor/assessments/edit?id=${encodeURIComponent(assessmentId)}`
        : ASSESSMENT_LIST_HREF,
      isActive: (p) => p.startsWith('/counselor/assessments/edit'),
    });
  }

  return items;
}

export function resolveActiveNestedNavItem(
  pathname: string,
  search: string,
): { item: CounselorNestedNavItem; href: string } | null {
  const path = normalizeCounselorPath(pathname);
  for (const item of counselorNestedNavItems) {
    if (item.match(path)) {
      return { item, href: item.buildHref(path, search) };
    }
  }
  const contextItems = getAssessmentListContextNestedItems(pathname, search);
  for (const nested of contextItems) {
    if (nested.isActive(path)) {
      return {
        item: {
          parentSubcategoryName: '1a. 상담코드',
          insertAfterHref: ASSESSMENT_LIST_HREF,
          order: nested.order,
          label: nested.label,
          match: nested.isActive,
          buildHref: () => nested.href,
        },
        href: nested.href,
      };
    }
  }
  return null;
}

/** 특정 중분류 메뉴 항목 바로 아래에 표시할 소분류(현재 경로와 일치할 때만) */
export function nestedNavItemsAfter(
  parentSubcategoryName: string,
  afterHref: string,
  pathname: string,
): CounselorNestedNavItem[] {
  const path = normalizeCounselorPath(pathname);
  const anchor = normalizeHref(afterHref);
  return counselorNestedNavItems
    .filter(
      (item) =>
        item.parentSubcategoryName === parentSubcategoryName &&
        normalizeHref(item.insertAfterHref) === anchor &&
        item.match(path),
    )
    .sort((a, b) => a.order - b.order);
}
