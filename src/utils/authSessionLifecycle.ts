/**
 * 탭/브라우저 종료 시 로그인 정보를 즉시 삭제합니다.
 * 다른 탭이 열려 있어도 사이트 탭이 하나 닫히면 BroadcastChannel로 전체 로그아웃합니다.
 */

import { signOut } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';

const AUTH_CLEAR_CHANNEL = 'wizcoco:auth-clear';
const AUTH_CLEARED_FLAG = 'wizcoco:auth-cleared';
const PAGE_REFRESHING_KEY = 'page_refreshing';

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
] as const;

const AUTH_SESSION_KEYS = [
  'swr:firebaseAuthUser',
  'oauth_return',
  'oauth_provider',
  'oauth_state',
] as const;

function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  const expires = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = `auth_token=; ${expires}`;
  document.cookie = `user_role=; ${expires}`;
}

/** Firebase signOut 없이 동기적으로 로그인 관련 저장소만 정리 */
export function clearAuthStorageSync(): void {
  if (typeof window === 'undefined') return;

  try {
    AUTH_LOCAL_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });

    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith('temp-auth-') ||
        key.startsWith('login-form') ||
        key.startsWith('temp-login-') ||
        key.includes('firebase:authUser:') ||
        (key.includes('auth') && !key.startsWith('wizcoco:'))
      ) {
        localStorage.removeItem(key);
      }
    });

    AUTH_SESSION_KEYS.forEach((key) => {
      sessionStorage.removeItem(key);
    });

    clearAuthCookies();
  } catch (error) {
    console.error('[AuthSessionLifecycle] 동기 로그인 정보 삭제 오류:', error);
  }
}

/** Firebase signOut 포함 전체 로그인 정보 삭제 */
export async function clearAllAuthStorage(): Promise<void> {
  clearAuthStorageSync();

  try {
    const { auth } = initializeFirebase();
    if (auth?.currentUser) {
      await signOut(auth);
    }
  } catch (error) {
    console.warn('[AuthSessionLifecycle] Firebase signOut 실패:', error);
  }
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

/** 탭/브라우저 종료 시 즉시 로그인 정보 삭제 */
export function clearAuthOnClose(): void {
  if (typeof window === 'undefined') return;
  if (isPageRefreshing()) return;

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
 * 앱 시작 시 호출 — 종료 시 signOut이 완료되지 않았으면 true 반환
 */
export function evaluateAuthSessionOnStartup(): boolean {
  if (typeof window === 'undefined') return false;

  const wasCleared = localStorage.getItem(AUTH_CLEARED_FLAG) === '1';
  if (!wasCleared) return false;

  localStorage.removeItem(AUTH_CLEARED_FLAG);
  clearAuthStorageSync();
  console.log('[AuthSessionLifecycle] 이전 세션 종료 감지 — 로그인 정보 정리');
  return true;
}

export function subscribeAuthClearEvents(onClear: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(AUTH_CLEAR_CHANNEL);
    channel.onmessage = () => {
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

  const handlePageHide = (event: PageTransitionEvent) => {
    if (event.persisted) return;
    if (isPageRefreshing()) return;
    clearAuthOnClose();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handlePageHide);

  const refreshFlagTimer = window.setTimeout(() => {
    sessionStorage.removeItem(PAGE_REFRESHING_KEY);
  }, 500);

  return () => {
    window.clearTimeout(refreshFlagTimer);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handlePageHide);
  };
}
