'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaClipboard } from 'react-icons/fa';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import ArchivedRecipientsTable from '@/components/counselor/ArchivedRecipientsTable';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import CounselorSlashInfoCell from '@/components/counselor/CounselorSlashInfoCell';
import { counselingCodeTypeLabel } from '@/data/counselingCodeTypes';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import {
  counselorListBodyRowClass,
  counselorListHeaderRowClass,
  counselorListNoThClass,
  counselorListSelectTdClass,
  counselorListSelectThClass,
  counselorListSortActiveClass,
  counselorListSortIdleClass,
  counselorListTableWrapperClass,
  counselorListTdCompactClass,
  counselorListThClass,
  counselorResultMetricClass,
  formatCounselorIssueDate,
} from '@/lib/counselorListTableStyles';
import { useListPagination } from '@/hooks/useListPagination';
import {
  readCachedArchivedAssessments,
  writeCachedArchivedAssessments,
} from '@/lib/counselorSessionCache';
import {
  fetchArchivedDispatchRecipients,
  type ArchivedDispatchRecipient,
} from '@/lib/clientPortalApi';
import {
  listArchivedAssessments,
  permanentlyDeleteArchivedAssessments,
  restoreArchivedAssessments,
  type ArchivedAssessment,
} from '@/lib/assessmentApi';

type ListSortKey = 'createdAt' | 'counselInfo' | 'accessCode' | 'usageEndDate' | 'archivedAt';
type SortDirection = 'asc' | 'desc';

