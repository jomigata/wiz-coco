'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUsers } from 'react-icons/fa';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import AuthLink from '@/components/auth/AuthLink';
import CounselorLiveStatusBadge from '@/components/counselor/CounselorLiveStatusBadge';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import CounselorSlashInfoCell from '@/components/counselor/CounselorSlashInfoCell';
import DispatchStatusText from '@/components/counselor/DispatchStatusText';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { displayContactPhone } from '@/lib/contactPrivacy';
import { formatPhoneDisplayOr } from '@/lib/phoneFormat';
import { counselingCodeTypeLabel } from '@/data/counselingCodeTypes';
import {
  counselorListBodyRowClass,
  counselorListHeaderRowClass,
  counselorListNoThClass,
  counselorListSortActiveClass,
  counselorListSortIdleClass,
  counselorListTableWrapperClass,
  counselorListTdClass,
  counselorListThClass,
} from '@/lib/counselorListTableStyles';
import { useListPagination } from '@/hooks/useListPagination';
import { useCounselorListPageSize } from '@/hooks/useCounselorListPageSize';
import CounselorPortalMoveDialog from '@/components/counselor/CounselorPortalMoveDialog';
import { listAssessments } from '@/lib/assessmentApi';
import { listCounselorClientPortals } from '@/lib/clientPortalApi';
import { counselorClientDetailHref } from '@/lib/counselorClientRoutes';
import { dispatchStatusDisplay } from '@/lib/dispatchRecipientDisplay';
import { INDIVIDUAL_COHORT_KEY } from '@/lib/monitoringRealtime';
import { applyRealtimeToClientList } from '@/lib/clientPortalRealtime';
import { useCounselorTestResultsRealtime } from '@/hooks/useCounselorTestResultsRealtime';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import {
  buildClientPortalsCacheKey,
  readCachedClientPortals,
  writeCachedClientPortals,
} from '@/lib/counselorSessionCache';
import type { ClientPortalProgressLabel, CounselorClientPortalListItem } from '@/types/clientPortal';

type StatusFilter = 'active' | 'archived' | 'all';
type ProgressFilter = 'all' | ClientPortalProgressLabel;
type ListSortKey =
  | 'createdAt'
  | 'displayName'
  | 'accessCode'
  | 'phone'
  | 'progress'
  | 'notifyStatus'
  | 'counselInfo'
  | 'notifyAt'
  | 'usageEndDate';
type SortDirection = 'asc' | 'desc';

