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
import { formatPhoneDisplay, normalizeRecipientPhone, isValidKrMobilePhone } from '@/lib/phoneFormat';
import { isValidEmailAddress } from '@/lib/emailValidation';
import { displayContactEmail, displayContactPhone } from '@/lib/contactPrivacy';
import DispatchStatusText from '@/components/counselor/DispatchStatusText';
import {
  DISPATCH_SUCCESS_TEXT_CLASS,
  dispatchStatusDisplay,
  shouldSendRemindNotification,
  formatNotifyDate,
  testSummary,
  type DispatchStatusView,
} from '@/lib/dispatchRecipientDisplay';
import RecipientContactCell from '@/components/counselor/RecipientContactCell';
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
  permanentlyDeleteArchivedDispatchRecipients,
  fetchAssessmentDispatchStatus,
  fetchDispatchRecipientDetail,
  resendDispatchCredentials,
  restoreAssessmentMove,
  sendDispatchTestReminders,
  updateDispatchRecipientContact,
  type AssessmentDispatchStatus,
  type DispatchRecipient,
  type DispatchTestResult,
} from '@/lib/clientPortalApi';
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
import { buildAssessmentListHref, writeAssessmentListSearch, buildAssessmentProgressHref } from '@/lib/counselorAssessmentListSearch';
import CounselorListTableScroll from '@/components/counselor/CounselorListTableScroll';
import { DELETED_ASSESSMENTS_HREF } from '@/lib/counselorNestedNav';
import { matchesWildcardFields } from '@/lib/wildcardSearch';
import {
  counselorListBodyRowClass,
  counselorListHeaderRowGrayClass,
  counselorListNoThGrayClass,
  counselorListSelectTdClass,
  counselorListSelectThGrayClass,
  counselorListSortActiveGrayClass,
  counselorListTdClass,
  counselorListThGrayClass,
  counselorListTheadClass,
} from '@/lib/counselorListTableStyles';
import { CounselorDispatchRecipientExpandContent } from '@/components/counselor/CounselorDispatchRecipientExpandDetail';
import { CounselorRecipientExpandLeadingCells } from '@/components/counselor/CounselorRecipientExpandRowCells';
import CounselorNotifyConfirmDialog from '@/components/counselor/CounselorNotifyConfirmDialog';
import type { NotifyRecipientContact } from '@/lib/counselorNotifyChannels';
import AssessmentAddRecipientModal, {
  type AssessmentAddRecipientContext,
} from '@/components/counselor/AssessmentAddRecipientModal';
import CounselorRecipientContactEditModal from '@/components/counselor/CounselorRecipientContactEditModal';
import { LoadingMessage } from '@/components/ui/LoadingMessage';

const DISPATCH_PAGE_SIZE = 50;
/** 탭 재포커스 시 silent load 최소 간격 */
const DISPATCH_VISIBILITY_REFRESH_MS = 60_000;

function myCodeWithOriginSuffix(
  r: DispatchRecipient,
  assessmentId: string,
  codeLabel: string,
): React.ReactNode {
  const originCode = (r.originAccessCode || r.sourceJoinAccessCode || '').trim();
  const originId = (r.originAssessmentId || r.movedFromAssessmentId || '').trim();
  if (!originCode) return codeLabel;
  const href = buildAssessmentProgressHref(originId, '');
  const sameAssessment = !originId || originId === assessmentId;
  if (sameAssessment) {
    return (
      <>
        {codeLabel}
        <span className="ml-1 font-normal text-slate-400">({originCode})</span>
      </>
    );
  }
  return (
    <>
      {codeLabel}
      <AuthLink
        href={href}
        onClick={(e) => e.stopPropagation()}
        className="ml-1 font-normal text-slate-400 hover:text-sky-300"
        title="이전 상담코드 진행 현황"
      >
        ({originCode})
      </AuthLink>
    </>
  );
}

function formatCompletedAt(iso: string | null | undefined): string {
  return formatNotifyDate(iso);
}

function notifyErrorHint(error: string | null | undefined): string | undefined {
  const err = (error || '').trim();
  if (!err) return undefined;
  if (err.includes('invalid_phone')) return '휴대폰 번호 형식(11자리)을 확인해 주세요.';
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

function patchDispatchFromResendDetails(
  status: AssessmentDispatchStatus,
  details: Array<{ portalId: string; status: string }> | undefined,
): AssessmentDispatchStatus {
  if (!details?.length) return status;
  const byId = new Map(details.map((d) => [d.portalId, d.status]));
  return {
    ...status,
    recipients: (status.recipients || []).map((row) => {
      const nextStatus = byId.get(row.portalId);
      if (!nextStatus) return row;
      return {
        ...row,
        notifyStatus: nextStatus,
        notifyKind: 'resend',
      };
    }),
  };
}

function shouldClearDispatchOverride(row: DispatchRecipient): boolean {
  const status = (row.notifyStatus || 'not_sent').trim();
  if (status === 'sending' || status === 'pending') return true;
  if (status === 'sent' || status === 'partial' || status === 'failed') {
    return row.notifyKind === 'resend' || row.notifyKind === 'remind';
  }
  return false;
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
      return '나의코드 전달';
    default:
      return '접속 정보 발송';
  }
}

function testStatusLabel(status: DispatchTestResult['status']): { text: string; className: string } {
  switch (status) {
    case 'completed':
      return { text: '완료', className: DISPATCH_SUCCESS_TEXT_CLASS };
    case 'in_progress':
      return { text: '진행 중', className: 'text-amber-300' };
    default:
      return { text: '미실시', className: 'text-slate-500' };
  }
}