function parseCreatedAt(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function parseUsageEndDate(iso?: string): number {
  const s = (iso || '').trim();
  if (!s) return Number.MAX_SAFE_INTEGER;
  const t = new Date(`${s}T00:00:00`).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function assessmentInfoLabel(a: ArchivedAssessment): string {
  return `${getAssessmentOrgLabel(a)} / ${(a.title || '—').trim()}`;
}

function compareRows(
  a: ArchivedAssessment,
  b: ArchivedAssessment,
  key: ListSortKey,
  dir: SortDirection,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'createdAt':
      return mult * (parseCreatedAt(a.createdAt) - parseCreatedAt(b.createdAt));
    case 'archivedAt':
      return mult * (parseCreatedAt(a.archivedAt) - parseCreatedAt(b.archivedAt));
    case 'counselInfo':
      return mult * assessmentInfoLabel(a).localeCompare(assessmentInfoLabel(b), 'ko');
    case 'accessCode':
      return (
        mult *
        formatAccessCodeDisplay(a.accessCode).localeCompare(formatAccessCodeDisplay(b.accessCode), 'ko')
      );
    case 'usageEndDate':
      return mult * (parseUsageEndDate(a.usageEndDate) - parseUsageEndDate(b.usageEndDate));
    default:
      return 0;
  }
}

function formatUsageEndDate(iso: string | undefined): string {
  const s = (iso || '').trim();
  if (!s) return '무기한';
  try {
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('ko-KR');
  } catch {
    return s;
  }
}

function isExpired(iso: string | undefined): boolean {
  const s = (iso || '').trim();
  if (!s) return false;
  try {
    return new Date(`${s}T23:59:59`) < new Date();
  } catch {
    return false;
  }
}

function resultStatusCounts(a: ArchivedAssessment) {
  const dispatchSent = a.dispatchSentCount ?? 0;
  const dispatchFailed = a.dispatchFailedCount ?? 0;
  const testComplete = a.testCompleteCount ?? 0;
  const testIncomplete = a.testIncompleteCount ?? 0;
  const dispatchTotal = Math.max(testComplete + testIncomplete, dispatchSent + dispatchFailed);
  return { dispatchFailed, testIncomplete, dispatchTotal };
}

function SortableColumnHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: ListSortKey;
  activeKey: ListSortKey;
  direction: SortDirection;
  onSort: (key: ListSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th scope="col" className={`${counselorListThClass} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 transition-colors hover:text-slate-200"
      >
        <span>{label}</span>
        <span
          className={`text-[10px] ${active ? counselorListSortActiveClass : counselorListSortIdleClass}`}
          aria-hidden="true"
        >
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

export default function DeletedAssessmentsPage() {
  const { authPending, isAuthenticated, showLoginRequired } = useAuthResolved();
  const [items, setItems] = useState<ArchivedAssessment[]>(
    () => readCachedArchivedAssessments<ArchivedAssessment>() ?? [],
  );
  const [loading, setLoading] = useState(
    () => !(readCachedArchivedAssessments<ArchivedAssessment>()?.length),
  );
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<ListSortKey>('archivedAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recipientCache, setRecipientCache] = useState<Record<string, ArchivedDispatchRecipient[]>>({});
  const [recipientLoadingId, setRecipientLoadingId] = useState<string | null>(null);
  const [recipientError, setRecipientError] = useState('');
  const emptyRecipientSelection = useMemo(() => new Set<string>(), []);

  const cellLinkClass =
    'cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/60 rounded-sm';

  const load = useCallback(async () => {
    const cached = readCachedArchivedAssessments<ArchivedAssessment>();
    if (!cached?.length) setLoading(true);
    setError('');
    try {
      const result = await listArchivedAssessments();
      writeCachedArchivedAssessments(result.assessments || []);
      setItems(result.assessments || []);
      setSelected(new Set());
    } catch (err) {
      if (!cached?.length) {
        setItems([]);
        setError(err instanceof Error ? err.message : '목록 조회 실패');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authPending || !isAuthenticated) return;
    void load();
  }, [load, authPending, isAuthenticated]);

  useRedirectOnLoginRequiredError(error);

  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.accessCode || '').toLowerCase().includes(q) ||
        counselingCodeTypeLabel(a.codeCategory).toLowerCase().includes(q) ||
        (a.targetAudience || '').toLowerCase().includes(q) ||
        getAssessmentOrgLabel(a).toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => compareRows(a, b, sortKey, sortDir));
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalParticipants = useMemo(
    () =>
      items.reduce((sum, a) => {
        const { dispatchTotal } = resultStatusCounts(a);
        return sum + dispatchTotal;
      }, 0),
    [items],
  );

  const {
    page,
    setPage,
    totalPages,
    totalCount,
    startIndex,
    paginatedItems,
    currentCount,
  } = useListPagination(sortedFiltered);

  const toggleSort = (key: ListSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' || key === 'archivedAt' ? 'desc' : 'asc');
    }
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = useCallback(
    async (assessmentId: string) => {
      if (expandedId === assessmentId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(assessmentId);
      setRecipientError('');
      if (recipientCache[assessmentId]) return;
      setRecipientLoadingId(assessmentId);
      try {
        const result = await fetchArchivedDispatchRecipients(assessmentId);
        setRecipientCache((prev) => ({ ...prev, [assessmentId]: result.items || [] }));
      } catch (err) {
        setRecipientError(err instanceof Error ? err.message : '삭제된 검사자 목록을 불러오지 못했습니다.');
      } finally {
        setRecipientLoadingId(null);
      }
    },
    [expandedId, recipientCache],
  );

  const handleRestore = async () => {
    if (selected.size === 0) return;
    setRestoring(true);
    setMessage('');
    try {
      const result = await restoreArchivedAssessments(Array.from(selected));
      setMessage(`복구 ${result.restored}건${result.failed ? `, 실패 ${result.failed}건` : ''}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '복구에 실패했습니다.');
    } finally {
      setRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`선택 ${selected.size}건을 영구 삭제하시겠습니까?`)) {
      return;
    }
    setDeleting(true);
    setMessage('');
    try {
      const result = await permanentlyDeleteArchivedAssessments(Array.from(selected));
      setMessage(`영구 삭제 ${result.deleted}건${result.failed ? `, 실패 ${result.failed}건` : ''}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '영구 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (authPending) return <AuthLoadingState className="py-8" />;
  if (showLoginRequired) {
    return <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />;
  }

  return (
    <CounselorPageSection
      title="삭제된 상담코드"
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      dense
      description={
        <>
          전체 <span className="font-semibold text-white">{items.length}</span>개 · 응시자{' '}
          <span className="font-semibold text-cyan-300">{totalParticipants}</span>명
          <span className="ml-2 text-sky-200/60">({filtered.length}건 표시)</span>
        </>
      }
      toolbar={
        <>
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <svg className="h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검사명 · 상담유형 · 코드 · 기관명 검색"
              className="w-full rounded-md border border-white/10 bg-[#101f38]/90 py-1.5 pl-8 pr-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
            />
          </div>
          <button
            type="button"
            onClick={toggleAll}
            disabled={loading || items.length === 0}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={restoring || selected.size === 0}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {restoring ? '복구 중…' : `복구 (${selected.size})`}
          </button>
          <button
            type="button"
            onClick={() => void handlePermanentDelete()}
            disabled={deleting || selected.size === 0}
            className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {deleting ? '처리 중…' : `영구 삭제 (${selected.size})`}
          </button>
        </>
      }
    >
      <motion.div
        className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {message ? <p className="mb-3 shrink-0 text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="mb-3 shrink-0 text-sm text-red-400">{error}</p> : null}

        {loading ? (
          <AuthLoadingState className="py-8" message="목록을 불러오는 중…" />
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
            <FaClipboard className="mb-2 h-10 w-10 text-slate-600" />
            <p className="text-base text-slate-300">
              {items.length === 0 ? '삭제된 상담코드가 없습니다' : '검색 결과가 없습니다'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {items.length === 0 ? '삭제된 항목이 없습니다.' : '검색어를 바꿔 보세요.'}
            </p>
          </div>
        ) : (
          <>
            <div className={`min-h-0 flex-1 ${counselorListTableWrapperClass}`}>
              <table className="w-max min-w-full table-fixed text-sm">
                <thead>
                  <tr className={counselorListHeaderRowClass}>
                    <th className={counselorListNoThClass}>No.</th>
                    <th scope="col" className={counselorListSelectThClass}>
                      선택
                    </th>
                    <SortableColumnHeader
                      label="삭제일"
                      sortKey="archivedAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <SortableColumnHeader
                      label="상담코드"
                      sortKey="accessCode"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap text-center"
                    />
                    <SortableColumnHeader
                      label="그룹명 / 제목"
                      sortKey="counselInfo"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <th scope="col" className={`${counselorListThClass} whitespace-nowrap text-center`}>
                      <span className="block">결과현황</span>
                      <span className="mt-0.5 block text-[10px] font-normal leading-tight text-slate-500">
                        (
                        <span className="text-slate-300">총발송수</span>
                        <span> / </span>
                        <span className="text-red-400">발송실패</span>
                        <span> / </span>
                        <span className="text-red-400">미완료</span>
                        )
                      </span>
                    </th>
                    <SortableColumnHeader
                      label="사용 종료일"
                      sortKey="usageEndDate"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap text-center"
                    />
                    <SortableColumnHeader
                      label="발급일"
                      sortKey="createdAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap text-center"
                    />
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((row, idx) => {
                    const { dispatchFailed, testIncomplete, dispatchTotal } = resultStatusCounts(row);
                    const expired = isExpired(row.usageEndDate);
                    const infoPrimary = getAssessmentOrgLabel(row);
                    const infoSecondary = (row.title || '—').trim();
                    const isOpen = expandedId === row.id;
                    const expandedRecipients = recipientCache[row.id] || [];

                    return (
                      <React.Fragment key={row.id}>
                        <tr className={`${counselorListBodyRowClass} ${isOpen ? 'bg-white/[0.04]' : ''}`}>
                          <td className={`${counselorListTdCompactClass} tabular-nums text-slate-500`}>
                            {startIndex + idx + 1}
                          </td>
                          <td className={counselorListSelectTdClass} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected.has(row.id)}
                              onChange={() => toggleOne(row.id)}
                              className="rounded accent-blue-500"
                            />
                          </td>
                          <td
                            className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-white`}
                            onClick={() => void toggleExpand(row.id)}
                          >
                            <span className={cellLinkClass}>{formatCounselorIssueDate(row.archivedAt)}</span>
                          </td>
                          <td
                            className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-center`}
                            onClick={() => void toggleExpand(row.id)}
                          >
                            <span className={`${cellLinkClass} font-mono tracking-wide text-cyan-300/95`}>
                              {formatAccessCodeDisplay(row.accessCode)}
                            </span>
                          </td>
                          <td
                            className={`max-w-[16rem] ${counselorListTdCompactClass} cursor-pointer`}
                            onClick={() => void toggleExpand(row.id)}
                          >
                            <CounselorSlashInfoCell
                              primary={infoPrimary}
                              secondary={infoSecondary}
                              showTooltip={false}
                              className={cellLinkClass}
                            />
                            {expired ? (
                              <span className="ml-1 inline-block rounded-full border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-red-300">
                                만료
                              </span>
                            ) : null}
                          </td>
                          <td className={`whitespace-nowrap ${counselorListTdCompactClass} text-center cursor-default`}>
                            (
                            <span className="px-1 font-medium tabular-nums text-slate-300">{dispatchTotal}</span>
                            /
                            <span className={`px-1 font-medium tabular-nums ${counselorResultMetricClass(dispatchFailed)}`}>
                              {dispatchFailed}
                            </span>
                            /
                            <span className={`px-1 font-medium tabular-nums ${counselorResultMetricClass(testIncomplete)}`}>
                              {testIncomplete}
                            </span>
                            )
                          </td>
                          <td
                            className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-center ${expired ? 'text-red-400' : ''}`}
                            onClick={() => void toggleExpand(row.id)}
                          >
                            <span className={cellLinkClass}>{formatUsageEndDate(row.usageEndDate)}</span>
                          </td>
                          <td
                            className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-center text-slate-300`}
                            onClick={() => void toggleExpand(row.id)}
                          >
                            <span className={cellLinkClass}>{formatCounselorIssueDate(row.createdAt)}</span>
                          </td>
                        </tr>
                        {isOpen ? (
                          <tr>
                            <td colSpan={8} className="border-t border-white/10 bg-slate-950/40 px-3 py-4">
                              {recipientLoadingId === row.id ? (
                                <p className="text-sm text-slate-400">내담자 목록을 불러오는 중…</p>
                              ) : recipientError && !expandedRecipients.length ? (
                                <p className="text-sm text-red-400">{recipientError}</p>
                              ) : expandedRecipients.length === 0 ? (
                                <p className="text-sm text-slate-400">발송된 내담자가 없습니다.</p>
                              ) : (
                                <ArchivedRecipientsTable
                                  items={expandedRecipients}
                                  selected={emptyRecipientSelection}
                                  onToggleOne={() => undefined}
                                  layout="dispatch"
                                  hideSelect
                                  hideArchivedAt
                                />
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <CounselorListPagination
              page={page}
              totalPages={totalPages}
              currentCount={currentCount}
              totalCount={totalCount}
              onPageChange={setPage}
            />
          </>
        )}
      </motion.div>
    </CounselorPageSection>
  );
}
