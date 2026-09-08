const SKIP_RELOAD_KEY = 'counselor:list:skipReload';

export type CounselorListCacheSource = 'assessments' | 'clients' | 'deleted-recipients';

export function markCounselorListSkipReload(source: CounselorListCacheSource): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SKIP_RELOAD_KEY, source);
  } catch {
    // ignore
  }
}

export function consumeCounselorListSkipReload(): CounselorListCacheSource | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = (sessionStorage.getItem(SKIP_RELOAD_KEY) || '').trim();
    sessionStorage.removeItem(SKIP_RELOAD_KEY);
    if (value === 'assessments' || value === 'clients' || value === 'deleted-recipients') return value;
  } catch {
    // ignore
  }
  return null;
}
