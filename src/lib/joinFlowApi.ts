/**
 * 검사 시작 플로우 API — 게스트 검사 선행 · 프로필 등록 · 나의코드 발송
 */

import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { getJoinGuestAuthHeader } from '@/lib/joinGuestSession';
import { getJoinParticipantAuthHeader } from '@/lib/joinParticipantSession';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) return process.env.NEXT_PUBLIC_FLASK_API_URL;
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') return window.location.origin;
  return 'http://localhost:5000';
};

export type RegisterParticipantBody = {
  accessCode: string;
  displayName: string;
  birthYear: string;
  gender: string;
  region: string;
  email: string;
  phone: string;
};

export async function startGuestJoin(accessCode: string): Promise<{
  guestId: string;
  guestToken: string;
  assessmentId: string;
  accessCode: string;
}> {
  const res = await fetch(`${getBaseUrl()}/api/join/guest-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode: normalizeAccessCodeInput(accessCode) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '검사 시작에 실패했습니다.');
  }
  return data;
}

export async function registerJoinParticipant(body: RegisterParticipantBody): Promise<{
  participantId: string;
  participantToken: string;
  assessmentId: string;
  accessCode: string;
  displayName: string;
  credentialsSent?: boolean;
  message?: string;
}> {
  const guestHeaders = getJoinGuestAuthHeader(body.accessCode);
  const res = await fetch(`${getBaseUrl()}/api/join/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...guestHeaders },
    body: JSON.stringify({
      ...body,
      accessCode: normalizeAccessCodeInput(body.accessCode),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '등록에 실패했습니다.');
  }
  return data;
}

export async function finalizeJoinParticipant(): Promise<{
  allCompleted: boolean;
  credentialsSent?: boolean;
  message: string;
  completedCount?: number;
  totalCount?: number;
}> {
  const headers = getJoinParticipantAuthHeader();
  if (!headers.Authorization) {
    throw new Error('참여 세션이 없습니다.');
  }
  const res = await fetch(`${getBaseUrl()}/api/join/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '처리에 실패했습니다.');
  }
  return data;
}
