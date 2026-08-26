'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { counselorClientProgressHref } from '@/lib/counselorClientRoutes';
import {
  cancelCounselorScheduledMessage,
  counselorChatProgressHref,
  deleteCounselorChatMessage,
  fetchCounselorChatMessages,
  fetchCounselorChatThreads,
  formatChatTimestamp,
  sendCounselorChatMessage,
  sendCounselorScheduledMessageNow,
  threadMatchesSearch,
  type PortalChatMessage,
  type PortalChatThread,
} from '@/lib/portalChatApi';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import DateTimeSpinFields, { defaultScheduledDate } from '@/components/ui/DateTimeSpinFields';
import {
  canDeleteUnreadOwnMessage,
  readReceiptLabel,
} from '@/lib/portalChatMessageUi';

function threadTitle(thread: PortalChatThread): string {
  const name = (thread.displayName || '').trim() || '내담자';
  const group = (thread.cohortName || '').trim();
  return group ? `${name} / ${group}` : name;
}

function sortThreads(threads: PortalChatThread[], selectedPortalId: string | null): PortalChatThread[] {
  return [...threads].sort((a, b) => {
    if (selectedPortalId) {
      if (a.portalId === selectedPortalId) return -1;
      if (b.portalId === selectedPortalId) return 1;
    }
    const unreadDiff = (b.unreadCount || 0) - (a.unreadCount || 0);
    if (unreadDiff !== 0) return unreadDiff;
    const timeDiff = (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '');
    if (timeDiff !== 0) return timeDiff;
    return threadTitle(a).localeCompare(threadTitle(b), 'ko');
  });
}

