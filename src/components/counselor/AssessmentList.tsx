'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaClipboard } from 'react-icons/fa';
import type { CounselorAssessment, CreatedAssessmentBannerInfo, PortalMoveBannerInfo } from '@/lib/assessmentApi';
import { deleteAssessment, listAssessments, removeCounselorAssessmentFromListCache } from '@/lib/assessmentApi';
import { listCounselorClientPortals } from '@/lib/clientPortalApi';
import {
  buildClientPortalsCacheKey,
  readCachedClientPortals,
} from '@/lib/counselorSessionCache';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import type { CounselorClientPortalListItem } from '@/types/clientPortal';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import CounselorListSearchInput from '@/components/counselor/CounselorListSearchInput';
import CounselorProgressMetricsInline from '@/components/counselor/CounselorProgressMetricsInline';
import CounselorSlashInfoCell from '@/components/counselor/CounselorSlashInfoCell';
import AssessmentAddRecipientModal, {
  buildContextFromAssessment,
} from '@/components/counselor/AssessmentAddRecipientModal';
import { rememberCounselorAssessmentContext } from '@/lib/counselorNestedNav';
import {
  counselingCodeTypeLabel,
} from '@/data/counselingCodeTypes';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import {
  counselorListActionBtnClass,
  counselorListBodyRowClass,
  counselorListHeaderRowClass,
  counselorListNoThClass,
  counselorListSortActiveClass,
  counselorListSortIdleClass,
  counselorListTableWrapperClass,
  counselorListTdCompactClass,
  counselorListThClass,
  formatCounselorIssueDate,
} from '@/lib/counselorListTableStyles';
import { useListPagination } from '@/hooks/useListPagination';
import { useCounselorListPageSize } from '@/hooks/useCounselorListPageSize';
import {
  assessmentGroupTitleParts,
  resultStatusCounts,
} from '@/lib/counselorAssessmentResultDisplay';
import {
  buildAssessmentProgressHref,
  readAssessmentListSearch,
  writeAssessmentListSearch,
} from '@/lib/counselorAssessmentListSearch';

type ListSortKey = 'createdAt' | 'counselInfo' | 'accessCode' | 'usageEndDate';
type SortDirection = 'asc' | 'desc';

