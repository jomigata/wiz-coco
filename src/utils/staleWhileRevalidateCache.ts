export type CacheEnvelope<T> = {
  savedAt: number;
  data: T | null;
};

function nowMs() {
  return Date.now();
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getStorage(scope: 'session' | 'local'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return scope === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readSWRCache<T>(
  key: string,
  opts?: { scope?: 'session' | 'local'; maxAgeMs?: number },
): { data: T | null; savedAt: number | null; isFresh: boolean } {
  const scope = opts?.scope ?? 'session';
  const maxAgeMs = opts?.maxAgeMs ?? 5 * 60 * 1000; // 5분
  const storage = getStorage(scope);
  if (!storage) return { data: null, savedAt: null, isFresh: false };

  const env = safeJsonParse<CacheEnvelope<T>>(storage.getItem(key));
  if (!env || typeof env.savedAt !== 'number') return { data: null, savedAt: null, isFresh: false };

  const age = nowMs() - env.savedAt;
  const isFresh = Number.isFinite(age) && age >= 0 && age <= maxAgeMs;
  return { data: env.data ?? null, savedAt: env.savedAt, isFresh };
}

export function writeSWRCache<T>(key: string, data: T | null, opts?: { scope?: 'session' | 'local' }) {
  const scope = opts?.scope ?? 'session';
  const storage = getStorage(scope);
  if (!storage) return;
  const env: CacheEnvelope<T> = { savedAt: nowMs(), data };
  try {
    storage.setItem(key, JSON.stringify(env));
  } catch {
    // ignore quota/blocked storage
  }
}