export default function CounselorPortalChatPanel() {
  const [threads, setThreads] = useState<PortalChatThread[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PortalChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => defaultScheduledDate());
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredThreads = useMemo(
    () => threads.filter((thread) => threadMatchesSearch(thread, searchQuery)),
    [threads, searchQuery],
  );
  const sortedThreads = useMemo(
    () => sortThreads(filteredThreads, selectedPortalId),
    [filteredThreads, selectedPortalId],
  );
  const selectedThread = threads.find((t) => t.portalId === selectedPortalId) || null;
  const progressHref = selectedThread
    ? counselorChatProgressHref(selectedThread) ||
      (selectedThread.primaryAssessmentId
        ? counselorClientProgressHref(selectedThread.primaryAssessmentId, selectedThread.portalId)
        : null)
    : null;

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const ta = a.scheduledAt || a.createdAt || '';
        const tb = b.scheduledAt || b.createdAt || '';
        return tb.localeCompare(ta);
      }),
    [messages],
  );

  const loadThreads = useCallback(async (keepSelection = true) => {
    setError('');
    try {
      const items = await fetchCounselorChatThreads();
      setThreads(items);
      if (keepSelection) {
        setSelectedPortalId((prev) => {
          if (prev && items.some((t) => t.portalId === prev)) return prev;
          return items[0]?.portalId || null;
        });
      }
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
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedPortalId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedPortalId);
  }, [selectedPortalId, loadMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
  }, [sortedMessages, selectedPortalId]);

  const handleSelectThread = (portalId: string) => {
    if (portalId === selectedPortalId) return;
    setSelectedPortalId(portalId);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedPortalId || sending) return;

    let scheduledIso: string | undefined;
    const wasScheduled = scheduleEnabled;
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
      const item = await sendCounselorChatMessage(selectedPortalId, text, {
        scheduledAt: scheduledIso,
      });
      setDraft('');
      setMessages((prev) => [...prev, item]);
      if (wasScheduled) {
        setScheduleEnabled(false);
        setScheduledDate(defaultScheduledDate());
      }
      await loadThreads(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleSendScheduledNow = async (scheduledId: string) => {
    if (!selectedPortalId || sending) return;
    setSending(true);
    setError('');
    try {
      await sendCounselorScheduledMessageNow(scheduledId);
      await loadMessages(selectedPortalId);
      await loadThreads(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '즉시 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleCancelScheduled = async (scheduledId: string) => {
    if (!selectedPortalId || sending) return;
    setSending(true);
    setError('');
    try {
      await cancelCounselorScheduledMessage(scheduledId);
      await loadMessages(selectedPortalId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '예약 취소에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedPortalId || sending) return;
    setSending(true);
    setError('');
    try {
      await deleteCounselorChatMessage(selectedPortalId, messageId);
      setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
      await loadThreads(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 삭제에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (loadingThreads) {
    return <LoadingMessage className="py-12" message="채팅 목록을 불러오는 중…" />;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="내담자 이름·이메일·전화번호·그룹명·나의코드 검색"
          className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none"
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/40">
          <div className="shrink-0 border-b border-slate-800/80 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            내담자
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-slate-800/80 overflow-y-auto overscroll-contain">
            {sortedThreads.length === 0 ? (
              <li className="px-4 py-6 text-sm text-slate-500">
                {searchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 내담자가 없습니다.'}
              </li>
            ) : (
              sortedThreads.map((thread) => {
                const active = thread.portalId === selectedPortalId;
                return (
                  <li key={thread.portalId}>
                    <button
                      type="button"
                      onClick={() => handleSelectThread(thread.portalId)}
                      className={`w-full border-l-2 px-3 py-3 text-left transition ${
                        active
                          ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-inset ring-cyan-500/35'
                          : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-white">{threadTitle(thread)}</p>
                        {thread.unreadCount > 0 ? (
                          <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {thread.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {thread.lastMessageAt ? formatChatTimestamp(thread.lastMessageAt) : '대화 없음'}
                      </p>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/40">
          {selectedThread ? (
            <>
              <div className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-slate-700/70 px-4 py-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">{threadTitle(selectedThread)}</h3>
                  <p className="text-xs text-slate-500">
                    나의코드 {formatAccessCodeDisplay(selectedThread.accessCode)}
                  </p>
                </div>
                {progressHref ? (
                  <AuthLink
                    href={progressHref}
                    className="shrink-0 rounded-lg border border-sky-500/40 bg-sky-950/40 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-900/50"
                  >
                    상담진행 현황
                  </AuthLink>
                ) : null}
              </div>

              <div className="shrink-0 space-y-3 border-b border-slate-700/70 p-4">
                {error ? (
                  <p className="rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={scheduleEnabled}
                      onChange={(e) => {
                        setScheduleEnabled(e.target.checked);
                        if (e.target.checked) {
                          setScheduledDate(defaultScheduledDate());
                        }
                      }}
                    />
                    예약 전송
                  </label>
                </div>

                {scheduleEnabled ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">예약 일시</p>
                    <DateTimeSpinFields value={scheduledDate} onChange={setScheduledDate} />
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
                    placeholder="답변을 입력하세요 (Enter 전송)"
                    className="min-h-[44px] flex-1 resize-y rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || !draft.trim()}
                    className="shrink-0 self-end rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {sending ? '전송 중…' : scheduleEnabled ? '예약' : '보내기'}
                  </button>
                </div>
              </div>

              <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
                {loadingMessages ? (
                  <p className="text-sm text-slate-500">대화를 불러오는 중…</p>
                ) : sortedMessages.length === 0 ? (
                  <p className="text-sm text-slate-500">아직 메시지가 없습니다.</p>
                ) : (
                  sortedMessages.map((msg) => {
                    const mine = msg.senderRole === 'counselor';
                    const scheduled = Boolean(msg.isScheduled && msg.scheduledPending);
                    const receipt = readReceiptLabel(msg, 'counselor', mine);
                    const deletable = canDeleteUnreadOwnMessage(msg, 'counselor');
                    return (
                      <div key={msg.messageId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            scheduled
                              ? 'rounded-br-md border border-dashed border-indigo-400/50 bg-indigo-950/30 text-indigo-100'
                              : mine
                                ? 'rounded-br-md bg-indigo-900/60 text-indigo-50'
                                : 'rounded-bl-md border border-slate-600 bg-slate-800 text-slate-100'
                          }`}
                        >
                          {scheduled ? (
                            <p className="mb-1 text-[10px] font-medium text-indigo-300">
                              예약 전송 · {formatChatTimestamp(msg.scheduledAt)}
                            </p>
                          ) : null}
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          {scheduled ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={sending}
                                onClick={() => void handleSendScheduledNow(msg.messageId)}
                                className="rounded-md bg-indigo-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
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
                            <p className={`text-[11px] ${mine ? 'text-indigo-200/70' : 'text-slate-400'}`}>
                              {mine ? '상담사' : selectedThread.displayName} ·{' '}
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
            </>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-slate-500">
              왼쪽에서 내담자를 선택하세요.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
