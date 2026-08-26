import type { PortalChatMessage } from '@/lib/portalChatApi';

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
