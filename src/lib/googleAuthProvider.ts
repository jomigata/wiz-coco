import { GoogleAuthProvider } from 'firebase/auth';

/** 탭/브라우저 재접속 시 Google 계정 자동 선택을 막고 매번 로그인 화면을 표시 */
export function createGoogleAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'login' });
  return provider;
}
