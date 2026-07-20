/**
 * 이메일·SMS·카카오 알림·검사시작(/portal/login) 진입 전
 * Firebase·포털·join 세션을 모두 정리하고 다른 탭에도 동기화합니다.
 */
import { clearAllAuthStorage } from '@/utils/authSessionLifecycle';
import { clearJoinFreshParticipantFlow } from '@/lib/joinFlowMode';
import { resetJoinStartEnvironment } from '@/lib/joinStartReset';
import {
  clearClientPortalSession,
  clearClientPortalSessionWithBroadcast,
} from '@/lib/clientPortalSession';

export { isClientPortalLinkEntryPath } from '@/lib/clientPortalLinkEntryPaths';

const PORTAL_LINK_ENTRY_CHANNEL = 'wizcoco:portal-link-entry';

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

/** 검사시작·매직링크 진입 탭 — 다른 열린 탭까지 로그아웃 */
export async function resetAllSessionsBeforePortalLinkEntry(): Promise<void> {
  if (resetPromise) return resetPromise;

  resetPromise = applyPortalLinkEntrySessionReset(true);

  try {
    await resetPromise;
  } finally {
    resetPromise = null;
  }
}

/** 다른 탭에서 검사시작 진입 시 — 재브로드캐스트 없이 동일 정리 */
export async function resetAllSessionsFromPortalLinkEntryBroadcast(): Promise<void> {
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
