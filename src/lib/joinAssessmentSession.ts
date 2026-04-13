/**
 * 검사코드 참여 세션: 브라우저 sessionStorage에 세트 메타만 보관합니다.
 */
import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';

export const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';

/** 검사 선택 현황으로 이동 */
export function navigateToJoinSelectionDashboard(accessCodeNorm: string): void {
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code || typeof window === 'undefined') return;
  const path = `/join/dashboard?accessCode=${encodeURIComponent(code)}`;
  window.location.assign(path);
}
