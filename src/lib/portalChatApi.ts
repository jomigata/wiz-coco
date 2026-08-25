/**
 * 내담자 ↔ 담당 상담사 1:1 문의 채팅 API
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

export type PortalChatReplyStatus = 'pending' | 'done';

export type PortalChatMessage = {
  messageId: string;
  portalId: string;
  counselorId: string;
  senderRole: 'portal' | 'counselor';
  message: string;
  createdAt: string | null;
  readByPortal: boolean;
  readByCounselor: boolean;
  scheduledAt?: string | null;
  isScheduled?: boolean;
  scheduledPending?: boolean;
};

export type PortalChatThread = {
  portalId: string;
  displayName: string;
  email?: string;
  phone?: string;
  accessCode: string;
  cohortName: string;
  primaryAssessmentId?: string;
  chatReplyStatus: PortalChatReplyStatus;
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
  options?: { scheduledAt?: string },
): Promise<PortalChatMessage> {
  const body: Record<string, string> = { message };
  if (options?.scheduledAt) body.scheduledAt = options.scheduledAt;

  const res = await fetch(`${getBaseUrl()}/api/portal-chat/me/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Portal ${portalToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '메시지 전송에 실패했습니다.');
  }
  return data.message as PortalChatMessage;
}

export async function cancelPortalScheduledMessage(
  portalToken: string,
  scheduledId: string,
): Promise<void> {
  const res = await fetch(
    `${getBaseUrl()}/api/portal-chat/me/scheduled/${encodeURIComponent(scheduledId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Portal ${portalToken}` },
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '예약 취소에 실패했습니다.');
  }
}

export async function sendPortalScheduledMessageNow(
  portalToken: string,
  scheduledId: string,
): Promise<PortalChatMessage> {
  const res = await fetch(
    `${getBaseUrl()}/api/portal-chat/me/scheduled/${encodeURIComponent(scheduledId)}/send-now`,
    {
      method: 'POST',
      headers: { Authorization: `Portal ${portalToken}` },
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '즉시 발송에 실패했습니다.');
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

export type SendCounselorChatOptions = {
  replyStatus?: PortalChatReplyStatus;
  scheduledAt?: string;
};

export async function sendCounselorChatMessage(
  portalId: string,
  message: string,
  options?: SendCounselorChatOptions,
): Promise<PortalChatMessage> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const body: Record<string, string> = { message };
  if (options?.replyStatus) body.replyStatus = options.replyStatus;
  if (options?.scheduledAt) body.scheduledAt = options.scheduledAt;

  const res = await fetch(`${getBaseUrl()}/api/portal-chat/threads/${encodeURIComponent(portalId)}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '메시지 전송에 실패했습니다.');
  }
  return data.message as PortalChatMessage;
}

export async function updateCounselorChatReplyStatus(
  portalId: string,
  replyStatus: PortalChatReplyStatus,
): Promise<void> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(`${getBaseUrl()}/api/portal-chat/threads/${encodeURIComponent(portalId)}/reply-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyStatus }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '답변 상태 변경에 실패했습니다.');
  }
}

export async function cancelCounselorScheduledMessage(scheduledId: string): Promise<void> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(`${getBaseUrl()}/api/portal-chat/scheduled/${encodeURIComponent(scheduledId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '예약 취소에 실패했습니다.');
  }
}

export async function sendCounselorScheduledMessageNow(scheduledId: string): Promise<PortalChatMessage> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(
    `${getBaseUrl()}/api/portal-chat/scheduled/${encodeURIComponent(scheduledId)}/send-now`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '즉시 발송에 실패했습니다.');
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

export function threadMatchesSearch(thread: PortalChatThread, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    thread.displayName,
    thread.email,
    thread.phone,
    thread.accessCode,
    thread.cohortName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function counselorChatProgressHref(thread: PortalChatThread): string | null {
  const assessmentId = (thread.primaryAssessmentId || '').trim();
  if (!assessmentId) return null;
  const params = new URLSearchParams({
    assessmentId,
    portalId: thread.portalId,
    from: 'chat',
  });
  return `/counselor/assessments/progress?${params.toString()}`;
}
