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

import { markCounselorListSkipReload } from '@/lib/counselorListNavigationCache';

/** 상담코드·검사발송 현황 메뉴 선택 시 항상 표시되는 고정 소분류 */
export type CounselorParentSubmenuItem = AssessmentListNestedNavItem;

const ASSESSMENTS_NEW_HREF = '/counselor/assessments/new';

const ASSESSMENT_CONTEXT_KEY = 'counselorAssessmentContextId';
const PROGRESS_FROM_KEY = 'counselorProgressFrom';
const ASSESSMENT_LIST_HREF = '/counselor/assessments';
const CLIENTS_LIST_HREF = '/counselor/clients';
export const DELETED_ASSESSMENTS_HREF = '/counselor/assessments/deleted';
export const DELETED_RECIPIENTS_HREF = '/counselor/assessments/deleted-recipients';
export const PERMANENTLY_DELETED_ASSESSMENTS_HREF = '/counselor/assessments/permanently-deleted';
export const PERMANENTLY_DELETED_RECIPIENTS_HREF =
  '/counselor/assessments/permanently-deleted-recipients';
const PARENT_SUBCATEGORY = '검사발송';
const ASSESSMENTS_PARENT_SUBCATEGORY = '상담코드';

export const counselorNestedNavItems: CounselorNestedNavItem[] = [];

export function normalizeCounselorPath(pathname: string): string {
  return (pathname || '').split('?')[0].replace(/\/+$/, '') || '';
}

/** 삭제된 상담코드 목록(내담자 삭제·영구삭제 경로 제외) */
export function isDeletedAssessmentsPath(pathname: string): boolean {
  const path = normalizeCounselorPath(pathname);
  if (path.startsWith(DELETED_RECIPIENTS_HREF)) return false;
  if (path.startsWith(PERMANENTLY_DELETED_ASSESSMENTS_HREF)) return false;
  if (path.startsWith(PERMANENTLY_DELETED_RECIPIENTS_HREF)) return false;
  return path === DELETED_ASSESSMENTS_HREF || path.startsWith(`${DELETED_ASSESSMENTS_HREF}/`);
}

/** 삭제된 내담자 목록(영구삭제 내담자 제외) */
export function isDeletedRecipientsPath(pathname: string): boolean {
  const path = normalizeCounselorPath(pathname);
  if (path.startsWith(PERMANENTLY_DELETED_RECIPIENTS_HREF)) return false;
  return path.startsWith(DELETED_RECIPIENTS_HREF);
}

function normalizeHref(href: string): string {
  return href.replace(/\/+$/, '');
}

export function rememberCounselorProgressFrom(source: 'clients' | 'assessments' | 'deleted-recipients') {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PROGRESS_FROM_KEY, source);
    if (source === 'clients' || source === 'assessments') {
      markCounselorListSkipReload(source);
    }
  } catch {
    // ignore
  }
}

export function resolveCounselorProgressFrom(
  pathname: string,
  search: string,
): 'clients' | 'assessments' | 'deleted-recipients' {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const fromQuery = (params.get('from') || '').trim();
  if (fromQuery === 'clients') return 'clients';
  if (fromQuery === 'deleted-recipients') return 'deleted-recipients';
  if (fromQuery === 'assessments') return 'assessments';
  if (typeof window !== 'undefined') {
    try {
      const stored = (sessionStorage.getItem(PROGRESS_FROM_KEY) || '').trim();
      if (stored === 'clients' || stored === 'assessments' || stored === 'deleted-recipients') {
        return stored;
      }
    } catch {
      // ignore
    }
  }
  return 'assessments';
}

