'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchPortalChatMessages,
  formatChatTimestamp,
  sendPortalChatMessage,
  type PortalChatMessage,
} from '@/lib/portalChatApi';
import { readClientPortalSession } from '@/lib/clientPortalSession';
import {
  PORTAL_INQUIRY_SECTION_DESC,
  PORTAL_INQUIRY_SECTION_TITLE,
  portalTestManagerChatSenderLabel,
} from '@/lib/portalCareManagerLabels';

export type PortalCounselorInquiryChatProps = {
  counselorName?: string;
  embeddedInTab?: boolean;
};

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PortalCounselorInquiryChat({
  counselorName,
  embeddedInTab = false,
}: PortalCounselorInquiryChatProps) {
  const [messages, setMessages] = useState<PortalChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      setError('로그인 세션이 만료되었습니다.');
      return;
    }

    let scheduledIso: string | undefined;
    if (scheduleEnabled && scheduledAt) {
      const dt = new Date(scheduledAt);
      if (Number.isNaN(dt.getTime())) {
        setError('예약 일시 형식을 확인해 주세요.');
        return;
      }
      if (dt.getTime() <= Date.now()) {
        setError('예약 일시는 현재 시각 이후여야 합니다.');
        return;
      }
      scheduledIso = dt.toISOString();
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
        setScheduledAt('');
      }
      setMessages((prev) => [...prev, item]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const chatSenderLabel = portalTestManagerChatSenderLabel(counselorName);

  return (
    <section className="flex min-h-[420px] flex-col rounded-xl border border-slate-700/80 bg-slate-800/40 p-5">
      {!embeddedInTab ? (
        <div className="shrink-0 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{PORTAL_INQUIRY_SECTION_TITLE}</h3>
            <p className="mt-1 text-sm text-slate-400">{PORTAL_INQUIRY_SECTION_DESC}</p>
          </div>
        </div>
      ) : (
        <p className="shrink-0 text-sm text-slate-400">{PORTAL_INQUIRY_SECTION_DESC}</p>
      )}

      <div
        ref={scrollRef}
        className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-700/70 bg-slate-900/50 p-3"
        aria-live="polite"
      >
        {loading ? (
          <p className="text-sm text-slate-500">문의 내역을 불러오는 중…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">아직 문의가 없습니다. 궁금한 점을 남겨 주세요.</p>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderRole === 'portal';
            const scheduled = Boolean(msg.isScheduled && msg.scheduledPending);
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
                  <p className={`mt-1 text-[11px] ${mine ? 'text-cyan-200/70' : 'text-slate-400'}`}>
                    {mine ? '나' : chatSenderLabel} ·{' '}
                    {formatChatTimestamp(scheduled ? msg.scheduledAt : msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error ? (
        <p className="mt-3 shrink-0 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-4 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => {
                setScheduleEnabled(e.target.checked);
                if (e.target.checked && !scheduledAt) {
                  setScheduledAt(toLocalDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000)));
                }
              }}
            />
            예약 전송
          </label>
        </div>
        {scheduleEnabled ? (
          <div className="flex flex-col-reverse items-start gap-2">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded border border-slate-600 bg-slate-900/70 px-2 py-1.5 text-xs text-white"
            />
            <p className="text-[11px] text-slate-500">예약 일시</p>
          </div>
        ) : null}
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            placeholder="질문을 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
            className="min-h-[44px] flex-1 resize-y rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !draft.trim()}
            className="shrink-0 self-end rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
          >
            {sending ? '전송 중…' : scheduleEnabled ? '예약' : '보내기'}
          </button>
        </div>
      </div>
    </section>
  );
}
