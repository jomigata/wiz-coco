/**
 * OAuth redirect_uri는 authorize 요청과 token 교환에서 반드시 동일해야 합니다.
 *
 * wizcoco.com → www.wizcoco.com Hosting 리다이렉트 때문에
 * non-www에서 OAuth를 시작하면 sessionStorage가 콜백(www)과 분리됩니다.
 * 프로덕션 도메인은 www를 canonical origin으로 고정하고,
 * redirect_uri를 OAuth state에 함께 실어 cross-origin에서도 복원합니다.
 */

const CANONICAL_ORIGINS: Record<string, string> = {
  'wizcoco.com': 'https://www.wizcoco.com',
  'wizcoco.kr': 'https://www.wizcoco.kr',
};

const STATE_SEP = '|';

export function getOAuthCanonicalOrigin(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname.toLowerCase();
  if (CANONICAL_ORIGINS[host]) return CANONICAL_ORIGINS[host];
  if (host.startsWith('www.')) {
    const bare = host.slice(4);
    if (CANONICAL_ORIGINS[bare]) return `https://${host}`;
  }
  return window.location.origin;
}

export function oauthCallbackUrl(provider: 'google' | 'kakao' | 'naver'): string {
  return `${getOAuthCanonicalOrigin()}/login/${provider}-callback/`;
}

export function buildOAuthState(redirectUri: string): string {
  const nonce = crypto.randomUUID();
  return `${nonce}${STATE_SEP}${encodeURIComponent(redirectUri)}`;
}

export function parseOAuthState(state: string | null): {
  nonce: string;
  redirectUri?: string;
} {
  if (!state) return { nonce: '' };
  const idx = state.indexOf(STATE_SEP);
  if (idx === -1) return { nonce: state };
  const nonce = state.slice(0, idx);
  let redirectUri: string | undefined;
  try {
    redirectUri = decodeURIComponent(state.slice(idx + 1));
  } catch {
    redirectUri = undefined;
  }
  return { nonce, redirectUri };
}

export function resolveOAuthRedirectUri(
  state: string | null,
  provider: 'google' | 'kakao' | 'naver',
): string {
  const fromState = parseOAuthState(state).redirectUri;
  if (fromState?.includes(`/login/${provider}-callback`)) {
    return fromState;
  }
  if (typeof window !== 'undefined') {
    const stored =
      sessionStorage.getItem('oauth_redirect_uri') ||
      localStorage.getItem('oauth_redirect_uri');
    if (stored) return stored;
  }
  return oauthCallbackUrl(provider);
}

export function validateOAuthState(
  callbackState: string | null,
): { ok: true } | { ok: false; error: string } {
  if (!callbackState) {
    return { ok: false, error: '잘못된 로그인 요청입니다. 다시 시도해 주세요.' };
  }
  const { nonce } = parseOAuthState(callbackState);
  if (!nonce) {
    return { ok: false, error: '잘못된 로그인 요청입니다. 다시 시도해 주세요.' };
  }

  const stored =
    (typeof window !== 'undefined' &&
      (sessionStorage.getItem('oauth_state') || localStorage.getItem('oauth_state'))) ||
    null;

  if (stored) {
    const storedParsed = parseOAuthState(stored);
    if (stored === callbackState || storedParsed.nonce === nonce) {
      return { ok: true };
    }
    return { ok: false, error: '잘못된 로그인 요청입니다. 다시 시도해 주세요.' };
  }

  // cross-origin(예: wizcoco.com → www)으로 storage 유실 — Google이 반환한 state만으로 진행
  if (parseOAuthState(callbackState).redirectUri) {
    return { ok: true };
  }

  return { ok: true };
}
