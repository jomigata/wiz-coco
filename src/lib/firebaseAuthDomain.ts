/**
 * Firebase Auth 도메인 설정
 *
 * authDomain = wiz-coco.firebaseapp.com 을 고정 사용합니다.
 *
 * ❌ 왜 www.wizcoco.com 을 쓰지 않는가
 *   - 사용자가 wizcoco.com (www 없음) 접속 시 authDomain 이 www.wizcoco.com 과
 *     다른 origin이 됩니다.
 *   - Firebase SDK 는 signInWithRedirect 내부에서 authDomain/__/auth/iframe 을
 *     hidden iframe 으로 로드해 postMessage 통신을 합니다.
 *   - 현재 페이지와 iframe 이 cross-origin 이면 iframe 초기화가 ~10초 후 타임아웃
 *     에러로 실패합니다 (COOP/SameSite 등 브라우저 정책 영향).
 *
 * ✅ wiz-coco.firebaseapp.com 을 쓰는 이유
 *   - Firebase 에서 관리하는 도메인이므로 iframe 통신 CORS 설정이 올바르게 돼 있습니다.
 *   - Google Cloud OAuth 클라이언트에 기본으로 등록된 redirect URI 입니다.
 *   - wizcoco.com / www.wizcoco.com 어느 쪽에서 접속해도 동일하게 동작합니다.
 *
 * ⚠️  Google Cloud Console 확인 필수
 *   Authorized redirect URIs 에 아래 URI 가 있어야 합니다:
 *     https://wiz-coco.firebaseapp.com/__/auth/handler
 */
export const FIREBASE_AUTH_DOMAIN = 'wiz-coco.firebaseapp.com';

export function getFirebaseAuthDomain(): string {
  return FIREBASE_AUTH_DOMAIN;
}
