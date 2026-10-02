import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';
import { isReadyTestHref, testIdFromHref } from '@/data/readyTests';

/** 로컬 dev 서버에서 메뉴 → 검사 바로 시작 쿼리 */
export const LOCAL_PSYCH_TEST_QUERY_KEY = 'localDirect';

export function isLocalPsychTestServer(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isLocalPsychTestDirectActive(
  searchParams: Pick<URLSearchParams, 'get'> | null | undefined,
): boolean {
  if (!isLocalPsychTestServer()) return false;
  return searchParams?.get(LOCAL_PSYCH_TEST_QUERY_KEY) === '1';
}

export function withLocalPsychTestDirectHref(href: string): string {
  const base = (href || '').trim().split('#')[0].split('?')[0];
  if (!base) return href;
  const url = new URL(base, 'http://local');
  url.searchParams.set(LOCAL_PSYCH_TEST_QUERY_KEY, '1');
  return `${url.pathname}${url.search}`;
}

/** AI 심리검사 메뉴·검색·대시보드 링크 (로컬에서만 localDirect 부착) */
export function psychologyTestMenuHref(href: string): string {
  if (!isLocalPsychTestServer()) return href;
  if (!isReadyTestHref(href)) return href;
  return withLocalPsychTestDirectHref(href);
}

export function localPsychTestIdFromHref(href: string): string {
  return testIdFromHref(href);
}

export function createLocalPsychTestClientInfo(): ClientInfo {
  const birthYear = new Date().getFullYear() - 30;
  return {
    birthYear,
    groupCode: '',
    gender: 'male',
    maritalStatus: 'single',
    name: '로컬테스트',
    privacyAgreed: true,
    phone: '01000000000',
  };
}
