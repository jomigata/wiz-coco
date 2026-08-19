/**
 * 로그인 페이지 리다이렉트 URL 및 인증 오류 판별
 */

import type { AppRole } from '@/utils/roleUtils';

/** 상담관리 영역 중 관리자 전용 경로 */
export const COUNSELOR_ADMIN_ONLY_PATH_PREFIXES = [
  '/counselor/assessments/permanently-deleted',
] as const;

export function isCounselorAdminOnlyPath(path: string): boolean {
  const normalized = (path.split('?')[0] || '').replace(/\/+$/, '') || '/';
  return COUNSELOR_ADMIN_ONLY_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`) || normalized.startsWith(`${prefix}-`),
  );
}

export function buildLoginRedirectUrl(returnPath?: string): string {
  if (typeof window === 'undefined') return '/login';
  const path = (returnPath || `${window.location.pathname}${window.location.search}`).trim();
  if (!path || path.startsWith('/login') || path.startsWith('/register')) {
    return '/login';
  }
  return `/login?redirect=${encodeURIComponent(path)}`;
}

/** 전문가·상담사 로그인 페이지 URL (검사시작 `/` 리다이렉트 방지) */
export function buildCounselorLoginUrl(returnPath?: string): string {
  if (typeof window === 'undefined') return '/login?redirect=%2Fcounselor';
  const raw = (returnPath || `${window.location.pathname}${window.location.search}`).trim();
  const path = resolveCounselorPostLoginRedirect(
    !raw ||
      raw === '/' ||
      raw.startsWith('/login') ||
      raw.startsWith('/register') ||
      raw.startsWith('/portal')
      ? null
      : raw,
  );
  return `/login?redirect=${encodeURIComponent(path)}`;
}

/** 전문가·상담사 로그인 성공 후 이동 경로 (검사시작 `/` 기본값 방지) */
export function resolveCounselorPostLoginRedirect(raw: string | null | undefined): string {
  const path = (raw || '').trim();
  if (!path || path === '/') return '/counselor';
  if (path.startsWith('/login') || path.startsWith('/register')) return '/counselor';
  return path;
}

/** 역할에 맞지 않는 관리자 전용 redirect는 상담관리 허브로 대체 (로그인 루프 방지) */
export function resolvePostLoginRedirectForRole(
  redirectPath: string,
  role: AppRole | string | null | undefined,
): string {
  const path = resolveCounselorPostLoginRedirect(redirectPath);
  if (isCounselorAdminOnlyPath(path) && role !== 'admin') {
    return '/counselor';
  }
  return path;
}

export function isLoginRequiredError(message: unknown): boolean {
  const text = String(message ?? '').trim();
  if (!text) return false;
  if (text.includes('로그인이 필요')) return true;
  if (text.includes('전문가·상담사 로그인') || text.includes('전문가 로그인')) return true;
  if (/unauthorized/i.test(text)) return true;
  if (/valid firebase id token/i.test(text)) return true;
  if (/id token required/i.test(text)) return true;
  return false;
}