function buildProgressHref(assessmentId: string | null, search: string): string {
  const params = new URLSearchParams();
  if (assessmentId) params.set('assessmentId', assessmentId);
  const from = resolveCounselorProgressFrom('', search);
  params.set('from', from);
  const qs = params.toString();
  return qs ? `/counselor/assessments/progress?${qs}` : ASSESSMENT_LIST_HREF;
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

/** 해당 화면이 직접 열렸을 때만 — 상담진행 현황 / 상담코드 수정 */
export function getAssessmentListContextNestedItems(
  pathname: string,
  search: string,
  options?: { admin?: boolean },
): AssessmentListNestedNavItem[] {
  const path = normalizeCounselorPath(pathname);
  const assessmentId = resolveAssessmentContextId(pathname, search);
  const progressFrom = resolveCounselorProgressFrom(pathname, search);
  const items: AssessmentListNestedNavItem[] = [];

  if (!options?.admin && isDeletedAssessmentsPath(path)) {
    items.push({
      order: 10,
      label: '삭제된 상담코드',
      href: DELETED_ASSESSMENTS_HREF,
      isActive: isDeletedAssessmentsPath,
    });
  }

  if (path.startsWith('/counselor/assessments/edit')) {
    items.push({
      order: 51,
      label: '상담코드 수정',
      href: assessmentId
        ? `/counselor/assessments/edit?id=${encodeURIComponent(assessmentId)}`
        : ASSESSMENT_LIST_HREF,
      isActive: (p) => p.startsWith('/counselor/assessments/edit'),
    });
  }

  return items;
}

/** 내담자 메뉴 — 삭제된 내담자 화면 하위 메뉴 */
export function getClientsListContextNestedItems(
  pathname: string,
  search: string,
  options?: { admin?: boolean },
): AssessmentListNestedNavItem[] {
  const path = normalizeCounselorPath(pathname);
  const items: AssessmentListNestedNavItem[] = [];

  if (!options?.admin && isDeletedRecipientsPath(path)) {
    items.push({
      order: 10,
      label: '삭제된 내담자',
      href: DELETED_RECIPIENTS_HREF,
      isActive: isDeletedRecipientsPath,
    });
  }

  if (path.startsWith('/counselor/assessments/progress') && resolveCounselorProgressFrom(pathname, search) === 'clients') {
    const assessmentId = resolveAssessmentContextId(pathname, search);
    items.push({
      order: 50,
      label: '검사발송 현황',
      href: buildProgressHref(assessmentId, search),
      isActive: (p) => p.startsWith('/counselor/assessments/progress'),
    });
  }

  return items;
}

/** 영구삭제 상담코드·내담자 (데이터 관리 > 복구 관리) */
export function isPermanentlyDeletedAdminPath(pathname: string): boolean {
  const path = normalizeCounselorPath(pathname);
  return (
    (path.startsWith(PERMANENTLY_DELETED_ASSESSMENTS_HREF) &&
      !path.startsWith(PERMANENTLY_DELETED_RECIPIENTS_HREF)) ||
    path.startsWith(PERMANENTLY_DELETED_RECIPIENTS_HREF)
  );
}

/** 내담자 메뉴가 활성(선택) 상태인지 */
export function isClientsMenuSelected(pathname: string, search: string): boolean {
  const path = normalizeCounselorPath(pathname);
  if (path === CLIENTS_LIST_HREF) return true;
  if (isDeletedRecipientsPath(path)) return true;
  if (isPermanentlyDeletedAdminPath(path)) return false;
  if (
    path.startsWith('/counselor/assessments/progress') &&
    resolveCounselorProgressFrom(pathname, search) === 'clients'
  ) {
    return true;
  }
  return false;
}

/** 상담코드 메뉴가 활성(선택) 상태인지 — 내담자 전용 화면은 제외 */
export function isAssessmentsMenuSelected(pathname: string, search: string): boolean {
  if (isClientsMenuSelected(pathname, search)) return false;
  const path = normalizeCounselorPath(pathname);
  if (isDeletedAssessmentsPath(path)) return true;
  if (isPermanentlyDeletedAdminPath(path)) return false;
  return path.startsWith('/counselor/assessments');
}

/** 상담코드 메뉴 선택 시 고정 소분류 */
export function getAssessmentsParentSubmenuItems(options?: {
  admin?: boolean;
  pathname?: string;
  search?: string;
}): CounselorParentSubmenuItem[] {
  const path = options?.pathname ? normalizeCounselorPath(options.pathname) : '';
  const assessmentId =
    options?.pathname != null
      ? resolveAssessmentContextId(options.pathname, options.search || '')
      : null;
  const progressFrom = options?.pathname
    ? resolveCounselorProgressFrom(options.pathname, options.search || '')
    : 'assessments';
  const progressHref = buildProgressHref(assessmentId, options?.search || '?from=assessments');

  const items: CounselorParentSubmenuItem[] = [];

  if (
    assessmentId &&
    progressFrom !== 'clients' &&
    path.startsWith('/counselor/assessments/progress')
  ) {
    items.push({
      order: 0,
      label: '상담진행 현황',
      href: progressHref,
      isActive: (p) => p.startsWith('/counselor/assessments/progress'),
    });
  }

  items.push({
    order: 1,
    label: '상담코드 생성',
    href: ASSESSMENTS_NEW_HREF,
    isActive: (p) => p.startsWith(ASSESSMENTS_NEW_HREF),
  });
  if (options?.admin) {
    items.push({
      order: 55,
      label: '삭제된 상담코드',
      href: DELETED_ASSESSMENTS_HREF,
      isActive: isDeletedAssessmentsPath,
    });
  }
  return items;
}

/** 검사발송 목록 메뉴 선택 시 고정 소분류 */
export function getClientsParentSubmenuItems(options?: { admin?: boolean }): CounselorParentSubmenuItem[] {
  const items: CounselorParentSubmenuItem[] = [];
  if (options?.admin) {
    items.push({
      order: 55,
      label: '삭제된 내담자',
      href: DELETED_RECIPIENTS_HREF,
      isActive: isDeletedRecipientsPath,
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
          parentSubcategoryName: ASSESSMENTS_PARENT_SUBCATEGORY,
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
  const clientsContextItems = getClientsListContextNestedItems(pathname, search);
  for (const nested of clientsContextItems) {
    if (nested.isActive(path)) {
      return {
        item: {
          parentSubcategoryName: PARENT_SUBCATEGORY,
          insertAfterHref: CLIENTS_LIST_HREF,
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
