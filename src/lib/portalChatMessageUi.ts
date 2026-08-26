import type { PortalChatMessage } from '@/lib/portalChatApi';

export function sortPortalChatMessagesAsc(messages: PortalChatMessage[]): PortalChatMessage[] {
  return [...messages].sort((a, b) => {
    const ta = a.scheduledAt || a.createdAt || '';
    const tb = b.scheduledAt || b.createdAt || '';
    return ta.localeCompare(tb);
  });
}

export function scrollToLatestChatAnchor(anchor: HTMLElement | null, behavior: ScrollBehavior = 'smooth') {
  if (!anchor) return;
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

export function readReceiptLabel(
  msg: PortalChatMessage,
  viewerRole: 'portal' | 'counselor',
  mine: boolean,
): string | null {
  if (!mine || (msg.isScheduled && msg.scheduledPending)) return null;
  return isMessageReadByRecipient(msg, viewerRole) ? '읽음' : '안 읽음';
}
