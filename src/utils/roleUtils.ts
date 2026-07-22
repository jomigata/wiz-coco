// 역할 기반 접근 제어 유틸리티 함수들
// 이메일이 아닌 Firebase 로그인 사용자(uid)의 프로필 문서(/users/{uid}.role)를 기준으로 판단합니다.

import { isClientPortalDedicatedTestPath } from '@/lib/joinDedicatedTestPaths';

export type AppRole = 'user' | 'counselor' | 'admin' | 'org_admin';

export const isAdmin = (role: unknown): boolean => role === 'admin';

export const isCounselor = (role: unknown): boolean => role === 'counselor' || role === 'admin';

export const isOrgAdmin = (role: unknown): boolean => role === 'org_admin' || role === 'admin';

export const shouldShowCounselorMenu = (role: unknown): boolean => isCounselor(role);

export const shouldShowAdminMenu = (role: unknown): boolean => isAdmin(role);

export const shouldShowOrgMenu = (role: unknown): boolean => isOrgAdmin(role);

export const hasPageAccess = (role: unknown, pageType: 'counselor' | 'admin'): boolean => {
  if (pageType === 'counselor') return shouldShowCounselorMenu(role);
  if (pageType === 'admin') return shouldShowAdminMenu(role);
  return false;
};

/** AI 심리검사 네비·대시보드 — 상담사·관리자와 동일 권한 */
export const shouldShowPsychologyTestsMenu = (role: unknown): boolean => isCounselor(role);

/** 홈·자가진단 등에서 일반 회원이 직접 접근하는 레거시 검사 경로 */
const LEGACY_PUBLIC_TEST_PREFIXES = ['/tests/mbti', '/tests/psychological'] as const;

export function isLegacyPublicTestPath(pathname: string): boolean {
  const path = pathname.split('?')[0];
  return LEGACY_PUBLIC_TEST_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** /tests 하위 중 AI 심리검사 메뉴(대시보드·카테고리) 전용 경로 — 상담사·관리자만 */
export function requiresPsychologyTestsMenuAccess(pathname: string): boolean {
  const path = pathname.split('?')[0];
  if (!path.startsWith('/tests')) return false;
  if (isLegacyPublicTestPath(path)) return false;
  if (isClientPortalDedicatedTestPath(path)) return false;
  return true;
}
