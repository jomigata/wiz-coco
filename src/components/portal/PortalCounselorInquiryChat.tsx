'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cancelPortalScheduledMessage,
  deletePortalChatMessage,
  fetchPortalChatMessages,
  formatChatTimestamp,
  sendPortalChatMessage,
  sendPortalScheduledMessageNow,
  type PortalChatMessage,
} from '@/lib/portalChatApi';
import { readClientPortalSession } from '@/lib/clientPortalSession';
import DateTimeSpinFields, { defaultScheduledDate } from '@/components/ui/DateTimeSpinFields';
import {
  PORTAL_INQUIRY_SECTION_DESC,
  PORTAL_INQUIRY_SECTION_TITLE,
  portalTestManagerChatSenderLabel,
} from '@/lib/portalCareManagerLabels';
import {
  canDeleteUnreadOwnMessage,
  readReceiptLabel,
} from '@/lib/portalChatMessageUi';

export type PortalCounselorInquiryChatProps = {
  counselorName?: string;
  embeddedInTab?: boolean;
};

function MessageComposer({
  draft,
  onDraftChange,
  scheduleEnabled,
  onScheduleEnabledChange,
  scheduledDate,
  onScheduledDateChange,
  sending,
  onSend,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  scheduleEnabled: boolean;
  onScheduleEnabledChange: (enabled: boolean) => void;
  scheduledDate: Date;
  onScheduledDateChange: (date: Date) => void;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={scheduleEnabled}
            onChange={(e) => {
              onScheduleEnabledChange(e.target.checked);
              if (e.target.checked) {
                onScheduledDateChange(defaultScheduledDate());
              }
            }}
          />
          예약 전송
        </label>
      </div>
      {scheduleEnabled ? (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">예약 일시</p>
          <DateTimeSpinFields value={scheduledDate} onChange={onScheduledDateChange} />
        </div>
      ) : null}
      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={3}
          placeholder="질문을 입력하세요 (보내기 버튼으로 전송)"
          className="min-h-[72px] flex-1 resize-y rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !draft.trim()}
          className="shrink-0 self-end rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
        >
          {sending ? '전송 중…' : scheduleEnabled ? '예약' : '보내기'}
        </button>
      </div>
    </div>
  );
}

