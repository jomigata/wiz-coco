/** localhost / Emulator 전용 — 내장 브라우저(Cursor)에서 로그인 필드 복원 */

const STORAGE_KEY = 'wizcoco_dev_login_remember_v1';

type Stored = {
  remember: boolean;
  email: string;
  password: string;
};

export function isDevLoginRememberEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export function loadDevLoginRemember(): Stored | null {
  if (!isDevLoginRememberEnabled()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed.remember) return null;
    return {
      remember: true,
      email: String(parsed.email || ''),
      password: String(parsed.password || ''),
    };
  } catch {
    return null;
  }
}

export function saveDevLoginRemember(email: string, password: string, remember: boolean): void {
  if (!isDevLoginRememberEnabled()) return;
  try {
    if (!remember) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: Stored = {
      remember: true,
      email: email.trim(),
      password,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}
