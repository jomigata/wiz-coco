import {
  counselorMenuCategories,
  getCounselorCategoryBySlug,
  getCounselorCategoryHubHref,
  type CounselorMainCategory,
} from '@/data/counselorMenu';

export const COUNSELOR_PSYCH_TESTS_SLUG = 'psych-tests';

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

function normalizePath(pathname: string): string {
  const base = (pathname || '').split('?')[0].replace(/\/+$/, '') || '/counselor';
  return base;
}

export function isPsychTestsWorkspaceRoute(pathname: string): boolean {
  const path = normalizePath(pathname);
  return PSYCH_TESTS_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
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

/** 현재 경로가 속한 대분류 slug (없으면 null) */
export function resolveCounselorCategorySlugForPath(pathname: string): string | null {
  const path = normalizePath(pathname);
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
  if (target === '/counselor/assessments' && path.startsWith('/counselor/assessments/')) {
    if (path.startsWith('/counselor/assessments/deleted-recipients')) return false;
    return true;
  }
  if (target === '/counselor/clients' && path.startsWith('/counselor/clients')) return true;
  return path.startsWith(`${target}/`);
}
