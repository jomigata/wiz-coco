import {
  counselorMenuCategories,
  COUNSELOR_ASSESSMENT_CODE_SLUG,
  COUNSELOR_COUNSEL_OPS_SLUG,
  COUNSELOR_DISPATCH_MGMT_SLUG,
  COUNSELOR_PSYCH_TESTS_MENU_SLUG,
  COUNSELOR_TEST_MGMT_SLUG,
  getCounselorCategoryBySlug,
  getCounselorCategoryHubHref,
  type CounselorMainCategory,
} from '@/data/counselorMenu';
import { resolveCounselorProgressFrom } from '@/lib/counselorNestedNav';

/** @deprecated use COUNSELOR_ASSESSMENT_CODE_SLUG */
export const COUNSELOR_PSYCH_TESTS_SLUG = COUNSELOR_PSYCH_TESTS_MENU_SLUG;
export { COUNSELOR_DISPATCH_MGMT_SLUG, COUNSELOR_ASSESSMENT_CODE_SLUG, COUNSELOR_TEST_MGMT_SLUG, COUNSELOR_COUNSEL_OPS_SLUG, COUNSELOR_PSYCH_TESTS_MENU_SLUG };
export const COUNSELOR_TOOLS_SLUG = 'tools';
export const COUNSELOR_DATA_SLUG = 'data';

const ASSESSMENT_CODE_ROUTE_PREFIXES = [
  '/counselor/hub/assessment-code',
  '/counselor/hub/psych-tests',
  '/counselor/assessments',
] as const;

const TEST_MGMT_ROUTE_PREFIXES = [
  '/counselor/hub/test-management',
  '/counselor/credits',
  '/counselor/assign-tests',
  '/counselor/test-results',
  '/counselor/test-recommendations',
  '/counselor/test-management',
] as const;

const COUNSEL_OPS_ROUTE_PREFIXES = [
  '/counselor/hub/counsel-ops',
  '/counselor/schedule',
  '/counselor/sessions',
] as const;

/** 검사발송 워크스페이스 */
const DISPATCH_MGMT_ROUTE_PREFIXES = [
  '/counselor/clients',
  '/counselor/assessments/deleted-recipients',
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

const SALES_ROUTE_PREFIXES = ['/discover', '/partners'] as const;

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

export function isAssessmentCodeWorkspaceRoute(pathname: string, search = ''): boolean {
  const path = normalizePath(pathname);
  if (
    path.startsWith('/counselor/assessments/progress') &&
    resolveCounselorProgressFrom(pathname, search) === 'clients'
  ) {
    return false;
  }
  return matchesPrefix(path, ASSESSMENT_CODE_ROUTE_PREFIXES);
}

/** @deprecated use isAssessmentCodeWorkspaceRoute */
export function isPsychTestsWorkspaceRoute(pathname: string, search = ''): boolean {
  return isAssessmentCodeWorkspaceRoute(pathname, search);
}

export function isTestMgmtWorkspaceRoute(pathname: string): boolean {
  return matchesPrefix(normalizePath(pathname), TEST_MGMT_ROUTE_PREFIXES);
}

export function isCounselOpsWorkspaceRoute(pathname: string): boolean {
  return matchesPrefix(normalizePath(pathname), COUNSEL_OPS_ROUTE_PREFIXES);
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
    isAssessmentCodeWorkspaceRoute(pathname, search) ||
    isTestMgmtWorkspaceRoute(pathname) ||
    isCounselOpsWorkspaceRoute(pathname) ||
    isToolsWorkspaceRoute(pathname) ||
    isDataWorkspaceRoute(pathname) ||
    isSalesWorkspaceRoute(pathname)
  );
}

export function getAssessmentCodeCategory(): CounselorMainCategory | undefined {
  return getCounselorCategoryBySlug(COUNSELOR_ASSESSMENT_CODE_SLUG);
}

/** @deprecated use getAssessmentCodeCategory */
export function getPsychTestsCategory(): CounselorMainCategory | undefined {
  return getAssessmentCodeCategory();
}

export function getAssessmentCodeDefaultHref(): string {
  return '/counselor/assessments';
}

/** @deprecated use getAssessmentCodeDefaultHref */
export function getPsychTestsDefaultHref(): string {
  return getAssessmentCodeDefaultHref();
}

export function getAssessmentCodeHubHref(): string {
  return getCounselorCategoryHubHref(COUNSELOR_ASSESSMENT_CODE_SLUG);
}

/** @deprecated use getAssessmentCodeHubHref */
export function getPsychTestsHubHref(): string {
  return getAssessmentCodeHubHref();
}

export function getCounselorCategoryDefaultHref(slug: string): string {
  if (slug === COUNSELOR_DISPATCH_MGMT_SLUG) {
    return '/counselor/clients';
  }
  if (slug === COUNSELOR_ASSESSMENT_CODE_SLUG || slug === COUNSELOR_PSYCH_TESTS_MENU_SLUG) {
    return getAssessmentCodeDefaultHref();
  }
  if (slug === COUNSELOR_TEST_MGMT_SLUG) {
    return '/counselor/credits';
  }
  if (slug === COUNSELOR_COUNSEL_OPS_SLUG) {
    return '/counselor/schedule';
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

function resolveSlugFromPrefixes(path: string, pathname: string, search: string): string | null {
  if (
    path.startsWith('/counselor/assessments/permanently-deleted') ||
    path.startsWith('/counselor/assessments/permanently-deleted-recipients')
  ) {
    return COUNSELOR_DATA_SLUG;
  }
  if (path.startsWith('/counselor/assessments/progress')) {
    return resolveCounselorProgressFrom(pathname, search) === 'clients'
      ? COUNSELOR_DISPATCH_MGMT_SLUG
      : COUNSELOR_ASSESSMENT_CODE_SLUG;
  }
  if (path.startsWith('/counselor/clients/detail')) {
    return COUNSELOR_DISPATCH_MGMT_SLUG;
  }
  if (path.startsWith('/counselor/assessments/edit')) {
    return COUNSELOR_ASSESSMENT_CODE_SLUG;
  }
  if (matchesPrefix(path, DISPATCH_MGMT_ROUTE_PREFIXES)) return COUNSELOR_DISPATCH_MGMT_SLUG;
  if (matchesPrefix(path, ASSESSMENT_CODE_ROUTE_PREFIXES)) return COUNSELOR_ASSESSMENT_CODE_SLUG;
  if (matchesPrefix(path, TEST_MGMT_ROUTE_PREFIXES)) return COUNSELOR_TEST_MGMT_SLUG;
  if (matchesPrefix(path, COUNSEL_OPS_ROUTE_PREFIXES)) return COUNSELOR_COUNSEL_OPS_SLUG;
  if (matchesPrefix(path, TOOLS_ROUTE_PREFIXES)) return COUNSELOR_TOOLS_SLUG;
  if (matchesPrefix(path, DATA_ROUTE_PREFIXES)) return COUNSELOR_DATA_SLUG;
  if (path.startsWith('/discover') || path.startsWith('/partners')) return 'sales';
  if (path.startsWith('/counselor/hub/')) {
    const slug = path.replace('/counselor/hub/', '').split('/')[0];
    if (slug === COUNSELOR_PSYCH_TESTS_MENU_SLUG) return COUNSELOR_ASSESSMENT_CODE_SLUG;
    return slug || null;
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
  return null;
}

/** 현재 경로가 속한 대분류 slug (없으면 null) */
export function resolveCounselorCategorySlugForPath(pathname: string, search = ''): string | null {
  const path = normalizePath(pathname);
  return resolveSlugFromPrefixes(path, pathname, search);
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
