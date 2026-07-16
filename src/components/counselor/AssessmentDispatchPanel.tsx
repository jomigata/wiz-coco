'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCounselorResult, type CounselorResultDetail } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { formatPhoneDisplay, formatPhoneDisplayOr, formatPhoneMaskedDisplay } from '@/lib/phoneFormat';
import {
  downloadDispatchRecipientsExcel,
  printDispatchRecipients,
} from '@/lib/dispatchRecipientExport';
import {
  archiveDispatchRecipients,
  bulkCreateClientPortals,
  fetchAssessmentDispatchStatus,
  resendDispatchCredentials,
  sendDispatchTestReminders,
  type AssessmentDispatchStatus,
  type DispatchRecipient,
  type DispatchTestResult,
} from '@/lib/clientPortalApi';
import { useAssessmentDispatchRealtime } from '@/hooks/useAssessmentDispatchRealtime';
import { normalizeRecipientPhone } from '@/lib/phoneFormat';
import { FORM_INPUT, FORM_LABEL } from '@/lib/assessmentFormUi';

function formatCompletedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

function formatNotifyDate(iso: string | null | undefined): string {
  return formatCompletedAt(iso);
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

type CredentialSendMode = 'initial' | 'resend' | 'mixed';

function hasCredentialBeenSent(r: DispatchRecipient): boolean {
  const status = r.notifyStatus || 'not_sent';
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
      return '선택 발송';
    case 'resend':
      return '코드 재발송';
    default:
      return '접속 정보 발송';
  }
}

function notifyKindLabel(kind: string | null | undefined): string {
  return kind === 'resend' ? '재발송' : '최초';
}

function dispatchStatusDisplay(r: DispatchRecipient): { text: string; className: string; title?: string } {
  const hasEmail = Boolean(r.email?.trim());
  const hasPhone = Boolean(r.phone?.trim());

  if (!hasEmail && !hasPhone) {
    return {
      text: '연락처 없음',
      className: 'text-red-400',
      title: '이메일·휴대폰 정보가 없어 발송할 수 없습니다.',
    };
  }

  const status = r.notifyStatus || 'not_sent';

  if (status === 'failed' || status === 'partial') {
    const kindPrefix = notifyKindLabel(r.notifyKind);
    return {
      text: status === 'partial' ? `${kindPrefix} 일부 실패` : `${kindPrefix} 실패`,
      className: 'text-red-400',
      title: notifyErrorHint(r.notifyError) || '발송에 실패했습니다.',
    };
  }

  if (status === 'skipped') {
    if (!hasEmail && hasPhone) {
      return {
        text: '발송 생략',
        className: 'text-amber-300',
        title: notifyErrorHint(r.notifyError) || '이메일 없음 · SMS만 등록됨',
      };
    }
    return {
      text: '발송 생략',
      className: 'text-slate-400',
      title: notifyErrorHint(r.notifyError),
    };
  }

  if (status === 'sent') {
    const kindPrefix = notifyKindLabel(r.notifyKind);
    if (!hasEmail && hasPhone) {
      return {
        text: `${kindPrefix} 완료(SMS)`,
        className: 'text-emerald-300',
        title: '이메일 없음 · SMS로 발송됨',
      };
    }
    if (hasEmail && !hasPhone) {
      return {
        text: `${kindPrefix} 완료(이메일)`,
        className: 'text-emerald-300',
        title: '이메일로 발송됨',
      };
    }
    const viaLabel = formatSentViaLabel(r.notifySentVia);
    return {
      text: viaLabel ? `${kindPrefix} 완료 (${viaLabel})` : `${kindPrefix} 완료`,
      className: 'text-emerald-300',
      title: kindPrefix === '재발송' ? '접속 정보 재발송 완료' : '최초 접속 정보 발송 완료',
    };
  }

  if (status === 'pending') {
    return {
      text: `${notifyKindLabel(r.notifyKind)} 예약`,
      className: 'text-amber-300',
      title: '발송 예약됨',
    };
  }

  if (status === 'not_sent' && !hasEmail) {
    return {
      text: '미발송',
      className: 'text-slate-500',
      title: '이메일 없음 · 휴대폰만 등록됨',
    };
  }

  return notifyLabel(status);
}

function notifyLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'sent':
      return { text: '발송 성공', className: 'text-emerald-300' };
    case 'failed':
      return { text: '발송 실패', className: 'text-red-400' };
    case 'partial':
      return { text: '일부 발송 실패', className: 'text-amber-300' };
    case 'pending':
      return { text: '발송 대기', className: 'text-amber-300' };
    case 'skipped':
      return { text: '발송 생략', className: 'text-slate-400' };
    case 'not_sent':
      return { text: '미발송', className: 'text-slate-500' };
    default:
      return { text: status || '—', className: 'text-slate-400' };
  }
}

function testSummary(r: DispatchRecipient): { text: string; className: string } {
  if (r.testStatus === 'completed') {
    return { text: '검사 완료', className: 'text-emerald-300' };
  }
  if (r.testStatus === 'in_progress') {
    return {
      text: `${r.completedCount}/${r.requiredCount}`,
      className: 'text-amber-300',
    };
  }
  return { text: '미실시', className: 'text-slate-500' };
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

function canSendReminder(r: DispatchRecipient): boolean {
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
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'displayName':
      return mult * (a.displayName || '').localeCompare(b.displayName || '', 'ko');
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
    <th className={`px-3 py-2 text-left text-xs font-medium text-slate-400 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors"
      >
        <span>{label}</span>
        <span className={`text-[10px] ${active ? 'text-cyan-400' : 'text-slate-600'}`} aria-hidden="true">
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
  if (r.testStatus === 'completed') return '검사 완료';
  if (!pendingTestsFor(r).length && r.requiredCount > 0) return '미완료 검사 없음';
  if (!r.email && !r.phone) return '연락처 없음';
  return '발송 불가';
}

type BulkConfirmAction = 'remind' | 'resend' | 'delete' | null;
type DispatchProgress = { kind: 'remind' | 'resend' | 'delete'; count: number };
type DispatchComplete = {
  kind: 'remind' | 'resend' | 'delete';
  error?: boolean;
  summary: string;
};

interface AssessmentDispatchPanelProps {
  assessmentId: string;
}

export default function AssessmentDispatchPanel({ assessmentId }: AssessmentDispatchPanelProps) {
  const router = useRouter();
  const { authPending, isAuthenticated } = useAuthResolved();
  const [data, setData] = useState<AssessmentDispatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedPhonePortalId, setRevealedPhonePortalId] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [remindLoading, setRemindLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BulkConfirmAction>(null);
  const [dispatchProgress, setDispatchProgress] = useState<DispatchProgress | null>(null);
  const [dispatchComplete, setDispatchComplete] = useState<DispatchComplete | null>(null);
  const [sortKey, setSortKey] = useState<RecipientSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addSendNow, setAddSendNow] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [detail, setDetail] = useState<CounselorResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useRedirectOnLoginRequiredError(error);
  useRedirectOnLoginRequiredError(detailError);

  useEffect(() => {
    if (!revealedPhonePortalId) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-phone-reveal]')) return;
      setRevealedPhonePortalId(null);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [revealedPhonePortalId]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!assessmentId) return;
    if (!opts?.silent) setLoading(true);
    setError('');
    try {
      const result = await fetchAssessmentDispatchStatus(assessmentId);
      setData(result);
      setSelected(new Set());
    } catch (err) {
      if (!opts?.silent) setData(null);
      setError(err instanceof Error ? err.message : '불러오기 실패');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (authPending || !isAuthenticated) return;
    void load();
  }, [load, authPending, isAuthenticated]);

  const {
    data: liveData,
    isLive,
    liveError,
    lastUpdatedAt,
  } = useAssessmentDispatchRealtime(assessmentId, data, isAuthenticated && !authPending);

  const displayData = liveData ?? data;

  const allIds = useMemo(
    () => (displayData?.recipients || []).map((r) => r.portalId),
    [displayData?.recipients],
  );
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const completedCount = useMemo(
    () => (displayData?.recipients || []).filter((r) => r.testStatus === 'completed').length,
    [displayData?.recipients],
  );

  const remindEligibleSelected = useMemo(
    () => (displayData?.recipients || []).filter((r) => selected.has(r.portalId) && canSendReminder(r)),
    [displayData?.recipients, selected],
  );

  const selectedRecipients = useMemo(
    () => (displayData?.recipients || []).filter((r) => selected.has(r.portalId)),
    [displayData?.recipients, selected],
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

  const remindSkippedSelected = useMemo(
    () => selectedRecipients.filter((r) => !canSendReminder(r)),
    [selectedRecipients],
  );

  const loginUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/portal/login/`
      : 'https://wizcoco.com/portal/login/';

  const sortedRecipients = useMemo(() => {
    const list = [...(displayData?.recipients || [])];
    if (!sortKey) return list;
    list.sort((a, b) => compareRecipients(a, b, sortKey, sortDir));
    return list;
  }, [displayData?.recipients, sortKey, sortDir]);

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

  const handleAddRecipient = async () => {
    if (!assessmentId || !displayData) return;
    const displayName = addName.trim();
    const email = addEmail.trim().toLowerCase();
    const phone = normalizeRecipientPhone(addPhone);
    if (!displayName) {
      setAddError('이름을 입력해 주세요.');
      return;
    }
    if (!email && !phone) {
      setAddError('이메일 또는 휴대폰 중 하나는 필수입니다.');
      return;
    }
    const cohortName = (displayData.cohortName || displayData.title || '내담자').trim();
    setAddLoading(true);
    setAddError('');
    try {
      await bulkCreateClientPortals({
        assessmentId,
        cohortName,
        title: displayData.title || cohortName,
        testList: displayData.testList,
        rows: [
          {
            displayName,
            email: email || undefined,
            phone: phone || undefined,
            queueNotify: addSendNow,
          },
        ],
        queueNotify: addSendNow,
      });
      setShowAddRecipient(false);
      setAddName('');
      setAddEmail('');
      setAddPhone('');
      setAddSendNow(true);
      await load({ silent: true });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '내담자 추가에 실패했습니다.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleResend = async () => {
    if (!assessmentId || selected.size === 0) return;
    const count = resendEligibleSelected.length || selected.size;
    setDispatchProgress({ kind: 'resend', count });
    setResendLoading(true);
    try {
      const result = await resendDispatchCredentials(assessmentId, Array.from(selected));
      await load({ silent: true });
      setDispatchComplete({
        kind: 'resend',
        summary: `성공 ${result.sent}명, 실패 ${result.failed}명`,
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
    setDispatchProgress({ kind: 'remind', count: portalIds.length });
    setRemindLoading(true);
    try {
      const result = await sendDispatchTestReminders(assessmentId, portalIds);
      await load({ silent: true });
      setDispatchComplete({
        kind: 'remind',
        summary: `성공 ${result.sent}명, 실패 ${result.failed}명`,
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
      router.push(
        `/counselor/assessments/deleted-recipients?assessmentId=${encodeURIComponent(assessmentId)}`,
      );
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

  if (loading) {
    return <p className="text-slate-400 text-sm py-4">발송목록을 불러오는 중…</p>;
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  if (!data || !displayData) return null;

  const liveUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-sky-400/20 bg-[#0f1d33]/70 px-3 py-2 text-sm">
        <span className="font-mono text-base font-bold tracking-wide text-cyan-300">
          {formatAccessCodeDisplay(displayData.joinAccessCode)}
        </span>
        {displayData.cohortName ? (
          <>
            <span className="text-slate-600" aria-hidden>
              ·
            </span>
            <span className="font-medium text-slate-200">{displayData.cohortName}</span>
          </>
        ) : null}
        <span className="text-slate-600" aria-hidden>
          ·
        </span>
        <span className="min-w-0 truncate text-slate-400">{displayData.title || '—'}</span>
        <span className="text-slate-600" aria-hidden>
          ·
        </span>
        <span className="whitespace-nowrap text-slate-300">
          완료{' '}
          <span className="font-semibold text-white tabular-nums">{completedCount}</span>
          <span className="text-slate-500">/</span>
          <span className="tabular-nums">{displayData.recipients.length}</span>
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
              실시간
              {liveUpdatedLabel ? <span className="text-slate-500">{liveUpdatedLabel}</span> : null}
            </span>
          ) : liveError ? (
            <span className="text-amber-300/90" title={liveError}>
              API 기준
            </span>
          ) : (
            <span className="text-slate-500">연결 중…</span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-600 bg-slate-800/30 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-300">내담자 목록</p>
            <button
              type="button"
              onClick={() => {
                setAddError('');
                setShowAddRecipient(true);
              }}
              disabled={addLoading || resendLoading || deleteLoading}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-100 bg-emerald-700/80 hover:bg-emerald-600 disabled:opacity-50"
            >
              + 내담자 추가
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">발송·알림</span>
            <button
              type="button"
              onClick={toggleAll}
              disabled={displayData.recipients.length === 0}
              className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50"
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
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              title="미실시 검사자에게 현황·검사 링크 발송 (비밀번호 유지)"
            >
              {remindLoading
                ? '발송 중…'
                : `미실시 알림통보 (${remindEligibleSelected.length})`}
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction('resend')}
              disabled={resendLoading || deleteLoading || selected.size === 0}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {resendLoading
                ? '발송 중…'
                : `${credentialSendModeLabel(credentialSendMode)} (${selected.size})`}
            </button>
          </div>
        </div>

        {displayData.recipients.length === 0 ? (
          <p className="px-4 py-6 text-slate-400 text-sm">발송된 내담자가 없습니다.</p>
        ) : (
          <>
            <div className="max-h-[min(28rem,calc(100dvh-20rem))] overflow-auto">
              <table className="w-max min-w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-10" />
                  <col className="w-10" />
                  <col className="w-12" />
                  <col className="w-36" />
                  <col className="w-28" />
                  <col className="w-52" />
                  <col className="w-32" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-24" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-slate-800 text-slate-400 shadow-[0_1px_0_0_rgb(71,85,105)]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium">No.</th>
                <th className="px-3 py-2 text-left text-xs font-medium">선택</th>
                <th className="px-3 py-2 text-left text-xs font-medium">검사현황</th>
                <SortableColumnHeader
                  label="발송일시"
                  sortKey="notifyAt"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-36"
                />
                <SortableColumnHeader
                  label="이름"
                  sortKey="displayName"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-28"
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
                  label="휴대폰"
                  sortKey="phone"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-32"
                />
                <SortableColumnHeader
                  label="나의코드"
                  sortKey="myCode"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-24"
                />
                <SortableColumnHeader
                  label="발송"
                  sortKey="notifyStatus"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-24"
                />
                <SortableColumnHeader
                  label="검사"
                  sortKey="testStatus"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-24"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedRecipients.map((r, rowIndex) => {
                const notify = dispatchStatusDisplay(r);
                const summary = testSummary(r);
                const isOpen = expandedId === r.portalId;
                const tests = r.tests ?? [];

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
                      aria-label={`${r.displayName || '내담자'} 검사 현황 ${isOpen ? '접기' : '펼치기'}`}
                      className={`cursor-pointer hover:bg-slate-800/50 ${isOpen ? 'bg-slate-800/40 border-b border-slate-700/60' : ''}`}
                    >
                      <td className="px-3 py-2 text-slate-400 align-top tabular-nums">{rowIndex + 1}</td>
                      <td className="px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(r.portalId)}
                          onChange={() => toggleOne(r.portalId)}
                          className="rounded text-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 align-top text-slate-400" aria-hidden="true">
                        {isOpen ? '▼' : '▶'}
                      </td>
                      <td className="px-3 py-2 text-slate-400 align-top whitespace-nowrap text-xs tabular-nums">
                        {formatNotifyDate(r.notifyAt)}
                      </td>
                      <td className="px-3 py-2 text-white align-top w-28 max-w-[7rem] truncate">
                        {r.displayName || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-300 align-top truncate">
                        {r.email?.trim() ? (
                          r.email
                        ) : (
                          <span className="text-amber-300/90" title="이메일 주소 없음">
                            없음
                          </span>
                        )}
                      </td>
                      <td
                        className="px-3 py-2 text-slate-300 align-top whitespace-nowrap"
                        data-phone-reveal
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.phone?.trim() ? (
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedPhonePortalId((prev) =>
                                prev === r.portalId ? null : r.portalId,
                              )
                            }
                            className="rounded tabular-nums transition hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500"
                            title={
                              revealedPhonePortalId === r.portalId ? '번호 숨기기' : '번호 보기'
                            }
                          >
                            {revealedPhonePortalId === r.portalId
                              ? formatPhoneDisplayOr(r.phone)
                              : formatPhoneMaskedDisplay(r.phone)}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-cyan-300 align-top whitespace-nowrap">
                        {formatAccessCodeDisplay(r.myCode)}
                      </td>
                      <td
                        className={`px-3 py-2 align-top whitespace-nowrap ${notify.className}`}
                        title={notify.title}
                      >
                        {notify.text}
                      </td>
                      <td className={`px-3 py-2 align-top whitespace-nowrap ${summary.className}`}>{summary.text}</td>
                    </tr>
                    {isOpen ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="p-0 border-b border-slate-700/60 bg-slate-900/20"
                          aria-hidden="true"
                        />
                        <td
                          colSpan={8}
                          className="px-3 py-3 pb-4 border-b border-slate-700/60 bg-slate-900/20 align-top"
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
                                <thead>
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
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/80 px-4 py-3">
              <p className="text-xs text-slate-500">
                선택 <span className="text-slate-300 tabular-nums">{selected.size}</span>명 · 전체{' '}
                {displayData.recipients.length}명
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden text-xs text-slate-500 sm:inline">내보내기·관리</span>
                <button
                  type="button"
                  onClick={handleDownloadSelected}
                  disabled={selected.size === 0 || deleteLoading || remindLoading || resendLoading}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
                >
                  다운로드 ({selected.size})
                </button>
                <button
                  type="button"
                  onClick={handlePrintSelected}
                  disabled={selected.size === 0 || deleteLoading || remindLoading || resendLoading}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 disabled:opacity-50"
                >
                  인쇄 ({selected.size})
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction('delete')}
                  disabled={deleteLoading || selected.size === 0 || remindLoading || resendLoading}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-700 hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteLoading ? '삭제 중…' : `삭제 (${selected.size})`}
                </button>
                <Link
                  href={`/counselor/assessments/deleted-recipients?assessmentId=${encodeURIComponent(assessmentId)}`}
                  className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-200 hover:bg-slate-600 inline-flex items-center"
                >
                  삭제된 목록
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {dispatchProgress ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispatch-progress-title"
          aria-busy="true"
        >
          <div className="bg-slate-800 rounded-xl border border-slate-600 max-w-md w-full p-6 shadow-xl text-center">
            <div
              className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-slate-600 border-t-cyan-400 animate-spin"
              aria-hidden="true"
            />
            <h3 id="dispatch-progress-title" className="text-lg font-semibold text-white">
              발송 진행 중…
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              {dispatchProgress.kind === 'remind'
                ? `미실시 알림 ${dispatchProgress.count}명에게 발송하고 있습니다.`
                : dispatchProgress.kind === 'delete'
                  ? `선택 ${dispatchProgress.count}명을 삭제 처리하고 있습니다.`
                  : `${credentialSendModeLabel(credentialSendMode)} ${dispatchProgress.count}명을 처리하고 있습니다.`}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {dispatchProgress.kind === 'delete'
                ? '잠시만 기다려 주세요.'
                : '이메일·SMS 발송 중입니다. 잠시만 기다려 주세요.'}
            </p>
          </div>
        </div>
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
            <p className="mt-2 text-sm text-slate-300">
              {dispatchComplete.error
                ? dispatchComplete.summary
                : dispatchComplete.kind === 'delete'
                  ? '선택한 검사자가 삭제 목록으로 이동했습니다.'
                  : '발송이 완료되었습니다.'}
            </p>
            {!dispatchComplete.error ? (
              <p className="mt-2 text-xs text-slate-400">{dispatchComplete.summary}</p>
            ) : null}
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
                    ? '선택한 검사자를 발송·검사 현황에서 제거합니다. 삭제된 목록에서 복구할 수 있습니다.'
                    : credentialSendMode === 'initial'
                      ? '선택한 내담자에게 접속 정보를 발송합니다. 비밀번호가 새로 발급됩니다.'
                      : credentialSendMode === 'resend'
                        ? '아래 내용으로 접속 정보를 재발송합니다. 비밀번호가 새로 발급됩니다.'
                        : '선택 내담자 중 최초 발송·재발송이 함께 포함됩니다. 비밀번호가 새로 발급됩니다.'}
              </p>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
              <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-3 space-y-1">
                <p>
                  <span className="text-slate-500">검사코드 </span>
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
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
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
                  <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-3 text-slate-300">
                    <p className="text-amber-200 font-medium mb-2">발송 내용 (이메일/SMS)</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                      <li>제목: [WizCoCo] 미실시 알림 (수신자 이름)</li>
                      <li>검사명, 진행 현황, 미완료 검사 목록</li>
                      <li>
                        검사코드 {formatAccessCodeDisplay(displayData.joinAccessCode)}, 나의코드(개인별)
                      </li>
                      <li>검사시작 URL: {loginUrl}</li>
                      <li>바로 시작 매직링크 (72시간 유효, 개인별 발급)</li>
                    </ul>
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
                    삭제 후에도 검사 결과 데이터는 보관될 수 있습니다. 내담자는 내 검사실 로그인이
                    제한됩니다. 「삭제된 목록」에서 복구할 수 있습니다.
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-slate-300 font-medium mb-2">
                      발송 대상 {resendEligibleSelected.length}명
                      {resendSkippedSelected.length > 0
                        ? ` · 제외 ${resendSkippedSelected.length}명(연락처 없음)`
                        : ''}
                    </p>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {resendEligibleSelected.map((r) => (
                        <li
                          key={r.portalId}
                          className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2"
                        >
                          <RecipientTargetLine recipient={r} />
                        </li>
                      ))}
                    </ul>
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
                  (confirmAction === 'resend' && resendEligibleSelected.length === 0) ||
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

      {showAddRecipient ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !addLoading && setShowAddRecipient(false)}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 max-w-lg w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white">내담자 추가</h3>
              <p className="text-sm text-slate-400 mt-1">
                이 검사코드에 새 내담자를 등록합니다. 나의코드·비밀번호가 자동 발급됩니다.
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="add-recipient-name" className={FORM_LABEL}>
                  이름 <span className="text-red-400">*</span>
                </label>
                <input
                  id="add-recipient-name"
                  type="text"
                  className={FORM_INPUT}
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  disabled={addLoading}
                />
              </div>
              <div>
                <label htmlFor="add-recipient-email" className={FORM_LABEL}>
                  이메일
                </label>
                <input
                  id="add-recipient-email"
                  type="email"
                  className={FORM_INPUT}
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  disabled={addLoading}
                />
              </div>
              <div>
                <label htmlFor="add-recipient-phone" className={FORM_LABEL}>
                  휴대폰
                </label>
                <input
                  id="add-recipient-phone"
                  type="tel"
                  className={FORM_INPUT}
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  disabled={addLoading}
                  placeholder="010-0000-0000"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={addSendNow}
                  onChange={(e) => setAddSendNow(e.target.checked)}
                  disabled={addLoading}
                  className="rounded text-sky-500"
                />
                추가 후 즉시 접속 정보 발송
              </label>
              {addError ? (
                <p className="text-red-400 text-sm" role="alert">
                  {addError}
                </p>
              ) : null}
            </div>
            <div className="px-4 py-3 border-t border-slate-600 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddRecipient(false)}
                disabled={addLoading}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleAddRecipient()}
                disabled={addLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {addLoading ? '추가 중…' : addSendNow ? '추가 후 발송' : '추가만'}
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
              {detailLoading && <p className="text-slate-400">불러오는 중…</p>}
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
    </section>
  );
}
