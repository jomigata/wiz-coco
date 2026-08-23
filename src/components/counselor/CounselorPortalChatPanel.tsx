'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  fetchCounselorChatMessages,
  fetchCounselorChatThreads,
  formatChatTimestamp,
  sendCounselorChatMessage,
  type PortalChatMessage,
  type PortalChatThread,
} from '@/lib/portalChatApi';
import { LoadingMessage } from '@/components/ui/LoadingMessage';

export default function CounselorPortalChatPanel() {
  const [threads, setThreads] = useState<PortalChatThread[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PortalChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedThread = threads.find((t) => t.portalId === selectedPortalId) || null;

  const loadThreads = useCallback(async () => {
    setError('');
    try {
      const items = await fetchCounselorChatThreads();
      setThreads(items);
      setSelectedPortalId((prev) => {
        if (prev && items.some((t) => t.portalId === prev)) return prev;
        return items[0]?.portalId || null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '채팅 목록 조회에 실패했습니다.');
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  const loadMessages = useCallback(async (portalId: string) => {
    setLoadingMessages(true);
    setError('');
    try {
      const items = await fetchCounselorChatMessages(portalId);
      setMessages(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : '채팅 내역 조회에 실패했습니다.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    const timer = window.setInterval(() => {
      void loadThreads();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedPortalId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedPortalId);
    const timer = window.setInterval(() => {
      void loadMessages(selectedPortalId);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [selectedPortalId, loadMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, selectedPortalId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedPortalId || sending) return;
    setSending(true);
    setError('');
    try {
      const item = await sendCounselorChatMessage(selectedPortalId, text);
      setDraft('');
      setMessages((prev) => [...prev, item]);
      void loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (loadingThreads) {
    return <LoadingMessage className="py-12" message="채팅 목록을 불러오는 중…" />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,320px)_1fr] lg:min-h-[520px]">
      <aside className="rounded-xl border border-slate-700/80 bg-slate-900/40">
        <div className="border-b border-slate-700/70 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-200">내담자</h3>
          <p className="mt-0.5 text-xs text-slate-500">{threads.length}명</p>
        </div>
        <ul className="max-h-[420px] overflow-y-auto divide-y divide-slate-800/80">
          {threads.length === 0 ? (
            <li className="px-4 py-6 text-sm text-slate-500">등록된 내담자가 없습니다.</li>
          ) : (
            threads.map((thread) => {
              const active = thread.portalId === selectedPortalId;
              return (
                <li key={thread.portalId}>
                  <button
                    type="button"
                    onClick={() => setSelectedPortalId(thread.portalId)}
                    className={`w-full px-4 py-3 text-left transition ${
                      active ? 'bg-cyan-950/40' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{thread.displayName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {formatAccessCodeDisplay(thread.accessCode)}
                        </p>
                      </div>
                      {thread.unreadCount > 0 ? (
                        <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {thread.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    {thread.lastMessage ? (
                      <p className="mt-1 truncate text-xs text-slate-400">{thread.lastMessage}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-600">아직 대화 없음</p>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section className="flex min-h-[420px] flex-col rounded-xl border border-slate-700/80 bg-slate-900/40">
        {selectedThread ? (
          <>
            <div className="border-b border-slate-700/70 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">{selectedThread.displayName}</h3>
              <p className="text-xs text-slate-500">
                나의코드 {formatAccessCodeDisplay(selectedThread.accessCode)}
              </p>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingMessages ? (
                <p className="text-sm text-slate-500">대화를 불러오는 중…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">아직 메시지가 없습니다.</p>
              ) : (
                messages.map((msg) => {
                  const mine = msg.senderRole === 'counselor';
                  return (
                    <div key={msg.messageId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'rounded-br-md bg-indigo-900/60 text-indigo-50'
                            : 'rounded-bl-md border border-slate-600 bg-slate-800 text-slate-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`mt-1 text-[11px] ${mine ? 'text-indigo-200/70' : 'text-slate-400'}`}>
                          {mine ? '나' : selectedThread.displayName} · {formatChatTimestamp(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {error ? (
              <p className="mx-4 mb-2 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <div className="border-t border-slate-700/70 p-4">
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
                  placeholder="답변을 입력하세요 (Enter 전송)"
                  className="min-h-[44px] flex-1 resize-y rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || !draft.trim()}
                  className="shrink-0 self-end rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  {sending ? '전송 중…' : '보내기'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
            왼쪽에서 내담자를 선택하세요.
          </div>
        )}
      </section>
    </div>
  );
}
