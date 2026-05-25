const PRODUCTION_AUTH_DOMAIN = 'www.wizcoco.com';
const LEGACY_AUTH_DOMAIN = 'wiz-coco.firebaseapp.com';

function resolveFirebaseAuthDomainFromEnv(): string {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  if (!raw || raw === LEGACY_AUTH_DOMAIN) {
    return PRODUCTION_AUTH_DOMAIN;
  }
  return raw;
}

/** 현재 접속 호스트와 일치하는 authDomain (wizcoco.com / www.wizcoco.com) */
export function getFirebaseAuthDomain(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  return resolveFirebaseAuthDomainFromEnv();
}

/** 빌드·SSR 기본값 */
export const FIREBASE_AUTH_DOMAIN = resolveFirebaseAuthDomainFromEnv();