function parseCreatedAt(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function assessmentInfoLabel(a: CounselorAssessment): string {
  return `${getAssessmentOrgLabel(a)} / ${(a.title || '—').trim()}`;
}

function assessmentHasPendingDispatch(a: CounselorAssessment): boolean {
  const { dispatchTotal, dispatchSent, dispatchFailed, dispatchSending } = resultStatusCounts(a);
  if (dispatchSending > 0) return true;
  return dispatchTotal > 0 && dispatchSent + dispatchFailed < dispatchTotal;
}

function parseUsageEndDate(iso?: string): number {
  const s = (iso || '').trim();
  if (!s) return Number.MAX_SAFE_INTEGER;
  const t = new Date(`${s}T00:00:00`).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function compareAssessments(
  a: CounselorAssessment,
  b: CounselorAssessment,
  key: ListSortKey,
  dir: SortDirection,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'createdAt':
      return mult * (parseCreatedAt(a.createdAt) - parseCreatedAt(b.createdAt));
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
        className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors"
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

interface AssessmentListProps {
  assessments: CounselorAssessment[];
  createdInfo?: CreatedAssessmentBannerInfo | null;
  moveInfo?: PortalMoveBannerInfo | null;
  autoLivePollId?: string | null;
  onAssessmentsRefresh?: (items: CounselorAssessment[]) => void;
}

const LIVE_POLL_INTERVAL_MS = 3000;
const LIVE_POLL_MAX_MS = 60_000;

export default function AssessmentList({
  assessments,
  createdInfo,
  moveInfo,
  autoLivePollId,
  onAssessmentsRefresh,
}: AssessmentListProps) {
  const router = useRouter();
  const { user } = useAuthResolved();
  const [listItems, setListItems] = useState(assessments);
  const [searchQuery, setSearchQuery] = useState(() => readAssessmentListSearch());
  const clientCacheKey = useMemo(
    () =>
      buildClientPortalsCacheKey({
        counselorUid: user?.uid,
        status: 'active',
        progress: 'all',
      }),
    [user?.uid],
  );
  const [clientItems, setClientItems] = useState<CounselorClientPortalListItem[]>(
    () => readCachedClientPortals(clientCacheKey)?.items ?? [],
  );
  const [sortKey, setSortKey] = useState<ListSortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [addTarget, setAddTarget] = useState<CounselorAssessment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CounselorAssessment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [liveAssessmentId, setLiveAssessmentId] = useState<string | null>(null);
  const liveStartRef = useRef<number>(0);
  const { pageSize, setPageSize } = useCounselorListPageSize();

  useEffect(() => {
    setListItems(assessments);
  }, [assessments]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    void listCounselorClientPortals({ status: 'active' })
      .then((data) => {
        if (!cancelled) setClientItems(data.items || []);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const clientSearchByAssessment = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of clientItems) {
      const hay = [
        item.displayName || '',
        item.email || '',
        item.phone || '',
        item.accessCode || '',
        item.cohortName || '',
        ...(item.counselorTags || []),
      ]
        .join(' ')
        .toLowerCase();
      for (const assessment of item.assessments) {
        const prev = map.get(assessment.assessmentId) || '';
        map.set(assessment.assessmentId, `${prev} ${hay}`.trim());
      }
    }
    return map;
  }, [clientItems]);

  useEffect(() => {
    if (autoLivePollId) {
      liveStartRef.current = Date.now();
      setLiveAssessmentId(autoLivePollId);
    }
  }, [autoLivePollId]);

  const shouldPollList = useMemo(() => {
    if (liveAssessmentId) return true;
    return listItems.some((a) => assessmentHasPendingDispatch(a));
  }, [liveAssessmentId, listItems]);

  const refreshListFromApi = useCallback(async () => {
    try {
      const data = await listAssessments();
      const items = data.assessments || [];
      setListItems(items);
      onAssessmentsRefresh?.(items);
    } catch {
      // ignore silent refresh errors
    }
  }, [onAssessmentsRefresh]);

  useEffect(() => {
    if (!shouldPollList) return;

    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      if (cancelled) return;
      const elapsed = Date.now() - liveStartRef.current;
      try {
        const data = await listAssessments();
        const items = data.assessments || [];
        if (cancelled) return;
        setListItems(items);
        onAssessmentsRefresh?.(items);
        const hasPending = items.some((a) => assessmentHasPendingDispatch(a));
        if (elapsed >= LIVE_POLL_MAX_MS && !hasPending && !liveAssessmentId) {
          return;
        }
      } catch {
        // ignore silent refresh errors
      }
      if (cancelled) return;
      timer = window.setTimeout(() => {
        void tick();
      }, LIVE_POLL_INTERVAL_MS);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [shouldPollList, liveAssessmentId, onAssessmentsRefresh]);

  useEffect(() => {
    if (!liveAssessmentId) return;
    const row = listItems.find((a) => a.id === liveAssessmentId);
    if (row) {
      const { dispatchTotal } = resultStatusCounts(row);
      const dispatchDone = (row.dispatchSentCount ?? 0) + (row.dispatchFailedCount ?? 0);
      if (dispatchTotal > 0 && dispatchDone >= dispatchTotal && !assessmentHasPendingDispatch(row)) {
        if (!listItems.some((a) => a.id !== liveAssessmentId && assessmentHasPendingDispatch(a))) {
          setLiveAssessmentId(null);
        }
        return;
      }
    }
    if (Date.now() - liveStartRef.current >= LIVE_POLL_MAX_MS) {
      if (!listItems.some((a) => assessmentHasPendingDispatch(a))) {
        setLiveAssessmentId(null);
      }
      return;
    }
  }, [liveAssessmentId, listItems]);

  const startLivePolling = (assessmentId: string) => {
    liveStartRef.current = Date.now();
    setLiveAssessmentId(assessmentId);
  };

  useEffect(() => {
    writeAssessmentListSearch(searchQuery);
  }, [searchQuery]);

  const goToProgress = (assessmentId: string) => {
    writeAssessmentListSearch(searchQuery);
    rememberCounselorAssessmentContext(assessmentId);
    router.push(buildAssessmentProgressHref(assessmentId, searchQuery));
  };

  const openAddRecipient = (assessment: CounselorAssessment) => {
    rememberCounselorAssessmentContext(assessment.id);
    setAddTarget(assessment);
  };

  const openDelete = (assessment: CounselorAssessment) => {
    rememberCounselorAssessmentContext(assessment.id);
    setDeleteError('');
    setDeleteTarget(assessment);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAssessment(deleteTarget.id, deleteTarget.accessCode);
      removeCounselorAssessmentFromListCache(deleteTarget.id, deleteTarget.accessCode);
      setListItems((prev) => {
        const next = prev.filter((a) => a.id !== deleteTarget.id);
        onAssessmentsRefresh?.(next);
        return next;
      });
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSort = (key: ListSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const cellLinkClass =
    'cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/60 rounded-sm';

  const totalParticipants = listItems.reduce((sum, a) => {
    const { dispatchTotal } = resultStatusCounts(a);
    return sum + dispatchTotal;
  }, 0);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listItems;
    return listItems.filter((a) => {
      const hay = [
        a.title || '',
        a.accessCode || '',
        a.cohortName || '',
        a.welcomeMessage || '',
        counselingCodeTypeLabel(a.codeCategory),
        a.targetAudience || '',
        getAssessmentOrgLabel(a),
        ...(a.testList || []).map((t) => `${t.name} ${t.testId}`),
        clientSearchByAssessment.get(a.id) || '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [listItems, searchQuery, clientSearchByAssessment]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => compareAssessments(a, b, sortKey, sortDir));
    return list;
  }, [filtered, sortKey, sortDir]);

  const {
    page,
    setPage,
    totalPages,
    totalCount,
    startIndex,
    paginatedItems,
    currentCount,
  } = useListPagination(sortedFiltered, pageSize);

  return (
    <CounselorPageSection
      showHierarchyBreadcrumb
      title="상담코드 목록"
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      dense
      description={
        <span className="inline-flex w-full flex-wrap items-center gap-x-3 gap-y-2">
          <span>
            상담코드 총 <span className="font-semibold text-white">{listItems.length}</span>개 · 내담자 총{' '}
            <span className="font-semibold text-cyan-300">{totalParticipants}</span>명
          </span>
          <CounselorListSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="그룹명 · 제목 · 코드 · 내담자 이름 · 이메일 · 휴대폰 검색"
          />
        </span>
      }
    >
    <motion.div
      className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {moveInfo ? (
        <div className="mb-2 shrink-0 rounded-lg border border-sky-500/30 bg-sky-950/40 px-3 py-2">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <p>
              <span className="font-medium text-sky-200">이동 상담코드 : </span>
              <span className="font-mono font-bold tracking-widest text-sky-300">
                {formatAccessCodeDisplay(moveInfo.targetAccessCode)}
              </span>
              <span className="ml-2 font-normal text-white">
                ({(moveInfo.targetCohortName || '—').trim()} / {(moveInfo.targetAssessmentTitle || '—').trim()})
              </span>
            </p>
          </div>
          {moveInfo.recipients.length > 0 ? (
            <div className="mt-2 text-sm text-slate-300">
              <span className="font-medium text-sky-200/90">
                총 {moveInfo.recipients.length}명 :
              </span>{' '}
              <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
                {moveInfo.recipients.map((r, idx) => (
                  <span key={`${r.displayName}-${idx}`}>
                    {r.displayName}
                    {r.myCode ? (
                      <span className="ml-1 font-mono text-xs text-slate-400">
                        ({formatAccessCodeDisplay(r.myCode)})
                      </span>
                    ) : null}
                  </span>
                ))}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {createdInfo && (
        <div className="mb-2 shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2">
          <p className="text-emerald-200 font-medium">상담코드가 발급되었습니다</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <p>
              <span className="text-emerald-400/80">코드 </span>
              <span className="text-emerald-300 font-mono font-bold tracking-widest">
                {formatAccessCodeDisplay(createdInfo.accessCode)}
              </span>
              {(createdInfo.cohortName || createdInfo.title) ? (
                <span className="ml-2 font-normal text-white">
                  ({(createdInfo.cohortName || '—').trim()} / {(createdInfo.title || '—').trim()})
                </span>
              ) : null}
            </p>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
          <FaClipboard className="mb-2 h-10 w-10 text-slate-600" />
          <p className="text-base text-slate-300">
            {listItems.length === 0 ? '등록된 상담코드가 없습니다' : '검색 결과가 없습니다'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {listItems.length === 0 ? '첫 상담코드를 만들어 내담자에게 배포하세요.' : '검색어를 바꿔 보세요.'}
          </p>
          {listItems.length === 0 && (
            <AuthLink
              href="/counselor/assessments/new"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-sky-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              첫 상담코드생성
            </AuthLink>
          )}
        </div>
      ) : (
        <>
          <div className={`min-h-0 flex-1 ${counselorListTableWrapperClass}`}>
            <table className="w-max min-w-full table-fixed text-sm">
              <thead>
                <tr className={counselorListHeaderRowClass}>
                  <th className={counselorListNoThClass}>No.</th>
                  <SortableColumnHeader
                    label="발급일"
                    sortKey="createdAt"
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
                    <span className="block">진행현황</span>
                  </th>
                  <SortableColumnHeader
                    label="사용 종료일"
                    sortKey="usageEndDate"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="whitespace-nowrap text-center"
                  />
                  <th scope="col" className={`${counselorListThClass} text-center`}>기타</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((a, idx) => {
                  const { dispatchTotal, testComplete } = resultStatusCounts(a);
                  const expired = isExpired(a.usageEndDate);
                  const { primary: infoPrimary, secondary: infoSecondary } = assessmentGroupTitleParts(a);

                  return (
                    <tr key={a.id} className={counselorListBodyRowClass}>
                      <td className={`${counselorListTdCompactClass} tabular-nums text-slate-500`}>
                        {startIndex + idx + 1}
                      </td>
                      <td
                        className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-white`}
                        onClick={() => goToProgress(a.id)}
                      >
                        <span className={cellLinkClass}>{formatCounselorIssueDate(a.createdAt)}</span>
                      </td>
                      <td
                        className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-center`}
                        onClick={() => goToProgress(a.id)}
                      >
                        <span className={`${cellLinkClass} font-mono tracking-wide text-cyan-300/95`}>
                          {formatAccessCodeDisplay(a.accessCode)}
                        </span>
                      </td>
                      <td
                        className={`max-w-[16rem] ${counselorListTdCompactClass} cursor-pointer`}
                        onClick={() => goToProgress(a.id)}
                      >
                        {infoSecondary ? (
                          <CounselorSlashInfoCell
                            primary={infoPrimary}
                            secondary={infoSecondary}
                            showTooltip={false}
                            className={cellLinkClass}
                          />
                        ) : (
                          <span className={`block truncate font-medium text-white ${cellLinkClass}`}>
                            {infoPrimary}
                          </span>
                        )}
                      </td>
                      <td className={`whitespace-nowrap ${counselorListTdCompactClass} text-center cursor-default`}>
                        <CounselorProgressMetricsInline
                          totalClients={dispatchTotal}
                          items={[{ label: '검사완료', value: testComplete }]}
                        />
                      </td>
                      <td
                        className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-center ${expired ? 'text-red-400' : ''}`}
                        onClick={() => goToProgress(a.id)}
                      >
                        {formatUsageEndDate(a.usageEndDate)}
                      </td>
                      <td className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-default text-center`}>
                        <div className="inline-flex flex-wrap items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openAddRecipient(a)}
                            className="inline-flex items-center justify-center rounded bg-sky-800/50 px-2 py-0.5 text-xs font-medium text-sky-100 hover:bg-sky-700/60"
                          >
                            내담자추가
                          </button>
                          <AuthLink
                            href={`/counselor/assessments/edit?id=${encodeURIComponent(a.id)}`}
                            onClick={() => rememberCounselorAssessmentContext(a.id)}
                            className="inline-flex min-w-0 items-center justify-center rounded bg-emerald-800/50 px-2 py-0.5 text-xs font-medium text-emerald-100 hover:bg-emerald-700/60"
                          >
                            수정
                          </AuthLink>
                          <button
                            type="button"
                            onClick={() => openDelete(a)}
                            className="inline-flex items-center justify-center rounded bg-red-950/50 px-2 py-0.5 text-xs font-medium text-red-300 hover:bg-red-900/60"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
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
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </motion.div>

    <AssessmentAddRecipientModal
      open={Boolean(addTarget)}
      onClose={() => setAddTarget(null)}
      context={addTarget ? buildContextFromAssessment(addTarget) : null}
      onSuccess={(info) => {
        const targetId = addTarget?.id;
        void refreshListFromApi();
        if (info.sent && targetId) {
          startLivePolling(targetId);
        }
      }}
    />

    {deleteTarget ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
        <div
          className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-black/50"
          role="dialog"
          aria-labelledby="delete-assessment-title"
          aria-modal="true"
        >
          <div className="border-b border-red-500/20 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 px-6 py-5">
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400"
                aria-hidden
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 id="delete-assessment-title" className="text-lg font-semibold text-white">
                  상담코드 삭제
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  선택한 상담코드를 삭제 목록으로 이동합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                삭제 대상
              </p>
              <p className="mt-1.5 font-mono text-lg font-bold tracking-wider text-cyan-300">
                {formatAccessCodeDisplay(deleteTarget.accessCode)}
              </p>
              <p className="mt-1 text-sm leading-snug text-slate-200">{deleteTarget.title}</p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm leading-relaxed text-slate-400">
              <p>
                <span className="font-medium text-slate-300">삭제된 상담코드 목록</span>으로 이동하며,
                필요 시 복구할 수 있습니다.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                내담자 접속 정보·검사 결과는 삭제 목록에서 복구하기 전까지 보관됩니다.
              </p>
            </div>

            {deleteError ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {deleteError}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-white/[0.06] bg-black/20 px-6 py-4">
            <button
              type="button"
              onClick={() => {
                if (!deleteLoading) {
                  setDeleteTarget(null);
                  setDeleteError('');
                }
              }}
              disabled={deleteLoading}
              className="rounded-lg border border-white/10 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteConfirm()}
              disabled={deleteLoading}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-900/30 transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {deleteLoading ? '처리 중…' : '삭제 확인'}
            </button>
          </div>
        </div>
      </div>
    ) : null}

    </CounselorPageSection>
  );
}
