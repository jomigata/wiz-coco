'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pushWithAuthSession } from '@/utils/authSessionLifecycle';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import {
  bulkCreateClientPortals,
  fetchBulkPortalJob,
  fetchBulkPortalJobResult,
} from '@/lib/clientPortalApi';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import type { BulkPortalJobStatus, ClientPortalBulkRow } from '@/types/clientPortal';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  prependCounselorAssessmentToListCache,
  type CounselorAssessment,
} from '@/lib/assessmentApi';
import {
  GROUP_RECIPIENT_MAX,
  GROUP_BULK_ASYNC_THRESHOLD,
  GROUP_NOTIFY_WARN_THRESHOLD,
} from '@/lib/groupRecipientLimits';
import {
  downloadGroupRecipientSampleCsv,
  downloadGroupRecipientSampleTxt,
  getGroupRecipientSamplePreviewText,
} from '@/lib/groupRecipientSampleDownload';
import { formatPhoneDisplay, normalizeRecipientPhone } from '@/lib/phoneFormat';
import {
  formatRecipientRowsPreview,
  mergeRecipients,
  parseRecipientFile,
  type RecipientRow,
} from '@/lib/recipientImport';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import WelcomeMessageSamplePicker from '@/components/counselor/WelcomeMessageSamplePicker';
import { COUNSELING_CODE_TYPES, type CounselingCodeType } from '@/data/counselingCodeTypes';

type IssueIntent = 'excel' | 'send_all' | 'goto_dispatch';
type TestSortKey = 'no' | 'name';
type SortDirection = 'asc' | 'desc';

function TestSortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: TestSortKey;
  activeKey: TestSortKey;
  direction: SortDirection;
  onSort: (key: TestSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold transition-colors hover:text-sky-200 ${active ? 'text-sky-300' : 'text-slate-400'} ${className}`}
    >
      {label}
      <span className="text-[10px] opacity-80" aria-hidden>
        {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </button>
  );
}

const EMPTY_ROW: RecipientRow = { displayName: '', email: '', phone: '' };

const FORM_INPUT =
  'w-full rounded-lg border border-white/15 bg-[#121f38]/95 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/35 focus:border-sky-400/55 disabled:cursor-not-allowed disabled:opacity-55';
const FORM_LABEL = 'mb-1.5 block text-sm font-semibold text-slate-200';
const FORM_HINT = 'text-sm text-slate-300 leading-relaxed';
/** 포함할 검사 목록 스크롤 영역 */
const TEST_PICKER_SCROLL =
  'max-h-[14rem] overflow-y-auto overscroll-y-contain rounded-lg border border-white/12 bg-[#121f38]/75 p-3';

function recipientGridClass(): string {
  return 'grid grid-cols-[minmax(5.5rem,1fr)_minmax(7rem,1.2fr)_minmax(6.5rem,1fr)_3rem] items-center gap-x-2 gap-y-1';
}

function recipientHeaderClass(): string {
  return `${recipientGridClass()} shrink-0 border-b border-white/10 pb-2 text-sm font-semibold text-sky-200/90`;
}

export default function IndividualAssessmentCreateForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usageEndDateRef = useRef<HTMLInputElement>(null);
  const cohortNameRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const recipientNameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingIntentRef = useRef<IssueIntent | null>(null);
  const { user, authPending, showLoginRequired } = useAuthResolved();

  const [cohortName, setCohortName] = useState('');
  const [codeCategory, setCodeCategory] = useState<CounselingCodeType>('group');
  const [title, setTitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [usageEndDate, setUsageEndDate] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [manualRows, setManualRows] = useState<RecipientRow[]>([{ ...EMPTY_ROW }]);
  const [fileRows, setFileRows] = useState<RecipientRow[]>([]);
  const [fileLabel, setFileLabel] = useState('');
  const [filePreviewText, setFilePreviewText] = useState('');
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [samplePreviewKind, setSamplePreviewKind] = useState<'txt' | 'csv' | null>(null);
  const [loadingIntent, setLoadingIntent] = useState<IssueIntent | null>(null);
  const [error, setError] = useState('');
  const [validationField, setValidationField] = useState<
    'cohortName' | 'title' | 'recipients' | 'tests' | null
  >(null);
  const [created, setCreated] = useState<ClientPortalBulkRow[]>([]);
  const [sharedJoinCode, setSharedJoinCode] = useState('');
  const [notifySent, setNotifySent] = useState(0);
  const [notifyFailed, setNotifyFailed] = useState(0);
  const [notifyQueued, setNotifyQueued] = useState(0);
  const [scheduledAtIso, setScheduledAtIso] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<BulkPortalJobStatus | null>(null);
  const [lastCreatedAssessmentId, setLastCreatedAssessmentId] = useState('');
  const [lastIssueIntent, setLastIssueIntent] = useState<IssueIntent>('excel');
  const [testSortKey, setTestSortKey] = useState<TestSortKey>('no');
  const [testSortDir, setTestSortDir] = useState<SortDirection>('asc');
  const [testSearchQuery, setTestSearchQuery] = useState('');

  const loading = loadingIntent !== null;

  const toggleTestSort = (key: TestSortKey) => {
    if (testSortKey === key) {
      setTestSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTestSortKey(key);
      setTestSortDir('asc');
    }
  };

  const sortedTests = useMemo(() => {
    const list = counselorAssessmentTestOptions.map((t, index) => ({
      ...t,
      no: index + 1,
    }));
    const mult = testSortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (testSortKey === 'no') return mult * (a.no - b.no);
      return mult * a.name.localeCompare(b.name, 'ko');
    });
  }, [testSortKey, testSortDir]);

  const filteredTests = useMemo(() => {
    const q = testSearchQuery.trim().toLowerCase();
    if (!q) return sortedTests;
    return sortedTests.filter((t) => t.name.toLowerCase().includes(q));
  }, [sortedTests, testSearchQuery]);

  const focusValidationField = useCallback(
    (field: 'cohortName' | 'title' | 'recipients' | 'tests') => {
      setValidationField(field);
      window.setTimeout(() => {
        if (field === 'cohortName') {
          cohortNameRef.current?.focus();
          cohortNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (field === 'title') {
          titleRef.current?.focus();
          titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (field === 'recipients') {
          recipientNameRefs.current[0]?.focus();
          recipientNameRefs.current[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    },
    [],
  );

  const showValidationError = useCallback(
    (message: string, field?: 'cohortName' | 'title' | 'recipients' | 'tests') => {
      setError(message);
      if (field) focusValidationField(field);
      else setValidationField(null);
    },
    [focusValidationField],
  );

  const filePreviewLayout = useMemo(() => {
    if (!filePreviewText) return null;
    const lines = filePreviewText.split('\n');
    const lineCount = lines.length;
    const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const widthCh = Math.min(Math.max(longestLine + 2, 28), 120);
    return { widthCh, lineCount };
  }, [filePreviewText]);

  const samplePreviewText = useMemo(
    () => (samplePreviewKind ? getGroupRecipientSamplePreviewText() : ''),
    [samplePreviewKind],
  );

  const samplePreviewLayout = useMemo(() => {
    if (!samplePreviewText) return null;
    const lines = samplePreviewText.split('\n');
    const lineCount = lines.length;
    const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const widthCh = Math.min(Math.max(longestLine + 2, 32), 120);
    const heightRem = Math.max(lineCount * 1.35 + 2.5, 8);
    return { widthCh, lineCount, heightRem };
  }, [samplePreviewText]);

  useEffect(() => {
    if (!activeJobId) return undefined;
    let cancelled = false;

    const poll = async () => {
      try {
        const status = await fetchBulkPortalJob(activeJobId);
        if (cancelled) return;
        setJobProgress(status);
        setSharedJoinCode(status.joinAccessCode || '');
        setNotifyQueued(status.notifyQueued);

        if (status.status === 'completed') {
          const full = await fetchBulkPortalJobResult(activeJobId);
          if (cancelled) return;
          const assessmentId = full.assessmentId || lastCreatedAssessmentId || '';
          const intent = pendingIntentRef.current;
          pendingIntentRef.current = null;

          if (intent === 'goto_dispatch' && assessmentId) {
            pushWithAuthSession(
              router,
              `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`
            );
            setActiveJobId(null);
            setJobProgress(null);
            setLoadingIntent(null);
            return;
          }

          setCreated(full.created || []);
          setNotifyQueued(full.notifyQueued);
          setSharedJoinCode(full.joinAccessCode || '');
          setScheduledAtIso(full.scheduledAt ?? null);
          setLastCreatedAssessmentId(assessmentId);
          setActiveJobId(null);
          setJobProgress(null);
          setLoadingIntent(null);
        } else if (status.status === 'failed') {
          setError(status.error || '대량 발급 작업이 실패했습니다.');
          setActiveJobId(null);
          setJobProgress(null);
          pendingIntentRef.current = null;
          setLoadingIntent(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '작업 상태 조회에 실패했습니다.');
          setActiveJobId(null);
          setJobProgress(null);
          pendingIntentRef.current = null;
          setLoadingIntent(null);
        }
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeJobId, lastCreatedAssessmentId, router]);

  const navigateToDispatch = useCallback(
    (assessmentId: string) => {
      pushWithAuthSession(
        router,
        `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`
      );
    },
    [router]
  );

  const recipients = useMemo(
    () => mergeRecipients(manualRows, fileRows),
    [manualRows, fileRows]
  );

  const canIssue =
    Boolean(user) &&
    !authPending &&
    !loading &&
    !activeJobId &&
    recipients.length <= GROUP_RECIPIENT_MAX;

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el || loading) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  };

  const toggleTest = (testId: string) => {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  const filteredTestIds = useMemo(() => filteredTests.map((t) => t.testId), [filteredTests]);

  const allFilteredSelected =
    filteredTestIds.length > 0 && filteredTestIds.every((id) => selectedTestIds.has(id));
  const someFilteredSelected =
    filteredTestIds.some((id) => selectedTestIds.has(id)) && !allFilteredSelected;

  const toggleSelectAllFiltered = () => {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredTestIds.forEach((id) => next.delete(id));
      } else {
        filteredTestIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const updateRow = (index: number, field: keyof RecipientRow, value: string) => {
    setManualRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = (focusNewRow = false) => {
    setManualRows((prev) => {
      const next = [...prev, { ...EMPTY_ROW }];
      if (focusNewRow) {
        const newIdx = next.length - 1;
        setTimeout(() => recipientNameRefs.current[newIdx]?.focus(), 0);
      }
      return next;
    });
  };

  const handleRecipientFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || loading) return;
    e.preventDefault();
    addRow(true);
  };

  const removeRow = (index: number) => {
    setManualRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLabel(file.name);
    setShowFilePreview(false);
    try {
      const parsed = await parseRecipientFile(file);
      setFileRows(parsed);
      setFilePreviewText(formatRecipientRowsPreview(parsed));
    } catch {
      setError('파일을 읽지 못했습니다. CSV·텍스트·엑셀 형식을 확인해 주세요.');
      setFileRows([]);
      setFilePreviewText('');
    }
  };

  const handleIssue = async (intent: IssueIntent) => {
    setError('');
    setValidationField(null);
    setCreated([]);
    setSharedJoinCode('');

    if (!cohortName.trim()) {
      showValidationError('기관/단체/그룹명을 입력해 주세요.', 'cohortName');
      return;
    }
    if (!codeCategory) {
      showValidationError('상담유형을 선택해 주세요.', 'cohortName');
      return;
    }
    if (!title.trim()) {
      showValidationError('안내 제목을 입력해 주세요.', 'title');
      return;
    }
    if (recipients.length === 0) {
      showValidationError(
        '내담자 1명 이상(이름·이메일 또는 휴대폰)을 입력하거나 파일을 첨부해 주세요.',
        'recipients',
      );
      return;
    }
    if (recipients.length > GROUP_RECIPIENT_MAX) {
      showValidationError(`한 번에 최대 ${GROUP_RECIPIENT_MAX.toLocaleString('ko-KR')}명까지 발급할 수 있습니다.`);
      return;
    }
    const invalid = recipients.find((r) => !r.email.trim() && !r.phone.trim());
    if (invalid) {
      showValidationError(`「${invalid.displayName}」님의 이메일 또는 휴대폰 번호가 필요합니다.`, 'recipients');
      return;
    }
    const testList = counselorAssessmentTestOptions
      .filter((t) => selectedTestIds.has(t.testId))
      .map((t) => ({ testId: t.testId, name: t.name }));
    if (testList.length === 0) {
      showValidationError('포함할 검사를 1개 이상 선택해 주세요.', 'tests');
      return;
    }

    const willNotify = intent === 'send_all';
    pendingIntentRef.current = intent;
    setLastIssueIntent(intent);
    setLoadingIntent(intent);
    try {
      const result = await bulkCreateClientPortals({
        cohortName: cohortName.trim().slice(0, 120),
        title: (title.trim() || cohortName.trim() || '검사').slice(0, 200),
        welcomeMessage: welcomeMessage.trim(),
        usageEndDate: usageEndDate.trim(),
        testList,
        codeCategory,
        rows: recipients.map((r) => ({
          displayName: r.displayName.trim(),
          email: r.email.trim() || undefined,
          phone: normalizeRecipientPhone(r.phone) || undefined,
          queueNotify: willNotify,
        })),
        queueNotify: willNotify,
      });

      const assessmentId = result.assessmentId || '';

      if (result.async && result.jobId) {
        setActiveJobId(result.jobId);
        setJobProgress({
          jobId: result.jobId,
          status: (result as BulkPortalJobStatus).status || 'pending',
          totalRows: (result as BulkPortalJobStatus).totalRows || recipients.length,
          processedRows: (result as BulkPortalJobStatus).processedRows || 0,
          createdCount: (result as BulkPortalJobStatus).createdCount || 0,
          notifyQueued: result.notifyQueued,
          progressPct: (result as BulkPortalJobStatus).progressPct || 0,
          cohortId: result.cohortId,
          cohortName: result.cohortName,
          joinAccessCode: result.joinAccessCode,
          scheduledAt: result.scheduledAt,
        });
        setSharedJoinCode(result.joinAccessCode || '');
        setNotifyQueued(result.notifyQueued);
        setScheduledAtIso(result.scheduledAt ?? null);
        setLastCreatedAssessmentId(assessmentId);
        setLoadingIntent(null);
        return;
      }

      if (intent === 'goto_dispatch') {
        pendingIntentRef.current = null;
        if (assessmentId) {
          navigateToDispatch(assessmentId);
          return;
        }
        setError('진행현황으로 이동할 검사 ID를 받지 못했습니다. 발송목록에서 확인해 주세요.');
      }

      setCreated(result.created || []);
      setLastCreatedAssessmentId(assessmentId);
      setSharedJoinCode(result.joinAccessCode || result.created?.[0]?.joinAccessCode || '');
      setNotifySent(result.notifySent ?? 0);
      setNotifyFailed(result.notifyFailed ?? 0);
      setNotifyQueued(result.notifyQueued);
      setScheduledAtIso(result.scheduledAt ?? null);
      pendingIntentRef.current = null;
    } catch (err) {
      pendingIntentRef.current = null;
      setError(err instanceof Error ? err.message : '상담코드 발급에 실패했습니다.');
    } finally {
      setLoadingIntent(null);
    }
  };

  const confirmIssueCompleteAndGoToList = useCallback(() => {
    const assessmentId = lastCreatedAssessmentId.trim();
    const accessCode = sharedJoinCode.trim();
    const testList = counselorAssessmentTestOptions
      .filter((t) => selectedTestIds.has(t.testId))
      .map((t) => ({ testId: t.testId, name: t.name }));

    if (assessmentId && accessCode) {
      const optimistic: CounselorAssessment = {
        id: assessmentId,
        accessCode,
        counselorId: user?.uid || '',
        title: (title.trim() || cohortName.trim() || '검사').slice(0, 200),
        issueType: 'individual',
        targetAudience: '그룹',
        welcomeMessage: welcomeMessage.trim(),
        usageEndDate: usageEndDate.trim() || undefined,
        testList,
        createdAt: new Date().toISOString(),
        cohortName: cohortName.trim() || undefined,
        codeCategory,
        dispatchSentCount: 0,
        dispatchFailedCount: 0,
        testCompleteCount: 0,
        testIncompleteCount: created.length,
      };
      prependCounselorAssessmentToListCache(optimistic);
      try {
        sessionStorage.setItem(
          'wizcoco_created_assessment',
          JSON.stringify({
            assessmentId,
            accessCode,
            cohortName: cohortName.trim() || undefined,
            title: (title.trim() || cohortName.trim() || '검사').slice(0, 200),
          }),
        );
      } catch {
        // ignore
      }
    }

    const href = assessmentId
      ? `/counselor/assessments?created=${encodeURIComponent(assessmentId)}`
      : '/counselor/assessments';
    pushWithAuthSession(router, href);
  }, [
    cohortName,
    created.length,
    lastCreatedAssessmentId,
    router,
    selectedTestIds,
    sharedJoinCode,
    title,
    usageEndDate,
    user?.uid,
    welcomeMessage,
  ]);

  if (authPending) {
    return <AuthLoadingState className="py-8" message="로그인 정보를 불러오는 중…" />;
  }
  if (showLoginRequired) {
    return (
      <AuthRequiredState
        className="max-w-2xl"
        description="Firebase에 로그인한 상태에서 다시 시도해 주세요."
      />
    );
  }

  if (activeJobId && jobProgress) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="rounded-lg border border-blue-500/40 bg-blue-950/30 p-5 text-blue-100">
          <p className="font-medium">상담코드 대량 발급 진행 중…</p>
          <p className="mt-2 text-sm text-blue-200/90">
            {jobProgress.processedRows.toLocaleString('ko-KR')} /{' '}
            {jobProgress.totalRows.toLocaleString('ko-KR')}명 처리됨 ({jobProgress.progressPct}%)
          </p>
          <div className="mt-4 h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, jobProgress.progressPct)}%` }}
            />
          </div>
          {sharedJoinCode ? (
            <p className="mt-3 text-sm">
              적용 상담코드:{' '}
              <span className="font-mono font-semibold">{formatAccessCodeDisplay(sharedJoinCode)}</span>
            </p>
          ) : null}
          <p className="mt-2 text-xs text-blue-200/70">
            이 화면을 닫지 마세요. {GROUP_BULK_ASYNC_THRESHOLD}명 초과 발급은 백그라운드에서 배치 처리됩니다.
            알림은 발급 완료 후 큐를 통해 순차 발송됩니다.
          </p>
        </div>
      </div>
    );
  }

  if (created.length > 0) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-complete-title"
      >
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15">
          <div className="border-b border-emerald-500/25 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 px-6 py-5">
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
                aria-hidden
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 id="issue-complete-title" className="text-xl font-semibold text-white">
                  발급 완료
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  상담코드와 나의코드·비밀번호가 정상적으로 생성되었습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                발급 인원
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-200">
                {created.length.toLocaleString('ko-KR')}
                <span className="ml-1 text-base font-medium text-slate-400">명</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                각 내담자에게 나의코드·비밀번호가 발급되었습니다.
              </p>
            </div>

            {sharedJoinCode ? (
              <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/8 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  적용 상담코드
                </p>
                <p className="mt-1.5 font-mono text-2xl font-bold tracking-wider text-cyan-300">
                  {formatAccessCodeDisplay(sharedJoinCode)}
                </p>
              </div>
            ) : null}

            {(notifySent > 0 || notifyFailed > 0 || notifyQueued > 0) ? (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm text-slate-300">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">발송 현황</p>
                <div className="mt-2 space-y-1">
                  {(notifySent > 0 || notifyQueued > 0) ? (
                    <p>
                      {notifySent > 0 ? (
                        <>
                          즉시 발송 완료{' '}
                          <span className="font-semibold text-emerald-300 tabular-nums">{notifySent}</span>건
                        </>
                      ) : null}
                      {notifySent > 0 && notifyQueued > 0 ? (
                        <span className="text-slate-500"> / </span>
                      ) : null}
                      {notifyQueued > 0 ? (
                        <>
                          발송중{' '}
                          <span className="font-semibold text-sky-300 tabular-nums">{notifyQueued}</span>건
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  {notifyFailed > 0 ? (
                    <p>
                      발송 실패{' '}
                      <span className="font-semibold text-red-300 tabular-nums">{notifyFailed}</span>건
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-white/[0.06] bg-black/20 px-6 py-4">
            <button
              type="button"
              onClick={confirmIssueCompleteAndGoToList}
              className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-500"
            >
              상담코드 목록으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recipientCountLabel = `${recipients.length || 0}명`;
  const selectedTestCount = selectedTestIds.size;

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(18rem,22rem)] xl:items-start">
        <CounselorPageSection
          title="검사 정보"
          className="!overflow-visible flex min-h-0 flex-col xl:col-start-1 xl:row-start-1 xl:min-h-[28rem]"
          bodyClassName="min-h-0 overflow-visible"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={FORM_LABEL}>
                  기관/단체/그룹명 <span className="text-red-400">*</span>
                </label>
                <input
                  ref={cohortNameRef}
                  type="text"
                  required
                  maxLength={120}
                  className={`${FORM_INPUT}${validationField === 'cohortName' ? ' ring-2 ring-amber-400/70 border-amber-400/60' : ''}`}
                  placeholder="예: 2025 OO고 3학년"
                  value={cohortName}
                  onChange={(e) => {
                    setCohortName(e.target.value);
                    if (validationField === 'cohortName') setValidationField(null);
                  }}
                  disabled={loading}
                />
              </div>
              <div>
                <label className={FORM_LABEL}>
                  안내 제목 <span className="text-red-400">*</span>
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  required
                  maxLength={200}
                  className={`${FORM_INPUT}${validationField === 'title' ? ' ring-2 ring-amber-400/70 border-amber-400/60' : ''}`}
                  placeholder="예: 개인 심리검사"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (validationField === 'title') setValidationField(null);
                  }}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="usage-end-date" className={FORM_LABEL}>
                  사용종료일 (선택)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => openDatePicker(usageEndDateRef)}
                    disabled={loading}
                    className="absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center rounded-l-lg border-r border-white/10 text-sky-400 transition hover:bg-sky-500/10 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="사용종료일 달력 열기"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M6 2.5V5M14 2.5V5M3.5 8h13M5 4.5h10a1.1 1.1 0 011.1 1.1v10.4A1.1 1.1 0 0115 17.1H5a1.1 1.1 0 01-1.1-1.1V5.6A1.1 1.1 0 015 4.5z"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <input
                    id="usage-end-date"
                    ref={usageEndDateRef}
                    type="date"
                    className={`${FORM_INPUT} py-2.5 pl-11 pr-2 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden`}
                    value={usageEndDate}
                    onChange={(e) => setUsageEndDate(e.target.value)}
                    onClick={() => openDatePicker(usageEndDateRef)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className={FORM_LABEL}>
                상담유형 <span className="text-red-400">*</span>
              </label>
              <select
                className={FORM_INPUT}
                value={codeCategory}
                onChange={(e) => setCodeCategory(e.target.value as CounselingCodeType)}
                disabled={loading}
              >
                {COUNSELING_CODE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label} — {t.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div>
                <label className={`${FORM_LABEL} mb-2 block`}>안내 메시지 (선택)</label>
                <WelcomeMessageSamplePicker
                  disabled={loading}
                  onPick={(text) => setWelcomeMessage(text)}
                />
                <textarea
                  rows={4}
                  className={`${FORM_INPUT} mt-2 min-h-[5.5rem] max-h-[5.5rem] resize-none overflow-y-auto text-sm leading-relaxed`}
                  placeholder="내담자에게 보여줄 안내 문구"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <div className="mb-2 flex w-full flex-wrap items-center gap-y-2">
                  <label className={`${FORM_LABEL} shrink-0 whitespace-nowrap`}>
                    포함할 검사 <span className="text-red-400">*</span>
                  </label>
                  <div className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-0">
                    <div
                      className="hidden shrink-0 sm:block"
                      style={{ width: 'clamp(0.75rem, 5vw, 20ch)' }}
                      aria-hidden
                    />
                    <div className="relative min-w-0 flex-1">
                      <svg
                        className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sky-400/80"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <input
                        type="text"
                        value={testSearchQuery}
                        onChange={(e) => setTestSearchQuery(e.target.value)}
                        placeholder="검사명 찾기"
                        disabled={loading}
                        className="w-full rounded-lg border border-sky-400/35 bg-[#0a1528] py-2 pl-7 pr-7 text-sm font-medium text-white caret-sky-300 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-50"
                        aria-label="검사명 찾기"
                      />
                      {testSearchQuery ? (
                        <button
                          type="button"
                          onClick={() => setTestSearchQuery('')}
                          disabled={loading}
                          className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                          aria-label="검색어 지우기"
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-0.5 text-sm text-slate-400">
                      {selectedTestCount}개 선택
                    </span>
                  </div>
                </div>
                <div className={`${TEST_PICKER_SCROLL} flex flex-col`}>
                  <div className="grid shrink-0 grid-cols-[2.75rem_1.75rem_minmax(0,1fr)] items-center gap-2 border-b border-white/[0.08] px-1 pb-2">
                    <TestSortHeader
                      label="No."
                      sortKey="no"
                      activeKey={testSortKey}
                      direction={testSortDir}
                      onSort={toggleTestSort}
                      className="text-slate-300"
                    />
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someFilteredSelected;
                      }}
                      onChange={toggleSelectAllFiltered}
                      disabled={loading || filteredTests.length === 0}
                      className="shrink-0 rounded accent-sky-500"
                      aria-label="표시된 검사 전체 선택 또는 해제"
                      title="전체 선택/해제"
                    />
                    <TestSortHeader
                      label="검사명"
                      sortKey="name"
                      activeKey={testSortKey}
                      direction={testSortDir}
                      onSort={toggleTestSort}
                      className="justify-start"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 pt-2">
                    {filteredTests.length === 0 ? (
                      <p className="col-span-full px-2 py-3 text-sm text-slate-500">
                        {testSearchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 검사가 없습니다.'}
                      </p>
                    ) : null}
                    {filteredTests.map((t) => {
                      const checked = selectedTestIds.has(t.testId);
                      return (
                        <label
                          key={t.testId}
                          title={t.name}
                          className={`grid cursor-pointer grid-cols-[2.75rem_1.75rem_minmax(0,1fr)] items-start gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-white/5 ${checked ? 'text-sky-100' : 'text-slate-300'}`}
                        >
                          <span className="pt-0.5 tabular-nums text-sm font-semibold text-slate-100">{t.no}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTest(t.testId)}
                            disabled={loading}
                            className="mt-0.5 shrink-0 rounded accent-sky-500"
                          />
                          <span className="min-w-0 break-words leading-snug">{t.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CounselorPageSection>

        <CounselorPageSection
          title="내담자 목록"
          className="!overflow-visible flex min-h-0 flex-col xl:col-start-2 xl:row-start-1 xl:min-h-[28rem]"
          bodyClassName="flex flex-col overflow-visible"
          toolbar={
            recipients.length > 0 ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                  recipients.length > GROUP_RECIPIENT_MAX
                    ? 'bg-red-500/15 text-red-300'
                    : 'bg-emerald-500/15 text-emerald-300'
                }`}
              >
                총 {recipients.length.toLocaleString('ko-KR')}명
              </span>
            ) : null
          }
        >
          <div className="flex flex-col gap-3 overflow-visible">
            <div className={`hidden md:grid ${recipientHeaderClass()}`}>
              <span>이름 *</span>
              <span>이메일</span>
              <span>휴대폰</span>
              <span />
            </div>
            <div className="min-h-[10rem] max-h-[16rem] space-y-2 overflow-y-auto pr-1">
              {manualRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`${recipientGridClass()} rounded-lg border border-white/5 bg-[#101f38]/40 px-2 py-2.5 md:border-0 md:bg-transparent md:px-0 md:py-1`}
                  >
                    <div>
                      <span className="mb-1 block text-xs text-slate-500 md:hidden">이름 *</span>
                      <input
                        ref={(el) => {
                          recipientNameRefs.current[idx] = el;
                        }}
                        placeholder="이름"
                        className={`${FORM_INPUT} py-2.5`}
                        value={row.displayName}
                        onChange={(e) => updateRow(idx, 'displayName', e.target.value)}
                        onKeyDown={handleRecipientFieldKeyDown}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-slate-500 md:hidden">이메일</span>
                      <input
                        placeholder="이메일"
                        type="email"
                        className={`${FORM_INPUT} py-2.5`}
                        value={row.email}
                        onChange={(e) => updateRow(idx, 'email', e.target.value)}
                        onKeyDown={handleRecipientFieldKeyDown}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-slate-500 md:hidden">휴대폰</span>
                      <input
                        placeholder="휴대폰"
                        className={`${FORM_INPUT} py-2.5`}
                        value={row.phone}
                        onChange={(e) => updateRow(idx, 'phone', e.target.value)}
                        onKeyDown={handleRecipientFieldKeyDown}
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="justify-self-end px-1 text-sm text-slate-500 transition hover:text-red-400 disabled:opacity-30"
                      disabled={loading || manualRows.length <= 1}
                      title="행 삭제"
                    >
                      삭제
                    </button>
                  </div>
              ))}
            </div>
            <div className="relative z-20 flex shrink-0 flex-col gap-2 overflow-visible border-t border-white/10 pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                className="relative"
                onMouseLeave={() => setSamplePreviewKind(null)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-white/10 bg-[#101f38]/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800/80"
                    disabled={loading}
                  >
                    텍스트/엑셀 파일 첨부하기
                  </button>
                  <span className="text-sm text-slate-400">샘플받기</span>
                  <button
                    type="button"
                    onClick={downloadGroupRecipientSampleTxt}
                    onMouseEnter={() => setSamplePreviewKind('txt')}
                    onFocus={() => setSamplePreviewKind('txt')}
                    onBlur={() => setSamplePreviewKind(null)}
                    className="text-sm text-sky-300 transition hover:text-sky-200"
                  >
                    (텍스트파일)
                  </button>
                  <button
                    type="button"
                    onClick={downloadGroupRecipientSampleCsv}
                    onMouseEnter={() => setSamplePreviewKind('csv')}
                    onFocus={() => setSamplePreviewKind('csv')}
                    onBlur={() => setSamplePreviewKind(null)}
                    className="text-sm text-sky-300 transition hover:text-sky-200"
                  >
                    (엑셀파일)
                  </button>
                </div>
                {samplePreviewKind && samplePreviewText && samplePreviewLayout ? (
                  <div
                    className="pointer-events-none absolute bottom-full left-0 z-[120] mb-1.5 w-full rounded-lg border border-sky-500/40 bg-slate-950 p-3 text-left shadow-2xl"
                    role="tooltip"
                    style={{
                      width: `min(100%, ${samplePreviewLayout.widthCh}ch)`,
                    }}
                  >
                    <p className="mb-2 text-xs font-semibold text-sky-300">
                      {samplePreviewKind === 'txt' ? '샘플 텍스트 미리보기' : '샘플 엑셀(CSV) 미리보기'}
                    </p>
                    <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-200">
                      {samplePreviewText}
                    </pre>
                  </div>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                첨부파일은 1개만 가능합니다. 최대 {GROUP_RECIPIENT_MAX.toLocaleString('ko-KR')}명
              </p>
              {fileLabel ? (
                <div
                  className="rounded-lg border border-sky-500/25 bg-sky-950/25 px-3 py-2.5"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-xs font-medium text-sky-300/90">첨부된 파일</p>
                  <div className="relative mt-1 max-w-full">
                    <p
                      className="inline cursor-help break-all text-sm font-medium leading-snug text-white underline decoration-dotted decoration-sky-400/60 underline-offset-4"
                      onMouseEnter={() => setShowFilePreview(true)}
                      onMouseLeave={() => setShowFilePreview(false)}
                      onFocus={() => setShowFilePreview(true)}
                      onBlur={() => setShowFilePreview(false)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${fileLabel} 파일 내용 미리보기`}
                    >
                      {fileLabel}
                    </p>
                    {showFilePreview && filePreviewText && filePreviewLayout ? (
                      <div
                        className="pointer-events-none absolute bottom-full left-0 z-[120] mb-2 w-max max-w-full rounded-lg border border-sky-500/40 bg-slate-950 p-3 text-left shadow-2xl"
                        role="tooltip"
                        style={{
                          width: `min(100%, ${filePreviewLayout.widthCh}ch)`,
                        }}
                      >
                        <p className="mb-2 text-xs font-semibold text-sky-300">파일 내용 미리보기</p>
                        <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-200">
                          {filePreviewText}
                          {filePreviewText.length >= 4000 ? '\n… (일부만 표시)' : ''}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    파일에서{' '}
                    <span className="font-semibold tabular-nums text-emerald-300">
                      {fileRows.length.toLocaleString('ko-KR')}
                    </span>
                    명 인식
                    {fileRows.length === 0 ? (
                      <span className="text-amber-300/90"> · 유효한 행이 없습니다</span>
                    ) : null}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => addRow()}
                className="rounded-lg border border-sky-500/35 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
                disabled={loading}
              >
                + 행 추가
              </button>
            </div>
            {recipients.length >= GROUP_NOTIFY_WARN_THRESHOLD ? (
              <p className="shrink-0 text-sm leading-snug text-amber-200/90">
                {GROUP_NOTIFY_WARN_THRESHOLD}명 이상은 「발급만」 또는 「발급 후 선택 발송」을 권장합니다.
              </p>
            ) : null}
          </div>
        </CounselorPageSection>

        <CounselorPageSection
          title="발급 · 발송"
          className="!overflow-visible flex min-h-0 flex-col xl:col-start-3 xl:row-start-1 xl:min-h-[20rem] xl:self-stretch"
          bodyClassName="flex min-h-0 flex-1 flex-col overflow-visible"
        >
          {error ? (
            <div
              className="mb-3 shrink-0 rounded-xl border-2 border-amber-400/50 bg-amber-950/40 px-4 py-3 shadow-lg shadow-amber-950/30"
              role="alert"
            >
              <p className="text-sm font-semibold text-amber-100">{error}</p>
              <p className="mt-1 text-xs text-amber-200/80">
                {validationField === 'cohortName' || validationField === 'title'
                  ? '왼쪽 검사 정보 영역의 입력란을 확인해 주세요.'
                  : validationField === 'recipients'
                    ? '내담자 목록에 정보를 입력하거나 파일을 첨부해 주세요.'
                    : validationField === 'tests'
                      ? '포함할 검사를 1개 이상 선택해 주세요.'
                      : '빈 항목을 채운 뒤 다시 시도해 주세요.'}
              </p>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5 px-1 pb-2 pt-4">
            <button
              type="button"
              onClick={() => void handleIssue('send_all')}
              disabled={!canIssue}
              className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 text-left shadow-lg shadow-sky-900/30 transition hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:shadow-none"
            >
              <span className="block text-base font-bold text-white">
                {loadingIntent === 'send_all' ? '발급·발송 중…' : `${recipientCountLabel} 즉시 전체 발송`}
              </span>
              <span className="mt-0.5 block text-sm text-sky-100/80">
                발급 후 모든 내담자에게 이메일·문자 즉시 발송
              </span>
            </button>
            <button
              type="button"
              onClick={() => void handleIssue('excel')}
              disabled={!canIssue}
              className="w-full rounded-xl border border-white/15 bg-slate-800/80 px-4 py-3 text-left transition hover:bg-slate-700/80 disabled:opacity-50"
            >
              <span className="block text-base font-bold text-white">
                {loadingIntent === 'excel' ? '저장 중…' : `${recipientCountLabel} 엑셀(Excel) 저장하기`}
              </span>
              <span className="mt-0.5 block text-sm text-slate-400">
                발송 없이 Excel로 코드·비밀번호 저장
              </span>
            </button>
          </div>

          <div className="shrink-0 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => pushWithAuthSession(router, '/counselor/assessments')}
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-base text-slate-300 transition hover:bg-slate-800/70"
            >
              취소
            </button>
          </div>
        </CounselorPageSection>
      </div>

      {loadingIntent && !activeJobId ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="issue-progress-title"
        >
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-sky-500/35 bg-[#121f38] px-6 py-8 text-center shadow-2xl shadow-black/50">
            <div
              className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-500/30 border-t-sky-400"
              aria-hidden="true"
            />
            <p id="issue-progress-title" className="text-lg font-bold text-white">
              발급 진행 중…
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {loadingIntent === 'excel'
                ? '엑셀 저장을 위해 상담코드를 발급하고 있습니다.'
                : '내담자에게 발급·발송을 처리하고 있습니다.'}
              <br />
              창을 닫지 말고 잠시만 기다려 주세요.
            </p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
