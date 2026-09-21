'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUsers } from 'react-icons/fa';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import AuthLink from '@/components/auth/AuthLink';
import CounselorLiveStatusBadge from '@/components/counselor/CounselorLiveStatusBadge';
import CounselorListTableScroll from '@/components/counselor/CounselorListTableScroll';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import CounselorListHoverTooltip from '@/components/counselor/CounselorListHoverTooltip';
import CounselorListSearchInput from '@/components/counselor/CounselorListSearchInput';
import CounselorSlashInfoCell from '@/components/counselor/CounselorSlashInfoCell';
import DispatchStatusText from '@/components/counselor/DispatchStatusText';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { normalizeRecipientPhone } from '@/lib/phoneFormat';
import { counselingCodeTypeLabel } from '@/data/counselingCodeTypes';
import {
  counselorListBodyRowClass,
  counselorListBodyRowClassAt,
  counselorListBodyRowStaticClass,
  counselorListHeaderRowClass,
  counselorListNoThClass,
  counselorListSelectTdClass,
  counselorListSelectThClass,
  counselorListSortActiveClass,
  counselorListSortIdleClass,
  counselorListTdClass,
  counselorListThClass,
  counselorListTheadClass,
} from '@/lib/counselorListTableStyles';
import { matchesWildcardFields } from '@/lib/wildcardSearch';
import { useListPagination } from '@/hooks/useListPagination';
import { useCounselorListPageSize } from '@/hooks/useCounselorListPageSize';
import CounselorPortalMoveDialog from '@/components/counselor/CounselorPortalMoveDialog';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import CounselorActionCompleteModal from '@/components/counselor/CounselorActionCompleteModal';
import CounselorConfirmModal from '@/components/counselor/CounselorConfirmModal';
import CounselorNotifyConfirmDialog from '@/components/counselor/CounselorNotifyConfirmDialog';
import {
  buildDispatchGroupsFromSelections,
  executeGroupedDispatchNotify,
  flattenDispatchRecipients,
  type DispatchNotifyGroup,
} from '@/lib/counselorBulkDispatch';
import CounselorListBackLink from '@/components/counselor/CounselorListBackLink';
import { DELETED_RECIPIENTS_HREF } from '@/lib/counselorNestedNav';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import {
  getCounselorResult,
  listAssessments,
  clearCounselorAssessmentsListCache,
  type CounselorResultDetail,
} from '@/lib/assessmentApi';
import {
  archiveDispatchRecipients,
  fetchArchivedDispatchRecipients,
  fetchAssessmentDispatchStatus,
  fetchDispatchRecipientDetail,
  isAssessmentLinkedArchivedRecipient,
  listCounselorClientPortals,
  permanentlyDeleteArchivedDispatchRecipients,
  restoreArchivedDispatchRecipients,
  updateDispatchRecipientContact,
  type ArchivedDispatchRecipient,
  type DispatchRecipient,
  type DispatchTestResult,
} from '@/lib/clientPortalApi';
import { stripAssessmentTitleDispatchCountSuffix } from '@/lib/counselorAssessmentResultDisplay';
import { exportClientPortalItems } from '@/lib/clientPortalListExport';
import RecipientContactCell from '@/components/counselor/RecipientContactCell';
import CounselorDispatchRecipientExpandRow from '@/components/counselor/CounselorDispatchRecipientExpandDetail';
import { CounselorRecipientExpandLeadingCells } from '@/components/counselor/CounselorRecipientExpandRowCells';
import CounselorRecipientContactEditModal from '@/components/counselor/CounselorRecipientContactEditModal';
import { dispatchStatusDisplay, formatNotifyDate, compareDispatchStatusSort, recipientProgressDisplay } from '@/lib/dispatchRecipientDisplay';
import { INDIVIDUAL_COHORT_KEY } from '@/lib/monitoringRealtime';
import { consumeCounselorListSkipReload } from '@/lib/counselorListNavigationCache';
import { applyRealtimeToClientList } from '@/lib/clientPortalRealtime';
import { useCounselorTestResultsRealtime } from '@/hooks/useCounselorTestResultsRealtime';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';
import { CounselorAdminEmailSortHeader, CounselorAdminEmailTd, compareCounselorEmail } from '@/components/counselor/CounselorAdminEmailColumn';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import {
  fetchPermanentlyDeletedRecords,
  restorePermanentlyDeletedRecords,
  type PermanentlyDeletedPortal,
} from '@/lib/adminDeletionsApi';
import {
  buildClientPortalsCacheKey,
  buildDeletedRecipientsCacheKey,
  readCachedClientPortals,
  readCachedDeletedRecipients,
  writeCachedClientPortals,
  writeCachedDeletedRecipients,
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
  | 'usageEndDate'
  | 'counselorEmail';
type SortDirection = 'asc' | 'desc';
type NameSortPhase = 'name-asc' | 'name-desc' | 'code-asc' | 'code-desc';
type CounselSortPhase =
  | 'org-asc'
  | 'org-desc'
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

function formatCompletedAt(iso: string | null | undefined): string {
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

function archivedTestsToDispatchTests(
  tests: CounselorClientPortalListItem['archivedTests'],
): DispatchTestResult[] {
  return (tests ?? []).map((t) => ({
    testId: t.testId,
    testName: t.testName || t.testId,
    status:
      t.status === 'completed' || t.status === 'in_progress' || t.status === 'not_started'
        ? t.status
        : 'not_started',
    completedAt: t.completedAt ?? null,
    resultId: t.resultId ?? null,
  }));
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
  const p = item.progress;
  if (p.label === 'no_tests') {
    return { text: '검사 없음', className: 'font-medium text-slate-400' };
  }
  const testStatus =
    p.label === 'completed'
      ? 'completed'
      : p.label === 'in_progress'
        ? 'in_progress'
        : 'not_started';
  const display = recipientProgressDisplay({
    testStatus,
    completedCount: p.completedTests,
    requiredCount: p.totalTests,
  });
  if (p.label === 'not_started' && display.text.includes('미시작')) {
    return {
      text: display.text.replace('미시작', '미완료'),
      className: display.className.replace('font-medium', 'font-normal'),
    };
  }
  return display;
}

function counselMoveProgressNote(item: CounselorClientPortalListItem): React.ReactNode | null {
  const origin = (item.originAccessCode || '').trim();
  const current = counselJoinCodeLabel(item);
  if (!origin || !current || origin === current) return null;
  return (
    <div className="mt-0.5 text-xs leading-snug text-slate-400">
      상담코드 이동(
      <span className="font-normal text-slate-500">{origin}</span>
      <span className="text-slate-600"> → </span>
      <span className="font-normal text-white">{current}</span>
      )
    </div>
  );
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
      return (
        mult *
        normalizeRecipientPhone(a.phone || '').localeCompare(
          normalizeRecipientPhone(b.phone || ''),
          'ko',
        )
      );
    case 'counselInfo': {
      const phaseMult = (p: CounselSortPhase) => (p.endsWith('-asc') ? 1 : -1);
      const m = phaseMult(counselSortPhase);
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
        compareDispatchStatusSort(
          {
            email: a.email,
            phone: a.phone,
            notifyStatus: a.notifyStatus,
            notifyError: a.notifyError,
            notifyKind: a.notifyKind,
            notifySentVia: a.notifySentVia,
            notifyEmailChannel: a.notifyEmailChannel,
            notifyPhoneChannel: a.notifyPhoneChannel,
            notifyAt: a.notifyAt,
          },
          {
            email: b.email,
            phone: b.phone,
            notifyStatus: b.notifyStatus,
            notifyError: b.notifyError,
            notifyKind: b.notifyKind,
            notifySentVia: b.notifySentVia,
            notifyEmailChannel: b.notifyEmailChannel,
            notifyPhoneChannel: b.notifyPhoneChannel,
            notifyAt: b.notifyAt,
          },
        )
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
    case 'counselorEmail':
      return compareCounselorEmail(a.counselorEmail, b.counselorEmail, dir);
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

function CounselDualFieldSortHeader({
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
  const orgActive = active && phase.startsWith('org');
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
    counselorId: row.counselorId,
    counselorEmail: row.counselorEmail,
    progress: {
      label,
      percent,
      completedTests: completed,
      totalTests: required,
    },
    archivedTests: row.tests,
  };
}

function listItemToDispatchRecipient(
  item: CounselorClientPortalListItem,
  tests: DispatchTestResult[],
): DispatchRecipient {
  const p = item.progress;
  const testStatus: DispatchRecipient['testStatus'] =
    p.label === 'completed'
      ? 'completed'
      : p.label === 'in_progress'
        ? 'in_progress'
        : 'not_started';
  return {
    portalId: item.portalId,
    displayName: item.displayName || '',
    email: item.email || '',
    phone: item.phone || '',
    myCode: item.accessCode || '',
    joinAccessCode: item.assessments[0]?.joinAccessCode || '',
    notifyStatus: item.notifyStatus || 'not_sent',
    notifyError: item.notifyError,
    notifyAt: item.notifyAt,
    testStatus,
    completedCount: p.completedTests,
    requiredCount: p.totalTests,
    tests,
    originAccessCode: item.originAccessCode,
  };
}

function mapPermanentlyDeletedToClientItem(row: PermanentlyDeletedPortal): CounselorClientPortalListItem {
  return mapArchivedToClientItem({
    portalId: row.portalId,
    displayName: row.displayName,
    email: row.email,
    phone: row.phone,
    myCode: row.myCode,
    joinAccessCode: row.joinAccessCode,
    assessmentId: row.assessmentId,
    assessmentTitle: row.assessmentTitle,
    cohortName: row.cohortName,
    archivedAt: row.permanentlyDeletedAt,
    archivedReason: row.assessmentPermanentlyDeleted ? 'assessment_deleted' : row.archivedReason,
    assessmentArchived: row.assessmentPermanentlyDeleted || row.assessmentArchived,
    counselorId: row.counselorId,
    counselorEmail: row.counselorEmail,
    notifyStatus: row.notifyStatus,
    notifyError: row.notifyError,
    notifyAt: row.permanentlyDeletedAt,
    testStatus: row.testStatus,
    completedCount: row.completedCount,
    requiredCount: row.requiredCount,
  });
}

type CounselorClientListProps = {
  deletedMode?: boolean;
  permanentlyDeletedMode?: boolean;
};

export default function CounselorClientList({
  deletedMode = false,
  permanentlyDeletedMode = false,
}: CounselorClientListProps) {
  const searchParams = useSearchParams();
  const { user, authPending, showLoginRequired, isAuthenticated } = useAuthResolved();
  const adminUser = isAdmin(user?.role ?? getAppRoleSync());
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
  const [notifyConfirmKind, setNotifyConfirmKind] = useState<'remind' | 'resend' | null>(null);
  const [notifyDispatchGroups, setNotifyDispatchGroups] = useState<DispatchNotifyGroup[]>([]);
  const [notifyDispatchLoading, setNotifyDispatchLoading] = useState(false);
  const [archivedRaw, setArchivedRaw] = useState<ArchivedDispatchRecipient[]>([]);
  const [permanentlyDeletedRaw, setPermanentlyDeletedRaw] = useState<PermanentlyDeletedPortal[]>([]);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clientDeleteLoading, setClientDeleteLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [permanentDeleteConfirmOpen, setPermanentDeleteConfirmOpen] = useState(false);
  const [actionComplete, setActionComplete] = useState<{
    title: string;
    message: string;
    error?: boolean;
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandDetailByPortal, setExpandDetailByPortal] = useState<
    Record<
      string,
      { recipient: DispatchRecipient; tests: DispatchTestResult[] } | 'loading' | 'error'
    >
  >({});
  const [contactEditItem, setContactEditItem] = useState<CounselorClientPortalListItem | null>(
    null,
  );
  const [contactEditSaving, setContactEditSaving] = useState(false);
  const [detail, setDetail] = useState<CounselorResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
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
    () => (deletedMode || permanentlyDeletedMode ? null : readCachedClientPortals(cacheKey)),
    [cacheKey, deletedMode, permanentlyDeletedMode],
  );

  const [items, setItems] = useState<CounselorClientPortalListItem[]>(
    () => (deletedMode || permanentlyDeletedMode ? [] : initialCached?.items ?? []),
  );
  const [assessmentMeta, setAssessmentMeta] = useState<
    Record<string, { testList: { testId: string; name: string }[] }>
  >(() => initialCached?.assessmentMeta ?? {});
  const [cohorts, setCohorts] = useState<{ cohortId: string; cohortName: string }[]>(
    () => initialCached?.cohorts ?? [],
  );
  const [tags, setTags] = useState<string[]>(() => initialCached?.tags ?? []);
  const [loading, setLoading] = useState(() =>
    deletedMode || permanentlyDeletedMode ? true : !initialCached?.items?.length,
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
    if (permanentlyDeletedMode) {
      setLoading(true);
      setItems([]);
      setError('');
      try {
        const data = await fetchPermanentlyDeletedRecords();
        const raw = data.portals || [];
        setPermanentlyDeletedRaw(raw);
        setItems(raw.map(mapPermanentlyDeletedToClientItem));
        setCohorts([]);
        setTags([]);
        setAssessmentMeta({});
        setSelected(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        setItems([]);
        setPermanentlyDeletedRaw([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (deletedMode) {
      const filterAssessmentId = (searchParams.get('assessmentId') || '').trim();
      const deletedCacheKey = buildDeletedRecipientsCacheKey({
        counselorUid: user?.uid,
        assessmentId: filterAssessmentId,
      });
      const cachedRaw = readCachedDeletedRecipients<ArchivedDispatchRecipient>(deletedCacheKey);
      const skipReload = consumeCounselorListSkipReload();
      if (skipReload === 'deleted-recipients' && cachedRaw?.length) {
        setArchivedRaw(cachedRaw);
        setItems(cachedRaw.map(mapArchivedToClientItem));
        setLoading(false);
      } else if (cachedRaw?.length) {
        setArchivedRaw(cachedRaw);
        setItems(cachedRaw.map(mapArchivedToClientItem));
      } else {
        setLoading(true);
        setItems([]);
      }
      setError('');
      try {
        const data = await fetchArchivedDispatchRecipients(filterAssessmentId || undefined, {
          ownOnly: adminUser,
        });
        const raw = data.items || [];
        setArchivedRaw(raw);
        setItems(raw.map(mapArchivedToClientItem));
        writeCachedDeletedRecipients(deletedCacheKey, raw);
        setCohorts([]);
        setTags([]);
        setAssessmentMeta({});
        setSelected(new Set());
      } catch (err) {
        if (!cachedRaw?.length) {
          setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
          setItems([]);
          setArchivedRaw([]);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    const cached = readCachedClientPortals(cacheKey);
    const skipReload = consumeCounselorListSkipReload();
    if (skipReload === 'clients' && cached?.items?.length) {
      setItems(cached.items);
      setCohorts(cached.cohorts || []);
      setTags(cached.tags || []);
      setAssessmentMeta(cached.assessmentMeta || {});
      setLoading(false);
    } else if (cached?.items?.length) {
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
        ownOnly: adminUser,
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
  }, [cacheKey, deletedMode, permanentlyDeletedMode, searchParams, adminUser]);

  useEffect(() => {
    if (permanentlyDeletedMode && !adminUser) {
      setLoading(false);
      return;
    }
    if (authPending || showLoginRequired) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load, permanentlyDeletedMode, adminUser]);

  const archivedByPortalId = useMemo(() => {
    const map = new Map<string, ArchivedDispatchRecipient>();
    for (const row of archivedRaw) {
      map.set(row.portalId, row);
    }
    return map;
  }, [archivedRaw]);

  const isAssessmentDeletedLinkedRow = useCallback(
    (portalId: string) => {
      if (permanentlyDeletedMode) {
        const row = permanentlyDeletedRaw.find((item) => item.portalId === portalId);
        return row?.assessmentPermanentlyDeleted === true;
      }
      if (!deletedMode) return false;
      const row = archivedByPortalId.get(portalId);
      return row ? isAssessmentLinkedArchivedRecipient(row) : false;
    },
    [archivedByPortalId, deletedMode, permanentlyDeletedMode, permanentlyDeletedRaw],
  );

  const isRowSelectionLocked = useCallback(
    (portalId: string) => {
      if (adminUser && (deletedMode || permanentlyDeletedMode)) return false;
      return isAssessmentDeletedLinkedRow(portalId);
    },
    [adminUser, deletedMode, permanentlyDeletedMode, isAssessmentDeletedLinkedRow],
  );

  useRedirectOnLoginRequiredError(error);

  const assessmentIds = useMemo(
    () => (deletedMode || permanentlyDeletedMode ? [] : Object.keys(assessmentMeta)),
    [assessmentMeta, deletedMode, permanentlyDeletedMode],
  );

  const { results: liveResults, isLive, liveError, lastUpdatedAt } =
    useCounselorTestResultsRealtime(
      assessmentIds,
      isAuthenticated && !authPending && !deletedMode && !permanentlyDeletedMode,
    );

  const displayItems = useMemo(() => {
    if (deletedMode || permanentlyDeletedMode) return items;
    return applyRealtimeToClientList(items, assessmentMeta, liveResults);
  }, [deletedMode, permanentlyDeletedMode, items, assessmentMeta, liveResults]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return displayItems;
    return displayItems.filter((item) =>
      matchesWildcardFields(
        [
          item.displayName || '',
          item.email || '',
          item.phone || '',
          item.accessCode || '',
          counselOrgLabel(item),
          counselJoinCodeLabel(item),
          formatAccessCodeDisplay(counselJoinCodeLabel(item)),
          counselTitleLabel(item),
          ...(item.counselorTags || []),
          counselingCodeTypeLabel(item.assessments[0]?.codeCategory),
          ...item.assessments.flatMap((a) => [
            a.orgName || '',
            a.title || '',
            a.joinAccessCode || '',
            formatAccessCodeDisplay(a.joinAccessCode || ''),
          ]),
          ...(adminUser ? [item.counselorEmail || ''] : []),
        ],
        q,
      ),
    );
  }, [displayItems, searchQuery, adminUser]);

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

  const restorableSelectedCount = useMemo(() => {
    if (!permanentlyDeletedMode) return selected.size;
    return Array.from(selected).filter((portalId) => !isAssessmentDeletedLinkedRow(portalId)).length;
  }, [permanentlyDeletedMode, selected, isAssessmentDeletedLinkedRow]);

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

  const selectableOnPage = useMemo(() => {
    if (adminUser && (deletedMode || permanentlyDeletedMode)) return paginatedItems;
    return paginatedItems.filter((item) => !isRowSelectionLocked(item.portalId));
  }, [adminUser, deletedMode, permanentlyDeletedMode, paginatedItems, isRowSelectionLocked]);

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
    if (adminUser && deletedMode) return;
    setRestoring(true);
    setMessage('');
    try {
      if (permanentlyDeletedMode) {
        const restorablePortalIds = Array.from(selected).filter(
          (portalId) => !isAssessmentDeletedLinkedRow(portalId),
        );
        const skipped = selected.size - restorablePortalIds.length;
        if (restorablePortalIds.length === 0) {
          setActionComplete({
            title: '복구 불가',
            message:
              skipped > 0
                ? '선택한 내담자는 삭제·영구삭제된 상담코드에 연결되어 복구할 수 없습니다.'
                : '복구할 내담자를 선택해 주세요.',
            error: true,
          });
          return;
        }
        const result = await restorePermanentlyDeletedRecords({
          portalIds: restorablePortalIds,
        });
        setActionComplete({
          title: '복구 완료',
          message: `삭제된 내담자로 복구 ${result.restoredPortals}건${
            skipped > 0 ? ` · 상담코드 연결 ${skipped}명 제외` : ''
          }${result.failed ? `, 실패 ${result.failed}건` : ''}`,
        });
      } else {
        const result = await restoreArchivedDispatchRecipients(Array.from(selected));
        clearCounselorAssessmentsListCache(user?.uid);
        setActionComplete({
          title: '복구 완료',
          message: `복구 ${result.restored}명${result.failed ? `, 실패 ${result.failed}명` : ''}`,
        });
      }
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

  const openBulkNotifyConfirm = (kind: 'remind' | 'resend') => {
    if (selectedItems.length === 0) return;
    const groups = buildDispatchGroupsFromSelections(selectedItems);
    if (groups.length === 0) {
      setError('선택한 내담자에 연결된 상담코드가 없습니다.');
      return;
    }
    setNotifyDispatchGroups(groups);
    setNotifyConfirmKind(kind);
  };

  const handleBulkNotifyConfirm = async (notifyChannels: ('email' | 'phone')[]) => {
    if (!notifyConfirmKind || notifyDispatchGroups.length === 0) return;
    setNotifyDispatchLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await executeGroupedDispatchNotify({
        kind: notifyConfirmKind,
        groups: notifyDispatchGroups,
        notifyChannels,
      });
      setNotifyConfirmKind(null);
      setNotifyDispatchGroups([]);
      setSelected(new Set());
      setActionComplete({
        title: notifyConfirmKind === 'remind' ? '미실시 알림 발송 완료' : '나의코드 전달 완료',
        message: `발송 ${result.sent}건 · 실패 ${result.failed}건 · 생략 ${result.skipped}건`,
      });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '발송에 실패했습니다.');
    } finally {
      setNotifyDispatchLoading(false);
    }
  };

  const handleClientDownload = () => {
    exportClientPortalItems(selectedItems, 'download');
  };

  const handleClientPrint = () => {
    exportClientPortalItems(selectedItems, 'print');
  };

  const handleClientDelete = async () => {
    if (selected.size === 0) return;
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

  const rowExpandable = !permanentlyDeletedMode;
  const showContactEditColumn = !adminUser && !deletedMode && !permanentlyDeletedMode;
  const expandLeadingColSpan = 2;
  const expandDetailColSpan = showContactEditColumn ? 7 : 6;

  const toggleExpand = useCallback((portalId: string) => {
    setExpandedId((prev) => (prev === portalId ? null : portalId));
  }, []);

  useEffect(() => {
    if (!expandedId || permanentlyDeletedMode) return;

    setExpandDetailByPortal((prev) => {
      if (prev[expandedId] !== undefined) return prev;

      const item = displayItems.find((i) => i.portalId === expandedId);
      const assessmentId = item?.assessments[0]?.assessmentId;

      void (async () => {
        if (!item) {
          setExpandDetailByPortal((p) =>
            p[expandedId] !== undefined ? p : { ...p, [expandedId]: 'error' },
          );
          return;
        }

        const applyLocalArchivedExpand = () => {
          const tests = archivedTestsToDispatchTests(item.archivedTests);
          setExpandDetailByPortal((p) => ({
            ...p,
            [expandedId]: {
              recipient: listItemToDispatchRecipient(item, tests),
              tests,
            },
          }));
        };

        if (deletedMode) {
          if (!assessmentId) {
            applyLocalArchivedExpand();
            return;
          }
          try {
            const detail = await fetchDispatchRecipientDetail(assessmentId, expandedId);
            const recipient = detail.recipient;
            const tests =
              recipient.tests?.map((t) => ({ ...t })) ??
              archivedTestsToDispatchTests(item.archivedTests);
            setExpandDetailByPortal((p) => ({
              ...p,
              [expandedId]: {
                recipient: recipient ?? listItemToDispatchRecipient(item, tests),
                tests,
              },
            }));
          } catch {
            applyLocalArchivedExpand();
          }
          return;
        }

        if (!assessmentId) {
          const tests = archivedTestsToDispatchTests(item.archivedTests);
          setExpandDetailByPortal((p) => ({
            ...p,
            [expandedId]: { recipient: listItemToDispatchRecipient(item, tests), tests },
          }));
          return;
        }
        try {
          const detail = await fetchDispatchRecipientDetail(assessmentId, expandedId);
          const recipient = detail.recipient;
          const tests = recipient.tests?.map((t) => ({ ...t })) ?? archivedTestsToDispatchTests(item.archivedTests);
          setExpandDetailByPortal((p) => ({
            ...p,
            [expandedId]: {
              recipient: recipient ?? listItemToDispatchRecipient(item, tests),
              tests,
            },
          }));
        } catch {
          setExpandDetailByPortal((p) => ({ ...p, [expandedId]: 'error' }));
        }
      })();

      return { ...prev, [expandedId]: 'loading' };
    });
  }, [deletedMode, permanentlyDeletedMode, expandedId, displayItems]);

  useEffect(() => {
    if (!rowExpandable || loading) return;
    const pid = (searchParams.get('expandPortalId') || '').trim();
    if (!pid) return;
    const idx = sortedFiltered.findIndex((i) => i.portalId === pid);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / pageSize) + 1;
    if (page !== targetPage) {
      setPage(targetPage);
      return;
    }
    setExpandedId(pid);
    const timer = window.setTimeout(() => {
      document.getElementById(`client-row-${pid}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [rowExpandable, loading, searchParams, sortedFiltered, page, pageSize, setPage]);

  const patchListItemContact = useCallback(
    (portalId: string, phone: string, email: string) => {
      const patch = (list: CounselorClientPortalListItem[]) =>
        list.map((item) =>
          item.portalId === portalId ? { ...item, phone, email } : item,
        );
      setItems((prev) => patch(prev));
      if (!deletedMode && !permanentlyDeletedMode) {
        const cached = readCachedClientPortals(cacheKey);
        if (cached?.items?.length) {
          writeCachedClientPortals(cacheKey, { ...cached, items: patch(cached.items) });
        }
      }
    },
    [cacheKey, deletedMode, permanentlyDeletedMode],
  );

  const handleContactEditSave = async (payload: { phone?: string; email?: string }) => {
    if (!contactEditItem) return;
    const assessmentId = contactEditItem.assessments[0]?.assessmentId;
    if (!assessmentId) {
      setError('상담코드 정보가 없어 연락처를 수정할 수 없습니다.');
      return;
    }
    setContactEditSaving(true);
    setError('');
    try {
      const updated = await updateDispatchRecipientContact(
        assessmentId,
        contactEditItem.portalId,
        payload,
      );
      patchListItemContact(updated.portalId, updated.phone, updated.email);
      setContactEditItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '연락처 수정에 실패했습니다.');
    } finally {
      setContactEditSaving(false);
    }
  };

  const openResultDetail = useCallback((assessmentId: string, resultId: string) => {
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    getCounselorResult(assessmentId, resultId)
      .then(setDetail)
      .catch((err) => setDetailError(err instanceof Error ? err.message : '조회 실패'))
      .finally(() => setDetailLoading(false));
  }, []);

  const closeResultModal = () => {
    setDetail(null);
    setDetailError('');
  };

  const pageTitle = permanentlyDeletedMode
    ? '영구삭제 내담자'
    : deletedMode
      ? '삭제된 내담자 (전체)'
      : '내담자 목록';
  const dateColumnLabel = permanentlyDeletedMode
    ? '영구삭제일'
    : deletedMode
      ? '삭제일'
      : '발송일시';
  const searchPlaceholder = adminUser
    ? '이름 · 연락처 · 상담유형 · 상담정보 · 태그 · 상담사 이메일'
    : '이름 · 연락처 · 상담유형 · 상담정보 · 태그';

  return (
    <CounselorPageSection
      title={pageTitle}
      titleAccent={deletedMode || permanentlyDeletedMode ? 'deleted' : 'list'}
      dense
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      description={
        <span className="inline-flex w-full flex-wrap items-center gap-x-3 gap-y-2">
          {deletedMode && !permanentlyDeletedMode ? (
            <CounselorListBackLink href="/counselor/clients" label="내담자 목록" />
          ) : null}
          {permanentlyDeletedMode ? (
            <span className="shrink-0">
              전체 <span className="font-semibold text-white">{displayItems.length}</span>명
            </span>
          ) : null}
          {!deletedMode && !permanentlyDeletedMode ? (
            <span className="shrink-0">
              전체 <span className="font-semibold text-white">{stats.total}</span>명 · 완료{' '}
              <span className="font-semibold text-emerald-300">{stats.completed}</span>명
            </span>
          ) : null}
          <CounselorListSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1"
          />
          {!deletedMode && !permanentlyDeletedMode && !adminUser ? (
            <span className="ml-auto inline-flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <button
                type="button"
                disabled={selected.size === 0 || notifyDispatchLoading}
                className="rounded-md bg-amber-600/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50 sm:text-sm"
                onClick={() => openBulkNotifyConfirm('remind')}
              >
                미실시 알림 ({selected.size})
              </button>
              <button
                type="button"
                disabled={selected.size === 0 || notifyDispatchLoading}
                className="rounded-md bg-sky-600/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50 sm:text-sm"
                onClick={() => openBulkNotifyConfirm('resend')}
              >
                나의코드 전달 ({selected.size})
              </button>
            </span>
          ) : null}
        </span>
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
          <LoadingMessage className="py-12" textClassName="text-sm text-slate-500" />
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
            <FaUsers className="mb-2 h-10 w-10 text-slate-600" />
            <p className="text-base text-slate-300">
              {displayItems.length === 0
                ? deletedMode || permanentlyDeletedMode
                  ? permanentlyDeletedMode
                    ? '영구삭제된 내담자가 없습니다'
                    : '삭제된 내담자가 없습니다'
                  : '등록된 내담자가 없습니다'
                : '검색 결과가 없습니다'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {displayItems.length === 0
                ? deletedMode || permanentlyDeletedMode
                  ? permanentlyDeletedMode
                    ? '영구삭제된 내담자가 여기에 표시됩니다.'
                    : '직접 삭제하거나 상담코드 삭제로 보관된 내담자가 여기에 표시됩니다.'
                  : '상담코드를 발급하면 내담자가 여기에 표시됩니다.'
                : '검색어·필터를 바꿔 보세요.'}
            </p>
            {displayItems.length === 0 && !deletedMode && !permanentlyDeletedMode ? (
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
            <CounselorListTableScroll>
              <table className="w-max min-w-full table-fixed text-sm">
                <thead className={counselorListTheadClass}>
                  <tr className={counselorListHeaderRowClass}>
                    <th className={`${counselorListNoThClass} w-12 tabular-nums`}>No.</th>
                    <th className={`${counselorListThClass} w-10 text-center`}>
                      {!adminUser || deletedMode || permanentlyDeletedMode ? (
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleAllOnPage}
                          className="rounded accent-blue-500"
                          aria-label="현재 페이지 전체 선택"
                        />
                      ) : null}
                    </th>
                    <SortableColumnHeader
                      label="이름 / 나의코드"
                      sortKey="displayName"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <CounselDualFieldSortHeader
                      leftLabel="그룹명"
                      rightLabel="소속"
                      activeKey={sortKey}
                      sortKey="counselInfo"
                      phase={counselSortPhase}
                      onSortLeft={() => toggleCounselFieldSort('org')}
                      onSortRight={() => toggleCounselFieldSort('title')}
                    />
                    <SortableColumnHeader
                      label={dateColumnLabel}
                      sortKey="notifyAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <SortableColumnHeader
                      label="검사 진행현황"
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
                      label="연락처"
                      sortKey="phone"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    {!showContactEditColumn ? null : (
                      <th
                        scope="col"
                        className={`${counselorListThClass} w-[4.5rem] whitespace-nowrap text-center text-xs font-medium text-slate-400`}
                      >
                        연락처 수정
                      </th>
                    )}
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
                  {paginatedItems.map((item, idx) => {
                    const progress = progressLabel(item);
                    const primaryAssessment = item.assessments[0];
                    const infoOrg = primaryAssessment
                      ? primaryAssessment.orgName || item.cohortName || '—'
                      : item.cohortName || '—';
                    const infoSecondary = stripAssessmentTitleDispatchCountSuffix(
                      primaryAssessment?.title || '—',
                    );
                    const dispatchView = dispatchStatusDisplay({
                      email: item.email,
                      phone: item.phone,
                      notifyStatus: item.notifyStatus,
                      notifyError: item.notifyError,
                      notifyAt: item.notifyAt,
                      notifySentVia: item.notifySentVia,
                      notifyKind: item.notifyKind,
                    });
                    const isSelected = selected.has(item.portalId);
                    const isOpen = expandedId === item.portalId;
                    const expandDetailState = expandDetailByPortal[item.portalId];
                    const assessmentId = primaryAssessment?.assessmentId || '';
                    const expandPayload =
                      expandDetailState &&
                      expandDetailState !== 'loading' &&
                      expandDetailState !== 'error'
                        ? expandDetailState
                        : null;
                    const rowTests: DispatchTestResult[] = expandPayload?.tests ?? [];

                    const locked = isRowSelectionLocked(item.portalId);
                    const dimmedCheckbox =
                      adminUser &&
                      (deletedMode || permanentlyDeletedMode) &&
                      isAssessmentDeletedLinkedRow(item.portalId);
                    const rowClass =
                      deletedMode || permanentlyDeletedMode
                        ? `${counselorListBodyRowStaticClass}${idx % 2 === 1 ? ' bg-white/[0.035]' : ''}`
                        : counselorListBodyRowClassAt(idx);

                    return (
                      <React.Fragment key={item.portalId}>
                      <tr
                        id={`client-row-${item.portalId}`}
                        onClick={rowExpandable ? () => toggleExpand(item.portalId) : undefined}
                        onKeyDown={
                          rowExpandable
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleExpand(item.portalId);
                                }
                              }
                            : undefined
                        }
                        tabIndex={rowExpandable ? 0 : undefined}
                        role={rowExpandable ? 'button' : undefined}
                        aria-expanded={rowExpandable ? isOpen : undefined}
                        className={`${rowClass} ${isSelected || isOpen ? 'bg-white/[0.04]' : ''} ${locked ? 'opacity-70' : ''} ${rowExpandable ? 'cursor-pointer' : ''}`}
                      >
                        <td className={`${counselorListTdClass} tabular-nums text-slate-500`}>
                          {startIndex + idx + 1}
                        </td>
                        <td className={`${counselorListTdClass} text-center`}>
                          {locked && (deletedMode || permanentlyDeletedMode) && !adminUser ? (
                            <CounselorListHoverTooltip
                              content={
                                permanentlyDeletedMode ? '영구삭제된 상담코드' : '삭제된 상담코드'
                              }
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleOne(item.portalId)}
                                disabled={locked}
                                className="rounded accent-blue-500 disabled:opacity-40"
                                aria-label={`${item.displayName || '내담자'} 선택`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </CounselorListHoverTooltip>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(item.portalId)}
                              disabled={locked}
                              className={`rounded accent-blue-500 disabled:opacity-40 ${dimmedCheckbox ? 'opacity-40' : ''}`}
                              aria-label={`${item.displayName || '내담자'} 선택`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </td>
                        <td className={`max-w-[12rem] ${counselorListTdClass}`}>
                          <p className="min-w-0 break-words text-sm leading-snug">
                            {rowExpandable ? (
                              <span className="text-slate-400" aria-hidden="true">
                                {isOpen ? '▼ ' : '▶ '}
                              </span>
                            ) : null}
                            <span className="font-semibold text-white">{item.displayName || '—'}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="font-mono text-slate-200">
                              {formatAccessCodeDisplay(item.accessCode || '')}
                            </span>
                          </p>
                        </td>
                        <td className={`max-w-[14rem] ${counselorListTdClass}`}>
                          {primaryAssessment ? (
                            <CounselorSlashInfoCell
                              primary={infoOrg}
                              secondary={infoSecondary}
                              hoverTypeLabel={counselingCodeTypeLabel(primaryAssessment.codeCategory)}
                              normalWeight
                              showTooltip={false}
                            />
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdClass} text-slate-200 tabular-nums`}
                        >
                          {formatNotifyDate(item.notifyAt)}
                        </td>
                        <td className={counselorListTdClass}>
                          <div className={`text-sm ${progress.className}`}>{progress.text}</div>
                          {counselMoveProgressNote(item)}
                        </td>
                        <td className={`max-w-[10rem] ${counselorListTdClass}`} title={dispatchView.title}>
                          <DispatchStatusText value={dispatchView} />
                        </td>
                        <td className={`max-w-[14rem] ${counselorListTdClass}`}>
                          <RecipientContactCell phone={item.phone} email={item.email} masked={!deletedMode && !permanentlyDeletedMode} />
                        </td>
                        {showContactEditColumn ? (
                          <td
                            className={`${counselorListTdClass} text-center`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setContactEditItem(item)}
                              className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-sky-200 transition-colors hover:border-sky-400/40 hover:bg-sky-500/10"
                            >
                              연락처 수정
                            </button>
                          </td>
                        ) : null}
                        {adminUser ? <CounselorAdminEmailTd email={item.counselorEmail} /> : null}
                      </tr>
                      {isOpen && rowExpandable ? (
                        expandDetailState === 'loading' ? (
                          <tr>
                            <CounselorRecipientExpandLeadingCells
                              leadingColSpan={expandLeadingColSpan}
                              portalId={item.portalId}
                            />
                            <td
                              colSpan={expandDetailColSpan}
                              className="border-b border-slate-700/60 bg-slate-900/20 px-3 py-3 pb-4"
                            >
                              <LoadingMessage layout="inline" textClassName="text-sm text-slate-500" />
                            </td>
                          </tr>
                        ) : expandDetailState === 'error' ? (
                          <tr>
                            <CounselorRecipientExpandLeadingCells
                              leadingColSpan={expandLeadingColSpan}
                              portalId={item.portalId}
                            />
                            <td
                              colSpan={expandDetailColSpan}
                              className="border-b border-slate-700/60 bg-slate-900/20 px-3 py-3 pb-4 text-sm text-red-400"
                            >
                              검사 목록을 불러오지 못했습니다.
                            </td>
                          </tr>
                        ) : expandPayload ? (
                          <CounselorDispatchRecipientExpandRow
                            recipient={expandPayload.recipient}
                            tests={rowTests}
                            assessmentId={assessmentId}
                            showRecommendCards={!deletedMode && !permanentlyDeletedMode}
                            leadingColSpan={expandLeadingColSpan}
                            detailColSpan={expandDetailColSpan}
                            onOpenResult={
                              assessmentId
                                ? (resultId) => openResultDetail(assessmentId, resultId)
                                : undefined
                            }
                            onRecommendAssigned={() => void load()}
                          />
                        ) : null
                      ) : null}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </CounselorListTableScroll>
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
                deletedMode || permanentlyDeletedMode ? (
                  <div className="contents">
                    {(adminUser && deletedMode) || permanentlyDeletedMode ? (
                      <>
                        <button
                          type="button"
                          onClick={handleClientDownload}
                          disabled={selected.size === 0 || restoring || deleting}
                          className="inline-flex items-center rounded-md bg-emerald-700/90 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                        >
                          다운로드 ({selected.size})
                        </button>
                        <button
                          type="button"
                          onClick={handleClientPrint}
                          disabled={selected.size === 0 || restoring || deleting}
                          className="inline-flex items-center rounded-md border border-white/15 bg-[#101f38]/90 px-2.5 py-1 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-50"
                        >
                          인쇄 ({selected.size})
                        </button>
                      </>
                    ) : null}
                    {!(adminUser && deletedMode) ? (
                      <button
                        type="button"
                        onClick={() => void handleRestore()}
                        disabled={restoring || restorableSelectedCount === 0}
                        className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {restoring
                          ? '복구 중…'
                          : permanentlyDeletedMode
                            ? `삭제된 내담자로 복구 (${restorableSelectedCount})`
                            : `복구 (${selected.size})`}
                      </button>
                    ) : null}
                    {!adminUser && deletedMode ? (
                      <button
                        type="button"
                        onClick={() => setPermanentDeleteConfirmOpen(true)}
                        disabled={deleting || selected.size === 0}
                        className="inline-flex items-center rounded-md bg-red-700 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting ? '처리 중…' : `영구 삭제 (${selected.size})`}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="contents">
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
                    {!adminUser ? (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(true)}
                        disabled={clientDeleteLoading || selected.size === 0}
                        className="inline-flex items-center rounded-md bg-red-700/90 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                      >
                        {clientDeleteLoading ? '삭제 중…' : `삭제 (${selected.size})`}
                      </button>
                    ) : null}
                    {!adminUser ? (
                      <button
                        type="button"
                        onClick={() => setMoveOpen(true)}
                        disabled={selected.size === 0}
                        className="inline-flex shrink-0 items-center justify-center rounded-md border border-sky-500/40 bg-sky-900/40 px-2.5 py-1 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-800/50 disabled:opacity-50"
                      >
                        다른 상담코드로 이동{selected.size > 0 ? ` (${selected.size})` : ''}
                      </button>
                    ) : null}
                  </div>
                )
              }
            />
          </>
        )}
      </motion.div>

      <CounselorNotifyConfirmDialog
        open={Boolean(notifyConfirmKind)}
        kind={notifyConfirmKind === 'resend' ? 'resend' : 'remind'}
        recipients={flattenDispatchRecipients(notifyDispatchGroups)}
        loading={notifyDispatchLoading}
        onCancel={() => {
          if (notifyDispatchLoading) return;
          setNotifyConfirmKind(null);
          setNotifyDispatchGroups([]);
        }}
        onConfirm={(channels) => void handleBulkNotifyConfirm(channels)}
      />
      <CounselorActionProgressOverlay
        open={notifyDispatchLoading}
        title={notifyConfirmKind === 'remind' ? '미실시 알림 발송 중…' : '나의코드 전달 중…'}
        message="잠시만 기다려 주세요."
      />
      <CounselorPortalMoveDialog
        open={moveOpen}
        portalIds={selectedPortalIds}
        portalSummaries={movePortalSummaries}
        onClose={() => setMoveOpen(false)}
        onSuccess={handleMoveSuccess}
      />
      {deletedMode || permanentlyDeletedMode ? (
        <>
          <CounselorActionProgressOverlay
            open={restoring}
            title="복구 진행 중…"
            message={
              permanentlyDeletedMode
                ? `선택 ${selected.size}명을 삭제된 내담자로 복구하고 있습니다.`
                : `선택 ${selected.size}명을 복구하고 있습니다.`
            }
          />
          {deletedMode ? (
            <CounselorActionProgressOverlay
              open={deleting}
              title="영구 삭제 진행 중…"
              message={`선택 ${selected.size}명을 영구 삭제하고 있습니다.`}
            />
          ) : null}
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
      <CounselorConfirmModal
        open={deleteConfirmOpen}
        title="삭제 확인"
        message={`선택 ${selected.size}명을 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          void handleClientDelete();
        }}
      />
      <CounselorConfirmModal
        open={permanentDeleteConfirmOpen}
        title="영구 삭제 확인"
        message={`선택 ${selected.size}명을 영구 삭제하시겠습니까?`}
        confirmLabel="영구 삭제"
        destructive
        onCancel={() => setPermanentDeleteConfirmOpen(false)}
        onConfirm={() => {
          setPermanentDeleteConfirmOpen(false);
          void handlePermanentDelete();
        }}
      />
      <CounselorRecipientContactEditModal
        open={Boolean(contactEditItem)}
        target={
          contactEditItem
            ? {
                displayName: contactEditItem.displayName,
                myCode: contactEditItem.accessCode,
                phone: contactEditItem.phone ?? undefined,
                email: contactEditItem.email ?? undefined,
              }
            : null
        }
        saving={contactEditSaving}
        onClose={() => !contactEditSaving && setContactEditItem(null)}
        onSave={(payload) => void handleContactEditSave(payload)}
      />
      {(detail !== null || detailLoading || detailError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !detailLoading && closeResultModal()}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-600 px-4 py-3">
              <h3 className="text-lg font-semibold text-white">검사 결과 상세</h3>
              <button
                type="button"
                onClick={closeResultModal}
                className="text-sm text-slate-400 hover:text-white"
              >
                닫기
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {detailLoading ? (
                <LoadingMessage layout="inline" textClassName="text-sm text-slate-400" />
              ) : null}
              {detailError ? <p className="text-sm text-red-400">{detailError}</p> : null}
              {detail && !detailLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-400">내담자</span>
                    <span className="text-white">
                      {detail.clientDisplayName || detail.clientEmail || '—'}
                    </span>
                    <span className="text-slate-400">검사</span>
                    <span className="text-white">{detail.testId}</span>
                    <span className="text-slate-400">완료일시</span>
                    <span className="text-slate-300">{formatCompletedAt(detail.completedAt)}</span>
                  </div>
                  {detail.resultData && Object.keys(detail.resultData).length > 0 ? (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-slate-400">채점/요약</h4>
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900/80 p-3 text-sm text-slate-300">
                        {JSON.stringify(detail.resultData, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                  {detail.responses != null ? (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-slate-400">응답</h4>
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900/80 p-3 text-sm text-slate-300">
                        {JSON.stringify(detail.responses, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </CounselorPageSection>
  );
}
