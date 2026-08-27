'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelPortalScheduledMessage,
  deletePortalChatMessage,
  fetchPortalChatMessages,
  sendPortalChatMessage,
  sendPortalScheduledMessageNow,
} from '@/lib/portalChatApi';
import { readClientPortalSession } from '@/lib/clientPortalSession';
import { defaultScheduledDate } from '@/components/ui/DateTimeSpinFields';
import {
  PORTAL_INQUIRY_SECTION_DESC,
  PORTAL_INQUIRY_SECTION_TITLE,
  portalTestManagerChatSenderLabel,
} from '@/lib/portalCareManagerLabels';
import {
  scrollChatContainerToBottom,
  removePortalChatMessage,
  upsertPortalChatMessage,
  portalInquiryAttentionCount,
  readCachedPortalChatMessages,
  writeCachedPortalChatMessages,
} from '@/lib/portalChatMessageUi';
import PortalChatMessageComposer from '@/components/portal/PortalChatMessageComposer';
import PortalChatMessageList from '@/components/portal/PortalChatMessageList';

export type PortalCounselorInquiryChatProps = {
  counselorName?: string;
  embeddedInTab?: boolean;
  onAttentionCountChange?: (count: number) => void;
};

export default function PortalCounselorInquiryChat({
  counselorName,
  embeddedInTab = false,
  onAttentionCountChange,
}: PortalCounselorInquiryChatProps) {
  const portalCacheId = readClientPortalSession()?.portal?.accessCode || 'portal';
  const initialCached = readCachedPortalChatMessages('portal', portalCacheId);
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof fetchPortalChatMessages>>>(
    () => initialCached ?? [],
  );
  const [draft, setDraft] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => defaultScheduledDate());
  const [loading, setLoading] = useState(() => !(initialCached && initialCached.length > 0));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollChatContainerToBottom(messageScrollRef.current, behavior);
  }, []);

  const appendMessage = useCallback((item: Awaited<ReturnType<typeof fetchPortalChatMessages>>[number]) => {
    pendingScrollRef.current = true;
    setMessages((prev) => upsertPortalChatMessage(prev, item));
  }, []);

  useEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    scrollToLatest('smooth');
  }, [messages, scrollToLatest]);

  useEffect(() => {
    onAttentionCountChange?.(portalInquiryAttentionCount(messages));
  }, [messages, onAttentionCountChange]);

  useEffect(() => {
    if (messages.length > 0) {
      writeCachedPortalChatMessages('portal', portalCacheId, messages);
    }
  }, [messages, portalCacheId]);

  const loadMessages = useCallback(async () => {
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      setLoading(false);
      return;
    }
    const cached = readCachedPortalChatMessages('portal', portalCacheId);
    if (cached?.length) {
      setMessages(cached);
      pendingScrollRef.current = true;
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const items = await fetchPortalChatMessages(session.portalToken);
      setMessages((prev) => {
        if (items.length !== prev.length) {
          pendingScrollRef.current = true;
        }
        return items;
      });
      writeCachedPortalChatMessages('portal', portalCacheId, items);
    } catch (err) {
      if (!cached?.length) {
        setError(err instanceof Error ? err.message : '문의 내역을 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [portalCacheId]);

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
      appendMessage(item);
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
      const item = await sendPortalScheduledMessageNow(session.portalToken, scheduledId);
      setMessages((prev) => {
        const withoutScheduled = removePortalChatMessage(prev, scheduledId);
        pendingScrollRef.current = true;
        return upsertPortalChatMessage(withoutScheduled, item);
      });
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
      setMessages((prev) => removePortalChatMessage(prev, scheduledId));
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
      setMessages((prev) => removePortalChatMessage(prev, messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 삭제에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const chatSenderLabel = portalTestManagerChatSenderLabel(counselorName);
  const showInitialLoading = loading && messages.length === 0;

  const messagePane = (
    <div
      ref={messageScrollRef}
      data-chat-scroll
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
    >
      <PortalChatMessageList
        messages={messages}
        loading={showInitialLoading}
        sending={sending}
        viewerRole="portal"
        senderLabelForMine="나"
        senderLabelForOther={chatSenderLabel}
        emptyMessage="아직 문의가 없습니다. 궁금한 점을 남겨 주세요."
        loadingMessage="문의 내역을 불러오는 중…"
        onSendScheduledNow={(id) => void handleSendScheduledNow(id)}
        onCancelScheduled={(id) => void handleCancelScheduled(id)}
        onDeleteMessage={(id) => void handleDeleteMessage(id)}
        theme="portal"
        unreadIndicatorStyle="pill"
      />
    </div>
  );

  const composerPane = (
    <div className="shrink-0 border-t border-slate-700/80 bg-slate-900/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)]">
      <div className="rounded-2xl border border-slate-600/80 bg-slate-800/95 p-4 shadow-2xl ring-1 ring-white/5">
        <PortalChatMessageComposer
          theme="portal"
          draft={draft}
          onDraftChange={setDraft}
          scheduleEnabled={scheduleEnabled}
          onScheduleEnabledChange={setScheduleEnabled}
          scheduledDate={scheduledDate}
          onScheduledDateChange={setScheduledDate}
          sending={sending}
          onSend={() => void handleSend()}
        />
      </div>
    </div>
  );

  if (embeddedInTab) {
    return (
      <div className="flex min-h-[min(58vh,560px)] flex-col">
        <p className="mb-3 shrink-0 text-sm text-slate-400">{PORTAL_INQUIRY_SECTION_DESC}</p>
        {error ? (
          <p className="mb-3 shrink-0 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/50">
          {messagePane}
          {composerPane}
        </div>
      </div>
    );
  }

  return (
    <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800/40">
      <div className="shrink-0 border-b border-slate-700/70 p-5">
        <h3 className="text-sm font-semibold text-slate-200">{PORTAL_INQUIRY_SECTION_TITLE}</h3>
        <p className="mt-1 text-sm text-slate-400">{PORTAL_INQUIRY_SECTION_DESC}</p>
        {error ? (
          <p className="mt-3 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </div>
      {messagePane}
      {composerPane}
    </section>
  );
}
