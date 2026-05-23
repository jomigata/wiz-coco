/** Google OAuth 팝업에 표시되는 Firebase Auth 도메인 */
export const FIREBASE_AUTH_DOMAIN = resolveFirebaseAuthDomain();

function resolveFirebaseAuthDomain(): string {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  if (!raw || raw === 'wiz-coco.firebaseapp.com') {
    return 'www.wizcoco.com';
  }
  return raw;
}
