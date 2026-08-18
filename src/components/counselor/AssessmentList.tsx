'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaClipboard } from 'react-icons/fa';
import type { CounselorAssessment, CreatedAssessmentBannerInfo, PortalMoveBannerInfo } from '@/lib/assessmentApi';
import { deleteAssessment, fetchAssessmentListStats, listAssessments, mergeAssessmentListStats, removeCounselorAssessmentFromListCache, clearCounselorAssessmentsListCache } from '@/lib/assessmentApi';
import { listCounselorClientPortals } from '@/lib/clientPortalApi';
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
import AssessmentEditModal from '@/components/counselor/AssessmentEditModal';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import CounselorActionCompleteModal from '@/components/counselor/CounselorActionCompleteModal';
import CounselorConfirmModal from '@/components/counselor/CounselorConfirmModal';
import { rememberCounselorAssessmentContext, rememberCounselorProgressFrom } from '@/lib/counselorNestedNav';
import {
  counselingCodeTypeLabel,
} from '@/data/counselingCodeTypes';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import {
  counselorListActionBtnClass,
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
  clearAssessmentListSearch,
  writeAssessmentListSearch,
} from '@/lib/counselorAssessmentListSearch';
import { exportCounselorAssessments } from '@/lib/counselorAssessmentListExport';
import { matchesWildcardFields } from '@/lib/wildcardSearch';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';
import { CounselorAdminEmailSortHeader, CounselorAdminEmailTd, compareCounselorEmail } from '@/components/counselor/CounselorAdminEmailColumn';

type ListSortKey = 'createdAt' | 'counselInfo' | 'accessCode' | 'usageEndDate' | 'counselorEmail';
type SortDirection = 'asc' | 'desc';
type CounselSortPhase = 'org-asc' | 'org-desc' | 'title-asc' | 'title-desc';

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
  counselSortPhase: CounselSortPhase,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'createdAt':
      return mult * (parseCreatedAt(a.createdAt) - parseCreatedAt(b.createdAt));
    case 'counselInfo': {
      const phaseMult = (p: CounselSortPhase) => (p.endsWith('-asc') ? 1 : -1);
      const m = phaseMult(counselSortPhase);
      if (counselSortPhase.startsWith('title')) {
        return (
          m *
          ((a.title || '').trim() || '—').localeCompare((b.title || '').trim() || '—', 'ko')
        );
      }
      return m * getAssessmentOrgLabel(a).localeCompare(getAssessmentOrgLabel(b), 'ko');
    }
    case 'accessCode':
      return (
        mult *
        formatAccessCodeDisplay(a.accessCode).localeCompare(formatAccessCodeDisplay(b.accessCode), 'ko')
      );
    case 'usageEndDate':
      return mult * (parseUsageEndDate(a.usageEndDate) - parseUsageEndDate(b.usageEndDate));
    case 'counselorEmail':
      return compareCounselorEmail(a.counselorEmail, b.counselorEmail, dir);
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

function sortPhaseIcon(active: boolean, phase: string): string {
  if (!active) return '↕';
  return phase.endsWith('-asc') ? '▲' : '▼';
}

function DualFieldSortHeader({
  leftLabel,
  rightLabel,
  activeKey,
  sortKey,
  phase,
  onSortLeft,
  onSortRight,
  className = '',
}: {
  leftLabel: string;
  rightLabel: string;
  activeKey: ListSortKey;
  sortKey: ListSortKey;
  phase: CounselSortPhase;
  onSortLeft: () => void;
  onSortRight: () => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const leftActive = active && phase.startsWith('org');
  const rightActive = active && phase.startsWith('title');
  return (
    <th scope="col" className={`${counselorListThClass} ${className}`}>
      <div className="inline-flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSortLeft();
          }}
          className={`inline-flex items-center gap-1 transition-colors hover:text-slate-200 ${leftActive ? counselorListSortActiveClass : 'text-slate-300'}`}
        >
          {leftLabel}
          <span className="text-[10px] opacity-80" aria-hidden>
            {sortPhaseIcon(leftActive, phase)}
          </span>
        </button>
        <span className="text-slate-500">/</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSortRight();
          }}
          className={`inline-flex items-center gap-1 transition-colors hover:text-slate-200 ${rightActive ? counselorListSortActiveClass : 'text-slate-300'}`}
        >
          {rightLabel}
          <span className="text-[10px] opacity-80" aria-hidden>
            {sortPhaseIcon(rightActive, phase)}
          </span>
        </button>
      </div>
    </th>
  );
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
  initialSearchQuery?: string;
}

