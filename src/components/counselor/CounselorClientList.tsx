'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUsers } from 'react-icons/fa';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import AuthLink from '@/components/auth/AuthLink';
import CounselorLiveStatusBadge from '@/components/counselor/CounselorLiveStatusBadge';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { displayContactPhone } from '@/lib/contactPrivacy';
import { formatPhoneDisplayOr } from '@/lib/phoneFormat';
import {
  counselingCodeTypeLabel,
  formatCounselingTypeWithCodeSlash,
} from '@/data/counselingCodeTypes';
import { listCounselorClientPortals } from '@/lib/clientPortalApi';
import { counselorClientDetailHref } from '@/lib/counselorClientRoutes';
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
type ListSortKey = 'displayName' | 'counselingCode' | 'counselInfo' | 'progress' | 'lastLoginAt' | 'notifyAt';
type SortDirection = 'asc' | 'desc';

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

function progressLabel(item: CounselorClientPortalListItem): { text: string; className: string } {
  const { label, percent, completedTests, totalTests } = item.progress;
  if (label === 'completed') {
    return { text: `완료 (${completedTests}/${totalTests})`, className: 'text-emerald-300' };
  }
  if (label === 'in_progress') {
    return { text: `진행 ${percent}% (${completedTests}/${totalTests})`, className: 'text-sky-300' };
  }
  if (label === 'not_started') {
    return { text: `미시작 (0/${totalTests})`, className: 'text-amber-300' };
  }
  return { text: '검사 없음', className: 'text-slate-500' };
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
  const title = (primary.title || '—').trim();
  const org = (primary.orgName || item.cohortName || '—').trim();
  return `${title}/${org}`;
}

function compareRows(
  a: CounselorClientPortalListItem,
  b: CounselorClientPortalListItem,
  key: ListSortKey,
  dir: SortDirection,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'displayName':
      return mult * (a.displayName || '').localeCompare(b.displayName || '', 'ko');
    case 'counselingCode': {
      const primaryA = a.assessments[0];
      const primaryB = b.assessments[0];
      const typeCmp = counselingCodeTypeLabel(primaryA?.codeCategory || 'group').localeCompare(
        counselingCodeTypeLabel(primaryB?.codeCategory || 'group'),
        'ko',
      );
      if (typeCmp !== 0) return mult * typeCmp;
      const codeA = primaryA?.joinAccessCode || a.accessCode || '';
      const codeB = primaryB?.joinAccessCode || b.accessCode || '';
      return mult * codeA.localeCompare(codeB);
    }
    case 'counselInfo':
      return mult * counselInfoLabel(a).localeCompare(counselInfoLabel(b), 'ko');
    case 'progress':
      return mult * (progressSortValue(a) - progressSortValue(b));
    case 'lastLoginAt':
      return mult * (parseDate(a.lastLoginAt) - parseDate(b.lastLoginAt));
    case 'notifyAt':
      return mult * (parseDate(a.notifyAt) - parseDate(b.notifyAt));
    default:
      return 0;
  }
}

