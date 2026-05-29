/** OAuth authorization code 1회용 — 새로고침 시 재사용 방지 */

const CONSUMED_PREFIX = 'oauth_code_done:';

export function oauthCodeStorageKey(code: string): string {
  return `${CONSUMED_PREFIX}${code.slice(0, 48)}`;
}

export function isOAuthCodeAlreadyConsumed(code: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(oauthCodeStorageKey(code)) === '1';
  } catch {
    return false;
  }
}

export function markOAuthCodeConsumed(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(oauthCodeStorageKey(code), '1');
  } catch {
    // ignore
  }
}

/** URL에서 code/state 제거 — 새로고침 시 code 재전송 방지 */
export function stripOAuthParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const path = window.location.pathname;
    window.history.replaceState({}, '', path.endsWith('/') ? path : `${path}/`);
  } catch {
    // ignore
  }
}
