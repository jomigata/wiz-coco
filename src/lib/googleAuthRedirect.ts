import type { Auth } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';

/**
 * Firebase Hosting /__/auth/handler 로 즉시 이동 (signInWithRedirect 대기·정지 회피)
 * 팝업 없이 Google 계정 선택 화면으로 이어집니다.
 */
export function navigateToGoogleSignInRedirect(
  auth: Auth,
  provider: GoogleAuthProvider = new GoogleAuthProvider(),
): void {
  if (typeof window === 'undefined') {
    throw new Error('브라우저에서만 사용할 수 있습니다.');
  }

  const apiKey = auth.config.apiKey;
  const authDomain = auth.config.authDomain;
  if (!apiKey || !authDomain) {
    throw new Error('Firebase Auth 설정(apiKey/authDomain)이 없습니다.');
  }

  const redirectUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const scopes = provider.scopes?.length ? provider.scopes.join(',') : 'profile';
  const customParameters = provider.customParameters ?? {};

  const params = new URLSearchParams();
  params.set('apiKey', apiKey);
  params.set('appName', auth.name);
  params.set('authType', 'signInViaRedirect');
  params.set('redirectUrl', redirectUrl);
  params.set('providerId', GoogleAuthProvider.PROVIDER_ID);
  params.set('scopes', scopes);
  if (Object.keys(customParameters).length > 0) {
    params.set('customParameters', JSON.stringify(customParameters));
  }

  const url = `https://${authDomain}/__/auth/handler?${params.toString()}`;
  console.log('[GoogleAuth] handler redirect', { authDomain, redirectUrl });
  window.location.replace(url);
}
