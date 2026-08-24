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
  PORTAL_CARE_MANAGER_CHAT_LABEL,
} from '@/lib/portalCareManagerLabels';

export type PortalCounselorInquiryChatProps = {
  counselorName?: string;
};

export default function PortalCounselorInquiryChat({ counselorName }: PortalCounselorInquiryChatProps) {
  const [messages, setMessages] = useState<PortalChatMessage[]>([]);
  const [draft, setDraft] = useState('');
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
    setSending(true);
    setError('');
    try {
      const item = await sendPortalChatMessage(session.portalToken, text);
      setDraft('');
      setMessages((prev) => [...prev, item]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const chatSenderLabel = (counselorName || '').trim() || PORTAL_CARE_MANAGER_CHAT_LABEL;

  return (
    <section className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{PORTAL_INQUIRY_SECTION_TITLE}</h3>
          <p className="mt-1 text-sm text-slate-400">{PORTAL_INQUIRY_SECTION_DESC}</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-lg border border-slate-700/70 bg-slate-900/50 p-3"
        aria-live="polite"
      >
        {loading ? (
          <p className="text-sm text-slate-500">문의 내역을 불러오는 중…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">아직 문의가 없습니다. 궁금한 점을 남겨 주세요.</p>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderRole === 'portal';
            return (
              <div key={msg.messageId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? 'rounded-br-md bg-cyan-900/60 text-cyan-50'
                      : 'rounded-bl-md border border-slate-600 bg-slate-800 text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`mt-1 text-[11px] ${mine ? 'text-cyan-200/70' : 'text-slate-400'}`}>
                    {mine ? '나' : chatSenderLabel} · {formatChatTimestamp(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
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
          {sending ? '전송 중…' : '보내기'}
        </button>
      </div>
    </section>
  );
}
