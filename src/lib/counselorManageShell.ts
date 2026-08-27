import {
  counselorMenuCategories,
  getCounselorCategoryBySlug,
  getCounselorCategoryHubHref,
  type CounselorMainCategory,
} from '@/data/counselorMenu';
import { resolveCounselorProgressFrom } from '@/lib/counselorNestedNav';

export const COUNSELOR_PSYCH_TESTS_SLUG = 'psych-tests';
export const COUNSELOR_DISPATCH_MGMT_SLUG = 'dispatch-mgmt';
export const COUNSELOR_TOOLS_SLUG = 'tools';
export const COUNSELOR_DATA_SLUG = 'data';

/** 검사관리(검사발송 현황) 워크스페이스 */
const DISPATCH_MGMT_ROUTE_PREFIXES = [
  '/counselor/clients',
  '/counselor/assessments/deleted-recipients',
] as const;

/** 심리검사 관리(통합) 워크스페이스 — 좌측 트리 + 우측 화면 */
const PSYCH_TESTS_ROUTE_PREFIXES = [
  '/counselor/hub/psych-tests',
  '/counselor/assessments',
  '/counselor/credits',
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

const SALES_ROUTE_PREFIXES = [
  '/discover',
  '/partners',
] as const;

const SALES_HUB_PREFIX = '/counselor/hub/sales';

function normalizePath(pathname: string): string {
  const base = (pathname || '').split('?')[0].replace(/\/+$/, '') || '/counselor';
  return base;
}

function matchesPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isDispatchMgmtWorkspaceRoute(pathname: string, search = ''): boolean {
  const path = normalizePath(pathname);
  if (
    path.startsWith('/counselor/assessments/progress') &&
    resolveCounselorProgressFrom(pathname, search) === 'clients'
  ) {
    return true;
  }
  return matchesPrefix(path, DISPATCH_MGMT_ROUTE_PREFIXES);
}

export function isPsychTestsWorkspaceRoute(pathname: string, search = ''): boolean {
  const path = normalizePath(pathname);
  if (
    path.startsWith('/counselor/assessments/progress') &&
    resolveCounselorProgressFrom(pathname, search) === 'clients'
  ) {
    return false;
  }
  return matchesPrefix(path, PSYCH_TESTS_ROUTE_PREFIXES);
}

export function isToolsWorkspaceRoute(pathname: string): boolean {
  return matchesPrefix(normalizePath(pathname), TOOLS_ROUTE_PREFIXES);
}

export function isDataWorkspaceRoute(pathname: string): boolean {
  return matchesPrefix(normalizePath(pathname), DATA_ROUTE_PREFIXES);
}

export function isSalesWorkspaceRoute(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path === SALES_HUB_PREFIX || path.startsWith(`${SALES_HUB_PREFIX}/`)) {
    return true;
  }
  return SALES_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isSalesHubRoute(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === SALES_HUB_PREFIX || path.startsWith(`${SALES_HUB_PREFIX}/`);
}

export function isCounselorManageShellRoute(pathname: string, search = ''): boolean {
  const path = normalizePath(pathname);
  if (path.startsWith('/counselor/hub/')) return true;
  return (
    isDispatchMgmtWorkspaceRoute(pathname, search) ||
    isPsychTestsWorkspaceRoute(pathname, search) ||
    isToolsWorkspaceRoute(pathname) ||
    isDataWorkspaceRoute(pathname) ||
    isSalesWorkspaceRoute(pathname)
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
  if (slug === COUNSELOR_DISPATCH_MGMT_SLUG) {
    return '/counselor/clients';
  }
  if (slug === COUNSELOR_PSYCH_TESTS_SLUG) {
    return getPsychTestsDefaultHref();
  }
  if (slug === COUNSELOR_TOOLS_SLUG) {
    return '/counselor/chat';
  }
  if (slug === 'sales') {
    return '/discover/mini-check/';
  }
  const category = getCounselorCategoryBySlug(slug);
  const first = category?.subcategories.flatMap((s) => s.items)[0]?.href;
  return first || getCounselorCategoryHubHref(slug);
}

/** 현재 경로가 속한 대분류 slug (없으면 null) */
export function resolveCounselorCategorySlugForPath(pathname: string, search = ''): string | null {
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
  if (path.startsWith('/discover') || path.startsWith('/partners')) {
    return 'sales';
  }
  if (path.startsWith('/counselor/clients/detail')) {
    return COUNSELOR_DISPATCH_MGMT_SLUG;
  }
  if (path.startsWith('/counselor/assessments/progress')) {
    return resolveCounselorProgressFrom(pathname, search) === 'clients'
      ? COUNSELOR_DISPATCH_MGMT_SLUG
      : COUNSELOR_PSYCH_TESTS_SLUG;
  }
  if (path.startsWith('/counselor/assessments/edit')) {
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
