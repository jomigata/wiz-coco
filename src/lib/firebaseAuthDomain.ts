/** Firebase Auth OAuth redirect_uri · Google 로그인 팝업 도메인 */
export const FIREBASE_AUTH_DOMAIN = resolveFirebaseAuthDomain();

const PRODUCTION_AUTH_DOMAIN = 'www.wizcoco.com';
const LEGACY_AUTH_DOMAIN = 'wiz-coco.firebaseapp.com';

function resolveFirebaseAuthDomain(): string {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  if (!raw || raw === LEGACY_AUTH_DOMAIN) {
    return PRODUCTION_AUTH_DOMAIN;
  }
  return raw;
}
