/** 검사 참여 플로우: 대시보드에서 저장한 내 이메일 (session + local 백업) */

export const JOIN_CLIENT_EMAIL_KEY = 'wizcoco_join_client_email';

export function readJoinClientEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    const s = sessionStorage.getItem(JOIN_CLIENT_EMAIL_KEY);
    if (s != null && s.trim() !== '') return s.trim().toLowerCase();
  } catch {
    // ignore
  }
  try {
    const l = localStorage.getItem(JOIN_CLIENT_EMAIL_KEY);
    if (l != null && l.trim() !== '') return l.trim().toLowerCase();
  } catch {
    // ignore
  }
  return '';
}

export function writeJoinClientEmail(trimmedLowercase: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(JOIN_CLIENT_EMAIL_KEY, trimmedLowercase);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(JOIN_CLIENT_EMAIL_KEY, trimmedLowercase);
  } catch {
    // ignore
  }
}
