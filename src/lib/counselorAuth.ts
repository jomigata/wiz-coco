/**
 * 상담사 API용 Firebase ID 토큰 — 중복 authStateReady·getIdToken 호출 방지
 */

import { initializeFirebase } from '@/lib/firebase';
import { getFlaskApiBaseUrl } from '@/lib/flaskApiBaseUrl';
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

/** 상담사 API 403 — 승인됐으나 Firestore role 미동기화 */
export function isCounselorRoleRequiredMessage(message: unknown): boolean {
  return /counselor role required/i.test(String(message || ''));
}

/** bootstrap-role API로 승인 상담사 role 동기화 후 토큰 갱신 */
export async function syncCounselorRoleViaApi(): Promise<{ ok: boolean; role?: string }> {
  if (typeof window === 'undefined') return { ok: false };
  try {
    const { auth } = initializeFirebase();
    const user = auth?.currentUser;
    if (!user) return { ok: false };
    const token = await user.getIdToken(true);
    primeCounselorIdToken(token);
    const res = await fetch(`${getFlaskApiBaseUrl()}/api/auth/bootstrap-role`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    const data = (await res.json().catch(() => ({}))) as { role?: string; message?: string };
    if (!res.ok) return { ok: false, role: data.role };
    const role = data.role;
    const ok = role === 'counselor' || role === 'admin';
    return { ok, role };
  } catch {
    return { ok: false };
  }
}

/** Firebase auth.currentUser.uid (동기). 로그인 전이면 null */
export function getCounselorUidSync(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const { auth } = initializeFirebase();
    return auth?.currentUser?.uid ?? null;
  } catch {
    return null;
  }
}

/** 상담사 UID — 토큰 해석 후 currentUser 확인 */
export async function getCounselorUid(): Promise<string | null> {
  const sync = getCounselorUidSync();
  if (sync) return sync;
  await getCounselorToken();
  return getCounselorUidSync();
}
