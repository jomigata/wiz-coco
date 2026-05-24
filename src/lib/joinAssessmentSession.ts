/**
 * 검사코드 참여 세션: 브라우저 sessionStorage에 세트 메타만 보관합니다.
 */
import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { markInternalNavigation, pushWithAuthSession } from '@/utils/authSessionLifecycle';

export const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';

export function getJoinDashboardPath(accessCodeNorm: string): string {
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code) return '/join';
  return `/join/dashboard?accessCode=${encodeURIComponent(code)}`;
}

/** 검사 선택 현황으로 이동 (전체 페이지 이동) */
export function navigateToJoinSelectionDashboard(accessCodeNorm: string): void {
  if (typeof window === 'undefined') return;
  const path = getJoinDashboardPath(accessCodeNorm);
  if (path === '/join') return;
  markInternalNavigation();
  window.location.assign(path);
}

/** 검사 선택 현황으로 이동 (Next router) */
export function pushToJoinDashboard(
  router: { push: (href: string) => void },
  accessCodeNorm: string
): void {
  pushWithAuthSession(router, getJoinDashboardPath(accessCodeNorm));
}
