/**
 * 검사시작·매직링크 진입 시 세션 정리
 * - 같은 탭 + 전문가(상담사/관리자/기관): 검사시작 화면 이동 시 로그아웃 안 함
 * - 같은 탭 + 그 외: 이 탭만 로그아웃
 * - 새 탭에서 URL 직접 진입: 다른 모든 탭도 로그아웃
 */
import { clearAllAuthStorage, isPrivilegedProfessionalSessionActive } from '@/utils/authSessionLifecycle';
import { clearJoinFreshParticipantFlow } from '@/lib/joinFlowMode';
import { resetJoinStartEnvironment } from '@/lib/joinStartReset';
import {
  clearClientPortalSession,
  clearClientPortalSessionWithBroadcast,
} from '@/lib/clientPortalSession';
import { isSameTabPortalStartNavigationPath } from '@/lib/clientPortalLinkEntryPaths';

export { isClientPortalLinkEntryPath } from '@/lib/clientPortalLinkEntryPaths';

const PORTAL_LINK_ENTRY_CHANNEL = 'wizcoco:portal-link-entry';
const TAB_APP_SESSION_ACTIVE_KEY = 'wizcoco:tab-app-session-active';

let resetPromise: Promise<void> | null = null;

function broadcastPortalLinkEntryReset(): void {
  if (typeof window === 'undefined') return;
  try {
    const channel = new BroadcastChannel(PORTAL_LINK_ENTRY_CHANNEL);
    channel.postMessage({ type: 'reset' });
    channel.close();
  } catch {
    // BroadcastChannel 미지원
  }
}

/** sessionStorage — 탭마다 독립. 새 탭 첫 로드면 false */
export function hasTabAppSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(TAB_APP_SESSION_ACTIVE_KEY) === '1';
}

export function markTabAppSessionActive(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TAB_APP_SESSION_ACTIVE_KEY, '1');
}

export type PortalLinkEntryResetOptions = {
  /** false: 이 탭만. true: 다른 탭 포함. 미지정 시 탭 최초 앱 로드 여부로 판단 */
  notifyOtherTabs?: boolean;
  /** SPA로 검사시작 화면 이동 직전 (경로가 아직 /portal/login 이 아닐 때) */
  portalStartNavigation?: boolean;
};

function resolveNotifyOtherTabs(options?: PortalLinkEntryResetOptions): boolean {
  if (options?.notifyOtherTabs !== undefined) {
    return options.notifyOtherTabs;
  }
  return !hasTabAppSessionActive();
}

function shouldSkipPortalLinkEntryReset(
  notifyOtherTabs: boolean,
  options?: PortalLinkEntryResetOptions,
): boolean {
  if (notifyOtherTabs) return false;
  if (typeof window === 'undefined') return false;
  if (!isPrivilegedProfessionalSessionActive()) return false;
  if (options?.portalStartNavigation) return true;
  return isSameTabPortalStartNavigationPath(window.location.pathname || '');
}

/** 동일 탭 검사시작 이동 시 전문가 로그인 유지 여부 */
export function shouldSkipPortalLinkEntryResetForCurrentTab(
  options?: PortalLinkEntryResetOptions,
): boolean {
  return shouldSkipPortalLinkEntryReset(resolveNotifyOtherTabs(options), options);
}

async function applyPortalLinkEntrySessionReset(notifyOtherTabs: boolean): Promise<void> {
  resetJoinStartEnvironment();
  clearJoinFreshParticipantFlow();
  if (notifyOtherTabs) {
    clearClientPortalSessionWithBroadcast();
    await clearAllAuthStorage({ fullReset: true });
    broadcastPortalLinkEntryReset();
  } else {
    clearClientPortalSession();
    await clearAllAuthStorage();
  }
}

export async function resetAllSessionsBeforePortalLinkEntry(
  options?: PortalLinkEntryResetOptions,
): Promise<void> {
  const notifyOtherTabs = resolveNotifyOtherTabs(options);

  if (shouldSkipPortalLinkEntryReset(notifyOtherTabs, options)) {
    markTabAppSessionActive();
    return;
  }

  markTabAppSessionActive();

  if (resetPromise) return resetPromise;

  resetPromise = applyPortalLinkEntrySessionReset(notifyOtherTabs);

  try {
    await resetPromise;
  } finally {
    resetPromise = null;
  }
}

/** 다른 탭에서 검사시작·매직링크 새 탭 진입 시 — 재브로드캐스트 없이 동일 정리 */
export async function resetAllSessionsFromPortalLinkEntryBroadcast(): Promise<void> {
  markTabAppSessionActive();
  await applyPortalLinkEntrySessionReset(false);
}

export function subscribePortalLinkEntryResetEvents(onReset: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  try {
    const channel = new BroadcastChannel(PORTAL_LINK_ENTRY_CHANNEL);
    channel.onmessage = () => onReset();
    return () => channel.close();
  } catch {
    return () => undefined;
  }
}
