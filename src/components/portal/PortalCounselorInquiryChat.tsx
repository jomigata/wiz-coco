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
import { scrollToLatestChatAnchor } from '@/lib/portalChatMessageUi';
import PortalChatMessageComposer, {
  PortalChatFixedComposerShell,
} from '@/components/portal/PortalChatMessageComposer';
import PortalChatMessageList from '@/components/portal/PortalChatMessageList';

export type PortalCounselorInquiryChatProps = {
  counselorName?: string;
  embeddedInTab?: boolean;
};

export default function PortalCounselorInquiryChat({
  counselorName,
  embeddedInTab = false,
}: PortalCounselorInquiryChatProps) {
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof fetchPortalChatMessages>>>([]);
  const [draft, setDraft] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => defaultScheduledDate());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const latestAnchorRef = useRef<HTMLDivElement>(null);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollToLatestChatAnchor(latestAnchorRef.current, behavior);
  }, []);

  const loadMessages = useCallback(
    async (scrollAfter = false) => {
      const session = readClientPortalSession();
      if (!session?.portalToken) {
        setLoading(false);
        return;
      }
      setError('');
      try {
        const items = await fetchPortalChatMessages(session.portalToken);
        setMessages(items);
        if (scrollAfter) scrollToLatest();
      } catch (err) {
        setError(err instanceof Error ? err.message : '문의 내역을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [scrollToLatest],
  );

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
      await sendPortalChatMessage(session.portalToken, text, {
        scheduledAt: scheduledIso,
      });
      setDraft('');
      if (scheduleEnabled) {
        setScheduleEnabled(false);
        setScheduledDate(defaultScheduledDate());
      }
      await loadMessages(true);
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
      await loadMessages(true);
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
      await loadMessages(true);
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
      await loadMessages(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 삭제에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const chatSenderLabel = portalTestManagerChatSenderLabel(counselorName);

  const composer = (
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
  );

  const messageBlock = (
    <>
      <PortalChatMessageList
        messages={messages}
        loading={loading}
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
      />
      <div ref={latestAnchorRef} aria-hidden className="h-px w-full" />
    </>
  );

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
          <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">{messageBlock}</div>
        </div>
        <PortalChatFixedComposerShell>{composer}</PortalChatFixedComposerShell>
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

      <div className="mt-4 shrink-0 space-y-3 border-b border-slate-700/70 pb-4">{composer}</div>

      {error ? (
        <p className="mt-3 shrink-0 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-lg border border-slate-700/70 bg-slate-900/50 p-3">
        {messageBlock}
      </div>
    </section>
  );
}
