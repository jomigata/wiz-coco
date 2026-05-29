/**
 * 탭/브라우저 종료·로그아웃 시 로그인 정보를 즉시 삭제합니다.
 * sessionStorage 탭 세션 마커로 재접속 시 Firebase/캐시 자동 로그인을 차단합니다.
 */

import { signOut } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';

const AUTH_CLEAR_CHANNEL = 'wizcoco:auth-clear';
const AUTH_CLEARED_FLAG = 'wizcoco:auth-cleared';
const AUTH_TAB_SESSION_KEY = 'wizcoco:auth-tab-session';
const AUTH_HEARTBEAT_KEY = 'wizcoco:auth-heartbeat';
const AUTH_HEARTBEAT_MAX_AGE_MS = 20_000;
const PAGE_REFRESHING_KEY = 'page_refreshing';
const SKIP_AUTH_CLEAR_KEY = 'wizcoco:skip-auth-clear';
const AUTH_LOGIN_IN_PROGRESS_KEY = 'wizcoco:auth-login-in-progress';
/** Google redirect OAuth 진행·복귀 구간 표시 (getRedirectResult 호출 조건) */
export const GOOGLE_OAUTH_PENDING_KEY = 'wizcoco:google-oauth-pending';
const GOOGLE_OAUTH_PENDING_TS_KEY = 'wizcoco:google-oauth-ts';
/** 이 시간(ms)이 지난 pending 플래그는 stale로 간주하고 무시 */
const GOOGLE_OAUTH_STALE_MS = 5 * 60 * 1000; // 5분
const FIREBASE_IDB_NAME = 'firebaseLocalStorageDb';

const AUTH_LOCAL_KEYS = [
  'oktest-auth-state',
  'isLoggedIn',
  'user',
  'userToken',
  'auth_token',
  'remember_login',
  'token',
  'auth_status',
  'session_token',
  'login_time',
  'oauth_state',
  'oauth_return',
  'oauth_provider',
  'oauth_redirect_uri',
  'oauth_client_id',
  'user_settings',
] as const;

const AUTH_SESSION_KEYS = [
  'swr:firebaseAuthUser',
  'oauth_return',
  'oauth_provider',
  'oauth_state',
  'oauth_redirect_uri',
  'oauth_client_id',
] as const;

function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  const expires = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = `auth_token=; ${expires}`;
  document.cookie = `user_role=; ${expires}`;
}

function clearFirebaseIndexedDB(): void {
  if (typeof indexedDB === 'undefined') return;
  try {
    indexedDB.deleteDatabase(FIREBASE_IDB_NAME);
  } catch {
    // ignore
  }
}

/** Firebase signOut 없이 동기적으로 로그인 관련 저장소만 정리 */
export function clearAuthStorageSync(options?: { fullReset?: boolean }): void {
  if (typeof window === 'undefined') return;

  const fullReset = options?.fullReset === true;

  try {
    AUTH_LOCAL_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });

    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith('temp-auth-') ||
        key.startsWith('login-form') ||
        key.startsWith('temp-login-') ||
        key.startsWith('oauth_code_done:') ||
        key.includes('firebase:authUser:') ||
        key.includes('firebase:host:') ||
        (key.includes('auth') && !key.startsWith('wizcoco:'))
      ) {
        localStorage.removeItem(key);
      }
    });

    localStorage.removeItem(AUTH_HEARTBEAT_KEY);

    const loginInProgress = isAuthLoginInProgress();
    const oauthPending = isGoogleOAuthPending();
    const protectOAuth = !fullReset && (loginInProgress || oauthPending);

    if (fullReset) {
      clearGoogleOAuthPending();
      endAuthLoginAttempt();
      AUTH_SESSION_KEYS.forEach((key) => {
        sessionStorage.removeItem(key);
      });
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('oauth_') || key.startsWith('oauth_code_done:')) {
          sessionStorage.removeItem(key);
        }
      });
      try {
        localStorage.setItem(AUTH_CLEARED_FLAG, '1');
      } catch {
        // ignore
      }
    } else if (protectOAuth) {
      AUTH_SESSION_KEYS.filter((key) => key !== 'oauth_return').forEach((key) => {
        sessionStorage.removeItem(key);
      });
    } else {
      AUTH_SESSION_KEYS.forEach((key) => {
        sessionStorage.removeItem(key);
      });
      sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_KEY);
    }

    sessionStorage.removeItem(AUTH_TAB_SESSION_KEY);
    clearAuthCookies();
    if (fullReset || !protectOAuth) {
      clearFirebaseIndexedDB();
    }
  } catch (error) {
    console.error('[AuthSessionLifecycle] 동기 로그인 정보 삭제 오류:', error);
  }
}

const AUTH_LOGIN_IN_PROGRESS_LS_KEY = 'wizcoco:auth-login-in-progress-ls';

