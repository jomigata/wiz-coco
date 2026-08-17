'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUsers } from 'react-icons/fa';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import AuthLink from '@/components/auth/AuthLink';
import CounselorLiveStatusBadge from '@/components/counselor/CounselorLiveStatusBadge';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import CounselorListSearchInput from '@/components/counselor/CounselorListSearchInput';
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
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import CounselorActionCompleteModal from '@/components/counselor/CounselorActionCompleteModal';
import CounselorListBackLink from '@/components/counselor/CounselorListBackLink';
import { listAssessments, clearCounselorAssessmentsListCache } from '@/lib/assessmentApi';
import {
  archiveDispatchRecipients,
  fetchArchivedDispatchRecipients,
  isAssessmentLinkedArchivedRecipient,
  listCounselorClientPortals,
  permanentlyDeleteArchivedDispatchRecipients,
  restoreArchivedDispatchRecipients,
  type ArchivedDispatchRecipient,
} from '@/lib/clientPortalApi';
import { counselorClientProgressHref } from '@/lib/counselorClientRoutes';
import { exportClientPortalItems } from '@/lib/clientPortalListExport';
import { dispatchStatusDisplay } from '@/lib/dispatchRecipientDisplay';
import { INDIVIDUAL_COHORT_KEY } from '@/lib/monitoringRealtime';
import { rememberCounselorAssessmentContext, rememberCounselorProgressFrom } from '@/lib/counselorNestedNav';
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
type NameSortPhase = 'name-asc' | 'name-desc' | 'code-asc' | 'code-desc';
type CounselSortPhase =
  | 'org-asc'
  | 'org-desc'
  | 'joinCode-asc'
  | 'joinCode-desc'
  | 'title-asc'
  | 'title-desc';

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

function counselOrgLabel(item: CounselorClientPortalListItem): string {
  const primary = item.assessments[0];
  return (primary?.orgName || item.cohortName || '').trim();
}

function counselJoinCodeLabel(item: CounselorClientPortalListItem): string {
  return (item.assessments[0]?.joinAccessCode || '').trim();
}

function counselTitleLabel(item: CounselorClientPortalListItem): string {
  return (item.assessments[0]?.title || '').trim();
}

