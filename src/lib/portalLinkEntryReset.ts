/**
 * 이메일·SMS·카카오 알림 링크(/go, /portal/login, 검사 링크) 진입 전
 * Firebase·포털·join 세션을 모두 정리합니다.
 */
import { clearAllAuthStorage } from '@/utils/authSessionLifecycle';
import { clearJoinFreshParticipantFlow } from '@/lib/joinFlowMode';
import { resetJoinStartEnvironment } from '@/lib/joinStartReset';

let resetPromise: Promise<void> | null = null;

export async function resetAllSessionsBeforePortalLinkEntry(): Promise<void> {
  if (resetPromise) return resetPromise;

  resetPromise = (async () => {
    resetJoinStartEnvironment();
    clearJoinFreshParticipantFlow();
    await clearAllAuthStorage({ fullReset: true });
  })();

  try {
    await resetPromise;
  } finally {
    resetPromise = null;
  }
}
