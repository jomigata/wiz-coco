/**
 * 상담사 API용 Firebase ID 토큰 — 중복 authStateReady·getIdToken 호출 방지
 */

import { initializeFirebase } from '@/lib/firebase';
import { hasAuthenticatedTabSession, isAuthLoginInProgress } from '@/utils/authSessionLifecycle';
import { readSWRCache, writeSWRCache } from '@/utils/staleWhileRevalidateCache';

const TOKEN_CACHE_KEY = 'swr:counselorIdToken';
const TOKEN_CACHE_MAX_AGE_MS = 4 * 60 * 1000;

let inFlightToken: Promise<string | null> | null = null;

/** 로그인 직후 API 호출을 앞당기기 위해 토큰을 미리 캐시 */
export function primeCounselorIdToken(token: string): void {
  writeSWRCache(TOKEN_CACHE_KEY, token, { scope: 'session' });
}

export function clearCounselorIdTokenCache(): void {
  writeSWRCache(TOKEN_CACHE_KEY, null, { scope: 'session' });
  inFlightToken = null;
}

async function resolveCounselorTokenFromFirebase(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { auth } = initializeFirebase();
    if (!auth) return null;

    let user = auth.currentUser;
    if (!user && (hasAuthenticatedTabSession() || isAuthLoginInProgress())) {
      await auth.authStateReady();
      user = auth.currentUser;
      if (!user) {
        for (let i = 0; i < 3 && !user; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          user = auth.currentUser;
        }
      }
    } else if (!user) {
      await auth.authStateReady();
      user = auth.currentUser;
    }

    if (!user) return null;
    const token = await user.getIdToken();
    writeSWRCache(TOKEN_CACHE_KEY, token, { scope: 'session' });
    return token;
  } catch {
    return null;
  }
}

/** 상담사 API 호출 시 Firebase ID 토큰. 로그인 안 되어 있으면 null */
export async function getCounselorToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const cached = readSWRCache<string>(TOKEN_CACHE_KEY, {
    scope: 'session',
    maxAgeMs: TOKEN_CACHE_MAX_AGE_MS,
  });
  if (cached.isFresh && cached.data) return cached.data;

  if (inFlightToken) return inFlightToken;

  inFlightToken = resolveCounselorTokenFromFirebase().finally(() => {
    inFlightToken = null;
  });
  return inFlightToken;
}
