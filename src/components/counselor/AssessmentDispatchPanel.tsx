'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import { getCounselorResult, type CounselorResultDetail } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';
import { formatPhoneDisplay, normalizeRecipientPhone } from '@/lib/phoneFormat';
import { displayContactEmail, displayContactPhone } from '@/lib/contactPrivacy';
import DispatchStatusText from '@/components/counselor/DispatchStatusText';
import {
  dispatchStatusDisplay,
  formatNotifyDate,
  testSummary,
  type DispatchStatusView,
} from '@/lib/dispatchRecipientDisplay';
import {
  downloadDispatchRecipientsExcel,
  printDispatchRecipients,
} from '@/lib/dispatchRecipientExport';
import {
  formatDispatchChannelSummary,
  parseDispatchChannelSummary,
  type DispatchChannelSummary,
} from '@/lib/dispatchNotifySummary';
import CounselorPortalMoveDialog from '@/components/counselor/CounselorPortalMoveDialog';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import {
  archiveDispatchRecipients,
  fetchAssessmentDispatchStatus,
  resendDispatchCredentials,
  sendDispatchTestReminders,
  type AssessmentDispatchStatus,
  type DispatchRecipient,
  type DispatchTestResult,
} from '@/lib/clientPortalApi';
import { useAssessmentDispatchRealtime } from '@/hooks/useAssessmentDispatchRealtime';
import {
  readAnyCachedDispatchStatus,
  writeCachedDispatchStatus,
} from '@/lib/counselorSessionCache';
import {
  clearDispatchIssueSeed,
  hasPendingDispatchIssueSeed,
  isDispatchIssuingPhase,
  isOptimisticPortalId,
  isPendingDispatchAssessmentId,
  mergeDispatchStatusWithCache,
  DISPATCH_CHECKING_LABEL,
  getDispatchRecipientFieldPending,
  pendingDispatchPlaceholder,
  readPendingDispatchError,
  readPendingDispatchResolution,
  resolveDispatchFetchId,
  resolveInitialDispatchStatus,
  shouldClearDispatchIssueSeed,
} from '@/lib/counselorDispatchSeed';
import CounselorListBackLink from '@/components/counselor/CounselorListBackLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import CounselorSlashInfoCell from '@/components/counselor/CounselorSlashInfoCell';
import CounselorListSearchInput from '@/components/counselor/CounselorListSearchInput';
import CounselorProgressMetricsInline from '@/components/counselor/CounselorProgressMetricsInline';
import { stripAssessmentTitleDispatchCountSuffix } from '@/lib/counselorAssessmentResultDisplay';
import { replaceWithAuthSession } from '@/utils/authSessionLifecycle';
import { buildAssessmentListHref, writeAssessmentListSearch } from '@/lib/counselorAssessmentListSearch';
import { matchesWildcardFields } from '@/lib/wildcardSearch';
import {
  counselorListBodyRowClass,
  counselorListHeaderRowGrayClass,
  counselorListNoThGrayClass,
  counselorListSelectTdClass,
  counselorListSelectThGrayClass,
  counselorListSortActiveGrayClass,
  counselorListTableWrapperClass,
  counselorListTdClass,
  counselorListThGrayClass,
  counselorListTheadClass,
} from '@/lib/counselorListTableStyles';
import CounselorNextTestRecommendCard from '@/components/counselor/CounselorNextTestRecommendCard';
import CounselorQuickCareRecommendCard from '@/components/counselor/CounselorQuickCareRecommendCard';
import { LoadingMessage } from '@/components/ui/LoadingMessage';

function formatCompletedAt(iso: string | null | undefined): string {
  return formatNotifyDate(iso);
}

function notifyErrorHint(error: string | null | undefined): string | undefined {
  const err = (error || '').trim();
  if (!err) return undefined;
  if (err.includes('no_recipient')) return '이메일·휴대폰 정보가 없습니다.';
  if (err.includes('email_send_failed')) return '이메일 발송에 실패했습니다.';
  if (err.includes('phone_send_failed')) return '문자·알림톡 발송에 실패했습니다.';
  if (err.includes('alimtalk_sender_equals_recipient') || err.includes('sms_sender_equals_recipient')) {
    return '수신 번호가 Solapi 발신번호와 같습니다. 알림톡·문자 테스트는 다른 휴대폰 번호를 사용해 주세요.';
  }
  if (err.includes('3027') || err.includes('카카오톡 미사용')) {
    return '카카오톡 수신 불가 번호입니다. 발신번호와 동일한 번호는 알림톡이 전달되지 않습니다.';
  }
  if (err.includes('smtp_not_configured')) return '이메일 서버가 설정되지 않았습니다.';
  return err;
}

function formatSentViaLabel(sentVia: string | null | undefined): string {
  const raw = (sentVia || '').trim();
  if (!raw) return '';
  return raw
    .split(',')
    .map((part) => {
      switch (part.trim()) {
        case 'email':
          return '이메일';
        case 'kakao_alimtalk':
          return '알림톡';
        case 'sms':
          return 'SMS';
        default:
          return part.trim();
      }
    })
    .join('·');
}

type DispatchRowOverride = Pick<
  DispatchRecipient,
  'notifyStatus' | 'notifyKind' | 'notifyEmailChannel' | 'notifyPhoneChannel' | 'notifySentVia' | 'notifyError'
>;

function buildSendingOverride(
  recipient: DispatchRecipient,
  kind: 'remind' | 'resend',
): DispatchRowOverride {
  const hasEmail = Boolean(recipient.email?.trim());
  const hasPhone = Boolean(recipient.phone?.trim());
  return {
    notifyStatus: 'sending',
    notifyKind: kind === 'resend' ? 'resend' : 'remind',
    notifyEmailChannel: hasEmail ? 'sending' : undefined,
    notifyPhoneChannel: hasPhone ? 'sending' : undefined,
    notifySentVia: '',
    notifyError: null,
  };
}

function mergeDispatchOverride(
  recipient: DispatchRecipient,
  override: DispatchRowOverride | undefined,
): DispatchRecipient {
  if (!override) return recipient;
  return { ...recipient, ...override };
}

type CredentialSendMode = 'initial' | 'resend' | 'mixed';

function hasCredentialBeenSent(r: DispatchRecipient): boolean {
  const status = r.notifyStatus || 'not_sent';
  if (status === 'sending') return false;
  return status === 'sent' || status === 'partial' || status === 'failed' || Boolean(r.notifyAt?.trim());
}

function resolveCredentialSendMode(recipients: DispatchRecipient[]): CredentialSendMode {
  const eligible = recipients.filter((r) => r.email || r.phone);
  if (!eligible.length) return 'resend';
  const sentBefore = eligible.filter(hasCredentialBeenSent);
  if (sentBefore.length === 0) return 'initial';
  if (sentBefore.length === eligible.length) return 'resend';
  return 'mixed';
}

function credentialSendModeLabel(mode: CredentialSendMode): string {
  switch (mode) {
    case 'initial':
      return '선택된 코드발송';
    case 'resend':
      return '코드 재발송';
    default:
      return '접속 정보 발송';
  }
}

