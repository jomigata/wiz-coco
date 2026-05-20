/**
 * 브라우저 종료 후 30초가 지나면 로그인 정보를 삭제합니다.
 * (브라우저가 닫힌 뒤 JS 타이머를 실행할 수 없으므로, 다음 방문 시 만료를 검사합니다.)
 */

import { signOut } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';

export const AUTH_SESSION_GRACE_MS = 30_000;
const LAST_CLOSED_KEY = 'wizcoco:last-closed-at';
const ACTIVE_TABS_KEY = 'wizcoco:active-tabs';
const TAB_ID_KEY = 'wizcoco:tab-id';
const PAGE_REFRESHING_KEY = 'page_refreshing';
const HEARTBEAT_INTERVAL_MS = 5_000;
const TAB_STALE_MS = 15_000;

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

type ActiveTabs = Record<string, number>;

function generateTabId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readActiveTabs(): ActiveTabs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ACTIVE_TABS_KEY);
    const parsed = raw ? (JSON.parse(raw) as ActiveTabs) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeActiveTabs(tabs: ActiveTabs): void {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(tabs).length === 0) {
      localStorage.removeItem(ACTIVE_TABS_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_TABS_KEY, JSON.stringify(tabs));
  } catch {
    // ignore quota errors
  }
}

function pruneStaleTabs(tabs: ActiveTabs, staleMs = TAB_STALE_MS): ActiveTabs {
  const now = Date.now();
  const next: ActiveTabs = {};
  for (const [tabId, lastSeen] of Object.entries(tabs)) {
    if (now - lastSeen <= staleMs) {
      next[tabId] = lastSeen;
    }
  }
  return next;
}

function getTabId(): string {
  if (typeof window === 'undefined') return '';
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}

function touchTabHeartbeat(tabId = getTabId()): void {
  if (!tabId) return;
  const tabs = pruneStaleTabs(readActiveTabs());
  tabs[tabId] = Date.now();
  writeActiveTabs(tabs);
}

function unregisterTab(tabId = getTabId()): void {
  if (!tabId) return;
  const tabs = pruneStaleTabs(readActiveTabs());
  delete tabs[tabId];
  writeActiveTabs(tabs);

  if (Object.keys(tabs).length === 0) {
    try {
      localStorage.setItem(LAST_CLOSED_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }
}

export function hasActiveTabs(): boolean {
  const tabs = pruneStaleTabs(readActiveTabs());
  writeActiveTabs(tabs);
  return Object.keys(tabs).length > 0;
}

function shouldClearAuthOnStartup(): boolean {
  if (typeof window === 'undefined') return false;

  const lastClosed = Number(localStorage.getItem(LAST_CLOSED_KEY) || 0);
  if (!lastClosed) return false;
  if (hasActiveTabs()) return false;

  return Date.now() - lastClosed > AUTH_SESSION_GRACE_MS;
}

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

/**
 * 앱 시작 시 호출 — 30초 grace 만료 시 true 반환 (동기 정리 완료)
 */
export function evaluateAuthSessionOnStartup(): boolean {
  if (typeof window === 'undefined') return false;

  const shouldClear = shouldClearAuthOnStartup();

  if (shouldClear) {
    clearAuthStorageSync();
    console.log('[AuthSessionLifecycle] 브라우저 종료 30초 경과 — 로그인 정보 삭제');
  }

  touchTabHeartbeat();
  localStorage.removeItem(LAST_CLOSED_KEY);

  return shouldClear;
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

/** 브라우저/탭 종료 시 호출 — 즉시 삭제 대신 종료 시각 기록 */
export function recordBrowserClose(): void {
  if (typeof window === 'undefined') return;
  if (isPageRefreshing()) return;

  unregisterTab();
}

export function initAuthSessionLifecycle(): () => void {
  if (typeof window === 'undefined') return () => {};

  touchTabHeartbeat();

  const handleBeforeUnload = () => {
    if (isPageRefreshing()) {
      sessionStorage.setItem(PAGE_REFRESHING_KEY, 'true');
      return;
    }
    recordBrowserClose();
  };

  const handlePageHide = (event: PageTransitionEvent) => {
    if (event.persisted) return;
    if (isPageRefreshing()) return;
    recordBrowserClose();
  };

  const heartbeat = window.setInterval(() => {
    touchTabHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handlePageHide);

  const refreshFlagTimer = window.setTimeout(() => {
    sessionStorage.removeItem(PAGE_REFRESHING_KEY);
  }, 500);

  return () => {
    window.clearInterval(heartbeat);
    window.clearTimeout(refreshFlagTimer);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handlePageHide);
  };
}
