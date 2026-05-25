import type { Auth } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';

/**
 * Firebase /__/auth/handler 로 직접 이동 (signInWithRedirect iframe 우회)
 * signInWithRedirect 가 5초 안에 이동하지 못하면 이 함수로 폴백합니다.
 */
export function navigateToGoogleSignInRedirect(auth: Auth, returnUrl?: string): void {
  if (typeof window === 'undefined') {
    throw new Error('브라우저에서만 사용할 수 있습니다.');
  }
  const apiKey = auth.config.apiKey;
  const authDomain = auth.config.authDomain;
  if (!apiKey || !authDomain) {
    throw new Error('Firebase Auth 설정(apiKey/authDomain)이 없습니다.');
  }

  const redirectUrl =
    returnUrl ||
    `${window.location.origin}${window.location.pathname}${window.location.search}`;

  const params = new URLSearchParams();
  params.set('apiKey', apiKey);
  params.set('appName', (auth as any).name ?? '[DEFAULT]');
  params.set('authType', 'signInViaRedirect');
  params.set('redirectUrl', redirectUrl);
  params.set('providerId', GoogleAuthProvider.PROVIDER_ID);
  params.set('scopes', 'profile email');
  params.set('customParameters', JSON.stringify({ prompt: 'select_account' }));

  const url = `https://${authDomain}/__/auth/handler?${params.toString()}`;
  console.log('[GoogleAuth] 직접 handler redirect', { authDomain, redirectUrl });
  window.location.replace(url);
}