function counselInfoLabel(item: CounselorClientPortalListItem): string {
  const org = counselOrgLabel(item) || '—';
  const code = counselJoinCodeLabel(item);
  const title = counselTitleLabel(item) || '—';
  const codePart = code ? formatAccessCodeDisplay(code) : '—';
  return `${org}/${codePart}/${title}`;
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
  nameSortPhase: NameSortPhase,
  counselSortPhase: CounselSortPhase,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'createdAt':
      return mult * (parseDate(a.createdAt) - parseDate(b.createdAt));
    case 'displayName': {
      const phaseMult = (p: NameSortPhase) => (p.endsWith('-asc') ? 1 : -1);
      const m = phaseMult(nameSortPhase);
      if (nameSortPhase.startsWith('code')) {
        return m * (a.accessCode || '').localeCompare(b.accessCode || '', 'ko');
      }
      return m * (a.displayName || '').localeCompare(b.displayName || '', 'ko');
    }
    case 'accessCode':
      return mult * (a.accessCode || '').localeCompare(b.accessCode || '', 'ko');
    case 'phone':
      return mult * (a.phone || '').localeCompare(b.phone || '', 'ko');
    case 'counselInfo': {
      const phaseMult = (p: CounselSortPhase) => (p.endsWith('-asc') ? 1 : -1);
      const m = phaseMult(counselSortPhase);
      if (counselSortPhase.startsWith('joinCode')) {
        return m * counselJoinCodeLabel(a).localeCompare(counselJoinCodeLabel(b), 'ko');
      }
      if (counselSortPhase.startsWith('title')) {
        return m * counselTitleLabel(a).localeCompare(counselTitleLabel(b), 'ko');
      }
      return m * counselOrgLabel(a).localeCompare(counselOrgLabel(b), 'ko');
    }
    case 'progress':
      return mult * (progressSortValue(a) - progressSortValue(b));
    case 'notifyStatus':
      return (
        mult *
        (notifyStatusSortValue(a.notifyStatus || 'not_sent') -
          notifyStatusSortValue(b.notifyStatus || 'not_sent'))
      );
    case 'notifyAt': {
      const diff = mult * (parseDate(a.notifyAt) - parseDate(b.notifyAt));
      if (diff !== 0) return diff;
      return (a.displayName || '').localeCompare(b.displayName || '', 'ko');
    }
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
  leftPhases,
  rightPhases,
  onSortLeft,
  onSortRight,
  className = '',
}: {
  leftLabel: string;
  rightLabel: string;
  activeKey: ListSortKey;
  sortKey: ListSortKey;
  phase: NameSortPhase;
  leftPhases: NameSortPhase[];
  rightPhases: NameSortPhase[];
  onSortLeft: () => void;
  onSortRight: () => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const leftActive = active && leftPhases.includes(phase);
  const rightActive = active && rightPhases.includes(phase);
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

function TripleFieldSortHeader({
  leftLabel,
  midLabel,
  rightLabel,
  activeKey,
  sortKey,
  phase,
  onSortLeft,
  onSortMid,
  onSortRight,
  className = '',
}: {
  leftLabel: string;
  midLabel: string;
  rightLabel: string;
  activeKey: ListSortKey;
  sortKey: ListSortKey;
  phase: CounselSortPhase;
  onSortLeft: () => void;
  onSortMid: () => void;
  onSortRight: () => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const orgActive = active && phase.startsWith('org');
  const codeActive = active && phase.startsWith('joinCode');
  const titleActive = active && phase.startsWith('title');
  return (
    <th scope="col" className={`${counselorListThClass} ${className}`}>
      <div className="inline-flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSortLeft();
          }}
          className={`inline-flex items-center gap-1 transition-colors hover:text-slate-200 ${orgActive ? counselorListSortActiveClass : 'text-slate-300'}`}
        >
          {leftLabel}
          <span className="text-[10px] opacity-80" aria-hidden>
            {sortPhaseIcon(orgActive, phase)}
          </span>
        </button>
        <span className="text-slate-500">/</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSortMid();
          }}
          className={`inline-flex items-center gap-1 transition-colors hover:text-slate-200 ${codeActive ? counselorListSortActiveClass : 'text-slate-300'}`}
        >
          {midLabel}
          <span className="text-[10px] opacity-80" aria-hidden>
            {sortPhaseIcon(codeActive, phase)}
          </span>
        </button>
        <span className="text-slate-500">/</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSortRight();
          }}
          className={`inline-flex items-center gap-1 transition-colors hover:text-slate-200 ${titleActive ? counselorListSortActiveClass : 'text-slate-300'}`}
        >
          {rightLabel}
          <span className="text-[10px] opacity-80" aria-hidden>
            {sortPhaseIcon(titleActive, phase)}
          </span>
        </button>
      </div>
    </th>
  );
}

function mapArchivedToClientItem(row: ArchivedDispatchRecipient): CounselorClientPortalListItem {
  const completed = row.completedCount ?? 0;
  const required = row.requiredCount ?? 0;
  let label: ClientPortalProgressLabel = 'not_started';
  if (row.testStatus === 'completed') label = 'completed';
  else if (row.testStatus === 'in_progress' || completed > 0) label = 'in_progress';
  else if (required === 0) label = 'no_tests';
  const percent = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0;

  return {
    portalId: row.portalId,
    displayName: row.displayName,
    email: row.email,
    phone: row.phone,
    accessCode: row.myCode,
    cohortName: row.cohortName,
    status: 'archived',
    assignedAssessmentCount: 1,
    assessments: [
      {
        assessmentId: row.assessmentId,
        title: row.assessmentTitle,
        joinAccessCode: row.joinAccessCode,
        orgName: row.cohortName,
      },
    ],
    notifyStatus: row.notifyStatus || '',
    notifyError: row.notifyError,
    notifyAt: row.archivedAt,
    createdAt: row.archivedAt,
    counselorTags: [],
    progress: {
      label,
      percent,
      completedTests: completed,
      totalTests: required,
    },
  };
}