function progressStatusForRow(recipient: DispatchRecipient): { text: string; className: string } {
  if (recipient.moveStatus === 'moved_out') {
    return { text: '상담코드 이동완료', className: 'font-medium text-white' };
  }
  return testSummary(recipient);
}

function progressMoveNote(
  r: DispatchRecipient,
  currentJoinCode: string,
): React.ReactNode | null {
  const origin = (r.originAccessCode || r.sourceJoinAccessCode || '').trim();
  const current = (currentJoinCode || '').trim();
  if (!origin || !current || origin === current) return null;
  return (
    <div className="mt-0.5 text-xs font-normal leading-snug text-slate-400">
      상담코드 이동(
      <span className="text-slate-500">{formatAccessCodeDisplay(origin)}</span>
      <span className="text-slate-600"> → </span>
      <span className="text-white">{formatAccessCodeDisplay(current)}</span>
      )
    </div>
  );
}

function isMovedOutRecipient(r: DispatchRecipient): boolean {
  return r.moveStatus === 'moved_out';
}

function dispatchStatusForRow(recipient: DispatchRecipient): DispatchStatusView {
  return dispatchStatusDisplay(recipient);
}

function canSendReminder(r: DispatchRecipient): boolean {
  return shouldSendRemindNotification({
    notifyStatus: r.notifyStatus,
    testStatus: r.testStatus,
    completedCount: r.completedCount,
    requiredCount: r.requiredCount,
    email: r.email,
    phone: r.phone,
    moveStatus: r.moveStatus,
    tests: r.tests,
    notifyEmailChannel: r.notifyEmailChannel,
    notifyPhoneChannel: r.notifyPhoneChannel,
  });
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

type BulkConfirmAction = 'delete' | 'permanent_delete' | null;
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
  entryFrom?: 'clients' | 'assessments' | 'deleted-recipients' | 'deleted-assessments';
  autoOpenAddRecipient?: boolean;
}

function buildAddRecipientContextFromDispatch(
  data: AssessmentDispatchStatus,
): AssessmentAddRecipientContext {
  return {
    assessmentId: data.assessmentId,
    accessCode: data.joinAccessCode || '',
    cohortName: data.cohortName || '',
    title: (data.title || '—').trim(),
    createdAt: '',
    totalIssuedCount: (data.recipients || []).length,
    testList: data.testList || [],
  };
}

