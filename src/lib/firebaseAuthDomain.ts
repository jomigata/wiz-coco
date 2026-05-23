/** Firebase Auth OAuth redirect_uri 에 사용되는 authDomain */
export const FIREBASE_AUTH_DOMAIN = resolveFirebaseAuthDomain();

const DEFAULT_AUTH_DOMAIN = 'wiz-coco.firebaseapp.com';

function resolveFirebaseAuthDomain(): string {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  return raw || DEFAULT_AUTH_DOMAIN;
}
