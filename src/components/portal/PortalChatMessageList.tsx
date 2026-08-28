'use client';

import React from 'react';
import { formatChatTimestamp, type PortalChatMessage } from '@/lib/portalChatApi';
import {
  canDeleteUnreadOwnMessage,
  isMessageUnreadForViewer,
  sortPortalChatMessagesAsc,
} from '@/lib/portalChatMessageUi';
import { LoadingSpinner } from '@/components/ui/LoadingMessage';

type UnreadIndicatorStyle = 'dot' | 'pill';

type Props = {
  messages: PortalChatMessage[];
  loading?: boolean;
  sending?: boolean;
  viewerRole: 'portal' | 'counselor';
  senderLabelForMine?: string;
  senderLabelForOther: string;
  emptyMessage?: string;
  loadingMessage?: string;
  onSendScheduledNow?: (scheduledId: string) => void;
  onCancelScheduled?: (scheduledId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  /** false면 삭제 버튼 숨김 (내 검사실) */
  allowDelete?: boolean;
  theme?: 'portal' | 'counselor';
  /** @deprecated 발송일시 뒤 빨간 「안읽음」 텍스트로 통일 */
  unreadIndicatorStyle?: UnreadIndicatorStyle;
};

const bubbleTheme = {
  portal: {
    mine: 'rounded-br-md bg-cyan-900/60 text-cyan-50',
    scheduled: 'rounded-br-md border border-dashed border-cyan-500/40 bg-cyan-950/30 text-cyan-50',
    scheduledLabel: 'text-cyan-300',
    mineMeta: 'text-cyan-200/70',
    sendNow: 'bg-cyan-700 hover:bg-cyan-600',
    unreadDot: 'text-amber-300',
    unreadPill: 'border-amber-400/50 bg-amber-400/15 text-amber-200',
  },
  counselor: {
    mine: 'rounded-br-md bg-indigo-900/60 text-indigo-50',
    scheduled: 'rounded-br-md border border-dashed border-indigo-400/50 bg-indigo-950/30 text-indigo-100',
    scheduledLabel: 'text-indigo-300',
    mineMeta: 'text-indigo-200/70',
    sendNow: 'bg-indigo-700 hover:bg-indigo-600',
    unreadDot: 'text-amber-300',
    unreadPill: 'border-amber-400/50 bg-amber-400/15 text-amber-200',
  },
} as const;

function UnreadLabel({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ml-1 font-medium text-red-400" aria-label="읽지 않음">
      · 안읽음
    </span>
  );
}

export default function PortalChatMessageList({
  messages,
  loading = false,
  sending = false,
  viewerRole,
  senderLabelForMine = '나',
  senderLabelForOther,
  emptyMessage = '아직 메시지가 없습니다.',
  loadingMessage = '메시지를 불러오는 중…',
  onSendScheduledNow,
  onCancelScheduled,
  onDeleteMessage,
  allowDelete = true,
  theme = 'portal',
}: Props) {
  const sortedMessages = sortPortalChatMessagesAsc(messages);
  const styles = bubbleTheme[theme];

  if (loading && sortedMessages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8" role="status" aria-label={loadingMessage}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!sortedMessages.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3" aria-live="polite">
      {sortedMessages.map((msg) => {
        const mine =
          viewerRole === 'portal' ? msg.senderRole === 'portal' : msg.senderRole === 'counselor';
        const scheduled = Boolean(msg.isScheduled && msg.scheduledPending);
        const unread = isMessageUnreadForViewer(msg, viewerRole, mine);
        const deletable = allowDelete && canDeleteUnreadOwnMessage(msg, viewerRole);
        const showScheduledActions = scheduled && mine && onSendScheduledNow && onCancelScheduled;

        return (
          <div key={msg.messageId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                scheduled
                  ? styles.scheduled
                  : mine
                    ? styles.mine
                    : 'rounded-bl-md border border-slate-600 bg-slate-800 text-slate-100'
              }`}
            >
              {scheduled ? (
                <p className={`mb-1 text-[10px] font-medium ${styles.scheduledLabel}`}>
                  예약 전송 · {formatChatTimestamp(msg.scheduledAt)}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
              {showScheduledActions ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => onSendScheduledNow(msg.messageId)}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50 ${styles.sendNow}`}
                  >
                    즉시발송
                  </button>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => onCancelScheduled(msg.messageId)}
                    className="rounded-md border border-slate-500 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    취소
                  </button>
                </div>
              ) : null}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className={`text-[11px] ${mine ? styles.mineMeta : 'text-slate-400'}`}>
                  {mine ? senderLabelForMine : senderLabelForOther} ·{' '}
                  {formatChatTimestamp(scheduled ? msg.scheduledAt : msg.createdAt)}
                  <UnreadLabel show={unread} />
                </p>
                {deletable && onDeleteMessage ? (
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => onDeleteMessage(msg.messageId)}
                    className="text-[11px] text-red-300 hover:text-red-200 disabled:opacity-50"
                  >
                    삭제
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
