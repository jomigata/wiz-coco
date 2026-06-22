/**
 * 검사 선행 게스트 세션 (프로필 등록 전 검사 제출)
 */

import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { startGuestJoin } from '@/lib/joinFlowApi';

export const JOIN_GUEST_STORAGE_KEY = 'wizcoco_join_guest';

export type JoinGuestSession = {
  guestId: string;
  guestToken: string;
  assessmentId: string;
  accessCode: string;
  savedAt: number;
};

export function persistJoinGuestSession(data: Omit<JoinGuestSession, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  const payload: JoinGuestSession = { ...data, savedAt: Date.now() };
  sessionStorage.setItem(JOIN_GUEST_STORAGE_KEY, JSON.stringify(payload));
}

export function readJoinGuestSession(): JoinGuestSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(JOIN_GUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JoinGuestSession;
    if (!parsed?.guestToken || !parsed?.accessCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearJoinGuestSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(JOIN_GUEST_STORAGE_KEY);
}

export function getJoinGuestAuthHeader(): Record<string, string> {
  const session = readJoinGuestSession();
  if (!session?.guestToken) return {};
  return { Authorization: `Guest ${session.guestToken}` };
}

export function hasJoinGuestSessionForCode(accessCodeNorm: string): boolean {
  const session = readJoinGuestSession();
  if (!session) return false;
  return session.accessCode === accessCodeNorm;
}

/** 해당 검사코드용 게스트 세션이 없으면 발급 */
export async function ensureJoinGuestSession(accessCodeNorm: string): Promise<JoinGuestSession> {
  const code = normalizeAccessCodeInput(accessCodeNorm);
  const existing = readJoinGuestSession();
  if (existing?.accessCode === code && existing.guestToken) {
    return existing;
  }
  const result = await startGuestJoin(code);
  const session: JoinGuestSession = {
    guestId: result.guestId,
    guestToken: result.guestToken,
    assessmentId: result.assessmentId,
    accessCode: result.accessCode,
    savedAt: Date.now(),
  };
  persistJoinGuestSession(session);
  return session;
}
