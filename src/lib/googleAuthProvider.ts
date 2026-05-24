import { GoogleAuthProvider } from 'firebase/auth';

/**
 * Google 계정 선택 화면 표시 (prompt=login 은 팝업·COOP 환경에서 흐름이 끊기는 경우가 많음)
 */
export function createGoogleAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}