function testStatusLabel(status: DispatchTestResult['status']): { text: string; className: string } {
  switch (status) {
    case 'completed':
      return { text: '완료', className: 'text-emerald-300' };
    case 'in_progress':
      return { text: '진행 중', className: 'text-amber-300' };
    default:
      return { text: '미실시', className: 'text-slate-500' };
  }
}

function progressStatusForRow(recipient: DispatchRecipient): { text: string; className: string } {
  return testSummary(recipient);
}

function dispatchStatusForRow(recipient: DispatchRecipient): DispatchStatusView {
  return dispatchStatusDisplay(recipient);
}

function canSendReminder(r: DispatchRecipient): boolean {
  if (!hasCredentialBeenSent(r)) return false;
  if (r.testStatus === 'completed') return false;
  const pending = (r.tests ?? []).some((t) => t.status !== 'completed');
  if (!pending && r.requiredCount > 0) return false;
  return Boolean(r.email || r.phone);
}

function testLetterLabel(index: number): string {
  return `${String.fromCharCode(97 + index)}.`;
}

type RecipientSortKey =
  | 'displayName'
  | 'email'
  | 'phone'
  | 'myCode'
  | 'notifyAt'
  | 'notifyStatus'
  | 'testStatus';
type SortDirection = 'asc' | 'desc';
type NameSortPhase = 'name-asc' | 'name-desc' | 'code-asc' | 'code-desc';

function testStatusOrder(status: DispatchRecipient['testStatus']): number {
  if (status === 'completed') return 2;
  if (status === 'in_progress') return 1;
  return 0;
}