function progressHref(assessmentId: string): string {
  return `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`;
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
    <th scope="col" className={`px-2 py-2 text-left text-xs font-medium text-slate-400 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 transition-colors hover:text-slate-200"
      >
        <span>{label}</span>
        <span className={`text-[10px] ${active ? 'text-sky-400' : 'text-slate-600'}`} aria-hidden="true">
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

export default function CounselorClientList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authPending, showLoginRequired, isAuthenticated } = useAuthResolved();
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [cohortFilter, setCohortFilter] = useState('');
  const [sortKey, setSortKey] = useState<ListSortKey>('displayName');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const cacheKey = useMemo(
    () =>
      buildClientPortalsCacheKey({
        status: statusFilter,
        cohortId: cohortFilter || undefined,
        progress: progressFilter,
        tag: tagFilter || undefined,
      }),
    [statusFilter, cohortFilter, progressFilter, tagFilter],
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
    list.sort((a, b) => compareRows(a, b, sortKey, sortDir));
    return list;
  }, [filtered, sortKey, sortDir]);

  const stats = useMemo(() => {
    const completed = displayItems.filter((i) => i.progress.label === 'completed').length;
    const inProgress = displayItems.filter((i) => i.progress.label === 'in_progress').length;
    return { total: displayItems.length, completed, inProgress };
  }, [displayItems]);

  const toggleSort = (key: ListSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'lastLoginAt' || key === 'notifyAt' ? 'desc' : 'asc');
    }
  };

  const rowHoverCellClass = (id: string) =>
    hoveredRowId === id ? 'bg-white/[0.06]' : '';

  const cellLinkClass =
    'cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/60 rounded-sm';

  const goToDetail = (portalId: string) => {
    router.push(counselorClientDetailHref(portalId));
  };

  return (
    <CounselorPageSection
      showHierarchyBreadcrumb
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      description={
        <>
          전체 <span className="font-semibold text-white">{stats.total}</span>명 · 진행 중{' '}
          <span className="font-semibold text-sky-300">{stats.inProgress}</span>명 · 완료{' '}
          <span className="font-semibold text-emerald-300">{stats.completed}</span>명
          <span className="ml-2 text-sky-200/60">({filtered.length}명 표시)</span>
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
        className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
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
            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                  <tr>
                    <SortableColumnHeader
                      label="내담자"
                      sortKey="displayName"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableColumnHeader
                      label="상담유형/상담코드"
                      sortKey="counselingCode"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableColumnHeader
                      label="상담정보"
                      sortKey="counselInfo"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableColumnHeader
                      label="검사진행"
                      sortKey="progress"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableColumnHeader
                      label="최근접속"
                      sortKey="lastLoginAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <SortableColumnHeader
                      label="발송일시"
                      sortKey="notifyAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-slate-400">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {sortedFiltered.map((item) => {
                    const progress = progressLabel(item);
                    const primaryAssessment = item.assessments[0];
                    const phoneMasked = displayContactPhone(item.phone, false);
                    const phoneFull = item.phone?.trim()
                      ? formatPhoneDisplayOr(item.phone)
                      : undefined;
                    const counselTypeCode = primaryAssessment
                      ? formatCounselingTypeWithCodeSlash(
                          primaryAssessment.codeCategory,
                          formatAccessCodeDisplay(primaryAssessment.joinAccessCode || ''),
                        )
                      : '—';
                    const counselInfo = counselInfoLabel(item);

                    return (
                      <tr
                        key={item.portalId}
                        className="group"
                        onMouseEnter={() => setHoveredRowId(item.portalId)}
                        onMouseLeave={() => setHoveredRowId(null)}
                      >
                        <td
                          className={`max-w-[12rem] px-2 py-2 text-left text-sm cursor-pointer transition-colors ${rowHoverCellClass(item.portalId)}`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          <span
                            className={`${cellLinkClass} block truncate`}
                            title={phoneFull}
                          >
                            <span className="font-medium text-white">{item.displayName || '—'}</span>
                            <span className="text-slate-400"> / </span>
                            <span className="text-slate-300 tabular-nums">{phoneMasked}</span>
                          </span>
                        </td>
                        <td
                          className={`max-w-[14rem] truncate px-2 py-2 text-left text-sm cursor-pointer transition-colors ${rowHoverCellClass(item.portalId)}`}
                          onClick={() => goToDetail(item.portalId)}
                          title={counselTypeCode}
                        >
                          {primaryAssessment ? (
                            <span className={`${cellLinkClass} truncate max-w-full block`}>
                              <span className="text-slate-200">
                                {counselingCodeTypeLabel(primaryAssessment.codeCategory || 'group')}
                              </span>
                              <span className="text-slate-400"> / </span>
                              <span className="font-mono font-semibold text-sky-300 tracking-wide">
                                {formatAccessCodeDisplay(primaryAssessment.joinAccessCode || '')}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td
                          className={`max-w-[16rem] truncate px-2 py-2 text-left text-sm text-slate-200 cursor-pointer transition-colors ${rowHoverCellClass(item.portalId)}`}
                          onClick={() => goToDetail(item.portalId)}
                          title={counselInfo}
                        >
                          {primaryAssessment ? (
                            <span className={`${cellLinkClass} truncate max-w-full block`}>
                              <span className="font-medium text-white">{primaryAssessment.title || '—'}</span>
                              <span className="text-slate-400"> / </span>
                              <span>{primaryAssessment.orgName || item.cohortName || '—'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td
                          className={`whitespace-nowrap px-2 py-2 text-left text-xs cursor-pointer transition-colors ${rowHoverCellClass(item.portalId)} ${progress.className}`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          {progress.text}
                        </td>
                        <td
                          className={`whitespace-nowrap px-2 py-2 text-left text-xs text-slate-400 cursor-pointer transition-colors ${rowHoverCellClass(item.portalId)}`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          {formatDateTime(item.lastLoginAt)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-2 py-2 text-left text-xs text-slate-300 cursor-pointer transition-colors ${rowHoverCellClass(item.portalId)}`}
                          onClick={() => goToDetail(item.portalId)}
                        >
                          {formatDateTime(item.notifyAt)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-center cursor-default">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <AuthLink
                              href={counselorClientDetailHref(item.portalId)}
                              className="rounded bg-sky-800/50 px-2 py-0.5 text-xs font-medium text-sky-100 hover:bg-sky-700/60 transition-colors"
                            >
                              상세
                            </AuthLink>
                            {primaryAssessment ? (
                              <AuthLink
                                href={progressHref(primaryAssessment.assessmentId)}
                                className="rounded bg-emerald-800/50 px-2 py-0.5 text-xs font-medium text-emerald-100 hover:bg-emerald-700/60 transition-colors"
                              >
                                진행현황
                              </AuthLink>
                            ) : null}
                            <AuthLink
                              href={`/counselor/test-results?portalId=${encodeURIComponent(item.portalId)}`}
                              className="rounded bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-300 hover:bg-white/15 transition-colors"
                            >
                              결과
                            </AuthLink>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 shrink-0 text-xs text-slate-500 sm:text-sm">총 {filtered.length}명</div>
          </>
        )}
      </motion.div>
    </CounselorPageSection>
  );
}
