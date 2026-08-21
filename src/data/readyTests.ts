/**
 * 끝까지 진행·채점되는 검사만. 메뉴·검색·상담코드 선택·직접 URL의 단일 기준.
 * 미구현 검사는 여기 넣지 않는다.
 */
export const READY_TEST_IDS = [
  'ego-ok-pro',
  'mbti_pro',
  'mbti',
  'ai-profiling',
  'integrated-assessment',
  'inside-mbti',
] as const;

export type ReadyTestId = (typeof READY_TEST_IDS)[number];

const READY_TEST_ID_SET = new Set<string>(READY_TEST_IDS);

/** 레거시 페이지: 포털로 보내거나, 자체 안내가 있어 레이아웃에서 막지 않음 */
const PASSTHROUGH_TEST_IDS = new Set(['ego-ok', 'group_mbti']);

export function testIdFromHref(href: string): string {
  const match = (href || '').trim().match(/\/tests\/([^/?#]+)/);
  return match ? match[1].trim() : '';
}

export function getTestPathId(pathname: string): string | null {
  const path = (pathname || '').split('?')[0].replace(/\/+$/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'tests' || !parts[1]) return null;
  return parts[1];
}

export function isReadyTestId(testId: string): boolean {
  return READY_TEST_ID_SET.has(String(testId || '').trim());
}

export function isReadyTestHref(href: string): boolean {
  return isReadyTestId(testIdFromHref(href));
}

/** /tests 대시보드 또는 실제 이용 가능한 검사(결과 하위 경로 포함) */
export function isReadyTestPath(pathname: string): boolean {
  const path = (pathname || '').split('?')[0].replace(/\/+$/, '') || '/';
  if (path === '/tests') return true;
  const id = getTestPathId(pathname);
  return id ? isReadyTestId(id) : false;
}

/** 미구현 검사 페이지를 ‘준비 중’으로 대체할지 */
export function shouldShowTestUnavailable(pathname: string): boolean {
  const path = (pathname || '').split('?')[0].replace(/\/+$/, '') || '/';
  if (!path.startsWith('/tests')) return false;
  if (path === '/tests') return false;
  const id = getTestPathId(pathname);
  if (!id) return false;
  if (isReadyTestId(id) || PASSTHROUGH_TEST_IDS.has(id)) return false;
  return true;
}