function compareRecipients(
  a: DispatchRecipient,
  b: DispatchRecipient,
  key: RecipientSortKey,
  dir: SortDirection,
  nameSortPhase: NameSortPhase,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'displayName': {
      const phaseMult = (p: NameSortPhase) => (p.endsWith('-asc') ? 1 : -1);
      const m = phaseMult(nameSortPhase);
      if (nameSortPhase.startsWith('code')) {
        return m * (a.myCode || '').localeCompare(b.myCode || '', 'ko');
      }
      return m * (a.displayName || '').localeCompare(b.displayName || '', 'ko');
    }
    case 'email':
      return mult * (a.email || '').localeCompare(b.email || '', 'ko');
    case 'phone':
      return mult * (a.phone || '').localeCompare(b.phone || '', 'ko');
    case 'myCode':
      return mult * (a.myCode || '').localeCompare(b.myCode || '', 'ko');
    case 'notifyAt': {
      const ta = a.notifyAt ? new Date(a.notifyAt).getTime() : 0;
      const tb = b.notifyAt ? new Date(b.notifyAt).getTime() : 0;
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return mult;
      if (Number.isNaN(tb)) return -mult;
      return mult * (ta - tb);
    }
    case 'notifyStatus':
      return mult * (a.notifyStatus || '').localeCompare(b.notifyStatus || '', 'ko');
    case 'testStatus':
      return mult * (testStatusOrder(a.testStatus) - testStatusOrder(b.testStatus));
    default:
      return 0;
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
  leftPhases,
  rightPhases,
  onSortLeft,
  onSortRight,
  className = '',
}: {
  leftLabel: string;
  rightLabel: string;
  activeKey: RecipientSortKey;
  sortKey: RecipientSortKey | null;
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
    <th scope="col" className={`${counselorListThGrayClass} ${className}`}>
      <div className="inline-flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSortLeft();
          }}
          className={`inline-flex items-center gap-1 transition-colors hover:text-gray-900 ${leftActive ? counselorListSortActiveGrayClass : 'text-gray-600'}`}
        >
          {leftLabel}
          <span className="text-[10px] opacity-80" aria-hidden>
            {sortPhaseIcon(leftActive, phase)}
          </span>
        </button>
        <span className="text-gray-400">/</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSortRight();
          }}
          className={`inline-flex items-center gap-1 transition-colors hover:text-gray-900 ${rightActive ? counselorListSortActiveGrayClass : 'text-gray-600'}`}
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
  sortKey: RecipientSortKey;
  activeKey: RecipientSortKey | null;
  direction: SortDirection;
  onSort: (key: RecipientSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className={`px-3 py-2.5 text-left text-sm font-medium text-gray-700 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-gray-700 transition-colors hover:text-gray-900"
      >
        <span>{label}</span>
        <span className={`text-[10px] ${active ? 'text-gray-800' : 'text-gray-500'}`} aria-hidden="true">
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

function contactChannels(r: DispatchRecipient): string {
  const parts: string[] = [];
  if (r.email) parts.push(`이메일 (${r.email})`);
  if (r.phone) parts.push(`SMS (${formatPhoneDisplay(r.phone)})`);
  return parts.length > 0 ? parts.join(', ') : '없음';
}

function RecipientTargetLine({ recipient }: { recipient: DispatchRecipient }) {
  return (
    <p className="text-sm text-slate-400 leading-relaxed">
      <span className="font-medium text-white">{recipient.displayName || '—'}</span>
      <span className="text-slate-500"> · </span>
      {contactChannels(recipient)}
    </p>
  );
}

function pendingTestsFor(r: DispatchRecipient): DispatchTestResult[] {
  return (r.tests ?? []).filter((t) => t.status !== 'completed');
}

function skipRemindReason(r: DispatchRecipient): string {
  if (!hasCredentialBeenSent(r)) return '미발송';
  if (r.testStatus === 'completed') return '검사 완료';
  if (!pendingTestsFor(r).length && r.requiredCount > 0) return '미완료 검사 없음';
  if (!r.email && !r.phone) return '연락처 없음';
  return '발송 불가';
}

function skipCredentialReason(r: DispatchRecipient, mode: CredentialSendMode): string {
  if (!r.email && !r.phone) return '연락처 없음';
  if (mode === 'initial' && hasCredentialBeenSent(r)) return '이미 발송됨';
  return '발송 대상 아님';
}

type BulkConfirmAction = 'remind' | 'resend' | 'delete' | null;
type DispatchProgress = { kind: 'remind' | 'resend' | 'delete'; count: number };
type DispatchComplete = {
  kind: 'remind' | 'resend' | 'delete';
  error?: boolean;
  summary: string;
  channelSummary?: DispatchChannelSummary | null;
};

interface AssessmentDispatchPanelProps {
  assessmentId: string;
  filterPortalId?: string;
  initialSearchQuery?: string;
  entryFrom?: 'clients' | 'assessments' | 'deleted-recipients';
}

export default function AssessmentDispatchPanel({
  assessmentId,
  filterPortalId,
  initialSearchQuery = '',
  entryFrom = 'assessments',
}: AssessmentDispatchPanelProps) {
  const router = useRouter();
  const { user, authPending, isAuthenticated } = useAuthResolved();
  const pendingIssue = isPendingDispatchAssessmentId(assessmentId);
  const adminUser = isAdmin(user?.role ?? getAppRoleSync());
  const [data, setData] = useState<AssessmentDispatchStatus | null>(() =>
    resolveInitialDispatchStatus(assessmentId, user?.uid),
  );
  const [loading, setLoading] = useState(() => {
    const initial = resolveInitialDispatchStatus(assessmentId, user?.uid);
    return !initial?.recipients?.length && !initial;
  });
  const [error, setError] = useState('');
  const [pendingIssueError, setPendingIssueError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [remindLoading, setRemindLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BulkConfirmAction>(null);
  const [dispatchProgress, setDispatchProgress] = useState<DispatchProgress | null>(null);
  const [dispatchComplete, setDispatchComplete] = useState<DispatchComplete | null>(null);
  const [sortKey, setSortKey] = useState<RecipientSortKey | null>('notifyAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [nameSortPhase, setNameSortPhase] = useState<NameSortPhase>('name-asc');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      writeAssessmentListSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    writeAssessmentListSearch(searchQuery);
  }, [searchQuery]);

  const [dispatchOverrides, setDispatchOverrides] = useState<Record<string, DispatchRowOverride>>({});

  const [detail, setDetail] = useState<CounselorResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useRedirectOnLoginRequiredError(error);
  useRedirectOnLoginRequiredError(detailError);

  useEffect(() => {
    if (!pendingIssue) {
      setPendingIssueError('');
      return undefined;
    }
    const syncPendingResolution = () => {
      const resolved = readPendingDispatchResolution(assessmentId);
      if (resolved) {
        replaceWithAuthSession(
          router,
          `/counselor/assessments/progress?assessmentId=${encodeURIComponent(resolved)}`,
        );
        return;
      }
      const issueError = readPendingDispatchError(assessmentId);
      if (issueError) setPendingIssueError(issueError);
    };
    syncPendingResolution();
    const timer = window.setInterval(syncPendingResolution, 400);
    return () => window.clearInterval(timer);
  }, [assessmentId, pendingIssue, router]);

  useEffect(() => {
    const initial = resolveInitialDispatchStatus(assessmentId, user?.uid);
    setData(initial);
    setLoading(!initial?.recipients?.length && !initial);
    setError('');
  }, [assessmentId, user?.uid]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const fetchId = resolveDispatchFetchId(assessmentId);
    if (!fetchId) return;
    const cached =
      readAnyCachedDispatchStatus(fetchId, user?.uid) ||
      readAnyCachedDispatchStatus(assessmentId, user?.uid);
    if (!opts?.silent && !cached?.recipients?.length) setLoading(true);
    setError('');
    try {
      const result = await fetchAssessmentDispatchStatus(fetchId);
      const fetchedIsAuthoritative =
        (result.recipients?.length ?? 0) > 0 &&
        result.recipients.every((row) => !isOptimisticPortalId(row.portalId));
      const merged = fetchedIsAuthoritative ? result : mergeDispatchStatusWithCache(cached, result);
      const nextData: AssessmentDispatchStatus = {
        ...merged,
        assessmentId: fetchId,
        recipients: (merged.recipients || []).map((row) => ({ ...row, tests: row.tests?.map((t) => ({ ...t })) })),
      };
      writeCachedDispatchStatus(fetchId, nextData, user?.uid);
      setData(nextData);
      setSelected(new Set());
      if (shouldClearDispatchIssueSeed(nextData)) {
        clearDispatchIssueSeed(fetchId);
        if (fetchId !== assessmentId.trim()) {
          clearDispatchIssueSeed(assessmentId);
        }
      }
    } catch (err) {
      if (cached?.recipients?.length) {
        setData(cached);
        setError('');
      } else if (!opts?.silent) {
        setData(null);
        setError(err instanceof Error ? err.message : '불러오기 실패');
      }
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  }, [assessmentId, user?.uid]);

  useEffect(() => {
    if (authPending || !isAuthenticated) return;
    const cached =
      readAnyCachedDispatchStatus(resolveDispatchFetchId(assessmentId) || assessmentId, user?.uid) ||
      readAnyCachedDispatchStatus(assessmentId, user?.uid);
    void load({ silent: Boolean(cached?.recipients?.length) });
  }, [load, authPending, isAuthenticated, assessmentId, user?.uid]);

  const realtimeAssessmentId = resolveDispatchFetchId(assessmentId) || assessmentId;
  const { data: liveData } = useAssessmentDispatchRealtime(
    realtimeAssessmentId,
    data,
    isAuthenticated &&
      !authPending &&
      Boolean(realtimeAssessmentId) &&
      !isPendingDispatchAssessmentId(realtimeAssessmentId),
  );

  const displayData = liveData ?? data;
  const issuingPhase = isDispatchIssuingPhase(assessmentId, displayData);

  const visibleData = useMemo(() => {
    if (!displayData) return null;
    const portalFilter = (filterPortalId || '').trim();
    if (!portalFilter) return displayData;
    return {
      ...displayData,
      recipients: (displayData.recipients || []).filter((r) => r.portalId === portalFilter),
    };
  }, [displayData, filterPortalId]);

  useEffect(() => {
    const portalFilter = (filterPortalId || '').trim();
    if (portalFilter) {
      setExpandedId(portalFilter);
    }
  }, [filterPortalId]);

  const hasSendingNotify = useMemo(
    () =>
      pendingIssue ||
      issuingPhase ||
      hasPendingDispatchIssueSeed(assessmentId) ||
      (visibleData?.recipients || []).some((r) => {
        const status = (r.notifyStatus || 'not_sent').trim();
        return status === 'sending' || status === 'pending';
      }) ||
      Object.keys(dispatchOverrides).length > 0,
    [pendingIssue, issuingPhase, assessmentId, visibleData?.recipients, dispatchOverrides],
  );

  const needsLiveRefresh = useMemo(() => {
    if (pendingIssue || issuingPhase || hasPendingDispatchIssueSeed(assessmentId)) return true;
    return (visibleData?.recipients || []).some((r) => {
      const status = (r.notifyStatus || 'not_sent').trim();
      if (status === 'sending' || status === 'pending') return true;
      if (issuingPhase && !(r.myCode || '').trim()) return true;
      return false;
    });
  }, [pendingIssue, issuingPhase, assessmentId, visibleData?.recipients]);

  useEffect(() => {
    if (authPending || !isAuthenticated || !needsLiveRefresh) return;

    const syncFromCache = () => {
      const fetchId = resolveDispatchFetchId(assessmentId) || assessmentId;
      const cached =
        readAnyCachedDispatchStatus(fetchId, user?.uid) ||
        readAnyCachedDispatchStatus(assessmentId, user?.uid);
      if (!cached) return;
      setData((prev) => (prev ? mergeDispatchStatusWithCache(prev, cached) : cached));
    };

    syncFromCache();
    const cacheTimer = window.setInterval(syncFromCache, 500);
    return () => window.clearInterval(cacheTimer);
  }, [authPending, isAuthenticated, needsLiveRefresh, assessmentId, user?.uid]);

  useEffect(() => {
    if (!data?.recipients?.length) return;
    setDispatchOverrides((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      let changed = false;
      for (const portalId of Object.keys(prev)) {
        const row = data.recipients.find((r) => r.portalId === portalId);
        if (!row || row.notifyStatus !== 'sending') {
          delete next[portalId];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [data]);

  const applySendingOverlay = useCallback(
    (portalIds: string[], kind: 'remind' | 'resend') => {
      const byId = new Map((visibleData?.recipients || []).map((r) => [r.portalId, r]));
      setDispatchOverrides((prev) => {
        const next = { ...prev };
        for (const portalId of portalIds) {
          const recipient = byId.get(portalId);
          if (!recipient) continue;
          next[portalId] = buildSendingOverride(recipient, kind);
        }
        return next;
      });
    },
    [visibleData?.recipients],
  );

  const sendingStartedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (!needsLiveRefresh && !hasSendingNotify) {
      sendingStartedAtRef.current = null;
      return;
    }
    if (authPending || !isAuthenticated) return;
    if (sendingStartedAtRef.current === null) sendingStartedAtRef.current = Date.now();
    const pollMs = pendingIssue || issuingPhase ? 800 : 1500;
    void load({ silent: true });
    const timer = window.setInterval(() => {
      void load({ silent: true });
    }, pollMs);
    return () => window.clearInterval(timer);
  }, [needsLiveRefresh, hasSendingNotify, pendingIssue, issuingPhase, load, authPending, isAuthenticated]);

  const allIds = useMemo(
    () => (visibleData?.recipients || []).map((r) => r.portalId),
    [visibleData?.recipients],
  );
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const completedCount = useMemo(
    () => (visibleData?.recipients || []).filter((r) => r.testStatus === 'completed').length,
    [visibleData?.recipients],
  );

  const dispatchSuccessCount = useMemo(
    () =>
      (visibleData?.recipients || []).filter((r) => {
        const status = r.notifyStatus || 'not_sent';
        return status === 'sent' || status === 'partial';
      }).length,
    [visibleData?.recipients],
  );

  const totalRecipientCount = visibleData?.recipients.length ?? 0;

  const sortedRecipients = useMemo(() => {
    const q = searchQuery.trim();
    let list = (visibleData?.recipients || []).map((r) =>
      mergeDispatchOverride(r, dispatchOverrides[r.portalId]),
    );
    if (q) {
      list = list.filter((r) =>
        matchesWildcardFields(
          [r.displayName || '', r.email || '', r.phone || '', r.myCode || ''],
          q,
        ),
      );
    }
    if (!sortKey) return list;
    list.sort((a, b) => compareRecipients(a, b, sortKey, sortDir, nameSortPhase));
    return list;
  }, [visibleData?.recipients, dispatchOverrides, sortKey, sortDir, nameSortPhase, searchQuery]);

  const remindEligibleSelected = useMemo(
    () => (visibleData?.recipients || []).filter((r) => selected.has(r.portalId) && canSendReminder(r)),
    [visibleData?.recipients, selected],
  );

  const selectedRecipients = useMemo(
    () => sortedRecipients.filter((r) => selected.has(r.portalId)),
    [sortedRecipients, selected],
  );

  const movePortalSummaries = useMemo(
    () =>
      selectedRecipients.map((r) => ({
        portalId: r.portalId,
        displayName: r.displayName,
        myCode: r.myCode,
      })),
    [selectedRecipients],
  );

  const resendEligibleSelected = useMemo(
    () => selectedRecipients.filter((r) => r.email || r.phone),
    [selectedRecipients],
  );

  const resendSkippedSelected = useMemo(
    () => selectedRecipients.filter((r) => !r.email && !r.phone),
    [selectedRecipients],
  );

  const credentialSendMode = useMemo(
    () => resolveCredentialSendMode(resendEligibleSelected),
    [resendEligibleSelected],
  );

  const resendInitialSelected = useMemo(
    () => resendEligibleSelected.filter((r) => !hasCredentialBeenSent(r)),
    [resendEligibleSelected],
  );

  const resendResendOnlySelected = useMemo(
    () => resendEligibleSelected.filter((r) => hasCredentialBeenSent(r)),
    [resendEligibleSelected],
  );

  const credentialTargetSelected = useMemo(() => {
    if (credentialSendMode === 'initial') {
      return resendInitialSelected;
    }
    return resendEligibleSelected;
  }, [credentialSendMode, resendInitialSelected, resendEligibleSelected]);

  const credentialSkippedSelected = useMemo(
    () => selectedRecipients.filter((r) => !credentialTargetSelected.some((t) => t.portalId === r.portalId)),
    [selectedRecipients, credentialTargetSelected],
  );

  const remindSkippedSelected = useMemo(
    () => selectedRecipients.filter((r) => !canSendReminder(r)),
    [selectedRecipients],
  );

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

  const toggleSort = (key: RecipientSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
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

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleResend = async () => {
    if (!assessmentId || credentialTargetSelected.length === 0) return;
    const ids = credentialTargetSelected.map((r) => r.portalId);
    applySendingOverlay(ids, 'resend');
    setDispatchProgress({ kind: 'resend', count: ids.length });
    setResendLoading(true);
    try {
      const result = await resendDispatchCredentials(assessmentId, ids);
      await load({ silent: true });
      const channelSummary = parseDispatchChannelSummary(result.channelSummary);
      setDispatchComplete({
        kind: 'resend',
        channelSummary,
        summary:
          formatDispatchChannelSummary(channelSummary) ||
          `성공 ${result.sent}명, 실패 ${result.failed}명`,
      });
    } catch (err) {
      setDispatchComplete({
        kind: 'resend',
        error: true,
        summary: err instanceof Error ? err.message : '재발송에 실패했습니다.',
      });
    } finally {
      setResendLoading(false);
      setDispatchProgress(null);
    }
  };

  const handleRemind = async (portalIds: string[]) => {
    if (!assessmentId || portalIds.length === 0) return;
    applySendingOverlay(portalIds, 'remind');
    setDispatchProgress({ kind: 'remind', count: portalIds.length });
    setRemindLoading(true);
    try {
      const result = await sendDispatchTestReminders(assessmentId, portalIds);
      await load({ silent: true });
      const channelSummary = parseDispatchChannelSummary(result.channelSummary);
      setDispatchComplete({
        kind: 'remind',
        channelSummary,
        summary:
          formatDispatchChannelSummary(channelSummary) ||
          `성공 ${result.sent}명, 실패 ${result.failed}명`,
      });
    } catch (err) {
      setDispatchComplete({
        kind: 'remind',
        error: true,
        summary: err instanceof Error ? err.message : '미실시 알림 발송에 실패했습니다.',
      });
    } finally {
      setRemindLoading(false);
      setDispatchProgress(null);
    }
  };

  const closeConfirm = () => {
    if (!remindLoading && !resendLoading && !deleteLoading) setConfirmAction(null);
  };

  const exportMeta = useMemo(
    () =>
      data
        ? {
            title: data.title,
            cohortName: data.cohortName,
            joinAccessCode: data.joinAccessCode,
          }
        : { title: '', cohortName: '', joinAccessCode: '' },
    [data],
  );

  const handleDownloadSelected = () => {
    if (selectedRecipients.length === 0 || !data) return;
    downloadDispatchRecipientsExcel(selectedRecipients, exportMeta);
  };

  const handlePrintSelected = () => {
    if (selectedRecipients.length === 0 || !data) return;
    printDispatchRecipients(selectedRecipients, exportMeta);
  };

  const handleDelete = async () => {
    if (!assessmentId || selected.size === 0) return;
    setDispatchProgress({ kind: 'delete', count: selected.size });
    setDeleteLoading(true);
    try {
      const result = await archiveDispatchRecipients(assessmentId, Array.from(selected));
      await load({ silent: true });
      setExpandedId((prev) => (prev && selected.has(prev) ? null : prev));
      setDispatchComplete({
        kind: 'delete',
        summary: `삭제 ${result.archived}명${result.failed ? `, 실패 ${result.failed}명` : ''}`,
      });
    } catch (err) {
      setDispatchComplete({
        kind: 'delete',
        error: true,
        summary: err instanceof Error ? err.message : '삭제에 실패했습니다.',
      });
    } finally {
      setDeleteLoading(false);
      setDispatchProgress(null);
    }
  };

  const confirmBulkAction = async () => {
    if (confirmAction === 'remind') {
      const ids = remindEligibleSelected.map((r) => r.portalId);
      setConfirmAction(null);
      await handleRemind(ids);
    } else if (confirmAction === 'resend') {
      setConfirmAction(null);
      await handleResend();
    } else if (confirmAction === 'delete') {
      setConfirmAction(null);
      await handleDelete();
    }
  };

  const openResultDetail = (resultId: string) => {
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    getCounselorResult(assessmentId, resultId)
      .then(setDetail)
      .catch((err) => setDetailError(err instanceof Error ? err.message : '조회 실패'))
      .finally(() => setDetailLoading(false));
  };

  const closeModal = () => {
    setDetail(null);
    setDetailError('');
  };

  const progressPageTitle = entryFrom === 'clients' ? '검사발송 현황' : '상담진행 현황';

  if (!displayData && loading) {
    return (
      <CounselorPageSection title={progressPageTitle} titleAccent="progress" dense className="flex min-h-0 flex-1">
        <LoadingMessage className="py-2" textClassName="text-sm text-slate-400" message="불러오는 중…" />
      </CounselorPageSection>
    );
  }

  if (error && !displayData) {
    return (
      <CounselorPageSection title={progressPageTitle} titleAccent="progress" dense className="flex min-h-0 flex-1">
        <p className="text-red-400 text-sm py-4">{error}</p>
      </CounselorPageSection>
    );
  }

  if (!data || !displayData) return null;

  const adminClientProgressView = adminUser && entryFrom === 'clients';

  const backHref =
    entryFrom === 'deleted-recipients'
      ? '/counselor/assessments/deleted-recipients'
      : entryFrom === 'clients'
        ? '/counselor/clients'
        : buildAssessmentListHref(searchQuery);
  const backButtonLabel =
    entryFrom === 'deleted-recipients'
      ? '삭제된 내담자'
      : entryFrom === 'clients'
        ? '검사발송 목록'
        : '상담코드 목록';

  return (
    <>
    <CounselorPageSection
      title={
        <span className="inline-flex flex-wrap items-center gap-2">
          <span>{progressPageTitle}</span>
          {displayData.cohortName ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-slate-900/50 px-2 py-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">그룹</span>
              <span className="text-sm font-medium text-slate-200">{displayData.cohortName}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-slate-900/50 px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">소속</span>
            <span className="text-sm text-slate-300">
              {stripAssessmentTitleDispatchCountSuffix(displayData.title || '') || '—'}
            </span>
          </span>
          {issuingPhase ? (
            <span className="inline-flex items-center rounded-md border border-sky-500/30 bg-sky-950/40 px-2 py-1 text-xs font-medium text-sky-200">
              상담코드 발급 중…
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/25 bg-cyan-950/30 px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-500/80">상담코드</span>
            <span className="font-mono text-sm font-semibold tracking-wide text-cyan-300">
              {pendingDispatchPlaceholder(
                formatAccessCodeDisplay(displayData.joinAccessCode),
                issuingPhase,
              )}
            </span>
          </span>
        </span>
      }
      titleAccent="progress"
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      dense
      description={
        <span className="inline-flex w-full flex-wrap items-center gap-2">
          {pendingIssueError ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-950/40 px-2 py-1 text-sm text-red-200">
              발급/발송 처리 중 오류가 발생했습니다: {pendingIssueError} — 상담코드 목록에서 실제 발송 여부를 확인해 주세요.
            </span>
          ) : null}
          <CounselorListBackLink href={backHref} label={backButtonLabel} />
          <AuthLink
            href={backHref}
            className="inline-flex shrink-0 items-center rounded-md border border-white/15 bg-[#101f38]/90 px-2.5 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
          >
            {backButtonLabel}
          </AuthLink>
          <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-950/25 px-2 py-1 text-sm">
            <CounselorProgressMetricsInline
              totalClients={totalRecipientCount}
              items={[
                { label: '발송성공', value: dispatchSuccessCount },
                { label: '검사완료', value: completedCount },
              ]}
            />
          </span>
          <CounselorListSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="이름 · 이메일 · 휴대폰 · 나의코드 검색"
            className="sm:max-w-xs"
          />
        </span>
      }
      toolbar={
        adminUser ? undefined : (
        <div className="flex w-full flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleAll}
            disabled={displayData.recipients.length === 0}
            className="rounded-md border border-white/10 bg-[#101f38]/90 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-50 sm:text-sm"
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction('remind')}
            disabled={
              remindLoading ||
              resendLoading ||
              deleteLoading ||
              remindEligibleSelected.length === 0
            }
            className="rounded-md bg-amber-600/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50 sm:text-sm"
            title="미실시 검사자에게 현황·검사 링크 발송 (비밀번호 유지)"
          >
            {remindLoading
              ? '발송 중…'
              : `미실시 알림 (${remindEligibleSelected.length})`}
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction('resend')}
            disabled={resendLoading || deleteLoading || credentialTargetSelected.length === 0}
            className="rounded-md bg-sky-600/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50 sm:text-sm"
          >
            {resendLoading
              ? '발송 중…'
              : `${credentialSendModeLabel(credentialSendMode)} (${credentialTargetSelected.length})`}
          </button>
        </div>
        )
      }
    >
      <div className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3">
        {displayData.recipients.length === 0 ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
            <p className="text-base text-slate-300">발송된 내담자가 없습니다</p>
            <p className="mt-1 text-sm text-slate-400">상담코드에 내담자를 추가하고 발송해 보세요.</p>
            <Link
              href={`/counselor/assessments/deleted-recipients?assessmentId=${encodeURIComponent(assessmentId)}`}
              className="mt-4 inline-flex items-center rounded-md bg-sky-600/90 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
            >
              삭제된 목록
            </Link>
          </div>
        ) : (
          <>
            <div className={`min-h-0 flex-1 ${counselorListTableWrapperClass}`}>
              <table className="w-max min-w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-10" />
                  {!adminClientProgressView ? <col className="w-10" /> : null}
                  <col className="w-36" />
                  <col className="w-36" />
                  <col className="w-32" />
                  <col className="w-52" />
                  <col className="w-28" />
                  <col className="w-36" />
                </colgroup>
                <thead className={counselorListTheadClass}>
              <tr className={counselorListHeaderRowGrayClass}>
                <th className={counselorListNoThGrayClass}>No.</th>
                {!adminClientProgressView ? (
                  <th className={counselorListSelectThGrayClass}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded accent-blue-500"
                      aria-label="전체 선택"
                    />
                  </th>
                ) : null}
                <DualFieldSortHeader
                  leftLabel="이름"
                  rightLabel="나의코드"
                  activeKey="displayName"
                  sortKey={sortKey}
                  phase={nameSortPhase}
                  leftPhases={['name-asc', 'name-desc']}
                  rightPhases={['code-asc', 'code-desc']}
                  onSortLeft={() => toggleNameFieldSort('name')}
                  onSortRight={() => toggleNameFieldSort('code')}
                  className="w-36"
                />
                <SortableColumnHeader
                  label="진행 현황"
                  sortKey="testStatus"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-36"
                />
                <SortableColumnHeader
                  label="휴대폰"
                  sortKey="phone"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-32"
                />
                <SortableColumnHeader
                  label="이메일"
                  sortKey="email"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-52"
                />
                <SortableColumnHeader
                  label="발송현황"
                  sortKey="notifyStatus"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-28"
                />
                <SortableColumnHeader
                  label="발송일시"
                  sortKey="notifyAt"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-36"
                />
              </tr>
            </thead>
            <tbody>
              {sortedRecipients.map((r, rowIndex) => {
                const notify = dispatchStatusForRow(r);
                const summary = progressStatusForRow(r);
                const isOpen = expandedId === r.portalId;
                const contactRevealed = isOpen;
                const tests = r.tests ?? [];
                const fieldPending = getDispatchRecipientFieldPending(r, issuingPhase);
                const myCodeLabel = pendingDispatchPlaceholder(
                  formatAccessCodeDisplay(r.myCode),
                  fieldPending.myCode,
                );

                return (
                  <React.Fragment key={r.portalId}>
                    <tr
                      onClick={() => toggleExpand(r.portalId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpand(r.portalId);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isOpen}
                      aria-label={`${r.displayName || '내담자'} 진행 현황 ${isOpen ? '접기' : '펼치기'}`}
                      className={`cursor-pointer ${counselorListBodyRowClass} ${isOpen ? 'bg-white/[0.04]' : ''}`}
                    >
                      <td className={`${counselorListTdClass} tabular-nums text-slate-400`}>{rowIndex + 1}</td>
                      {!adminClientProgressView ? (
                        <td className={counselorListSelectTdClass} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(r.portalId)}
                            onChange={() => toggleOne(r.portalId)}
                            className="rounded text-blue-500"
                          />
                        </td>
                      ) : null}
                      <td className={`max-w-[9rem] ${counselorListTdClass} align-top w-36`}>
                        <CounselorSlashInfoCell
                          primary={r.displayName || '—'}
                          secondary={myCodeLabel}
                          hoverTypeLabel="나의코드"
                          normalSecondary
                          showTooltip={false}
                        />
                      </td>
                      <td className={`px-3 py-2.5 align-top whitespace-nowrap text-sm ${summary.className}`}>
                        <span className="text-slate-400" aria-hidden="true">
                          {isOpen ? '▼' : '▶'}{' '}
                        </span>
                        <span>{summary.text}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-300 align-top whitespace-nowrap tabular-nums">
                        {r.phone?.trim() ? displayContactPhone(r.phone, contactRevealed) : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-300 align-top truncate tabular-nums">
                        {r.email?.trim() ? (
                          displayContactEmail(r.email, contactRevealed)
                        ) : (
                          <span className="text-amber-300/90" title="이메일 주소 없음">
                            없음
                          </span>
                        )}
                      </td>
                      <td
                        className="px-3 py-2.5 align-top whitespace-nowrap text-sm"
                        title={fieldPending.notifyStatus ? undefined : notify.title}
                      >
                        {fieldPending.notifyStatus ? (
                          <span className="text-slate-400">{DISPATCH_CHECKING_LABEL}</span>
                        ) : (
                          <DispatchStatusText value={notify} />
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top whitespace-nowrap text-sm tabular-nums text-slate-400">
                        {fieldPending.notifyAt ? DISPATCH_CHECKING_LABEL : formatNotifyDate(r.notifyAt)}
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr>
                        <td
                          colSpan={adminClientProgressView ? 1 : 2}
                          className="border-b border-slate-700/60 bg-slate-900/20 p-0"
                          aria-hidden="true"
                        />
                        <td
                          colSpan={6}
                          className="border-b border-slate-700/60 bg-slate-900/20 px-3 py-3 pb-4 align-top"
                        >
                          {tests.length === 0 ? (
                            <p className="text-slate-500 text-sm rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                              등록된 검사 항목이 없습니다.
                            </p>
                          ) : (
                            <div className="max-w-2xl rounded-lg border border-slate-600/80 bg-slate-950/55 overflow-hidden shadow-inner">
                              <table className="w-full text-sm table-fixed">
                                <colgroup>
                                  <col className="w-10" />
                                  <col />
                                  <col className="w-[5.5rem]" />
                                  <col className="w-[10.5rem]" />
                                  <col className="w-[5.5rem]" />
                                </colgroup>
                                <thead className={counselorListTheadClass}>
                                  <tr className="text-slate-400 text-xs border-b border-slate-700/70 bg-slate-900/40">
                                    <th className="px-3 py-2" aria-hidden="true" />
                                    <th className="px-3 py-2 text-left font-medium">검사명</th>
                                    <th className="px-3 py-2 text-left font-medium">상태</th>
                                    <th className="px-3 py-2 text-left font-medium">완료일시</th>
                                    <th className="px-3 py-2 text-left font-medium">결과 확인</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tests.map((t, testIndex) => {
                                    const st = testStatusLabel(t.status);
                                    return (
                                      <tr
                                        key={t.testId}
                                        className="border-b border-slate-800/80 last:border-0 hover:bg-slate-900/30"
                                      >
                                        <td className="px-3 py-2.5 text-slate-500 tabular-nums align-top">
                                          {testLetterLabel(testIndex)}
                                        </td>
                                        <td className="px-3 py-2.5 text-white align-top break-words">
                                          {t.testName || t.testId}
                                        </td>
                                        <td className={`px-3 py-2.5 align-top ${st.className}`}>
                                          {st.text}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-400 align-top text-xs leading-relaxed">
                                          {formatCompletedAt(t.completedAt)}
                                        </td>
                                        <td className="px-3 py-2.5 align-top">
                                          {t.status === 'completed' && t.resultId ? (
                                            <button
                                              type="button"
                                              onClick={() => openResultDetail(t.resultId!)}
                                              className="text-blue-400 hover:text-blue-300 whitespace-nowrap"
                                            >
                                              결과 보기
                                            </button>
                                          ) : t.status === 'in_progress' ? (
                                            <span className="text-amber-300">진행 중</span>
                                          ) : (
                                            <span className="text-slate-500">미실시</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {!adminClientProgressView ? (
                            <>
                            <CounselorNextTestRecommendCard
                              assessmentId={assessmentId}
                              recipient={r}
                              onAssigned={() => void load({ silent: true })}
                            />
                            <CounselorQuickCareRecommendCard
                              recipient={r}
                              onAssigned={() => void load({ silent: true })}
                            />
                            </>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
              </table>
            </div>

            {!adminClientProgressView ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
              <p className="text-xs text-slate-500">
                선택 <span className="font-semibold text-slate-300 tabular-nums">{selected.size}</span>명 · 전체{' '}
                <span className="tabular-nums text-slate-300">{displayData.recipients.length}</span>명
              </p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {adminUser ? (
                  <button
                    type="button"
                    onClick={toggleAll}
                    disabled={displayData.recipients.length === 0}
                    className="rounded-md border border-white/10 bg-[#101f38]/90 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-50 sm:text-sm"
                  >
                    {allSelected ? '전체 해제' : '전체 선택'}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleDownloadSelected}
                  disabled={selected.size === 0 || deleteLoading || remindLoading || resendLoading}
                  className="rounded-md bg-emerald-700/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 sm:text-sm"
                >
                  다운로드 ({selected.size})
                </button>
                <button
                  type="button"
                  onClick={handlePrintSelected}
                  disabled={selected.size === 0 || deleteLoading || remindLoading || resendLoading}
                  className="rounded-md border border-white/10 bg-[#101f38]/90 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-50 sm:text-sm"
                >
                  인쇄 ({selected.size})
                </button>
                {!adminUser ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction('delete')}
                    disabled={deleteLoading || selected.size === 0 || remindLoading || resendLoading}
                    className="rounded-md bg-red-700/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50 sm:text-sm"
                  >
                    {deleteLoading ? '삭제 중…' : `삭제 (${selected.size})`}
                  </button>
                ) : null}
                {selected.size > 0 && !adminUser ? (
                  <button
                    type="button"
                    onClick={() => setMoveOpen(true)}
                    disabled={remindLoading || resendLoading || deleteLoading}
                    className="inline-flex shrink-0 items-center justify-center rounded-md border border-sky-500/40 bg-sky-900/40 px-2.5 py-1.5 text-xs font-medium text-sky-100 transition-colors hover:bg-sky-800/50 disabled:opacity-50 sm:text-sm"
                  >
                    다른 상담코드로 이동
                  </button>
                ) : null}
              </div>
            </div>
            ) : null}
          </>
        )}
      </div>
    </CounselorPageSection>

      {dispatchProgress ? (
        <CounselorActionProgressOverlay
          open
          zIndexClass="z-[60]"
          title={
            dispatchProgress.kind === 'delete'
              ? '삭제 진행 중…'
              : dispatchProgress.kind === 'remind'
                ? '알림 발송 진행 중…'
                : '발송 진행 중…'
          }
          message={
            dispatchProgress.kind === 'remind'
              ? `미실시 알림 ${dispatchProgress.count}명에게 발송하고 있습니다.`
              : dispatchProgress.kind === 'delete'
                ? `선택 ${dispatchProgress.count}명을 삭제 처리하고 있습니다.`
                : `${credentialSendModeLabel(credentialSendMode)} ${dispatchProgress.count}명을 처리하고 있습니다.`
          }
          hint={
            dispatchProgress.kind === 'delete'
              ? '잠시만 기다려 주세요.'
              : '이메일·SMS 발송 중입니다. 잠시만 기다려 주세요.'
          }
        />
      ) : null}

      {dispatchComplete ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispatch-complete-title"
          onClick={() => setDispatchComplete(null)}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 max-w-md w-full p-6 shadow-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                dispatchComplete.error
                  ? 'bg-red-900/40 text-red-400'
                  : 'bg-emerald-900/40 text-emerald-400'
              }`}
              aria-hidden="true"
            >
              {dispatchComplete.error ? (
                <span className="text-2xl font-bold">!</span>
              ) : (
                <span className="text-2xl">✓</span>
              )}
            </div>
            <h3 id="dispatch-complete-title" className="text-lg font-semibold text-white">
              {dispatchComplete.error
                ? dispatchComplete.kind === 'delete'
                  ? '삭제 실패'
                  : '발송 실패'
                : dispatchComplete.kind === 'remind'
                  ? '미실시 알림 발송 완료'
                  : dispatchComplete.kind === 'delete'
                    ? '삭제 완료'
                    : `${credentialSendModeLabel(credentialSendMode)} 완료`}
            </h3>
            <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">
              {dispatchComplete.error
                ? dispatchComplete.summary
                : dispatchComplete.kind === 'delete'
                  ? dispatchComplete.summary || '선택한 검사자가 삭제 목록으로 이동했습니다.'
                  : dispatchComplete.summary ||
                    (dispatchComplete.kind === 'remind'
                      ? '미실시 알림 발송을 마쳤습니다.'
                      : '발송을 마쳤습니다.')}
            </p>
            <button
              type="button"
              onClick={() => setDispatchComplete(null)}
              className="mt-5 px-6 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              확인
            </button>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeConfirm}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white">
                {confirmAction === 'remind'
                  ? '미실시 알림통보 확인'
                  : confirmAction === 'delete'
                    ? '검사자 삭제 확인'
                    : `${credentialSendModeLabel(credentialSendMode)} 확인`}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {confirmAction === 'remind'
                  ? '아래 내용으로 이메일·SMS 알림을 발송합니다. 비밀번호는 변경되지 않습니다.'
                  : confirmAction === 'delete'
                    ? '선택한 검사자를 상담진행 현황에서 제거합니다.'
                    : credentialSendMode === 'initial'
                      ? '선택한 내담자에게 접속 정보를 발송합니다. 비밀번호가 새로 발급됩니다.'
                      : credentialSendMode === 'resend'
                        ? '아래 내용으로 접속 정보를 재발송합니다. 비밀번호가 새로 발급되며, 이전에 안내된 비밀번호는 더 이상 사용할 수 없습니다.'
                        : '선택 내담자 중 발송·재발송이 함께 포함됩니다. 비밀번호가 새로 발급됩니다.'}
              </p>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
                  <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-3 space-y-1">
                <p>
                  <span className="text-slate-500">상담코드 </span>
                  <span className="font-mono text-cyan-300">
                    {formatAccessCodeDisplay(displayData.joinAccessCode)}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">검사명 </span>
                  <span className="text-white">{displayData.title || '—'}</span>
                </p>
              </div>

              {confirmAction === 'remind' ? (
                <>
                  <div>
                    <p className="text-slate-300 font-medium mb-2">
                      발송 대상 {remindEligibleSelected.length}명
                    </p>
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {remindEligibleSelected.map((r) => (
                        <li
                          key={r.portalId}
                          className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2"
                        >
                          <RecipientTargetLine recipient={r} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  {remindSkippedSelected.length > 0 ? (
                    <p className="text-slate-500 text-xs">
                      선택했으나 제외 {remindSkippedSelected.length}명:{' '}
                      {remindSkippedSelected
                        .map((r) => `${r.displayName || '—'}(${skipRemindReason(r)})`)
                        .join(', ')}
                    </p>
                  ) : null}
                  <div className="rounded-lg border border-slate-600 bg-[#0a1018] p-4 space-y-3 text-sm">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">발송 내용 미리보기</p>
                    <p className="text-slate-200">안녕하세요, ○○님</p>
                    <p className="text-slate-400 leading-relaxed">
                      WizCoCo 검사 접속 정보입니다. 아직 완료하지 않은 검사가 있으니 아래 정보로 검사를 진행해
                      주세요.
                    </p>
                    <div className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2.5 space-y-1">
                      <p className="text-slate-300">
                        나의코드{' '}
                        <span className="font-mono font-semibold text-cyan-300">(개인별)</span>
                      </p>
                      <p className="text-slate-300">
                        비밀번호 <span className="text-amber-200/90">(최초 발송 안내 참고)</span>
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      검사시작 URL · 바로 시작 링크(72시간)가 이메일·문자로 함께 전달됩니다.
                    </p>
                  </div>
                </>
              ) : confirmAction === 'delete' ? (
                <>
                  <div>
                    <p className="text-slate-300 font-medium mb-2">삭제 대상 {selectedRecipients.length}명</p>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedRecipients.map((r) => (
                        <li
                          key={r.portalId}
                          className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2"
                        >
                          <RecipientTargetLine recipient={r} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-red-300/90 text-xs">
                    삭제 후 검사 결과 데이터는 보관되며, 내담자는 내 검사실 로그인이 제한됩니다.
                    「삭제된 목록」에서 복구할 수 있습니다.
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-slate-300 font-medium mb-2">
                      발송 대상 {credentialTargetSelected.length}명
                      {credentialSkippedSelected.length > 0
                        ? ` · 제외 ${credentialSkippedSelected.length}명`
                        : ''}
                      {resendSkippedSelected.length > 0
                        ? ` · 연락처 없음 ${resendSkippedSelected.length}명`
                        : ''}
                    </p>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {credentialTargetSelected.map((r) => (
                        <li
                          key={r.portalId}
                          className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2"
                        >
                          <RecipientTargetLine recipient={r} />
                          <p className="mt-1 text-xs text-slate-500">
                            {hasCredentialBeenSent(r)
                              ? '접속 정보 재발송 (비밀번호 재발급)'
                              : '최초 접속 정보 발송 (미발송)'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {credentialSkippedSelected.length > 0 ? (
                    <p className="text-slate-500 text-xs">
                      선택했으나 제외 {credentialSkippedSelected.length}명:{' '}
                      {credentialSkippedSelected
                        .map((r) => `${r.displayName || '—'}(${skipCredentialReason(r, credentialSendMode)})`)
                        .join(', ')}
                    </p>
                  ) : null}
                  {credentialSendMode === 'mixed' ? (
                    <div className="rounded-lg border border-blue-700/40 bg-blue-950/30 p-3 text-xs text-slate-400 space-y-1">
                      <p>
                        <span className="text-sky-300">최초 발송 {resendInitialSelected.length}명</span>
                        {' · '}
                        <span className="text-sky-300">재발송 {resendResendOnlySelected.length}명</span>
                      </p>
                      <p>미발송 내담자는 접속 정보(나의코드·비밀번호)를, 이미 발송된 내담자는 재발송 메시지를 받습니다.</p>
                    </div>
                  ) : null}
                  <div className="rounded-lg border border-slate-600 bg-[#0a1018] p-4 space-y-3 text-sm">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">발송 내용 미리보기</p>
                    <p className="text-slate-200">안녕하세요, ○○님</p>
                    <p className="text-slate-400 leading-relaxed">
                      WizCoCo 검사 접속 정보입니다. 아래 나의코드·비밀번호 또는 바로 시작 링크로 검사를 진행해
                      주세요.
                      {credentialSendMode === 'resend' ? (
                        <span className="block mt-1 text-amber-200/80">
                          재발송 시 비밀번호가 새로 발급됩니다.
                        </span>
                      ) : null}
                    </p>
                    <div className="rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2.5 space-y-1">
                      <p className="text-slate-300">
                        나의코드{' '}
                        <span className="font-mono font-semibold text-cyan-300">(개인별)</span>
                      </p>
                      <p className="text-slate-300">
                        비밀번호 <span className="font-mono font-semibold text-amber-200">(새로 발급)</span>
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      검사시작 URL · 바로 시작 링크(72시간)가 이메일·문자로 함께 전달됩니다.
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="px-4 py-3 border-t border-slate-600 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={remindLoading || resendLoading || deleteLoading}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmBulkAction()}
                disabled={
                  remindLoading ||
                  resendLoading ||
                  deleteLoading ||
                  (confirmAction === 'remind' && remindEligibleSelected.length === 0) ||
                  (confirmAction === 'resend' && credentialTargetSelected.length === 0) ||
                  (confirmAction === 'delete' && selectedRecipients.length === 0)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                  confirmAction === 'remind'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : confirmAction === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmAction === 'remind'
                  ? '알림 발송'
                  : confirmAction === 'delete'
                    ? '삭제'
                    : credentialSendMode === 'resend'
                      ? '재발송'
                      : '발송'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {(detail !== null || detailLoading || detailError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !detailLoading && closeModal()}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">검사 결과 상세</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-sm"
              >
                닫기
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {detailLoading ? (
                <LoadingMessage layout="inline" textClassName="text-slate-400 text-sm" />
              ) : null}
              {detailError && <p className="text-red-400 text-sm">{detailError}</p>}
              {detail && !detailLoading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-400">내담자</span>
                    <span className="text-white">{detail.clientDisplayName || detail.clientEmail || '—'}</span>
                    <span className="text-slate-400">검사</span>
                    <span className="text-white">{detail.testId}</span>
                    <span className="text-slate-400">완료일시</span>
                    <span className="text-slate-300">{formatCompletedAt(detail.completedAt)}</span>
                  </div>
                  {detail.resultData && Object.keys(detail.resultData).length > 0 && (
                    <div>
                      <h4 className="text-slate-400 text-sm font-medium mb-2">채점/요약</h4>
                      <pre className="bg-slate-900/80 rounded-lg p-3 text-slate-300 text-sm overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(detail.resultData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {detail.responses != null && (
                    <div>
                      <h4 className="text-slate-400 text-sm font-medium mb-2">응답</h4>
                      <pre className="bg-slate-900/80 rounded-lg p-3 text-slate-300 text-sm overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(detail.responses, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CounselorPortalMoveDialog
        open={moveOpen}
        portalIds={Array.from(selected)}
        portalSummaries={movePortalSummaries}
        sourceAssessmentId={assessmentId}
        onClose={() => setMoveOpen(false)}
        onSuccess={() => {
          setMoveOpen(false);
          setSelected(new Set());
        }}
      />
    </>
  );
}