type CounselorClientListProps = {
  deletedMode?: boolean;
};

export default function CounselorClientList({ deletedMode = false }: CounselorClientListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authPending, showLoginRequired, isAuthenticated } = useAuthResolved();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<ListSortKey>('notifyAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [nameSortPhase, setNameSortPhase] = useState<NameSortPhase>('name-desc');
  const [counselSortPhase, setCounselSortPhase] = useState<CounselSortPhase>('org-asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [usageEndMap, setUsageEndMap] = useState<Record<string, string>>({});
  const [moveOpen, setMoveOpen] = useState(false);
  const [archivedRaw, setArchivedRaw] = useState<ArchivedDispatchRecipient[]>([]);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clientDeleteLoading, setClientDeleteLoading] = useState(false);
  const [actionComplete, setActionComplete] = useState<{
    title: string;
    message: string;
    error?: boolean;
  } | null>(null);
  const { pageSize, setPageSize } = useCounselorListPageSize();

  const cacheKey = useMemo(
    () =>
      buildClientPortalsCacheKey({
        counselorUid: user?.uid,
        status: 'active',
        progress: 'all',
      }),
    [user?.uid],
  );

  const initialCached = useMemo(
    () => (deletedMode ? null : readCachedClientPortals(cacheKey)),
    [cacheKey, deletedMode],
  );

  const [items, setItems] = useState<CounselorClientPortalListItem[]>(
    () => (deletedMode ? [] : initialCached?.items ?? []),
  );
  const [assessmentMeta, setAssessmentMeta] = useState<
    Record<string, { testList: { testId: string; name: string }[] }>
  >(() => initialCached?.assessmentMeta ?? {});
  const [cohorts, setCohorts] = useState<{ cohortId: string; cohortName: string }[]>(
    () => initialCached?.cohorts ?? [],
  );
  const [tags, setTags] = useState<string[]>(() => initialCached?.tags ?? []);
  const [loading, setLoading] = useState(() =>
    deletedMode ? true : !initialCached?.items?.length,
  );

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

  const load = useCallback(async () => {
    if (deletedMode) {
      setLoading(true);
      setItems([]);
      setError('');
      try {
        const filterAssessmentId = (searchParams.get('assessmentId') || '').trim();
        const data = await fetchArchivedDispatchRecipients(filterAssessmentId || undefined);
        const raw = data.items || [];
        setArchivedRaw(raw);
        setItems(raw.map(mapArchivedToClientItem));
        setCohorts([]);
        setTags([]);
        setAssessmentMeta({});
        setSelected(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        setItems([]);
        setArchivedRaw([]);
      } finally {
        setLoading(false);
      }
      return;
    }

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
        status: 'active',
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
  }, [cacheKey, deletedMode, searchParams]);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load]);

  const archivedByPortalId = useMemo(() => {
    const map = new Map<string, ArchivedDispatchRecipient>();
    for (const row of archivedRaw) {
      map.set(row.portalId, row);
    }
    return map;
  }, [archivedRaw]);

  const isRowSelectionLocked = useCallback(
    (portalId: string) => {
      if (!deletedMode) return false;
      const row = archivedByPortalId.get(portalId);
      return row ? isAssessmentLinkedArchivedRecipient(row) : false;
    },
    [archivedByPortalId, deletedMode],
  );

  useRedirectOnLoginRequiredError(error);

  const assessmentIds = useMemo(
    () => (deletedMode ? [] : Object.keys(assessmentMeta)),
    [assessmentMeta, deletedMode],
  );

  const { results: liveResults, isLive, liveError, lastUpdatedAt } =
    useCounselorTestResultsRealtime(assessmentIds, isAuthenticated && !authPending && !deletedMode);

  const displayItems = useMemo(() => {
    if (deletedMode) return items;
    return applyRealtimeToClientList(items, assessmentMeta, liveResults);
  }, [deletedMode, items, assessmentMeta, liveResults]);

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
    list.sort((a, b) =>
      compareRows(a, b, sortKey, sortDir, usageEndMap, nameSortPhase, counselSortPhase),
    );
    return list;
  }, [filtered, sortKey, sortDir, usageEndMap, nameSortPhase, counselSortPhase]);

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

  const selectableOnPage = useMemo(
    () => paginatedItems.filter((item) => !isRowSelectionLocked(item.portalId)),
    [paginatedItems, isRowSelectionLocked],
  );

  const allPageSelected =
    selectableOnPage.length > 0 && selectableOnPage.every((item) => selected.has(item.portalId));

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

  const toggleNameFieldSort = (field: 'name' | 'code') => {
    setSortKey('displayName');
    setNameSortPhase((prev) => {
      if (field === 'name') {
        if (prev.startsWith('name')) return prev === 'name-asc' ? 'name-desc' : 'name-asc';
        return 'name-asc';
      }
      if (prev.startsWith('code')) return prev === 'code-asc' ? 'code-desc' : 'code-asc';
      return 'code-asc';
    });
  };

  const toggleCounselFieldSort = (field: 'org' | 'joinCode' | 'title') => {
    setSortKey('counselInfo');
    setCounselSortPhase((prev) => {
      if (field === 'org') {
        if (prev.startsWith('org')) return prev === 'org-asc' ? 'org-desc' : 'org-asc';
        return 'org-asc';
      }
      if (field === 'joinCode') {
        if (prev.startsWith('joinCode')) return prev === 'joinCode-asc' ? 'joinCode-desc' : 'joinCode-asc';
        return 'joinCode-asc';
      }
      if (prev.startsWith('title')) return prev === 'title-asc' ? 'title-desc' : 'title-asc';
      return 'title-asc';
    });
  };

  const toggleOne = (portalId: string) => {
    if (isRowSelectionLocked(portalId)) return;
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
        selectableOnPage.forEach((item) => next.delete(item.portalId));
      } else {
        selectableOnPage.forEach((item) => next.add(item.portalId));
      }
      return next;
    });
  };

  const handleRestore = async () => {
    if (selected.size === 0) return;
    setRestoring(true);
    setMessage('');
    try {
      const result = await restoreArchivedDispatchRecipients(Array.from(selected));
      clearCounselorAssessmentsListCache(user?.uid);
      setActionComplete({
        title: '복구 완료',
        message: `복구 ${result.restored}명${result.failed ? `, 실패 ${result.failed}명` : ''}`,
      });
      await load();
    } catch (err) {
      setActionComplete({
        title: '복구 실패',
        message: err instanceof Error ? err.message : '복구에 실패했습니다.',
        error: true,
      });
    } finally {
      setRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`선택 ${selected.size}명을 영구 삭제하시겠습니까?`)) {
      return;
    }
    setDeleting(true);
    setMessage('');
    try {
      const result = await permanentlyDeleteArchivedDispatchRecipients(Array.from(selected));
      setActionComplete({
        title: '영구 삭제 완료',
        message: `영구 삭제 ${result.deleted}명${result.failed ? `, 실패 ${result.failed}명` : ''}`,
      });
      await load();
    } catch (err) {
      setActionComplete({
        title: '영구 삭제 실패',
        message: err instanceof Error ? err.message : '영구 삭제에 실패했습니다.',
        error: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveSuccess = () => {
    setMoveOpen(false);
    setSelected(new Set());
  };

  const selectedItems = useMemo(
    () => sortedFiltered.filter((item) => selected.has(item.portalId)),
    [sortedFiltered, selected],
  );

  const handleClientDownload = () => {
    exportClientPortalItems(selectedItems, 'download');
  };

  const handleClientPrint = () => {
    exportClientPortalItems(selectedItems, 'print');
  };

  const handleClientDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`선택 ${selected.size}명을 삭제하시겠습니까?`)) return;
    setClientDeleteLoading(true);
    setMessage('');
    setError('');
    try {
      const byAssessment = new Map<string, string[]>();
      for (const item of selectedItems) {
        const assessmentId = item.assessments[0]?.assessmentId;
        if (!assessmentId) continue;
        const list = byAssessment.get(assessmentId) || [];
        list.push(item.portalId);
        byAssessment.set(assessmentId, list);
      }
      let archived = 0;
      let failed = 0;
      for (const [assessmentId, portalIds] of Array.from(byAssessment.entries())) {
        const result = await archiveDispatchRecipients(assessmentId, portalIds);
        archived += result.archived;
        failed += result.failed ?? 0;
      }
      clearCounselorAssessmentsListCache(user?.uid);
      setSelected(new Set());
      setActionComplete({
        title: '삭제 완료',
        message: `삭제 ${archived}명${failed ? `, 실패 ${failed}명` : ''}`,
      });
      await load();
    } catch (err) {
      setActionComplete({
        title: '삭제 실패',
        message: err instanceof Error ? err.message : '삭제에 실패했습니다.',
        error: true,
      });
    } finally {
      setClientDeleteLoading(false);
    }
  };

  const cellLinkClass =
    'cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/60 rounded-sm';

  const goToProgress = (item: CounselorClientPortalListItem) => {
    if (isRowSelectionLocked(item.portalId)) return;
    const assessmentId = item.assessments[0]?.assessmentId;
    if (!assessmentId) return;
    rememberCounselorAssessmentContext(assessmentId);
    rememberCounselorProgressFrom(deletedMode ? 'deleted-recipients' : 'clients');
    router.push(counselorClientProgressHref(assessmentId, item.portalId));
  };

  const pageTitle = deletedMode ? '삭제된 내담자' : '내담자 목록';
  const dateColumnLabel = deletedMode ? '삭제일' : '발송일';

  return (
    <CounselorPageSection
      title={pageTitle}
      dense
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      description={
        <span className="inline-flex w-full flex-wrap items-center gap-x-3 gap-y-2">
          {deletedMode ? (
            <>
              <CounselorListBackLink href="/counselor/clients" label="내담자" />
              <AuthLink
                href="/counselor/clients"
                className="inline-flex shrink-0 items-center rounded-md border border-white/15 bg-[#101f38]/90 px-2.5 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
              >
                내담자
              </AuthLink>
            </>
          ) : null}
          <span className="shrink-0">
            전체 <span className="font-semibold text-white">{stats.total}</span>명 · 완료{' '}
            <span className="font-semibold text-emerald-300">{stats.completed}</span>명
          </span>
          <CounselorListSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="이름 · 연락처 · 상담유형 · 상담코드 · 상담정보 · 태그"
          />
        </span>
      }
      toolbar={
        deletedMode ? null : selected.size > 0 ? (
          <button
            type="button"
            onClick={() => setMoveOpen(true)}
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-sky-500/40 bg-sky-900/40 px-2.5 py-1.5 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-800/50"
          >
            다른 상담코드로 이동
          </button>
        ) : null
      }
    >
      <motion.div
        className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3"
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
          <p className="py-12 text-center text-sm text-slate-500">
            {deletedMode ? '삭제된 내담자 목록을 불러오는 중…' : '내담자 목록을 불러오는 중…'}
          </p>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
            <FaUsers className="mb-2 h-10 w-10 text-slate-600" />
            <p className="text-base text-slate-300">
              {displayItems.length === 0
                ? deletedMode
                  ? '삭제된 내담자가 없습니다'
                  : '등록된 내담자가 없습니다'
                : '검색 결과가 없습니다'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {displayItems.length === 0
                ? deletedMode
                  ? '직접 삭제하거나 상담코드 삭제로 보관된 내담자가 여기에 표시됩니다.'
                  : '상담코드를 발급하면 내담자가 여기에 표시됩니다.'
                : '검색어·필터를 바꿔 보세요.'}
            </p>
            {displayItems.length === 0 && !deletedMode ? (
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
            {loading && !deletedMode ? (
              <p className="mb-2 shrink-0 text-xs text-sky-300/80" role="status">
                저장된 목록을 표시 중… 최신 정보를 불러오고 있습니다.
              </p>
            ) : null}
            <div className={counselorListTableWrapperClass}>
              <table className="w-max min-w-full table-fixed text-sm">
                <thead>
                  <tr className={counselorListHeaderRowClass}>
                    <th className={`${counselorListNoThClass} w-12 tabular-nums`}>No.</th>
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
                      label={dateColumnLabel}
                      sortKey="notifyAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <DualFieldSortHeader
                      leftLabel="이름"
                      rightLabel="나의코드"
                      activeKey={sortKey}
                      sortKey="displayName"
                      phase={nameSortPhase}
                      leftPhases={['name-asc', 'name-desc']}
                      rightPhases={['code-asc', 'code-desc']}
                      onSortLeft={() => toggleNameFieldSort('name')}
                      onSortRight={() => toggleNameFieldSort('code')}
                    />
                    <TripleFieldSortHeader
                      leftLabel="그룹명"
                      midLabel="상담코드"
                      rightLabel="제목"
                      activeKey={sortKey}
                      sortKey="counselInfo"
                      phase={counselSortPhase}
                      onSortLeft={() => toggleCounselFieldSort('org')}
                      onSortMid={() => toggleCounselFieldSort('joinCode')}
                      onSortRight={() => toggleCounselFieldSort('title')}
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
                      label="진행현황"
                      sortKey="progress"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
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
                    const infoOrg = primaryAssessment
                      ? primaryAssessment.orgName || item.cohortName || '—'
                      : item.cohortName || '—';
                    const infoCode = primaryAssessment
                      ? formatAccessCodeDisplay(primaryAssessment.joinAccessCode || '')
                      : '—';
                    const infoSecondary = primaryAssessment?.title || '—';
                    const usageEnd = primaryUsageEndDate(item, usageEndMap);
                    const dispatchView = dispatchStatusDisplay({
                      email: item.email,
                      phone: item.phone,
                      notifyStatus: item.notifyStatus,
                      notifyError: item.notifyError,
                      notifyAt: item.notifyAt,
                    });
                    const isSelected = selected.has(item.portalId);

                    const locked = isRowSelectionLocked(item.portalId);
                    const rowClickable = !deletedMode && !locked;

                    return (
                      <tr
                        key={item.portalId}
                        className={`${counselorListBodyRowClass} ${isSelected ? 'bg-white/[0.04]' : ''} ${locked ? 'opacity-70' : ''}`}
                      >
                        <td className={`${counselorListTdClass} tabular-nums text-slate-500`}>
                          {startIndex + idx + 1}
                        </td>
                        <td className={`${counselorListTdClass} text-center`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(item.portalId)}
                            disabled={locked}
                            className="rounded accent-blue-500 disabled:opacity-40"
                            aria-label={`${item.displayName || '내담자'} 선택`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdClass} ${rowClickable ? 'cursor-pointer' : ''} text-slate-200`}
                          onClick={rowClickable ? () => goToProgress(item) : undefined}
                        >
                          {formatDateOnly(item.notifyAt)}
                        </td>
                        <td
                          className={`max-w-[11rem] ${counselorListTdClass} ${rowClickable ? 'cursor-pointer' : ''}`}
                          onClick={rowClickable ? () => goToProgress(item) : undefined}
                        >
                          <CounselorSlashInfoCell
                            primary={item.displayName || '—'}
                            secondary={formatAccessCodeDisplay(item.accessCode || '')}
                            hoverTypeLabel="나의코드"
                            normalSecondary
                            className={cellLinkClass}
                          />
                        </td>
                        <td
                          className={`max-w-[14rem] ${counselorListTdClass} ${rowClickable ? 'cursor-pointer' : ''}`}
                          onClick={rowClickable ? () => goToProgress(item) : undefined}
                        >
                          {primaryAssessment ? (
                            <CounselorSlashInfoCell
                              primary={infoOrg}
                              mid={infoCode}
                              midClassName="font-normal text-slate-400"
                              secondary={infoSecondary}
                              hoverTypeLabel={counselingCodeTypeLabel(primaryAssessment.codeCategory)}
                              hoverAccessCode={formatAccessCodeDisplay(
                                primaryAssessment.joinAccessCode || '',
                              )}
                              normalWeight
                              className={cellLinkClass}
                            />
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td
                          className={`max-w-[10rem] ${counselorListTdClass} ${rowClickable ? 'cursor-pointer' : ''}`}
                          onClick={rowClickable ? () => goToProgress(item) : undefined}
                        >
                          <DispatchStatusText value={dispatchView} />
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdClass} ${rowClickable ? 'cursor-pointer' : ''} ${progress.className}`}
                          onClick={rowClickable ? () => goToProgress(item) : undefined}
                        >
                          {progress.text}
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdClass} ${rowClickable ? 'cursor-pointer' : ''} text-slate-300 tabular-nums`}
                          onClick={rowClickable ? () => goToProgress(item) : undefined}
                        >
                          {phoneMasked}
                          {phoneFull ? <span className="sr-only">{phoneFull}</span> : null}
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdClass} ${rowClickable ? 'cursor-pointer' : ''} text-center text-slate-200`}
                          onClick={rowClickable ? () => goToProgress(item) : undefined}
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
              footerAction={
                deletedMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRestore()}
                      disabled={restoring || selected.size === 0}
                      className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {restoring ? '복구 중…' : `복구 (${selected.size})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePermanentDelete()}
                      disabled={deleting || selected.size === 0}
                      className="inline-flex items-center rounded-md bg-red-700 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleting ? '처리 중…' : `영구 삭제 (${selected.size})`}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClientDownload}
                      disabled={selected.size === 0 || clientDeleteLoading}
                      className="inline-flex items-center rounded-md bg-emerald-700/90 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                    >
                      다운로드 ({selected.size})
                    </button>
                    <button
                      type="button"
                      onClick={handleClientPrint}
                      disabled={selected.size === 0 || clientDeleteLoading}
                      className="inline-flex items-center rounded-md border border-white/15 bg-[#101f38]/90 px-2.5 py-1 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-50"
                    >
                      인쇄 ({selected.size})
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleClientDelete()}
                      disabled={clientDeleteLoading || selected.size === 0}
                      className="inline-flex items-center rounded-md bg-red-700/90 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    >
                      {clientDeleteLoading ? '삭제 중…' : `삭제 (${selected.size})`}
                    </button>
                  </div>
                )
              }
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
      {deletedMode ? (
        <>
          <CounselorActionProgressOverlay
            open={restoring}
            title="복구 진행 중…"
            message={`선택 ${selected.size}명을 복구하고 있습니다.`}
          />
          <CounselorActionProgressOverlay
            open={deleting}
            title="영구 삭제 진행 중…"
            message={`선택 ${selected.size}명을 영구 삭제하고 있습니다.`}
          />
        </>
      ) : (
        <CounselorActionProgressOverlay
          open={clientDeleteLoading}
          title="삭제 진행 중…"
          message={`선택 ${selected.size}명을 삭제하고 있습니다.`}
        />
      )}
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
