/**
 * 검사 시작(/join) 진입 시 — 새 검사자가 깨끗한 상태로 시작하도록 세션 초기화
 */
import { clearClientPortalSession } from '@/lib/clientPortalSession';
import { clearJoinAssessmentSession } from '@/lib/joinAssessmentSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';

export function resetJoinStartEnvironment(): void {
  clearJoinGuestSession();
  clearJoinParticipantSession();
  clearJoinAssessmentSession();
  clearClientPortalSession();
}