export default function AssessmentDispatchPanel({
  assessmentId,
  filterPortalId,
  initialSearchQuery = '',
  entryFrom = 'assessments',
  autoOpenAddRecipient = false,
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
  const [editRecipient, setEditRecipient] = useState<DispatchRecipient | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [confirmAction, setConfirmAction] = useState<BulkConfirmAction>(null);
  const [notifyConfirmKind, setNotifyConfirmKind] = useState<'remind' | 'resend' | null>(null);
  const [restoreTombstoneId, setRestoreTombstoneId] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState<DispatchProgress | null>(null);
  const [dispatchComplete, setDispatchComplete] = useState<DispatchComplete | null>(null);
  const [sortKey, setSortKey] = useState<RecipientSortKey | null>('notifyAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [nameSortPhase, setNameSortPhase] = useState<NameSortPhase>('name-asc');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const dispatchLastFetchedMsRef = useRef(0);
  const [dispatchNextCursor, setDispatchNextCursor] = useState<string | null>(null);
  const [dispatchTotalCount, setDispatchTotalCount] = useState<number | null>(null);
  const [loadingMoreDispatch, setLoadingMoreDispatch] = useState(false);
  const [loadingExpandedTests, setLoadingExpandedTests] = useState<string | null>(null);
  const expandedTestsLoadedRef = useRef(new Set<string>());

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
      setPendingIssueError(issueError || '');
    };
    syncPendingResolution();
    const timer = window.setInterval(syncPendingResolution, 3000);
    return () => window.clearInterval(timer);
  }, [assessmentId, pendingIssue, router]);

  useEffect(() => {
    const initial = resolveInitialDispatchStatus(assessmentId, user?.uid);
    setData(initial);
    setLoading(!initial?.recipients?.length && !initial);
    setError('');
    dispatchLastFetchedMsRef.current = 0;
  }, [assessmentId, user?.uid]);

  const autoOpenAddRecipientHandled = useRef(false);

  useEffect(() => {
    if (!autoOpenAddRecipient || autoOpenAddRecipientHandled.current) return;
    autoOpenAddRecipientHandled.current = true;
    setAddRecipientOpen(true);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('addRecipient');
    const next = `${url.pathname}${url.search}`;
    router.replace(next, { scroll: false });
  }, [autoOpenAddRecipient, router]);

  const load = useCallback(async (opts?: { silent?: boolean; refresh?: boolean }) => {
    const fetchId = resolveDispatchFetchId(assessmentId);
    if (!fetchId) return;
    const cached =
      readAnyCachedDispatchStatus(fetchId, user?.uid) ||
      readAnyCachedDispatchStatus(assessmentId, user?.uid);
    if (!opts?.silent && !cached?.recipients?.length) setLoading(true);
    setError('');
    try {
      const result = await fetchAssessmentDispatchStatus(fetchId, {
        limit: DISPATCH_PAGE_SIZE,
        expandTests: false,
      });
      const fetchedIsAuthoritative =
        (result.recipients?.length ?? 0) > 0 &&
        result.recipients.every((row) => !isOptimisticPortalId(row.portalId));
      const merged = fetchedIsAuthoritative ? result : mergeDispatchStatusWithCache(cached, result);
      const nextData: AssessmentDispatchStatus = {
        ...merged,
        assessmentId: fetchId,
        totalRecipientCount: result.totalRecipientCount ?? merged.totalRecipientCount,
        nextCursor: result.nextCursor ?? null,
        recipients: (merged.recipients || []).map((row) => ({ ...row, tests: row.tests?.map((t) => ({ ...t })) })),
      };
      writeCachedDispatchStatus(fetchId, nextData, user?.uid);
      setData(nextData);
      dispatchLastFetchedMsRef.current = Date.now();
      expandedTestsLoadedRef.current.clear();
      setDispatchNextCursor(result.nextCursor ?? null);
      setDispatchTotalCount(result.totalRecipientCount ?? nextData.recipients.length);
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
        setDispatchNextCursor(cached.nextCursor ?? null);
        setDispatchTotalCount(cached.totalRecipientCount ?? cached.recipients.length);
        setError('');
      } else {
        let keptExisting = false;
        setData((prev) => {
          if (prev?.recipients?.length) {
            keptExisting = true;
            return prev;
          }
          return opts?.silent ? prev : null;
        });
        if (keptExisting || opts?.silent) {
          setError('');
        } else {
          setError(err instanceof Error ? err.message : '불러오기 실패');
        }
      }
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  }, [assessmentId, user?.uid]);

  const loadMoreDispatch = useCallback(async () => {
    const fetchId = resolveDispatchFetchId(assessmentId);
    if (!fetchId || !dispatchNextCursor || loadingMoreDispatch) return;
    setLoadingMoreDispatch(true);
    setError('');
    try {
      const result = await fetchAssessmentDispatchStatus(fetchId, {
        limit: DISPATCH_PAGE_SIZE,
        cursor: dispatchNextCursor,
        expandTests: false,
      });
      setData((prev) => {
        if (!prev) return result;
        const seen = new Set(prev.recipients.map((r) => r.portalId));
        const appended = (result.recipients || []).filter((r) => !seen.has(r.portalId));
        const next: AssessmentDispatchStatus = {
          ...prev,
          recipients: [...prev.recipients, ...appended],
          totalRecipientCount: result.totalRecipientCount ?? prev.totalRecipientCount,
          nextCursor: result.nextCursor ?? null,
        };
        writeCachedDispatchStatus(fetchId, next, user?.uid);
        return next;
      });
      setDispatchNextCursor(result.nextCursor ?? null);
      if (result.totalRecipientCount != null) {
        setDispatchTotalCount(result.totalRecipientCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '추가 목록 불러오기 실패');
    } finally {
      setLoadingMoreDispatch(false);
    }
  }, [assessmentId, dispatchNextCursor, loadingMoreDispatch, user?.uid]);

  useEffect(() => {
    if (authPending || !isAuthenticated || !expandedId) return;
    if (expandedTestsLoadedRef.current.has(expandedId)) return;
    const fetchId = resolveDispatchFetchId(assessmentId) || assessmentId;
    let cancelled = false;
    setLoadingExpandedTests(expandedId);
    void fetchDispatchRecipientDetail(fetchId, expandedId)
      .then((detail) => {
        if (cancelled) return;
        expandedTestsLoadedRef.current.add(expandedId);
        const tests = (detail.recipient.tests ?? []).map((t) => ({ ...t }));
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recipients: prev.recipients.map((row) =>
              row.portalId === expandedId ? { ...row, ...detail.recipient, tests } : row,
            ),
          };
        });
      })
      .catch(() => {
        expandedTestsLoadedRef.current.delete(expandedId);
      })
      .finally(() => {
        if (!cancelled) setLoadingExpandedTests(null);
      });
    return () => {
      cancelled = true;
    };
  }, [expandedId, assessmentId, authPending, isAuthenticated]);

  const openEditContact = useCallback((recipient: DispatchRecipient) => {
    setEditRecipient(recipient);
    setEditPhone(recipient.phone?.trim() ? formatPhoneDisplay(recipient.phone) : '');
    setEditEmail(recipient.email?.trim() || '');
    setEditError('');
  }, []);

  const closeEditContact = useCallback(() => {
    if (editSaving) return;
    setEditRecipient(null);
    setEditPhone('');
    setEditEmail('');
    setEditError('');
  }, [editSaving]);

  const saveEditContact = useCallback(async () => {
    if (!editRecipient) return;
    const phone = normalizeRecipientPhone(editPhone);
    const email = editEmail.trim().toLowerCase();
    const prevPhone = normalizeRecipientPhone(editRecipient.phone || '');
    const prevEmail = (editRecipient.email || '').trim().toLowerCase();
    if (phone === prevPhone && email === prevEmail) {
      closeEditContact();
      return;
    }
    if (!phone && !email) {
      setEditError('휴대폰 또는 이메일 중 하나 이상 입력해 주세요.');
      return;
    }
    if (email && !isValidEmailAddress(email)) {
      setEditError('이메일 형식을 확인해 주세요.');
      return;
    }
    if (phone && !isValidKrMobilePhone(phone)) {
      setEditError('휴대폰 번호는 11자리(010-1234-5678) 형식으로 입력해 주세요.');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      const updated = await updateDispatchRecipientContact(assessmentId, editRecipient.portalId, {
        phone: phone || undefined,
        email: email || undefined,
      });
      setData((prev) => {
        if (!prev) return prev;
        const next: AssessmentDispatchStatus = {
          ...prev,
          recipients: prev.recipients.map((row) =>
            row.portalId === updated.portalId
              ? { ...row, phone: updated.phone, email: updated.email }
              : row,
          ),
        };
        writeCachedDispatchStatus(assessmentId, next, user?.uid);
        return next;
      });
      closeEditContact();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '연락처 수정에 실패했습니다.');
    } finally {
      setEditSaving(false);
    }
  }, [assessmentId, closeEditContact, editEmail, editPhone, editRecipient, user?.uid]);

  useEffect(() => {
    if (authPending || !isAuthenticated) return;
    const cached =
      readAnyCachedDispatchStatus(resolveDispatchFetchId(assessmentId) || assessmentId, user?.uid) ||
      readAnyCachedDispatchStatus(assessmentId, user?.uid);
    void load({ silent: Boolean(cached?.recipients?.length) });
  }, [load, authPending, isAuthenticated, assessmentId, user?.uid]);

  const displayData = data;
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
    if (Object.keys(dispatchOverrides).length > 0) return true;
    if (pendingIssue || issuingPhase || hasPendingDispatchIssueSeed(assessmentId)) return true;
    return (visibleData?.recipients || []).some((r) => {
      const status = (r.notifyStatus || 'not_sent').trim();
      if (status === 'sending' || status === 'pending') return true;
      if (issuingPhase && !(r.myCode || '').trim()) return true;
      return false;
    });
  }, [pendingIssue, issuingPhase, assessmentId, visibleData?.recipients, dispatchOverrides]);

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
    const cacheTimer = window.setInterval(syncFromCache, 30_000);
    return () => window.clearInterval(cacheTimer);
  }, [authPending, isAuthenticated, needsLiveRefresh, assessmentId, user?.uid]);

  useEffect(() => {
    if (authPending || !isAuthenticated) return;

    const refreshIfStale = () => {
      if (document.visibilityState !== 'visible') return;
      const elapsed = Date.now() - dispatchLastFetchedMsRef.current;
      if (dispatchLastFetchedMsRef.current > 0 && elapsed < DISPATCH_VISIBILITY_REFRESH_MS) {
        return;
      }
      void load({ silent: true });
    };

    document.addEventListener('visibilitychange', refreshIfStale);
    return () => document.removeEventListener('visibilitychange', refreshIfStale);
  }, [load, authPending, isAuthenticated]);

  useEffect(() => {
    if (!data?.recipients?.length) return;
    setDispatchOverrides((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      let changed = false;
      for (const portalId of Object.keys(prev)) {
        const row = data.recipients.find((r) => r.portalId === portalId);
        if (!row || shouldClearDispatchOverride(row)) {
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
  const burstLoadTimerRef = useRef<number[]>([]);

  const scheduleBurstDispatchRefresh = useCallback(() => {
    burstLoadTimerRef.current.forEach((id) => window.clearTimeout(id));
    burstLoadTimerRef.current = [300, 700, 1200, 2000, 3500].map((delay) =>
      window.setTimeout(() => {
        void load({ silent: true });
      }, delay),
    );
  }, [load]);

  useEffect(
    () => () => {
      burstLoadTimerRef.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  useEffect(() => {
    if (!needsLiveRefresh && !hasSendingNotify) {
      sendingStartedAtRef.current = null;
      return;
    }
    if (authPending || !isAuthenticated) return;
    if (sendingStartedAtRef.current === null) sendingStartedAtRef.current = Date.now();
    const maxActiveMs = 120_000;
    void load({ silent: true });
    scheduleBurstDispatchRefresh();
    const pollMs = pendingIssue || issuingPhase ? 5000 : 8000;
    const timer = window.setInterval(() => {
      if (sendingStartedAtRef.current && Date.now() - sendingStartedAtRef.current > maxActiveMs) {
        return;
      }
      void load({ silent: true });
    }, pollMs);
    return () => window.clearInterval(timer);
  }, [
    needsLiveRefresh,
    hasSendingNotify,
    pendingIssue,
    issuingPhase,
    load,
    authPending,
    isAuthenticated,
    scheduleBurstDispatchRefresh,
  ]);

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

  const totalRecipientCount =
    dispatchTotalCount ?? visibleData?.totalRecipientCount ?? visibleData?.recipients.length ?? 0;

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

  const selectedRecipients = useMemo(
    () => sortedRecipients.filter((r) => selected.has(r.portalId)),
    [sortedRecipients, selected],
  );

  const remindEligibleSelected = useMemo(
    () => selectedRecipients.filter((r) => canSendReminder(r)),
    [selectedRecipients],
  );

  const openRemindNotifyConfirm = () => {
    if (selected.size === 0) return;
    if (remindEligibleSelected.length === 0) {
      setError(
        '발송 가능한 내담자가 없습니다. (검사 완료 또는 이메일·휴대폰 발송 모두 실패한 경우는 제외됩니다.)',
      );
      return;
    }
    setNotifyConfirmKind('remind');
  };

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
    () => selectedRecipients.filter((r) => !isMovedOutRecipient(r) && (r.email || r.phone)),
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

  const notifyConfirmRecipients = useMemo<NotifyRecipientContact[]>(() => {
    const targets =
      notifyConfirmKind === 'remind' ? remindEligibleSelected : credentialTargetSelected;
    return targets.map((r) => ({
      displayName: r.displayName,
      email: r.email,
      phone: r.phone,
      notifyStatus: r.notifyStatus,
      initialDispatchPointsCharged: r.initialDispatchPointsCharged,
      notifyResendSuccessCount: r.notifyResendSuccessCount,
    }));
  }, [notifyConfirmKind, remindEligibleSelected, credentialTargetSelected]);

  const handleRestoreMove = async (tombstoneId: string) => {
    setRestoreLoading(true);
    try {
      await restoreAssessmentMove(tombstoneId);
      setRestoreTombstoneId(null);
      setExpandedId(null);
      await load({ silent: true });
      setDispatchComplete({
        kind: 'delete',
        summary: '이전 상담코드로 복구했습니다.',
      });
    } catch (err) {
      setDispatchComplete({
        kind: 'delete',
        error: true,
        summary: err instanceof Error ? err.message : '복구에 실패했습니다.',
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleResend = async (notifyChannels: ('email' | 'phone')[]) => {
    if (!assessmentId || credentialTargetSelected.length === 0) return;
    const ids = credentialTargetSelected.map((r) => r.portalId);
    applySendingOverlay(ids, 'resend');
    setDispatchProgress({ kind: 'resend', count: ids.length });
    setResendLoading(true);
    try {
      const result = await resendDispatchCredentials(assessmentId, ids, notifyChannels);
      setData((prev) => {
        if (!prev) return prev;
        const fetchId = resolveDispatchFetchId(assessmentId) || assessmentId;
        const patched = patchDispatchFromResendDetails(prev, result.details);
        writeCachedDispatchStatus(fetchId, patched, user?.uid);
        return patched;
      });
      setDispatchOverrides((prev) => {
        const next = { ...prev };
        for (const detail of result.details || []) {
          const status = (detail.status || '').trim();
          if (status === 'sent' || status === 'partial' || status === 'failed') {
            delete next[detail.portalId];
          }
        }
        return next;
      });
      await load({ silent: true });
      scheduleBurstDispatchRefresh();
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

  const handleRemind = async (portalIds: string[], notifyChannels: ('email' | 'phone')[]) => {
    if (!assessmentId || portalIds.length === 0) return;
    applySendingOverlay(portalIds, 'remind');
    setDispatchProgress({ kind: 'remind', count: portalIds.length });
    setRemindLoading(true);
    try {
      const result = await sendDispatchTestReminders(assessmentId, portalIds, notifyChannels);
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
      setSelected(new Set());
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

  const handlePermanentDelete = async () => {
    if (selected.size === 0) return;
    const portalIds = Array.from(selected);
    setDispatchProgress({ kind: 'delete', count: portalIds.length });
    setDeleteLoading(true);
    try {
      if (assessmentId) {
        await archiveDispatchRecipients(assessmentId, portalIds);
      }
      const result = await permanentlyDeleteArchivedDispatchRecipients(portalIds);
      await load({ silent: true });
      setExpandedId((prev) => (prev && selected.has(prev) ? null : prev));
      setSelected(new Set());
      setDispatchComplete({
        kind: 'delete',
        summary: `영구삭제 ${result.deleted}명${result.failed ? `, 실패 ${result.failed}명` : ''}`,
      });
    } catch (err) {
      setDispatchComplete({
        kind: 'delete',
        error: true,
        summary: err instanceof Error ? err.message : '영구 삭제에 실패했습니다.',
      });
    } finally {
      setDeleteLoading(false);
      setDispatchProgress(null);
    }
  };

  const confirmBulkAction = async () => {
    if (confirmAction === 'delete') {
      setConfirmAction(null);
      await handleDelete();
    } else if (confirmAction === 'permanent_delete') {
      setConfirmAction(null);
      await handlePermanentDelete();
    }
  };

  const handleNotifyConfirm = async (notifyChannels: ('email' | 'phone')[]) => {
    if (notifyConfirmKind === 'remind') {
      const ids = remindEligibleSelected.map((r) => r.portalId);
      setNotifyConfirmKind(null);
      await handleRemind(ids, notifyChannels);
    } else if (notifyConfirmKind === 'resend') {
      setNotifyConfirmKind(null);
      await handleResend(notifyChannels);
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

  const progressPageTitle =
    entryFrom === 'clients'
      ? '나의코드 현황'
      : entryFrom === 'deleted-recipients'
        ? '삭제된 코드현황'
        : entryFrom === 'deleted-assessments'
          ? '삭제된 내담자'
          : '상담진행 현황';

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
  const clientsSimplifiedView = entryFrom === 'clients' && !adminUser;
  const clientsMergedContact = entryFrom !== 'deleted-recipients' && !adminClientProgressView;
  const contactAfterNotifyAt = entryFrom === 'deleted-assessments';
  const showContactEditColumn = !adminClientProgressView && entryFrom !== 'deleted-assessments';
  const showArchiveDeleteFooter = entryFrom === 'assessments' && !adminUser;
  const showPermanentDeleteFooter = false;
  const showTableCheckbox = !adminClientProgressView && !clientsSimplifiedView;
  const showTableSort = !clientsSimplifiedView;
  const showBulkToolbar = entryFrom === 'assessments' && !adminUser;
  const showFooterActions = !adminClientProgressView && !clientsSimplifiedView;
  const leadingDetailSpacerColSpan = adminClientProgressView || clientsSimplifiedView ? 1 : 2;
  const expandedDetailColSpan =
    (clientsMergedContact ? 5 : 6) + (showContactEditColumn ? 1 : 0);

  const backHref =
    entryFrom === 'deleted-recipients'
      ? '/counselor/assessments/deleted-recipients'
      : entryFrom === 'deleted-assessments'
        ? DELETED_ASSESSMENTS_HREF
        : entryFrom === 'clients'
          ? '/counselor/clients'
          : buildAssessmentListHref(searchQuery);
  const backButtonLabel =
    entryFrom === 'deleted-recipients'
      ? '삭제된 내담자'
      : entryFrom === 'deleted-assessments'
        ? '삭제된 상담코드'
        : entryFrom === 'clients'
          ? '내담자 목록'
          : '상담코드 목록';

  return (
    <>
    <CounselorPageSection
      title={
        <span className="inline-flex flex-wrap items-center gap-2">
          <CounselorListBackLink href={backHref} label={backButtonLabel} />
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
          {pendingIssueError && !issuingPhase && !hasSendingNotify ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-950/40 px-2 py-1 text-sm text-red-200">
              발급/발송 처리 중 오류가 발생했습니다: {pendingIssueError} — 상담코드 목록에서 실제 발송 여부를 확인해 주세요.
            </span>
          ) : null}
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
          {showBulkToolbar ? (
            <span className="ml-auto inline-flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => openRemindNotifyConfirm()}
                disabled={
                  remindLoading ||
                  resendLoading ||
                  deleteLoading ||
                  selected.size === 0
                }
                className="rounded-md bg-amber-600/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50 sm:text-sm"
                title="미실시 검사자에게 현황·검사 링크 발송 (비밀번호 유지)"
              >
                {remindLoading
                  ? '발송 중…'
                  : `미실시 알림 (${selected.size})`}
              </button>
              <button
                type="button"
                onClick={() => setNotifyConfirmKind('resend')}
                disabled={resendLoading || deleteLoading || selected.size === 0}
                className="rounded-md bg-sky-600/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50 sm:text-sm"
              >
                {resendLoading
                  ? '발송 중…'
                  : `${credentialSendModeLabel(credentialSendMode)} (${selected.size})`}
              </button>
            </span>
          ) : null}
        </span>
      }
      toolbar={undefined}
    >
      <div className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3">
        {displayData.recipients.length === 0 ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
            <p className="text-lg font-semibold text-white sm:text-xl">
              {stripAssessmentTitleDispatchCountSuffix(displayData.cohortName || '') || '—'}
              <span className="text-slate-500"> / </span>
              {(displayData.title || '—').trim()}
            </p>
            <p className="mt-3 text-base text-slate-300">발송된 내담자가 없습니다</p>
            <p className="mt-1 text-sm text-slate-400">상담코드에 내담자를 추가하고 발송해 보세요.</p>
            <button
              type="button"
              onClick={() => setAddRecipientOpen(true)}
              className="mt-4 inline-flex items-center rounded-md bg-sky-600/90 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
            >
              내담자 추가
            </button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CounselorListTableScroll className="min-h-0 flex-1">
              <table className="w-max min-w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-10" />
                  {showTableCheckbox ? <col className="w-10" /> : null}
                  <col className="w-36" />
                  <col className="w-36" />
                  {clientsMergedContact ? (
                    <col className="w-52" />
                  ) : (
                    <>
                      <col className="w-32" />
                      <col className="w-52" />
                    </>
                  )}
                  <col className="w-28" />
                  <col className="w-36" />
                  {!adminClientProgressView ? <col className="w-[4.5rem]" /> : null}
                </colgroup>
                <thead className={counselorListTheadClass}>
              <tr className={counselorListHeaderRowGrayClass}>
                <th className={counselorListNoThGrayClass}>No.</th>
                {showTableCheckbox ? (
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
                {showTableSort ? (
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
                ) : (
                  <th scope="col" className={`${counselorListThGrayClass} w-36 whitespace-nowrap`}>
                    이름 / 나의코드
                  </th>
                )}
                {showTableSort ? (
                  <SortableColumnHeader
                    label="진행 현황"
                    sortKey="testStatus"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="w-36"
                  />
                ) : (
                  <th scope="col" className={`${counselorListThGrayClass} w-36 whitespace-nowrap`}>
                    진행 현황
                  </th>
                )}
                {clientsMergedContact && !contactAfterNotifyAt ? (
                  <th scope="col" className={`${counselorListThGrayClass} w-52 whitespace-nowrap`}>
                    연락처
                  </th>
                ) : !clientsMergedContact ? (
                  showTableSort ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <th scope="col" className={`${counselorListThGrayClass} w-32 whitespace-nowrap`}>
                        휴대폰
                      </th>
                      <th scope="col" className={`${counselorListThGrayClass} w-52 whitespace-nowrap`}>
                        이메일
                      </th>
                    </>
                  )
                ) : null}
                {showTableSort ? (
                  <SortableColumnHeader
                    label="발송현황"
                    sortKey="notifyStatus"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="w-28"
                  />
                ) : (
                  <th scope="col" className={`${counselorListThGrayClass} w-28 whitespace-nowrap`}>
                    발송현황
                  </th>
                )}
                {showTableSort ? (
                  <SortableColumnHeader
                    label="발송일시"
                    sortKey="notifyAt"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="w-36"
                  />
                ) : (
                  <th scope="col" className={`${counselorListThGrayClass} w-36 whitespace-nowrap`}>
                    발송일시
                  </th>
                )}
                {contactAfterNotifyAt && clientsMergedContact ? (
                  <th scope="col" className={`${counselorListThGrayClass} w-52 whitespace-nowrap`}>
                    연락처
                  </th>
                ) : null}
                {showContactEditColumn ? (
                  <th className={`${counselorListTdClass} w-[4.5rem] text-center text-xs font-medium text-slate-400`}>
                    연락처 수정
                  </th>
                ) : null}
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
                      {showTableCheckbox ? (
                        <td className={counselorListSelectTdClass} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(r.portalId)}
                            onChange={() => toggleOne(r.portalId)}
                            disabled={isMovedOutRecipient(r)}
                            className="rounded text-blue-500 disabled:opacity-40"
                          />
                        </td>
                      ) : null}
                      <td className={`max-w-[14rem] ${counselorListTdClass} w-44`}>
                        <p className="min-w-0 truncate text-sm leading-snug text-white">
                          <span className="font-semibold">{r.displayName || '—'}</span>
                          <span className="text-slate-500"> / </span>
                          <span className="font-mono text-[13px] text-slate-200">
                            {myCodeWithOriginSuffix(r, assessmentId, myCodeLabel)}
                          </span>
                        </p>
                      </td>
                      <td className={`px-3 py-2.5 align-middle text-sm ${summary.className}`}>
                        <div>
                          <div>
                            <span className="text-slate-400" aria-hidden="true">
                              {isOpen ? '▼' : '▶'}{' '}
                            </span>
                            <span>{summary.text}</span>
                          </div>
                          {progressMoveNote(r, displayData.joinAccessCode || '')}
                        </div>
                      </td>
                      {clientsMergedContact && !contactAfterNotifyAt ? (
                        <td className={`${counselorListTdClass} align-middle`}>
                          <RecipientContactCell phone={r.phone} email={r.email} />
                        </td>
                      ) : !clientsMergedContact ? (
                        <>
                          <td className="px-3 py-2 text-slate-300 align-middle whitespace-nowrap tabular-nums">
                            {r.phone?.trim() ? displayContactPhone(r.phone, contactRevealed) : '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-300 align-middle truncate tabular-nums">
                            {r.email?.trim() ? (
                              displayContactEmail(r.email, contactRevealed)
                            ) : (
                              <span className="text-amber-300/90" title="이메일 주소 없음">
                                없음
                              </span>
                            )}
                          </td>
                        </>
                      ) : null}
                      <td
                        className="px-3 py-2.5 align-middle whitespace-nowrap text-sm"
                        title={notify.title}
                      >
                        <DispatchStatusText value={notify} />
                      </td>
                      <td className="px-3 py-2.5 align-middle whitespace-nowrap text-sm tabular-nums text-slate-400">
                        {fieldPending.notifyAt ? DISPATCH_CHECKING_LABEL : formatNotifyDate(r.notifyAt)}
                      </td>
                      {contactAfterNotifyAt && clientsMergedContact ? (
                        <td className={`${counselorListTdClass} align-middle`}>
                          <RecipientContactCell phone={r.phone} email={r.email} />
                        </td>
                      ) : null}
                      {showContactEditColumn ? (
                        <td className="px-2 py-2.5 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openEditContact(r)}
                            className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-sky-200 transition-colors hover:border-sky-400/40 hover:bg-sky-500/10"
                          >
                            연락처 수정
                          </button>
                        </td>
                      ) : null}
                    </tr>
                    {isOpen ? (
                      <tr data-counselor-list-expand-row>
                        <CounselorRecipientExpandLeadingCells
                          leadingColSpan={leadingDetailSpacerColSpan}
                          portalId={r.portalId}
                        />
                        <td
                          colSpan={expandedDetailColSpan}
                          className="border-b border-slate-700/60 bg-slate-900/20 px-3 py-3 pb-4 align-top"
                        >
                          {loadingExpandedTests === r.portalId ? (
                            <p className="text-sm text-slate-400">검사 상세 불러오는 중…</p>
                          ) : (
                          <CounselorDispatchRecipientExpandContent
                            recipient={r}
                            tests={tests}
                            assessmentId={assessmentId}
                            searchQuery={searchQuery}
                            showRecommendCards={!adminClientProgressView}
                            onOpenResult={(resultId) => openResultDetail(resultId)}
                            onRestoreTombstone={(tombstoneId) => setRestoreTombstoneId(tombstoneId)}
                            restoreLoading={restoreLoading}
                            onRecommendAssigned={() => void load({ silent: true })}
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
            </CounselorListTableScroll>

            {dispatchNextCursor ? (
              <div className="relative z-10 shrink-0 flex justify-center border-t border-white/10 bg-[#0f1d33] pt-3">
                <button
                  type="button"
                  disabled={loadingMoreDispatch}
                  onClick={() => void loadMoreDispatch()}
                  className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-sky-200 transition-colors hover:border-sky-400/40 hover:bg-sky-500/10 disabled:opacity-50"
                >
                  {loadingMoreDispatch
                    ? '불러오는 중…'
                    : `더 보기 (${displayData.recipients.length}${totalRecipientCount ? ` / ${totalRecipientCount}` : ''})`}
                </button>
              </div>
            ) : null}

            {showFooterActions ? (
            <div className="relative z-10 shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0f1d33] px-0.5 pt-3 pb-1">
              <p className="text-xs text-slate-500">
                선택 <span className="font-semibold text-slate-300 tabular-nums">{selected.size}</span>명 · 전체{' '}
                <span className="tabular-nums text-slate-300">{displayData.recipients.length}</span>명
              </p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                {showArchiveDeleteFooter ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction('delete')}
                    disabled={deleteLoading || selected.size === 0 || remindLoading || resendLoading}
                    className="rounded-md bg-red-700/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50 sm:text-sm"
                  >
                    {deleteLoading ? '삭제 중…' : `삭제 (${selected.size})`}
                  </button>
                ) : null}
                {showPermanentDeleteFooter ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction('permanent_delete')}
                    disabled={deleteLoading || selected.size === 0 || remindLoading || resendLoading}
                    className="rounded-md bg-red-700/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50 sm:text-sm"
                  >
                    {deleteLoading ? '영구삭제 중…' : `영구삭제 (${selected.size})`}
                  </button>
                ) : null}
                {!adminUser && entryFrom !== 'deleted-assessments' ? (
                  <button
                    type="button"
                    onClick={() => setMoveOpen(true)}
                    disabled={
                      selected.size === 0 || remindLoading || resendLoading || deleteLoading
                    }
                    className="inline-flex shrink-0 items-center justify-center rounded-md border border-sky-500/40 bg-sky-900/40 px-2.5 py-1.5 text-xs font-medium text-sky-100 transition-colors hover:bg-sky-800/50 disabled:opacity-50 sm:text-sm"
                  >
                    다른 상담코드로 이동
                  </button>
                ) : null}
              </div>
            </div>
            ) : null}
          </div>
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

      {confirmAction === 'delete' ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeConfirm}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white">검사자 삭제 확인</h3>
              <p className="text-sm text-slate-400 mt-1">
                선택한 검사자를 상담진행 현황에서 제거합니다.
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
            </div>
            <div className="px-4 py-3 border-t border-slate-600 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmBulkAction()}
                disabled={deleteLoading || selectedRecipients.length === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 bg-red-600 hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmAction === 'permanent_delete' ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeConfirm}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white">나의코드 영구삭제 확인</h3>
              <p className="text-sm text-slate-400 mt-1">
                선택한 내담자의 나의코드를 영구삭제합니다. 복구할 수 없습니다.
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
              <div>
                <p className="text-slate-300 font-medium mb-2">영구삭제 대상 {selectedRecipients.length}명</p>
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
                영구삭제 후 해당 나의코드는 삭제코드 현황·삭제된 내담자 목록에서 제외됩니다.
              </p>
            </div>
            <div className="px-4 py-3 border-t border-slate-600 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmBulkAction()}
                disabled={deleteLoading || selectedRecipients.length === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 bg-red-600 hover:bg-red-700"
              >
                영구삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CounselorNotifyConfirmDialog
        open={notifyConfirmKind !== null}
        kind={notifyConfirmKind === 'remind' ? 'remind' : 'resend'}
        recipients={notifyConfirmRecipients}
        loading={remindLoading || resendLoading}
        confirmLabel={
          notifyConfirmKind === 'remind'
            ? '알림 발송'
            : credentialSendMode === 'resend'
              ? '나의코드 전달'
              : '발송'
        }
        onConfirm={(channels) => void handleNotifyConfirm(channels)}
        onCancel={() => setNotifyConfirmKind(null)}
      />

      {restoreTombstoneId ? (
        <div
          className="fixed inset-0 z-[135] flex items-center justify-center bg-black/70 p-4"
          onClick={() => !restoreLoading && setRestoreTombstoneId(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-800 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">이전 코드로 복구</h3>
            <p className="mt-2 text-sm text-slate-300">
              이동한 내담자를 이 상담코드로 되돌립니다. 검사 결과 분류가 다시 조정될 수 있습니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={restoreLoading}
                onClick={() => setRestoreTombstoneId(null)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={restoreLoading}
                onClick={() => void handleRestoreMove(restoreTombstoneId)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {restoreLoading ? '복구 중…' : '복구'}
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

      {editRecipient ? (
        <CounselorRecipientContactEditModal
          open
          target={{
            displayName: editRecipient.displayName,
            myCode: editRecipient.myCode,
            phone: editRecipient.phone,
            email: editRecipient.email,
          }}
          saving={editSaving}
          onClose={closeEditContact}
          onSave={async (payload) => {
            if (!editRecipient) return;
            setEditSaving(true);
            setEditError('');
            try {
              const updated = await updateDispatchRecipientContact(
                assessmentId,
                editRecipient.portalId,
                payload,
              );
              setData((prev) => {
                if (!prev) return prev;
                const next: AssessmentDispatchStatus = {
                  ...prev,
                  recipients: prev.recipients.map((row) =>
                    row.portalId === updated.portalId
                      ? { ...row, phone: updated.phone, email: updated.email }
                      : row,
                  ),
                };
                writeCachedDispatchStatus(assessmentId, next, user?.uid);
                return next;
              });
              closeEditContact();
            } catch (err) {
              setEditError(err instanceof Error ? err.message : '연락처 수정에 실패했습니다.');
            } finally {
              setEditSaving(false);
            }
          }}
        />
      ) : null}

      <AssessmentAddRecipientModal
        open={addRecipientOpen}
        onClose={() => setAddRecipientOpen(false)}
        context={displayData ? buildAddRecipientContextFromDispatch(displayData) : null}
        onSuccess={() => {
          void load({ silent: true });
        }}
      />

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