function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function parseDate(iso?: string | null): number {
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

function progressLabel(item: CounselorClientPortalListItem): { text: string; className: string } {
  const { label, percent, completedTests, totalTests } = item.progress;
  if (label === 'completed') {
    return {
      text: `완료 (${completedTests}/${totalTests})`,
      className: 'font-medium text-emerald-200',
    };
  }
  if (label === 'in_progress') {
    return {
      text: `진행 ${percent}% (${completedTests}/${totalTests})`,
      className: 'font-medium text-sky-200',
    };
  }
  if (label === 'not_started') {
    return {
      text: `미시작 (0/${totalTests})`,
      className: 'font-medium text-amber-200',
    };
  }
  return { text: '검사 없음', className: 'font-medium text-slate-400' };
}

function progressSortValue(item: CounselorClientPortalListItem): number {
  const order: Record<ClientPortalProgressLabel, number> = {
    completed: 4,
    in_progress: 3,
    not_started: 2,
    no_tests: 1,
  };
  return order[item.progress.label] * 1000 + item.progress.percent;
}

function counselInfoLabel(item: CounselorClientPortalListItem): string {
  const primary = item.assessments[0];
  if (!primary) return '—';
  const org = (primary.orgName || item.cohortName || '—').trim();
  const title = (primary.title || '—').trim();
  return `${org}/${title}`;
}

function notifyStatusSortValue(status: string): number {
  const order: Record<string, number> = {
    not_sent: 1,
    skipped: 2,
    sending: 3,
    partial: 4,
    sent: 5,
    failed: 6,
  };
  return order[status] ?? 0;
}

function primaryUsageEndDate(
  item: CounselorClientPortalListItem,
  usageMap: Record<string, string>,
): string {
  const aid = item.assessments[0]?.assessmentId;
  return aid ? usageMap[aid] || '' : '';
}

function compareRows(
  a: CounselorClientPortalListItem,
  b: CounselorClientPortalListItem,
  key: ListSortKey,
  dir: SortDirection,
  usageMap: Record<string, string>,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'createdAt':
      return mult * (parseDate(a.createdAt) - parseDate(b.createdAt));
    case 'displayName':
      return mult * (a.displayName || '').localeCompare(b.displayName || '', 'ko');
    case 'accessCode':
      return mult * (a.accessCode || '').localeCompare(b.accessCode || '', 'ko');
    case 'phone':
      return mult * (a.phone || '').localeCompare(b.phone || '', 'ko');
    case 'counselInfo':
      return mult * counselInfoLabel(a).localeCompare(counselInfoLabel(b), 'ko');
    case 'progress':
      return mult * (progressSortValue(a) - progressSortValue(b));
    case 'notifyStatus':
      return (
        mult *
        (notifyStatusSortValue(a.notifyStatus || 'not_sent') -
          notifyStatusSortValue(b.notifyStatus || 'not_sent'))
      );
    case 'notifyAt':
      return mult * (parseDate(a.notifyAt) - parseDate(b.notifyAt));
    case 'usageEndDate':
      return (
        mult *
        (parseUsageEndDate(primaryUsageEndDate(a, usageMap)) -
          parseUsageEndDate(primaryUsageEndDate(b, usageMap)))
      );
    default:
      return 0;
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

export default function CounselorClientList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authPending, showLoginRequired, isAuthenticated } = useAuthResolved();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [cohortFilter, setCohortFilter] = useState('');
  const [sortKey, setSortKey] = useState<ListSortKey>('displayName');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [usageEndMap, setUsageEndMap] = useState<Record<string, string>>({});
  const [moveOpen, setMoveOpen] = useState(false);
  const { pageSize, setPageSize } = useCounselorListPageSize();

  const cacheKey = useMemo(
    () =>
      buildClientPortalsCacheKey({
        counselorUid: user?.uid,
        status: statusFilter,
        cohortId: cohortFilter || undefined,
        progress: progressFilter,
        tag: tagFilter || undefined,
      }),
    [user?.uid, statusFilter, cohortFilter, progressFilter, tagFilter],
  );

  const initialCached = useMemo(() => readCachedClientPortals(cacheKey), [cacheKey]);

  const [items, setItems] = useState<CounselorClientPortalListItem[]>(
    () => initialCached?.items ?? [],
  );
  const [assessmentMeta, setAssessmentMeta] = useState<
    Record<string, { testList: { testId: string; name: string }[] }>
  >(() => initialCached?.assessmentMeta ?? {});
  const [cohorts, setCohorts] = useState<{ cohortId: string; cohortName: string }[]>(
    () => initialCached?.cohorts ?? [],
  );
  const [tags, setTags] = useState<string[]>(() => initialCached?.tags ?? []);
  const [loading, setLoading] = useState(() => !initialCached?.items?.length);

  useEffect(() => {
    const fromUrl = searchParams.get('cohortId');
    if (fromUrl !== null) {
      setCohortFilter(fromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    void listAssessments()
      .then((data) => {
        const map: Record<string, string> = {};
        for (const a of data.assessments || []) {
          if (a.id) {
            map[a.id] = (a.usageEndDate || '').trim();
          }
        }
        setUsageEndMap(map);
      })
      .catch(() => {
        // usage end dates are optional display
      });
  }, []);

  const updateCohortFilter = useCallback(
    (value: string) => {
      setCohortFilter(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('cohortId', value);
      } else {
        params.delete('cohortId');
      }
      const qs = params.toString();
      router.replace(qs ? `/counselor/clients?${qs}` : '/counselor/clients', { scroll: false });
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    const cached = readCachedClientPortals(cacheKey);
    if (cached?.items?.length) {
      setItems(cached.items);
      setCohorts(cached.cohorts || []);
      setTags(cached.tags || []);
      setAssessmentMeta(cached.assessmentMeta || {});
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const data = await listCounselorClientPortals({
        status: statusFilter,
        cohortId: cohortFilter || undefined,
        progress: progressFilter,
        tag: tagFilter || undefined,
      });
      writeCachedClientPortals(cacheKey, data);
      setItems(data.items || []);
      setCohorts(data.cohorts || []);
      setTags(data.tags || []);
      setAssessmentMeta(data.assessmentMeta || {});
    } catch (err) {
      if (!cached?.items?.length) {
        setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, statusFilter, cohortFilter, progressFilter, tagFilter]);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load]);

  useRedirectOnLoginRequiredError(error);

  const assessmentIds = useMemo(() => Object.keys(assessmentMeta), [assessmentMeta]);

  const { results: liveResults, isLive, liveError, lastUpdatedAt } =
    useCounselorTestResultsRealtime(assessmentIds, isAuthenticated && !authPending);

  const displayItems = useMemo(
    () => applyRealtimeToClientList(items, assessmentMeta, liveResults),
    [items, assessmentMeta, liveResults],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayItems;
    return displayItems.filter((item) => {
      const hay = [
        item.displayName || '',
        item.email || '',
        item.phone || '',
        item.accessCode || '',
        item.cohortName || '',
        ...(item.counselorTags || []),
        ...item.assessments.map((a) => `${a.title} ${a.orgName || ''} ${a.joinAccessCode || ''}`),
        counselingCodeTypeLabel(item.assessments[0]?.codeCategory),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [displayItems, searchQuery]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => compareRows(a, b, sortKey, sortDir, usageEndMap));
    return list;
  }, [filtered, sortKey, sortDir, usageEndMap]);

  const {
    page,
    setPage,
    totalPages,
    totalCount,
    startIndex,
    paginatedItems,
    currentCount,
  } = useListPagination(sortedFiltered, pageSize);

  const stats = useMemo(() => {
    const completed = displayItems.filter((i) => i.progress.label === 'completed').length;
    const inProgress = displayItems.filter((i) => i.progress.label === 'in_progress').length;
    return { total: displayItems.length, completed, inProgress };
  }, [displayItems]);

  const selectedPortalIds = useMemo(() => Array.from(selected), [selected]);

  const movePortalSummaries = useMemo(
    () =>
      items
        .filter((item) => selected.has(item.portalId))
        .map((item) => ({
          portalId: item.portalId,
          displayName: item.displayName,
          myCode: item.accessCode,
        })),
    [items, selected],
  );

  const allPageSelected =
    paginatedItems.length > 0 && paginatedItems.every((item) => selected.has(item.portalId));

  const toggleSort = (key: ListSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(
        key === 'notifyAt' || key === 'createdAt' || key === 'usageEndDate' ? 'desc' : 'asc',
      );
    }
  };

  const toggleOne = (portalId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(portalId)) next.delete(portalId);
      else next.add(portalId);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginatedItems.forEach((item) => next.delete(item.portalId));
      } else {
        paginatedItems.forEach((item) => next.add(item.portalId));
      }
      return next;
    });
  };

  const handleMoveSuccess = () => {
    setMoveOpen(false);
    setSelected(new Set());
  };

  const cellLinkClass =
    'cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/60 rounded-sm';

  const goToDetail = (portalId: string) => {
    router.push(counselorClientDetailHref(portalId));
  };

  return (
    <CounselorPageSection
      bodyClassName="!p-0"
      noBodyPadding
      description={
        <>
          전체 <span className="font-semibold text-white">{stats.total}</span>명 · 진행 중{' '}
          <span className="font-semibold text-sky-300">{stats.inProgress}</span>명 · 완료{' '}
          <span className="font-semibold text-emerald-300">{stats.completed}</span>명
          <span className="ml-2 text-sky-200/60">({filtered.length}명 표시)</span>
          {selected.size > 0 ? (
            <span className="ml-2 font-medium text-sky-200">{selected.size}명 선택</span>
          ) : null}
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
              placeholder="이름 · 연락처 · 상담유형 · 상담코드 · 상담정보 · 태그"
              className="w-full rounded-md border border-white/10 bg-[#101f38]/90 py-1.5 pl-8 pr-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
            />
          </div>
          {selected.size > 0 ? (
            <button
              type="button"
              onClick={() => setMoveOpen(true)}
              className="inline-flex shrink-0 items-center justify-center rounded-md border border-sky-500/40 bg-sky-900/40 px-2.5 py-1.5 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-800/50"
            >
              다른 상담코드로 이동
            </button>
          ) : null}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-white/10 bg-[#101f38]/90 px-2 py-1.5 text-sm text-slate-200"
            title="내담자 상태"
          >
            <option value="active">활성</option>
            <option value="archived">보관</option>
            <option value="all">전체 상태</option>
          </select>
          <select
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value as ProgressFilter)}
            className="rounded-md border border-white/10 bg-[#101f38]/90 px-2 py-1.5 text-sm text-slate-200"
            title="검사 진행"
          >
            <option value="all">전체 진행</option>
            <option value="in_progress">진행 중</option>
            <option value="not_started">미시작</option>
            <option value="completed">완료</option>
            <option value="no_tests">검사 없음</option>
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="hidden rounded-md border border-white/10 bg-[#101f38]/90 px-2 py-1.5 text-sm text-slate-200 sm:block"
            title="관리 태그"
          >
            <option value="">전체 태그</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
          <select
            value={cohortFilter}
            onChange={(e) => updateCohortFilter(e.target.value)}
            className="rounded-md border border-white/10 bg-[#101f38]/90 px-2 py-1.5 text-sm text-slate-200"
            title="그룹"
          >
            <option value="">전체 그룹</option>
            <option value={INDIVIDUAL_COHORT_KEY}>개별 발급</option>
            {cohorts.map((c) => (
              <option key={c.cohortId} value={c.cohortId}>
                {c.cohortName || c.cohortId}
              </option>
            ))}
          </select>
          <CounselorLiveStatusBadge isLive={isLive} liveError={liveError} lastUpdatedAt={lastUpdatedAt} />
          <AuthLink
            href="/counselor/assessments/new"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-sky-600/90 px-2.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
          >
            +상담코드생성
          </AuthLink>
        </>
      }
    >
      <motion.div
        className="p-2.5 text-sm sm:p-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {message ? (
          <div className="mb-2 shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mb-2 shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading && displayItems.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">내담자 목록을 불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
            <FaUsers className="mb-2 h-10 w-10 text-slate-600" />
            <p className="text-base text-slate-300">
              {displayItems.length === 0 ? '등록된 내담자가 없습니다' : '검색 결과가 없습니다'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {displayItems.length === 0
                ? '상담코드를 발급하면 내담자가 여기에 표시됩니다.'
                : '검색어·필터를 바꿔 보세요.'}
            </p>
            {displayItems.length === 0 ? (
              <AuthLink
                href="/counselor/assessments/new"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-sky-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
              >
                상담코드생성
              </AuthLink>
            ) : null}
          </div>
        ) : (
          <>
            {loading ? (
              <p className="mb-2 shrink-0 text-xs text-sky-300/80" role="status">
                저장된 목록을 표시 중… 최신 정보를 불러오고 있습니다.
              </p>
            ) : null}
            <div className={counselorListTableWrapperClass}>
              <table className="w-max min-w-full table-fixed text-sm">
                <thead>
                  <tr className={counselorListHeaderRowClass}>
                    <SortableColumnHeader
                      label="No."
                      sortKey="createdAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="w-12 tabular-nums"
                    />
                    <th className={`${counselorListThClass} w-10 text-center`}>
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleAllOnPage}
                        className="rounded accent-blue-500"
                        aria-label="현재 페이지 전체 선택"
                      />
                    </th>
                    <SortableColumnHeader
                      label="이름 / 나의코드"
                      sortKey="displayName"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableColumnHeader
                      label="휴대폰"
                      sortKey="phone"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <SortableColumnHeader
                      label="진행현황"
                      sortKey="progress"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <SortableColumnHeader
                      label="발송현황"
                      sortKey="notifyStatus"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <SortableColumnHeader
                      label="그룹명(상담코드) / 제목"
                      sortKey="counselInfo"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableColumnHeader
                      label="발송일"
                      sortKey="notifyAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <SortableColumnHeader
                      label="사용종료일"
                      sortKey="usageEndDate"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap text-center"
                    />
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, idx) => {
                    const progress = progressLabel(item);
                    const primaryAssessment = item.assessments[0];
                    const phoneMasked = displayContactPhone(item.phone, false);
                    const phoneFull = item.phone?.trim()
                      ? formatPhoneDisplayOr(item.phone)
                      : undefined;
                    const infoPrimary = primaryAssessment
                      ? `${primaryAssessment.orgName || item.cohortName || '—'} (${formatAccessCodeDisplay(primaryAssessment.joinAccessCode || '')})`
                      : item.cohortName || '—';
                    const infoSecondary = primaryAssessment?.title || '—';
                    const usageEnd = primaryUsageEndDate(item, usageEndMap);
                    const dispatchView = dispatchStatusDisplay({
                      email: item.email,
                      phone: item.phone,
                      notifyStatus: item.notifyStatus,
                      notifyError: item.notifyError,
                    });
                    const isSelected = selected.has(item.portalId);

                    return (
                      <tr
                        key={item.portalId}
                        className={`${counselorListBodyRowClass} ${isSelected ? 'bg-white/[0.04]' : ''}`}
                      >
                        <td className={`${counselorListTdClass} tabular-nums text-slate-500`}>
                          {startIndex + idx + 1}
                        </td>
                        <td className={`${counselorListTdClass} text-center`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(item.portalId)}
                            className="rounded accent-blue-500"
                            aria-label={`${item.displayName || '내담자'} 선택`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td
                          className={`max-w-[11rem] ${counselorListTdClass} cursor-pointer`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          <CounselorSlashInfoCell
                            primary={item.displayName || '—'}
                            secondary={formatAccessCodeDisplay(item.accessCode || '')}
                            hoverTypeLabel="나의코드"
                            className={cellLinkClass}
                          />
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdClass} cursor-pointer text-slate-300 tabular-nums`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          {phoneMasked}
                          {phoneFull ? <span className="sr-only">{phoneFull}</span> : null}
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdClass} cursor-pointer ${progress.className}`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          {progress.text}
                        </td>
                        <td
                          className={`max-w-[10rem] ${counselorListTdClass} cursor-pointer`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          <DispatchStatusText value={dispatchView} />
                        </td>
                        <td
                          className={`max-w-[14rem] ${counselorListTdClass} cursor-pointer`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          {primaryAssessment ? (
                            <CounselorSlashInfoCell
                              primary={infoPrimary}
                              secondary={infoSecondary}
                              hoverTypeLabel={counselingCodeTypeLabel(primaryAssessment.codeCategory)}
                              hoverAccessCode={formatAccessCodeDisplay(
                                primaryAssessment.joinAccessCode || '',
                              )}
                              className={cellLinkClass}
                            />
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdClass} cursor-pointer text-slate-200`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          {formatDateOnly(item.notifyAt)}
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdClass} cursor-pointer text-center text-slate-200`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          {formatUsageEndDate(usageEnd)}
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
              unit="명"
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </motion.div>

      <CounselorPortalMoveDialog
        open={moveOpen}
        portalIds={selectedPortalIds}
        portalSummaries={movePortalSummaries}
        onClose={() => setMoveOpen(false)}
        onSuccess={handleMoveSuccess}
      />
    </CounselorPageSection>
  );
}