/** 로그인 시도 시작 — startup signOut·세션 정리와의 경쟁 방지 */
export function beginAuthLoginAttempt(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_LOGIN_IN_PROGRESS_KEY, '1');
  try {
    localStorage.setItem(AUTH_LOGIN_IN_PROGRESS_LS_KEY, '1');
  } catch {
    // ignore
  }
}

/** 로그인 시도 종료 */
export function endAuthLoginAttempt(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_LOGIN_IN_PROGRESS_KEY);
  try {
    localStorage.removeItem(AUTH_LOGIN_IN_PROGRESS_LS_KEY);
  } catch {
    // ignore
  }
}

export function isAuthLoginInProgress(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    sessionStorage.getItem(AUTH_LOGIN_IN_PROGRESS_KEY) === '1' ||
    localStorage.getItem(AUTH_LOGIN_IN_PROGRESS_LS_KEY) === '1'
  );
}

/** Google OAuth pending 플래그: sessionStorage + localStorage(타임스탬프 포함)에 저장
 *  크로스 오리진 이동 시 sessionStorage는 지워지지만 localStorage는 유지됩니다.
 *  5분 이상 된 stale 플래그는 자동으로 무시·정리합니다. */
export function markGoogleOAuthPending(): void {
  if (typeof window === 'undefined') return;
  const ts = String(Date.now());
  try { sessionStorage.setItem(GOOGLE_OAUTH_PENDING_KEY, '1'); } catch { /* ignore */ }
  try { localStorage.setItem(GOOGLE_OAUTH_PENDING_KEY, '1'); } catch { /* ignore */ }
  try { localStorage.setItem(GOOGLE_OAUTH_PENDING_TS_KEY, ts); } catch { /* ignore */ }
}

export function isGoogleOAuthPending(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(GOOGLE_OAUTH_PENDING_KEY);
    if (raw === '1') {
      const ts = parseInt(localStorage.getItem(GOOGLE_OAUTH_PENDING_TS_KEY) ?? '0', 10);
      if (ts && Date.now() - ts > GOOGLE_OAUTH_STALE_MS) {
        // 5분 이상 된 stale 플래그 — 이전 실패한 OAuth 시도 잔존물
        clearGoogleOAuthPending();
        return false;
      }
    }
    return (
      sessionStorage.getItem(GOOGLE_OAUTH_PENDING_KEY) === '1' ||
      raw === '1'
    );
  } catch { return false; }
}

export function clearGoogleOAuthPending(): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem(GOOGLE_OAUTH_PENDING_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem(GOOGLE_OAUTH_PENDING_TS_KEY); } catch { /* ignore */ }
}

/** Google OAuth redirect 복귀 URL(해시·쿼리) 여부 */
export function isFirebaseAuthRedirectReturn(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  return (
    hash.includes('apiKey=') ||
    hash.includes('access_token=') ||
    hash.includes('id_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('__/auth/') ||
    hash.includes('firebase') ||
    search.includes('state=') ||
    search.includes('code=') ||
    search.includes('mode=signIn')
  );
}

/** Google OAuth 복귀 처리 중 — 세션 삭제·signOut 방지 */
export function isGoogleOAuthFlowActive(): boolean {
  return (
    isAuthLoginInProgress() ||
    isGoogleOAuthPending() ||
    isFirebaseAuthRedirectReturn()
  );
}

/** Firebase signOut 포함 전체 로그인 정보 삭제 */
export async function clearAllAuthStorage(options?: { fullReset?: boolean }): Promise<void> {
  const fullReset = options?.fullReset === true;
  if (!fullReset && isAuthLoginInProgress()) return;

  clearAuthStorageSync({ fullReset });

  try {
    const { auth } = initializeFirebase();
    if (auth?.currentUser) {
      await signOut(auth);
    }
  } catch (error) {
    console.warn('[AuthSessionLifecycle] Firebase signOut 실패:', error);
  }

  if (fullReset) {
    broadcastAuthClear();
  }
}

/** 현재 탭에서 로그인 세션이 유효한지 (탭/브라우저 종료 후 재접속 시 false) */
export function hasAuthenticatedTabSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === '1';
}

/** 로그인 유지 중 주기적으로 갱신 — 탭/브라우저 종료 후 stale 세션 차단 */
export function touchAuthHeartbeat(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_HEARTBEAT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function isAuthHeartbeatFresh(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(AUTH_HEARTBEAT_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts <= AUTH_HEARTBEAT_MAX_AGE_MS;
  } catch {
    return false;
  }
}

/** 로그인 성공 후 현재 탭 세션을 활성화 */
export function markAuthenticatedTabSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_TAB_SESSION_KEY, '1');
  touchAuthHeartbeat();
}

