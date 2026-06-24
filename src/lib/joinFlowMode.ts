/**
 * /join 검사코드 입력 — 신규 내담자 참여 플로우 (기존 내 검사실 세션과 분리)
 */
import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { readClientPortalSession } from '@/lib/clientPortalSession';

export const JOIN_FRESH_PARTICIPANT_KEY = 'wizcoco_join_fresh_participant';

export function markJoinFreshParticipantFlow(accessCodeNorm: string): void {
  if (typeof window === 'undefined') return;
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code) return;
  sessionStorage.setItem(JOIN_FRESH_PARTICIPANT_KEY, code);
}

export function clearJoinFreshParticipantFlow(accessCodeNorm?: string): void {
  if (typeof window === 'undefined') return;
  if (!accessCodeNorm) {
    sessionStorage.removeItem(JOIN_FRESH_PARTICIPANT_KEY);
    return;
  }
  const code = normalizeAccessCodeInput(accessCodeNorm);
  const stored = sessionStorage.getItem(JOIN_FRESH_PARTICIPANT_KEY);
  if (stored === code) {
    sessionStorage.removeItem(JOIN_FRESH_PARTICIPANT_KEY);
  }
}

/** 검사코드 입력(/join)으로 시작한 신규 참여 — 내 검사실 세션보다 우선 */
export function isJoinFreshParticipantFlow(accessCodeNorm?: string): boolean {
  if (typeof window === 'undefined') return false;
  const stored = sessionStorage.getItem(JOIN_FRESH_PARTICIPANT_KEY);
  if (!stored) return false;
  if (!accessCodeNorm) return true;
  return stored === normalizeAccessCodeInput(accessCodeNorm);
}

/** 내 검사실(포털) 모드 — 신규 /join 참여 중이면 포털 세션이 있어도 false */
export function isPortalModeForAccessCode(accessCodeNorm?: string): boolean {
  if (isJoinFreshParticipantFlow(accessCodeNorm)) return false;
  return Boolean(readClientPortalSession()?.portalToken);
}
