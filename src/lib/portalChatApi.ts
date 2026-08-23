/**
 * 내 검사실 ↔ 담당 상담사 1:1 문의 채팅 API
 */

import { getCounselorToken } from '@/lib/assessmentApi';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export type PortalChatMessage = {
  messageId: string;
  portalId: string;
  counselorId: string;
  senderRole: 'portal' | 'counselor';
  message: string;
  createdAt: string | null;
  readByPortal: boolean;
  readByCounselor: boolean;
};

export type PortalChatThread = {
  portalId: string;
  displayName: string;
  accessCode: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
};

export async function fetchPortalChatMessages(portalToken: string): Promise<PortalChatMessage[]> {
  const res = await fetch(`${getBaseUrl()}/api/portal-chat/me/messages`, {
    headers: { Authorization: `Portal ${portalToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '문의 내역을 불러오지 못했습니다.');
  }
  return (data.messages || []) as PortalChatMessage[];
}

export async function sendPortalChatMessage(
  portalToken: string,
  message: string,
): Promise<PortalChatMessage> {
  const res = await fetch(`${getBaseUrl()}/api/portal-chat/me/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Portal ${portalToken}`,
    },
    body: JSON.stringify({ message }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '메시지 전송에 실패했습니다.');
  }
  return data.message as PortalChatMessage;
}

export async function fetchCounselorChatThreads(): Promise<PortalChatThread[]> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(`${getBaseUrl()}/api/portal-chat/threads`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '채팅 목록 조회에 실패했습니다.');
  }
  return (data.threads || []) as PortalChatThread[];
}

export async function fetchCounselorChatMessages(portalId: string): Promise<PortalChatMessage[]> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(`${getBaseUrl()}/api/portal-chat/threads/${encodeURIComponent(portalId)}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '채팅 내역 조회에 실패했습니다.');
  }
  return (data.messages || []) as PortalChatMessage[];
}

export async function sendCounselorChatMessage(
  portalId: string,
  message: string,
): Promise<PortalChatMessage> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(`${getBaseUrl()}/api/portal-chat/threads/${encodeURIComponent(portalId)}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '메시지 전송에 실패했습니다.');
  }
  return data.message as PortalChatMessage;
}

export function formatChatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
