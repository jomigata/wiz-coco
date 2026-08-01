/** 중분류 하위 — 현재 화면에서만 표시되는 이동형(소분류) 메뉴 */

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

export const counselorNestedNavItems: CounselorNestedNavItem[] = [
  {
    parentSubcategoryName: '1a. 상담코드',
    insertAfterHref: '/counselor/assessments',
    order: 1,
    label: '발송·검사 현황',
    match: (path) => path.startsWith('/counselor/assessments/progress'),
    buildHref: (path, search) => `${path}${search}`,
  },
  {
    parentSubcategoryName: '1a. 상담코드',
    insertAfterHref: '/counselor/assessments',
    order: 2,
    label: '상담코드 수정',
    match: (path) => path.startsWith('/counselor/assessments/edit'),
    buildHref: (path, search) => `${path}${search}`,
  },
  {
    parentSubcategoryName: '1b. 내담자 관리',
    insertAfterHref: '/counselor/clients',
    order: 1,
    label: '내담자 상세',
    match: (path) => path.startsWith('/counselor/clients/detail'),
    buildHref: (path, search) => `${path}${search}`,
  },
];

export function resolveActiveNestedNavItem(
  pathname: string,
  search: string,
): { item: CounselorNestedNavItem; href: string } | null {
  const path = (pathname || '').split('?')[0].replace(/\/+$/, '') || '';
  for (const item of counselorNestedNavItems) {
    if (item.match(path)) {
      return { item, href: item.buildHref(path, search) };
    }
  }
  return null;
}

function normalizeHref(href: string): string {
  return href.replace(/\/+$/, '');
}

/** 특정 중분류 메뉴 항목 바로 아래에 표시할 소분류(현재 경로와 일치할 때만) */
export function nestedNavItemsAfter(
  parentSubcategoryName: string,
  afterHref: string,
  pathname: string,
): CounselorNestedNavItem[] {
  const path = (pathname || '').split('?')[0].replace(/\/+$/, '') || '';
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
