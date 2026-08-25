import {
  counselorMenuCategories,
  getCounselorCategoryBySlug,
  getCounselorCategoryHubHref,
  type CounselorMainCategory,
} from '@/data/counselorMenu';

export const COUNSELOR_PSYCH_TESTS_SLUG = 'psych-tests';
export const COUNSELOR_TOOLS_SLUG = 'tools';
export const COUNSELOR_DATA_SLUG = 'data';

/** 심리검사 관리(통합) 워크스페이스 — 좌측 트리 + 우측 화면 */
const PSYCH_TESTS_ROUTE_PREFIXES = [
  '/counselor/hub/psych-tests',
  '/counselor/assessments',
  '/counselor/credits',
  '/counselor/clients',
  '/counselor/assign-tests',
  '/counselor/test-results',
  '/counselor/test-recommendations',
  '/counselor/test-management',
  '/counselor/schedule',
  '/counselor/sessions',
] as const;

const TOOLS_ROUTE_PREFIXES = [
  '/counselor/hub/tools',
  '/counselor/chat',
  '/counselor/notes',
  '/counselor/treatment-plans',
  '/counselor/daily-records',
  '/counselor/resources',
] as const;

const DATA_ROUTE_PREFIXES = [
  '/counselor/hub/data',
  '/counselor/data-sharing',
  '/counselor/assessments/permanently-deleted',
  '/counselor/assessments/permanently-deleted-recipients',
] as const;

const SALES_HUB_PREFIX = '/counselor/hub/sales';

function normalizePath(pathname: string): string {
  const base = (pathname || '').split('?')[0].replace(/\/+$/, '') || '/counselor';
  return base;
}

function matchesPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isPsychTestsWorkspaceRoute(pathname: string): boolean {
  return matchesPrefix(normalizePath(pathname), PSYCH_TESTS_ROUTE_PREFIXES);
}

export function isToolsWorkspaceRoute(pathname: string): boolean {
  return matchesPrefix(normalizePath(pathname), TOOLS_ROUTE_PREFIXES);
}

export function isDataWorkspaceRoute(pathname: string): boolean {
  return matchesPrefix(normalizePath(pathname), DATA_ROUTE_PREFIXES);
}

export function isSalesHubRoute(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === SALES_HUB_PREFIX || path.startsWith(`${SALES_HUB_PREFIX}/`);
}

export function isCounselorManageShellRoute(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path.startsWith('/counselor/hub/')) return true;
  return (
    isPsychTestsWorkspaceRoute(pathname) ||
    isToolsWorkspaceRoute(pathname) ||
    isDataWorkspaceRoute(pathname)
  );
}

export function getPsychTestsCategory(): CounselorMainCategory | undefined {
  return getCounselorCategoryBySlug(COUNSELOR_PSYCH_TESTS_SLUG);
}

export function getPsychTestsDefaultHref(): string {
  const category = getPsychTestsCategory();
  const first = category?.subcategories[0]?.items[0]?.href;
  return first || '/counselor/assessments';
}

export function getPsychTestsHubHref(): string {
  return getCounselorCategoryHubHref(COUNSELOR_PSYCH_TESTS_SLUG);
}

export function getCounselorCategoryDefaultHref(slug: string): string {
  if (slug === COUNSELOR_PSYCH_TESTS_SLUG) {
    return getPsychTestsDefaultHref();
  }
  if (slug === COUNSELOR_TOOLS_SLUG) {
    return '/counselor/chat';
  }
  const category = getCounselorCategoryBySlug(slug);
  const first = category?.subcategories.flatMap((s) => s.items)[0]?.href;
  return first || getCounselorCategoryHubHref(slug);
}

/** 현재 경로가 속한 대분류 slug (없으면 null) */
export function resolveCounselorCategorySlugForPath(pathname: string): string | null {
  const path = normalizePath(pathname);
  if (
    path.startsWith('/counselor/assessments/permanently-deleted') ||
    path.startsWith('/counselor/assessments/permanently-deleted-recipients')
  ) {
    return COUNSELOR_DATA_SLUG;
  }
  for (const category of counselorMenuCategories) {
    for (const sub of category.subcategories) {
      for (const item of sub.items) {
        const href = item.href.replace(/\/+$/, '');
        if (path === href || path.startsWith(`${href}/`)) {
          return category.slug;
        }
      }
    }
  }
  if (
    path.startsWith('/counselor/assessments/progress') ||
    path.startsWith('/counselor/assessments/edit') ||
    path.startsWith('/counselor/clients/detail')
  ) {
    return COUNSELOR_PSYCH_TESTS_SLUG;
  }
  if (path.startsWith('/counselor/hub/')) {
    const slug = path.replace('/counselor/hub/', '').split('/')[0];
    return slug || null;
  }
  return null;
}

export function isMenuItemActive(pathname: string, href: string): boolean {
  const path = normalizePath(pathname);
  const target = href.replace(/\/+$/, '');
  if (path === target) return true;
  if (target === '/counselor/assessments') {
    return path === '/counselor/assessments';
  }
  if (target === '/counselor/clients') {
    return path === '/counselor/clients';
  }
  return path.startsWith(`${target}/`);
}
