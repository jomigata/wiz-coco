import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';

/** 검사 참여 세션 (프로필 등록 후) */
export const JOIN_PARTICIPANT_STORAGE_KEY = 'wizcoco_join_participant';

export type JoinParticipantSession = {
  participantId: string;
  participantToken: string;
  assessmentId: string;
  accessCode: string;
  displayName: string;
  savedAt: number;
};

export function persistJoinParticipantSession(data: Omit<JoinParticipantSession, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  const payload: JoinParticipantSession = { ...data, savedAt: Date.now() };
  sessionStorage.setItem(JOIN_PARTICIPANT_STORAGE_KEY, JSON.stringify(payload));
}

export function readJoinParticipantSession(): JoinParticipantSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(JOIN_PARTICIPANT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JoinParticipantSession;
    if (!parsed?.participantToken || !parsed?.accessCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearJoinParticipantSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(JOIN_PARTICIPANT_STORAGE_KEY);
}

export function getJoinParticipantAuthHeader(accessCodeNorm?: string): Record<string, string> {
  const session = readJoinParticipantSession();
  if (!session?.participantToken) return {};
  if (accessCodeNorm) {
    const norm = normalizeAccessCodeInput(accessCodeNorm);
    if (session.accessCode !== norm) return {};
  }
  return { Authorization: `Participant ${session.participantToken}` };
}

export function hasJoinParticipantSessionForCode(accessCodeNorm: string): boolean {
  const session = readJoinParticipantSession();
  if (!session) return false;
  return session.accessCode === accessCodeNorm;
}