const LIVE_POLL_INTERVAL_MS = 3000;
const LIVE_POLL_MAX_MS = 60_000;

export default function AssessmentList({
  assessments,
  createdInfo,
  moveInfo,
  autoLivePollId,
  onAssessmentsRefresh,
  initialSearchQuery = '',
}: AssessmentListProps) {
  const router = useRouter();
  const { user } = useAuthResolved();
  const adminUser = isAdmin(getAppRoleSync());
  const [listItems, setListItems] = useState(assessments);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [clientItems, setClientItems] = useState<CounselorClientPortalListItem[]>([]);
  const [sortKey, setSortKey] = useState<ListSortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [counselSortPhase, setCounselSortPhase] = useState<CounselSortPhase>('org-asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [actionComplete, setActionComplete] = useState<{
    title: string;
    message: string;
    error?: boolean;
  } | null>(null);
  const [addTarget, setAddTarget] = useState<CounselorAssessment | null>(null);
  const [editTarget, setEditTarget] = useState<CounselorAssessment | null>(null);
  const [liveAssessmentId, setLiveAssessmentId] = useState<string | null>(null);
  const liveStartRef = useRef<number>(0);
  const { pageSize, setPageSize } = useCounselorListPageSize();

  useEffect(() => {
    setListItems(assessments);
  }, [assessments]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
    if (initialSearchQuery) {
      writeAssessmentListSearch(initialSearchQuery);
    } else {
      clearAssessmentListSearch();
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (!user?.uid) return;
    if (adminUser && !searchQuery.trim()) {
      setClientItems([]);
      return;
    }
    let cancelled = false;
    const portalQuery = searchQuery.trim();
    void listCounselorClientPortals({
      status: 'active',
      ...(portalQuery ? { q: portalQuery } : {}),
    })
      .then((data) => {
        if (!cancelled) setClientItems(data.items || []);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, adminUser, searchQuery]);

  const clientSearchFieldsByAssessment = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of clientItems) {
      const fields = [
        item.displayName || '',
        item.email || '',
        item.phone || '',
        item.accessCode || '',
        item.cohortName || '',
        ...(item.counselorTags || []),
      ];
      for (const assessment of item.assessments) {
        const prev = map.get(assessment.assessmentId) || [];
        map.set(assessment.assessmentId, [...prev, ...fields]);
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

  const refreshFullListFromApi = useCallback(async () => {
    try {
      const data = await listAssessments({ includeStats: true });
      const items = data.assessments || [];
      setListItems(items);
      onAssessmentsRefresh?.(items);
    } catch {
      // ignore
    }
  }, [onAssessmentsRefresh]);

  const pollTargetIds = useMemo(() => {
    const ids = new Set<string>();
    if (liveAssessmentId) ids.add(liveAssessmentId);
    for (const a of listItems) {
      if (assessmentHasPendingDispatch(a)) ids.add(a.id);
    }
    return Array.from(ids);
  }, [liveAssessmentId, listItems]);

  const refreshStatsFromApi = useCallback(async () => {
    if (!pollTargetIds.length) return;
    try {
      const statsMap = await fetchAssessmentListStats(pollTargetIds);
      if (!Object.keys(statsMap).length) return;
      setListItems((prev) => {
        const next = mergeAssessmentListStats(prev, statsMap);
        onAssessmentsRefresh?.(next);
        return next;
      });
    } catch {
      // ignore silent refresh errors
    }
  }, [pollTargetIds, onAssessmentsRefresh]);

  useEffect(() => {
    if (!shouldPollList) return;

    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      if (cancelled) return;
      const elapsed = Date.now() - liveStartRef.current;
      await refreshStatsFromApi();
      if (cancelled) return;

      let shouldStop = false;
      setListItems((prev) => {
        const hasPending = prev.some((a) => assessmentHasPendingDispatch(a));
        if (elapsed >= LIVE_POLL_MAX_MS && !hasPending && !liveAssessmentId) {
          shouldStop = true;
        }
        return prev;
      });
      if (shouldStop) return;

      timer = window.setTimeout(() => {
        void tick();
      }, LIVE_POLL_INTERVAL_MS);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [shouldPollList, liveAssessmentId, refreshStatsFromApi]);

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
    rememberCounselorProgressFrom('assessments');
    router.push(buildAssessmentProgressHref(assessmentId, searchQuery));
  };

  const openAddRecipient = (assessment: CounselorAssessment) => {
    rememberCounselorAssessmentContext(assessment.id);
    setAddTarget(assessment);
  };

  const openEdit = (assessment: CounselorAssessment) => {
    rememberCounselorAssessmentContext(assessment.id);
    setEditTarget(assessment);
  };

  const toggleCounselFieldSort = (field: 'org' | 'title') => {
    setSortKey('counselInfo');
    setCounselSortPhase((prev) => {
      if (field === 'org') {
        if (prev.startsWith('org')) return prev === 'org-asc' ? 'org-desc' : 'org-asc';
        return 'org-asc';
      }
      if (prev.startsWith('title')) return prev === 'title-asc' ? 'title-desc' : 'title-asc';
      return 'title-asc';
    });
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
    const q = searchQuery.trim();
    if (!q) return listItems;
    return listItems.filter((a) =>
      matchesWildcardFields(
        [
          a.cohortName || '',
          a.accessCode || '',
          a.title || '',
          a.welcomeMessage || '',
          counselingCodeTypeLabel(a.codeCategory),
          a.targetAudience || '',
          ...(a.testList || []).map((t) => t.name),
          ...(a.testList || []).map((t) => t.testId),
          ...(clientSearchFieldsByAssessment.get(a.id) || []),
          ...(adminUser ? [a.counselorEmail || ''] : []),
        ],
        q,
      ),
    );
  }, [listItems, searchQuery, clientSearchFieldsByAssessment, adminUser]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => compareAssessments(a, b, sortKey, sortDir, counselSortPhase));
    return list;
  }, [filtered, sortKey, sortDir, counselSortPhase]);

  const {
    page,
    setPage,
    totalPages,
    totalCount,
    startIndex,
    paginatedItems,
    currentCount,
  } = useListPagination(sortedFiltered, pageSize);

  const selectedItems = useMemo(
    () => sortedFiltered.filter((a) => selected.has(a.id)),
    [sortedFiltered, selected],
  );

  const allPageSelected =
    paginatedItems.length > 0 && paginatedItems.every((a) => selected.has(a.id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginatedItems.forEach((a) => next.delete(a.id));
      } else {
        paginatedItems.forEach((a) => next.add(a.id));
      }
      return next;
    });
  };

  const handleAssessmentDownload = () => {
    exportCounselorAssessments(selectedItems, 'download');
  };

  const handleAssessmentPrint = () => {
    exportCounselorAssessments(selectedItems, 'print');
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleteLoading(true);
    let deleted = 0;
    let failed = 0;
    try {
      for (const item of selectedItems) {
        try {
          await deleteAssessment(item.id, item.accessCode);
          removeCounselorAssessmentFromListCache(item.id, item.accessCode);
          deleted += 1;
        } catch {
          failed += 1;
        }
      }
      clearCounselorAssessmentsListCache(user?.uid);
      setSelected(new Set());
      setListItems((prev) => {
        const removed = new Set(selectedItems.map((a) => a.id));
        const next = prev.filter((a) => !removed.has(a.id));
        onAssessmentsRefresh?.(next);
        return next;
      });
      setActionComplete({
        title: '삭제 완료',
        message: `삭제 ${deleted}건${failed ? `, 실패 ${failed}건` : ''}`,
        error: failed > 0 && deleted === 0,
      });
    } catch (err) {
      setActionComplete({
        title: '삭제 실패',
        message: err instanceof Error ? err.message : '삭제에 실패했습니다.',
        error: true,
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  return (
    <CounselorPageSection
      showHierarchyBreadcrumb
      title="상담코드"
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      dense
      description={
        <span className="inline-flex w-full flex-wrap items-center gap-x-3 gap-y-2">
          <span className="shrink-0">
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
                  <th className={counselorListSelectThClass}>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleAllOnPage}
                      className="rounded accent-blue-500"
                      aria-label="현재 페이지 전체 선택"
                    />
                  </th>
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
                    <DualFieldSortHeader
                      leftLabel="그룹명"
                      rightLabel="제목"
                      activeKey={sortKey}
                      sortKey="counselInfo"
                      phase={counselSortPhase}
                      onSortLeft={() => toggleCounselFieldSort('org')}
                      onSortRight={() => toggleCounselFieldSort('title')}
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
                  {adminUser ? (
                    <CounselorAdminEmailSortHeader
                      emailSortKey="counselorEmail"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((a, idx) => {
                  const { dispatchTotal, testComplete } = resultStatusCounts(a);
                  const expired = isExpired(a.usageEndDate);
                  const { primary: infoPrimary, secondary: infoSecondary } = assessmentGroupTitleParts(a);
                  const isSelected = selected.has(a.id);

                  return (
                    <tr key={a.id} className={`${counselorListBodyRowClass} ${isSelected ? 'bg-white/[0.04]' : ''}`}>
                      <td className={`${counselorListTdCompactClass} tabular-nums text-slate-500`}>
                        {startIndex + idx + 1}
                      </td>
                      <td className={counselorListSelectTdClass} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(a.id)}
                          className="rounded accent-blue-500"
                          aria-label={`${infoSecondary || infoPrimary} 선택`}
                        />
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
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="inline-flex min-w-0 items-center justify-center rounded bg-emerald-800/50 px-2 py-0.5 text-xs font-medium text-emerald-100 hover:bg-emerald-700/60"
                          >
                            수정
                          </button>
                        </div>
                      </td>
                      {adminUser ? <CounselorAdminEmailTd email={a.counselorEmail} /> : null}
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
            unit="건"
            footerAction={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAssessmentDownload}
                  disabled={selected.size === 0 || bulkDeleteLoading}
                  className="inline-flex items-center rounded-md bg-emerald-700/90 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                >
                  다운로드 ({selected.size})
                </button>
                <button
                  type="button"
                  onClick={handleAssessmentPrint}
                  disabled={selected.size === 0 || bulkDeleteLoading}
                  className="inline-flex items-center rounded-md border border-white/15 bg-[#101f38]/90 px-2.5 py-1 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-50"
                >
                  인쇄 ({selected.size})
                </button>
                {!adminUser ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={bulkDeleteLoading || selected.size === 0}
                    className="inline-flex items-center rounded-md bg-red-700/90 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {bulkDeleteLoading ? '삭제 중…' : `삭제 (${selected.size})`}
                  </button>
                ) : null}
              </div>
            }
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
        void refreshFullListFromApi();
        if (info.sent && targetId) {
          startLivePolling(targetId);
        }
      }}
    />

    <AssessmentEditModal
      open={Boolean(editTarget)}
      assessmentId={editTarget?.id ?? null}
      onClose={() => setEditTarget(null)}
      onSaved={() => {
        setEditTarget(null);
        void refreshFullListFromApi();
      }}
    />

    <CounselorConfirmModal
      open={deleteConfirmOpen}
      title="삭제 확인"
      message={`선택 ${selected.size}건을 삭제하시겠습니까?`}
      confirmLabel="삭제"
      destructive
      onCancel={() => setDeleteConfirmOpen(false)}
      onConfirm={() => {
        setDeleteConfirmOpen(false);
        void handleBulkDelete();
      }}
    />

    <CounselorActionProgressOverlay
      open={bulkDeleteLoading}
      title="삭제 진행 중…"
      message={`선택 ${selected.size}건을 삭제하고 있습니다.`}
    />
    <CounselorActionCompleteModal
      open={Boolean(actionComplete)}
      title={actionComplete?.title ?? ''}
      message={actionComplete?.message}
      error={actionComplete?.error}
      onConfirm={() => setActionComplete(null)}
    />

    </CounselorPageSection>
  );
}
