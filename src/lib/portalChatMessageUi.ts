import type { PortalChatMessage } from '@/lib/portalChatApi';
import { readSWRCache, writeSWRCache } from '@/utils/staleWhileRevalidateCache';

const PORTAL_CHAT_CACHE_SCOPE = 'session';
const PORTAL_CHAT_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 12;
export const PORTAL_CHAT_CACHE_PREVIEW_COUNT = 10;

export function sortPortalChatMessagesAsc(messages: PortalChatMessage[]): PortalChatMessage[] {
  return [...messages].sort((a, b) => {
    const ta = a.scheduledAt || a.createdAt || '';
    const tb = b.scheduledAt || b.createdAt || '';
    return ta.localeCompare(tb);
  });
}

/** API 응답 메시지를 목록에 즉시 반영 (새로고침 없이) */
export function upsertPortalChatMessage(
  messages: PortalChatMessage[],
  item: PortalChatMessage,
): PortalChatMessage[] {
  const filtered = messages.filter((m) => m.messageId !== item.messageId);
  return sortPortalChatMessagesAsc([...filtered, item]);
}

export function removePortalChatMessage(
  messages: PortalChatMessage[],
  messageId: string,
): PortalChatMessage[] {
  return messages.filter((m) => m.messageId !== messageId);
}

export function scrollChatContainerToBottom(
  container: HTMLElement | null,
  behavior: ScrollBehavior = 'smooth',
) {
  if (!container) return;
  requestAnimationFrame(() => {
    container.scrollTo({ top: container.scrollHeight, behavior });
  });
}

export function scrollToLatestChatAnchor(anchor: HTMLElement | null, behavior: ScrollBehavior = 'smooth') {
  if (!anchor) return;
  const container = anchor.closest('[data-chat-scroll]') as HTMLElement | null;
  if (container) {
    scrollChatContainerToBottom(container, behavior);
    return;
  }
  requestAnimationFrame(() => {
    anchor.scrollIntoView({ behavior, block: 'end' });
  });
}

export function isMessageReadByRecipient(
  msg: PortalChatMessage,
  viewerRole: 'portal' | 'counselor',
): boolean {
  if (msg.isScheduled && msg.scheduledPending) return false;
  if (viewerRole === 'portal') {
    return msg.senderRole === 'portal' ? msg.readByCounselor : msg.readByPortal;
  }
  return msg.senderRole === 'counselor' ? msg.readByPortal : msg.readByCounselor;
}

export function canDeleteUnreadOwnMessage(
  msg: PortalChatMessage,
  viewerRole: 'portal' | 'counselor',
): boolean {
  if (msg.isScheduled && msg.scheduledPending) return false;
  if (viewerRole === 'portal') {
    return msg.senderRole === 'portal' && !msg.readByCounselor;
  }
  return msg.senderRole === 'counselor' && !msg.readByPortal;
}

/** 내 메시지 — 상대가 아직 읽지 않음 */
export function isOwnMessageUnreadByRecipient(
  msg: PortalChatMessage,
  viewerRole: 'portal' | 'counselor',
): boolean {
  if (msg.isScheduled && msg.scheduledPending) return false;
  return !isMessageReadByRecipient(msg, viewerRole);
}

/** 받은 메시지 — 내가 아직 읽지 않음 */
export function isIncomingMessageUnread(
  msg: PortalChatMessage,
  viewerRole: 'portal' | 'counselor',
): boolean {
  if (msg.isScheduled && msg.scheduledPending) return false;
  if (viewerRole === 'portal') {
    return msg.senderRole === 'counselor' && !msg.readByPortal;
  }
  return msg.senderRole === 'portal' && !msg.readByCounselor;
}

export function isMessageUnreadForViewer(
  msg: PortalChatMessage,
  viewerRole: 'portal' | 'counselor',
  mine: boolean,
): boolean {
  return mine
    ? isOwnMessageUnreadByRecipient(msg, viewerRole)
    : isIncomingMessageUnread(msg, viewerRole);
}

export function chatMessageUnreadSymbol(
  msg: PortalChatMessage,
  viewerRole: 'portal' | 'counselor',
  mine: boolean,
): string | null {
  if (isMessageUnreadForViewer(msg, viewerRole, mine)) {
    return '●';
  }
  return null;
}

/** 내검사실 상담·문의 탭 배지 — 예약 대기 + 읽지 않은 송·수신 메시지 */
export function portalInquiryAttentionCount(messages: PortalChatMessage[]): number {
  return messages.filter((msg) => {
    if (msg.isScheduled && msg.scheduledPending) return true;
    if (msg.senderRole === 'counselor' && !msg.readByPortal) return true;
    if (msg.senderRole === 'portal' && !msg.readByCounselor) return true;
    return false;
  }).length;
}

/** 상담사 화면 — 내담자 예약 전송 중 아직 발송되지 않은 메시지 제외 */
export function filterCounselorVisibleChatMessages(messages: PortalChatMessage[]): PortalChatMessage[] {
  return messages.filter(
    (msg) => !(msg.senderRole === 'portal' && msg.isScheduled && msg.scheduledPending),
  );
}

/** 상담사 1:1 — 미읽음 + 예약 대기(상담사·내담자) 건수 */
export function counselorChatAttentionCount(messages: PortalChatMessage[]): number {
  return messages.filter((msg) => {
    if (msg.isScheduled && msg.scheduledPending) return true;
    if (msg.senderRole === 'portal' && !msg.readByCounselor) return true;
    return false;
  }).length;
}

function portalChatCacheKey(scope: 'portal' | 'counselor', id: string): string {
  return `swr:portalChatMessages:${scope}:${id.trim()}`;
}

export function readCachedPortalChatMessages(
  scope: 'portal' | 'counselor',
  id: string,
): PortalChatMessage[] | null {
  if (typeof window === 'undefined' || !id.trim()) return null;
  const cached = readSWRCache<{ messages: PortalChatMessage[] }>(
    portalChatCacheKey(scope, id),
    { scope: PORTAL_CHAT_CACHE_SCOPE, maxAgeMs: PORTAL_CHAT_CACHE_MAX_AGE_MS },
  );
  if (cached.isFresh && cached.data) {
    return sortPortalChatMessagesAsc(cached.data.messages || []);
  }
  return null;
}

/** 목록 진입 시 즉시 표시할 최근 N개 (전체 캐시의 마지막 구간) */
export function readCachedPortalChatMessagesPreview(
  scope: 'portal' | 'counselor',
  id: string,
  limit = PORTAL_CHAT_CACHE_PREVIEW_COUNT,
): PortalChatMessage[] | null {
  const cached = readCachedPortalChatMessages(scope, id);
  if (!cached?.length) return null;
  if (cached.length <= limit) return cached;
  return cached.slice(-limit);
}

export function writeCachedPortalChatMessages(
  scope: 'portal' | 'counselor',
  id: string,
  messages: PortalChatMessage[],
): void {
  if (typeof window === 'undefined' || !id.trim()) return;
  writeSWRCache(
    portalChatCacheKey(scope, id),
    { messages: sortPortalChatMessagesAsc(messages) },
    { scope: PORTAL_CHAT_CACHE_SCOPE },
  );
}