function isPageRefreshing(): boolean {
  if (typeof window === 'undefined') return false;
  if (sessionStorage.getItem(PAGE_REFRESHING_KEY) === 'true') return true;

  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return navigation?.type === 'reload';
  } catch {
    return false;
  }
}

function shouldSkipAuthClear(): boolean {
  return (
    sessionStorage.getItem(SKIP_AUTH_CLEAR_KEY) === '1' ||
    isPageRefreshing() ||
    isAuthLoginInProgress()
  );
}

/** router.push/replace 등 사이트 내부 이동 직전에 호출 */
export function markInternalNavigation(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SKIP_AUTH_CLEAR_KEY, '1');
  if (hasAuthenticatedTabSession()) {
    touchAuthHeartbeat();
  }
}

/** Next.js router.push — 탭/브라우저 종료 오탐 로그아웃 방지 */
export function pushWithAuthSession(router: { push: (href: string) => void }, href: string): void {
  markInternalNavigation();
  router.push(href);
}

/** Next.js router.replace — 탭/브라우저 종료 오탐 로그아웃 방지 */
export function replaceWithAuthSession(router: { replace: (href: string) => void }, href: string): void {
  markInternalNavigation();
  router.replace(href);
}

/** 새 페이지 진입 시 내부 이동 플래그 정리 */
export function consumeInternalNavigationFlags(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SKIP_AUTH_CLEAR_KEY);
}

function broadcastAuthClear(): void {
  if (typeof window === 'undefined') return;
  try {
    const channel = new BroadcastChannel(AUTH_CLEAR_CHANNEL);
    channel.postMessage({ type: 'clear' });
    channel.close();
  } catch {
    // BroadcastChannel 미지원 환경
  }
}

/** 탭/브라우저 종료·로그아웃 시 즉시 로그인 정보 삭제 */
export function clearAuthOnClose(): void {
  if (typeof window === 'undefined') return;
  if (shouldSkipAuthClear()) return;

  clearAuthStorageSync();
  try {
    localStorage.setItem(AUTH_CLEARED_FLAG, '1');
  } catch {
    // ignore
  }
  broadcastAuthClear();
  console.log('[AuthSessionLifecycle] 탭/브라우저 종료 — 로그인 정보 즉시 삭제');
}

/**
 * 앱 시작 시 호출 — 탭 세션 없음/이전 종료/heartbeat 만료 시 true (동기 정리 완료)
 */
export function evaluateAuthSessionOnStartup(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname || '';
  if (path.startsWith('/login') || path.startsWith('/register')) {
    return false;
  }
  if (sessionStorage.getItem(SKIP_AUTH_CLEAR_KEY) === '1') return false;
  if (isAuthLoginInProgress()) return false;

  if (isPageRefreshing()) {
    sessionStorage.removeItem(PAGE_REFRESHING_KEY);
    if (hasAuthenticatedTabSession()) {
      touchAuthHeartbeat();
      return false;
    }
  }

  const hasTabSession = hasAuthenticatedTabSession();
  const wasClosed = localStorage.getItem(AUTH_CLEARED_FLAG) === '1';
  const heartbeatFresh = isAuthHeartbeatFresh();

  if (hasTabSession && !wasClosed && heartbeatFresh) return false;

  if (wasClosed) localStorage.removeItem(AUTH_CLEARED_FLAG);
  clearAuthStorageSync();
  console.log('[AuthSessionLifecycle] 재접속 또는 세션 만료 — 로그인 정보 초기화');
  return true;
}

export function subscribeAuthClearEvents(onClear: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(AUTH_CLEAR_CHANNEL);
    channel.onmessage = () => {
      if (shouldSkipAuthClear() || isAuthLoginInProgress()) return;
      void clearAllAuthStorage().then(onClear);
    };
  } catch {
    // ignore
  }

  return () => {
    channel?.close();
  };
}

export function initAuthSessionLifecycle(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleBeforeUnload = () => {
    if (isPageRefreshing()) {
      sessionStorage.setItem(PAGE_REFRESHING_KEY, 'true');
      return;
    }
    clearAuthOnClose();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  const refreshFlagTimer = window.setTimeout(() => {
    sessionStorage.removeItem(PAGE_REFRESHING_KEY);
  }, 500);

  return () => {
    window.clearTimeout(refreshFlagTimer);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

/** 같은 origin 링크 클릭 시 내부 이동으로 표시 */
export function bindInternalNavigationMarkers(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleClick = (event: MouseEvent) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = (event.target as Element | null)?.closest('a');
    if (!anchor) return;
    if (anchor.target && anchor.target !== '_self') return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    try {
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin) {
        markInternalNavigation();
      }
    } catch {
      // ignore invalid URLs
    }
  };

  document.addEventListener('click', handleClick, true);
  return () => document.removeEventListener('click', handleClick, true);
}
