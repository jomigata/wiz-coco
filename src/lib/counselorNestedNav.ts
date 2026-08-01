/** 중분류 하위 — 현재 화면에서만 표시되는 이동형(소분류) 메뉴 */

export type CounselorNestedNavItem = {
  /** counselorMenu subcategories[].name 과 일치 */
  parentSubcategoryName: string;
  label: string;
  match: (path: string) => boolean;
  buildHref: (path: string, search: string) => string;
};

export const counselorNestedNavItems: CounselorNestedNavItem[] = [
  {
    parentSubcategoryName: '1a. 상담코드',
    label: '발송·검사 현황',
    match: (path) => path.startsWith('/counselor/assessments/progress'),
    buildHref: (path, search) => `${path}${search}`,
  },
  {
    parentSubcategoryName: '1a. 상담코드',
    label: '상담코드 수정',
    match: (path) => path.startsWith('/counselor/assessments/edit'),
    buildHref: (path, search) => `${path}${search}`,
  },
  {
    parentSubcategoryName: '1b. 내담자 관리',
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
