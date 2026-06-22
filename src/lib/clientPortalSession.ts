/**
 * 내담자 포털 세션 (sessionStorage) — 브라우저 탭/창 종료 시 자동 로그아웃
 */

import type { ClientPortalLoginResult } from '@/types/clientPortal';

export const CLIENT_PORTAL_STORAGE_KEY = 'wizcoco_client_portal_session';

export type ClientPortalSession = ClientPortalLoginResult & {
  savedAt: number;
};

function clearLegacyLocalPortalSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CLIENT_PORTAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function persistClientPortalSession(data: ClientPortalLoginResult): void {
  if (typeof window === 'undefined') return;
  clearLegacyLocalPortalSession();
  const payload: ClientPortalSession = { ...data, savedAt: Date.now() };
  sessionStorage.setItem(CLIENT_PORTAL_STORAGE_KEY, JSON.stringify(payload));
}

export function readClientPortalSession(): ClientPortalSession | null {
  if (typeof window === 'undefined') return null;
  clearLegacyLocalPortalSession();
  try {
    const raw = sessionStorage.getItem(CLIENT_PORTAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientPortalSession;
    if (!parsed?.portalToken || !parsed?.portal?.accessCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearClientPortalSession(): void {
  if (typeof window === 'undefined') return;
  clearLegacyLocalPortalSession();
  sessionStorage.removeItem(CLIENT_PORTAL_STORAGE_KEY);
}

export function getClientPortalAuthHeader(): Record<string, string> {
  const session = readClientPortalSession();
  if (!session?.portalToken) return {};
  return { Authorization: `Portal ${session.portalToken}` };
}
