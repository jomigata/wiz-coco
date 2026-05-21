/**
 * 탭/브라우저 종료 시 로그인 정보를 즉시 삭제합니다.
 * 사이트 내부 이동(로그인 → 마이페이지 등)이나 탭 전환에서는 삭제하지 않습니다.
 */

import { signOut } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';

const AUTH_CLEAR_CHANNEL = 'wizcoco:auth-clear';
const AUTH_CLEARED_FLAG = 'wizcoco:auth-cleared';
const PAGE_REFRESHING_KEY = 'page_refreshing';
const SKIP_AUTH_CLEAR_KEY = 'wizcoco:skip-auth-clear';

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

function shouldSkipAuthClear(): boolean {
  return sessionStorage.getItem(SKIP_AUTH_CLEAR_KEY) === '1' || isPageRefreshing();
}

/** router.push/replace 등 사이트 내부 이동 직전에 호출 */
export function markInternalNavigation(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SKIP_AUTH_CLEAR_KEY, '1');
}

/** 새 페이지 진입 시 내부 이동 플래그·오탐 종료 플래그 정리 */
export function consumeInternalNavigationFlags(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SKIP_AUTH_CLEAR_KEY);
  localStorage.removeItem(AUTH_CLEARED_FLAG);
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
 * 앱 시작 시 호출 — 종료 시 signOut이 완료되지 않았으면 true 반환
 */
export function evaluateAuthSessionOnStartup(): boolean {
  if (typeof window === 'undefined') return false;
  if (sessionStorage.getItem(SKIP_AUTH_CLEAR_KEY) === '1') return false;

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
      if (shouldSkipAuthClear()) return;
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
    // beforeunload는 탭/브라우저 닫기·전체 페이지 이동에서만 발생 (탭 전환 pagehide와 구분)
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
