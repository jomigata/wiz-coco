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
import { defaultScheduledDate } from '@/components/ui/DateTimeSpinFields';
import { scrollToLatestChatAnchor, removePortalChatMessage, upsertPortalChatMessage, filterCounselorVisibleChatMessages } from '@/lib/portalChatMessageUi';
import PortalChatMessageComposer, {
  PortalChatFixedComposerShell,
} from '@/components/portal/PortalChatMessageComposer';
import PortalChatMessageList from '@/components/portal/PortalChatMessageList';

function threadTitle(thread: PortalChatThread): string {
  const name = (thread.displayName || '').trim() || '내담자';
  const group = (thread.cohortName || '').trim();
  return group ? `${name} / ${group}` : name;
}

function sortThreads(
  threads: PortalChatThread[],
  sortKey: 'name' | 'group',
  sortDir: 'asc' | 'desc',
): PortalChatThread[] {
  return [...threads].sort((a, b) => {
    const aName = (a.displayName || '').trim();
    const bName = (b.displayName || '').trim();
    const aGroup = (a.cohortName || '').trim();
    const bGroup = (b.cohortName || '').trim();
    const primary =
      sortKey === 'name'
        ? aName.localeCompare(bName, 'ko')
        : aGroup.localeCompare(bGroup, 'ko') || aName.localeCompare(bName, 'ko');
    return sortDir === 'asc' ? primary : -primary;
  });
}

type ThreadSortKey = 'name' | 'group';
type ThreadSortDir = 'asc' | 'desc';

function SortArrowButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: ThreadSortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
        active ? 'bg-slate-700/80 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
      }`}
      title={`${label} ${direction === 'asc' ? '오름차순' : '내림차순'}`}
    >
      {label}
      <span aria-hidden className="text-[9px]">
        {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

export default function CounselorPortalChatPanel() {
  const [threads, setThreads] = useState<PortalChatThread[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PortalChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [threadSortKey, setThreadSortKey] = useState<ThreadSortKey>('name');
  const [threadSortDir, setThreadSortDir] = useState<ThreadSortDir>('asc');
  const [dismissedUnreadPortalIds, setDismissedUnreadPortalIds] = useState<Set<string>>(() => new Set());
  const [stickyUnreadByPortalId, setStickyUnreadByPortalId] = useState<Record<string, number>>({});
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => defaultScheduledDate());
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const latestAnchorRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);

  const filteredThreads = useMemo(
    () => threads.filter((thread) => threadMatchesSearch(thread, searchQuery)),
    [threads, searchQuery],
  );
  const sortedThreads = useMemo(
    () => sortThreads(filteredThreads, threadSortKey, threadSortDir),
    [filteredThreads, threadSortKey, threadSortDir],
  );
  const visibleMessages = useMemo(
    () => filterCounselorVisibleChatMessages(messages),
    [messages],
  );
  const selectedThread = threads.find((t) => t.portalId === selectedPortalId) || null;
  const progressHref = selectedThread
    ? counselorChatProgressHref(selectedThread) ||
      (selectedThread.primaryAssessmentId
        ? counselorClientProgressHref(selectedThread.primaryAssessmentId, selectedThread.portalId)
        : null)
    : null;

  const scrollToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollToLatestChatAnchor(latestAnchorRef.current, behavior);
  }, []);

  const appendMessage = useCallback((item: PortalChatMessage) => {
    pendingScrollRef.current = true;
    setMessages((prev) => upsertPortalChatMessage(prev, item));
  }, []);

  useEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    scrollToLatest('smooth');
  }, [messages, scrollToLatest]);

  const loadThreads = useCallback(async (keepSelection = true) => {
    setError('');
    try {
      const items = await fetchCounselorChatThreads();
      setThreads(items);
      setStickyUnreadByPortalId((prev) => {
        const next = { ...prev };
        for (const thread of items) {
          if (thread.unreadCount > 0) {
            next[thread.portalId] = Math.max(next[thread.portalId] || 0, thread.unreadCount);
          }
        }
        return next;
      });
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

  const dismissThreadUnread = useCallback((portalId: string) => {
    setDismissedUnreadPortalIds((prev) => {
      if (prev.has(portalId)) return prev;
      const next = new Set(prev);
      next.add(portalId);
      return next;
    });
    setThreads((prev) =>
      prev.map((thread) =>
        thread.portalId === portalId ? { ...thread, unreadCount: 0 } : thread,
      ),
    );
    setStickyUnreadByPortalId((prev) => {
      if (!(portalId in prev)) return prev;
      const next = { ...prev };
      delete next[portalId];
      return next;
    });
  }, []);

  const ackThreadRead = useCallback(
    async (portalId: string) => {
      if (!portalId) return;
      dismissThreadUnread(portalId);
      try {
        await fetchCounselorChatMessages(portalId);
      } catch {
        // ignore — UI already cleared badge
      }
    },
    [dismissThreadUnread],
  );

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

  const handleSelectThread = (portalId: string) => {
    setSelectedPortalId(portalId);
    void ackThreadRead(portalId);
  };

  const handleMessageAreaReadAck = () => {
    if (!selectedPortalId) return;
    void ackThreadRead(selectedPortalId);
  };

  const toggleThreadSort = (key: ThreadSortKey) => {
    if (threadSortKey === key) {
      setThreadSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setThreadSortKey(key);
    setThreadSortDir('asc');
  };

  const displayUnreadCount = (thread: PortalChatThread) => {
    if (dismissedUnreadPortalIds.has(thread.portalId)) return 0;
    return Math.max(thread.unreadCount, stickyUnreadByPortalId[thread.portalId] || 0);
  };

  const showUnreadBadge = (thread: PortalChatThread) => displayUnreadCount(thread) > 0;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedPortalId || sending) return;

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
      const item = await sendCounselorChatMessage(selectedPortalId, text, {
        scheduledAt: scheduledIso,
      });
      setDraft('');
      if (scheduleEnabled) {
        setScheduleEnabled(false);
        setScheduledDate(defaultScheduledDate());
      }
      appendMessage(item);
      void loadThreads(true);
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
      const item = await sendCounselorScheduledMessageNow(scheduledId);
      setMessages((prev) => {
        const withoutScheduled = removePortalChatMessage(prev, scheduledId);
        pendingScrollRef.current = true;
        return upsertPortalChatMessage(withoutScheduled, item);
      });
      void loadThreads(true);
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
      setMessages((prev) => removePortalChatMessage(prev, scheduledId));
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
      setMessages((prev) => removePortalChatMessage(prev, messageId));
      void loadThreads(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 삭제에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (loadingThreads) {
    return <LoadingMessage className="py-12" message="채팅 목록을 불러오는 중…" />;
  }

  const composer = selectedThread ? (
    <PortalChatMessageComposer
      theme="counselor"
      draft={draft}
      onDraftChange={setDraft}
      scheduleEnabled={scheduleEnabled}
      onScheduleEnabledChange={setScheduleEnabled}
      scheduledDate={scheduledDate}
      onScheduledDateChange={setScheduledDate}
      sending={sending}
      onSend={() => void handleSend()}
      placeholder="답변을 입력하세요 (Ctrl+Enter 전송, Enter 줄바꿈)"
    />
  ) : null;

  return (
    <>
      <div className={`flex flex-col gap-3 ${selectedThread ? 'pb-52' : ''}`}>
        <div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="내담자 이름·이메일·전화번호·그룹명·나의코드 검색"
            className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none"
          />
        </div>

        {error && !selectedThread ? (
          <p className="rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
          <aside className="rounded-xl border border-slate-700/80 bg-slate-900/40">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-3 py-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                내담자
              </span>
              <div className="flex items-center gap-1">
                <SortArrowButton
                  label="이름"
                  active={threadSortKey === 'name'}
                  direction={threadSortDir}
                  onClick={() => toggleThreadSort('name')}
                />
                <SortArrowButton
                  label="그룹"
                  active={threadSortKey === 'group'}
                  direction={threadSortDir}
                  onClick={() => toggleThreadSort('group')}
                />
              </div>
            </div>
            <ul className="divide-y divide-slate-800/80">
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
                          <p className="truncate text-sm font-medium text-white">
                            {threadTitle(thread)}
                            {showUnreadBadge(thread) ? (
                              <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white align-middle">
                                {displayUnreadCount(thread)}
                              </span>
                            ) : null}
                          </p>
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

          <section className="rounded-xl border border-slate-700/80 bg-slate-900/40">
            {selectedThread ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-700/70 px-4 py-3">
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

                {error ? (
                  <p className="mx-4 mt-3 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                ) : null}

                <div
                  className="space-y-3 p-4"
                  onClick={handleMessageAreaReadAck}
                  onTouchStart={handleMessageAreaReadAck}
                  role="presentation"
                >
                  <PortalChatMessageList
                    messages={visibleMessages}
                    loading={loadingMessages}
                    sending={sending}
                    viewerRole="counselor"
                    senderLabelForMine="상담사"
                    senderLabelForOther={selectedThread.displayName}
                    emptyMessage="아직 메시지가 없습니다."
                    loadingMessage="대화를 불러오는 중…"
                    onSendScheduledNow={(id) => void handleSendScheduledNow(id)}
                    onCancelScheduled={(id) => void handleCancelScheduled(id)}
                    onDeleteMessage={(id) => void handleDeleteMessage(id)}
                    theme="counselor"
                  />
                  <div ref={latestAnchorRef} aria-hidden className="h-px w-full" />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center p-8 text-sm text-slate-500">
                왼쪽에서 내담자를 선택하세요.
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedThread && composer ? (
        <PortalChatFixedComposerShell maxWidthClass="max-w-[1920px]">{composer}</PortalChatFixedComposerShell>
      ) : null}
    </>
  );
}