export default function PortalCounselorInquiryChat({
  counselorName,
  embeddedInTab = false,
}: PortalCounselorInquiryChatProps) {
  const [messages, setMessages] = useState<PortalChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => defaultScheduledDate());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const ta = a.scheduledAt || a.createdAt || '';
        const tb = b.scheduledAt || b.createdAt || '';
        return tb.localeCompare(ta);
      }),
    [messages],
  );

  const loadMessages = useCallback(async () => {
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      const items = await fetchPortalChatMessages(session.portalToken);
      setMessages(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문의 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => {
      void loadMessages();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      setError('로그인 세션이 만료되었습니다.');
      return;
    }

    let scheduledIso: string | undefined;
    if (scheduleEnabled) {
      if (scheduledDate.getTime() <= Date.now()) {
        setError('예약 일시는 현재 시각 이후여야 합니다.');
        return;
      }
      scheduledIso = scheduledDate.toISOString();
    }

    setSending(true);
    setError('');
    try {
      const item = await sendPortalChatMessage(session.portalToken, text, {
        scheduledAt: scheduledIso,
      });
      setDraft('');
      if (scheduleEnabled) {
        setScheduleEnabled(false);
        setScheduledDate(defaultScheduledDate());
      }
      setMessages((prev) => [...prev, item]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleSendScheduledNow = async (scheduledId: string) => {
    const session = readClientPortalSession();
    if (!session?.portalToken || sending) return;
    setSending(true);
    setError('');
    try {
      await sendPortalScheduledMessageNow(session.portalToken, scheduledId);
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '즉시 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleCancelScheduled = async (scheduledId: string) => {
    const session = readClientPortalSession();
    if (!session?.portalToken || sending) return;
    setSending(true);
    setError('');
    try {
      await cancelPortalScheduledMessage(session.portalToken, scheduledId);
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '예약 취소에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const session = readClientPortalSession();
    if (!session?.portalToken || sending) return;
    setSending(true);
    setError('');
    try {
      await deletePortalChatMessage(session.portalToken, messageId);
      setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 삭제에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const chatSenderLabel = portalTestManagerChatSenderLabel(counselorName);

  const messageList = (
    <div className="space-y-3" aria-live="polite">
      {loading ? (
        <p className="text-sm text-slate-500">문의 내역을 불러오는 중…</p>
      ) : sortedMessages.length === 0 ? (
        <p className="text-sm text-slate-500">아직 문의가 없습니다. 궁금한 점을 남겨 주세요.</p>
      ) : (
        sortedMessages.map((msg) => {
          const mine = msg.senderRole === 'portal';
          const scheduled = Boolean(msg.isScheduled && msg.scheduledPending);
          const receipt = readReceiptLabel(msg, 'portal', mine);
          const deletable = canDeleteUnreadOwnMessage(msg, 'portal');
          return (
            <div key={msg.messageId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  scheduled
                    ? 'rounded-br-md border border-dashed border-cyan-500/40 bg-cyan-950/30 text-cyan-50'
                    : mine
                      ? 'rounded-br-md bg-cyan-900/60 text-cyan-50'
                      : 'rounded-bl-md border border-slate-600 bg-slate-800 text-slate-100'
                }`}
              >
                {scheduled ? (
                  <p className="mb-1 text-[10px] font-medium text-cyan-300">
                    예약 전송 · {formatChatTimestamp(msg.scheduledAt)}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                {scheduled && mine ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void handleSendScheduledNow(msg.messageId)}
                      className="rounded-md bg-cyan-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
                    >
                      즉시발송
                    </button>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void handleCancelScheduled(msg.messageId)}
                      className="rounded-md border border-slate-500 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/5 disabled:opacity-50"
                    >
                      취소
                    </button>
                  </div>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className={`text-[11px] ${mine ? 'text-cyan-200/70' : 'text-slate-400'}`}>
                    {mine ? '나' : chatSenderLabel} ·{' '}
                    {formatChatTimestamp(scheduled ? msg.scheduledAt : msg.createdAt)}
                    {receipt ? ` · ${receipt}` : ''}
                  </p>
                  {deletable ? (
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void handleDeleteMessage(msg.messageId)}
                      className="text-[11px] text-red-300 hover:text-red-200 disabled:opacity-50"
                    >
                      삭제
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const composerProps = {
    draft,
    onDraftChange: setDraft,
    scheduleEnabled,
    onScheduleEnabledChange: setScheduleEnabled,
    scheduledDate,
    onScheduledDateChange: setScheduledDate,
    sending,
    onSend: () => void handleSend(),
  };

  if (embeddedInTab) {
    return (
      <>
        <div className="pb-52">
          <p className="text-sm text-slate-400">{PORTAL_INQUIRY_SECTION_DESC}</p>
          {error ? (
            <p className="mt-3 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">{messageList}</div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/80 bg-gray-900/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-slate-600/80 bg-slate-800/95 p-4 shadow-2xl ring-1 ring-white/5">
              <MessageComposer {...composerProps} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <section className="flex min-h-[420px] flex-col rounded-xl border border-slate-700/80 bg-slate-800/40 p-5">
      <div className="shrink-0 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{PORTAL_INQUIRY_SECTION_TITLE}</h3>
          <p className="mt-1 text-sm text-slate-400">{PORTAL_INQUIRY_SECTION_DESC}</p>
        </div>
      </div>

      <div className="mt-4 shrink-0 space-y-3 border-b border-slate-700/70 pb-4">
        <MessageComposer {...composerProps} />
      </div>

      {error ? (
        <p className="mt-3 shrink-0 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-700/70 bg-slate-900/50 p-3">
        {messageList}
      </div>
    </section>
  );
}
