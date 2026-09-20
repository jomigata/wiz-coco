const STORAGE_KEY = 'wizcoco_dispatch_live_refresh';

/** Firestore testResults onSnapshot — default off to reduce read cost (TASK-010). */
export function readDispatchLiveRefreshPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeDispatchLiveRefreshPref(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}
