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
import { downloadBulkPortalExcel } from '@/lib/bulkPortalExcelDownload';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import type { BulkPortalJobStatus, ClientPortalBulkRow } from '@/types/clientPortal';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  GROUP_RECIPIENT_MAX,
  GROUP_BULK_ASYNC_THRESHOLD,
  GROUP_NOTIFY_WARN_THRESHOLD,
} from '@/lib/groupRecipientLimits';
import {
  downloadGroupRecipientSampleCsv,
  downloadGroupRecipientSampleTxt,
} from '@/lib/groupRecipientSampleDownload';
import { formatPhoneDisplay, normalizeRecipientPhone } from '@/lib/phoneFormat';
import {
  mergeRecipients,
  parseRecipientFile,
  type RecipientRow,
} from '@/lib/recipientImport';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import WelcomeMessageSamplePicker from '@/components/counselor/WelcomeMessageSamplePicker';

type IssueIntent = 'excel' | 'send_all' | 'goto_dispatch';

const EMPTY_ROW: RecipientRow = { displayName: '', email: '', phone: '' };

const FORM_INPUT =
  'w-full rounded-lg border border-white/10 bg-[#101f38]/90 px-3 py-2.5 text-base text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400/50 disabled:cursor-not-allowed disabled:opacity-55';
const FORM_LABEL = 'mb-1.5 block text-sm font-semibold text-slate-300';
const FORM_HINT = 'text-sm text-slate-400 leading-relaxed';
/** 포함할 검사 목록 스크롤 영역 */
const TEST_PICKER_SCROLL =
  'max-h-[14rem] overflow-y-auto overscroll-y-contain rounded-lg border border-white/10 bg-[#101f38]/60 p-3';

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
  const recipientNameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingIntentRef = useRef<IssueIntent | null>(null);
  const { user, authPending, showLoginRequired } = useAuthResolved();

  const [cohortName, setCohortName] = useState('');
  const [title, setTitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [usageEndDate, setUsageEndDate] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [manualRows, setManualRows] = useState<RecipientRow[]>([{ ...EMPTY_ROW }]);
  const [fileRows, setFileRows] = useState<RecipientRow[]>([]);
  const [fileLabel, setFileLabel] = useState('');
  const [loadingIntent, setLoadingIntent] = useState<IssueIntent | null>(null);
  const [error, setError] = useState('');
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

  const loading = loadingIntent !== null;

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
    try {
      setFileRows(await parseRecipientFile(file));
    } catch {
      setError('파일을 읽지 못했습니다. CSV·텍스트·엑셀 형식을 확인해 주세요.');
      setFileRows([]);
    }
  };

  const handleIssue = async (intent: IssueIntent) => {
    setError('');
    setCreated([]);
    setSharedJoinCode('');

    if (!cohortName.trim()) {
      setError('기관/단체/그룹명을 입력해 주세요.');
      return;
    }
    if (!title.trim()) {
      setError('안내 제목을 입력해 주세요.');
      return;
    }
    if (recipients.length === 0) {
      setError('내담자 1명 이상(이름·이메일 또는 휴대폰)을 입력하거나 파일을 첨부해 주세요.');
      return;
    }
    if (recipients.length > GROUP_RECIPIENT_MAX) {
      setError(`한 번에 최대 ${GROUP_RECIPIENT_MAX.toLocaleString('ko-KR')}명까지 발급할 수 있습니다.`);
      return;
    }
    const invalid = recipients.find((r) => !r.email.trim() && !r.phone.trim());
    if (invalid) {
      setError(`「${invalid.displayName}」님의 이메일 또는 휴대폰 번호가 필요합니다.`);
      return;
    }
    const testList = counselorAssessmentTestOptions
      .filter((t) => selectedTestIds.has(t.testId))
      .map((t) => ({ testId: t.testId, name: t.name }));
    if (testList.length === 0) {
      setError('포함할 검사를 1개 이상 선택해 주세요.');
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
      setError(err instanceof Error ? err.message : '검사코드 발급에 실패했습니다.');
    } finally {
      setLoadingIntent(null);
    }
  };

  const downloadExcel = () => {
    downloadBulkPortalExcel(created, sharedJoinCode);
  };

  const resetForAnotherIssue = () => {
    setCreated([]);
    setSharedJoinCode('');
    setNotifySent(0);
    setNotifyFailed(0);
    setNotifyQueued(0);
    setScheduledAtIso(null);
    setLastCreatedAssessmentId('');
    setLastIssueIntent('excel');
    setError('');
    setManualRows([{ ...EMPTY_ROW }]);
    setFileRows([]);
    setFileLabel('');
    pendingIntentRef.current = null;
  };

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
          <p className="font-medium">검사코드 대량 발급 진행 중…</p>
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
              공통 검사코드:{' '}
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
    const didNotify = lastIssueIntent === 'send_all';
    return (
      <div className="space-y-4">
        <CounselorPageSection title="발급 완료">
          <div className="space-y-4 text-base text-slate-200">
            <p className="font-semibold text-emerald-200">
              {created.length.toLocaleString('ko-KR')}명에게 나의코드·비밀번호가 발급되었습니다.
            </p>
            {sharedJoinCode ? (
              <p>
                공통 검사코드:{' '}
                <span className="font-mono text-lg font-bold tracking-wider text-emerald-100">
                  {formatAccessCodeDisplay(sharedJoinCode)}
                </span>
              </p>
            ) : null}
            {didNotify ? (
              <p className="text-slate-300">
                {lastIssueIntent === 'send_all' ? (
                  <span className="text-sky-200">전체 {created.length}명 · </span>
                ) : null}
                {scheduledAtIso ? (
                  `${notifyQueued}건이 ${new Date(scheduledAtIso).toLocaleString('ko-KR')}에 발송 예약되었습니다.`
                ) : notifySent > 0 ? (
                  <>
                    {notifySent}명에게 즉시 이메일·문자로 발송되었습니다.
                    {notifyFailed > 0 ? ` (${notifyFailed}명 발송 실패 — Excel 저장 후 진행현황에서 재발송)` : null}
                  </>
                ) : notifyQueued > 0 ? (
                  `${notifyQueued}건이 알림 큐에 등록되었습니다. 몇 분 내 이메일·문자로 순차 발송됩니다.`
                ) : (
                  '발송 설정이 없거나 연락처가 없습니다.'
                )}
              </p>
            ) : (
              <p className="text-slate-400">Excel에서 코드·비밀번호를 확인하거나, 아래에서 발송목록으로 이동할 수 있습니다.</p>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={downloadExcel}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-blue-700"
              >
                Excel 다운로드
              </button>
              <button
                type="button"
                onClick={() => pushWithAuthSession(router, '/counselor/assessments')}
                className="rounded-lg border border-white/15 bg-slate-800/80 px-5 py-2.5 text-base font-medium text-slate-200 transition hover:bg-slate-700/80"
              >
                발송목록
              </button>
              {lastCreatedAssessmentId ? (
                <button
                  type="button"
                  onClick={() =>
                    pushWithAuthSession(router, `/counselor/assessments/${lastCreatedAssessmentId}/progress`)
                  }
                  className="rounded-lg border border-sky-500/35 bg-sky-500/10 px-5 py-2.5 text-base font-medium text-sky-200 transition hover:bg-sky-500/20"
                >
                  진행현황
                </button>
              ) : null}
              <button
                type="button"
                onClick={resetForAnotherIssue}
                className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-5 py-2.5 text-base font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              >
                이 페이지에서 계속 발급
              </button>
            </div>
          </div>
        </CounselorPageSection>
      </div>
    );
  }

  const recipientCountLabel = `${recipients.length || 0}명`;
  const selectedTestCount = selectedTestIds.size;

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(18rem,22rem)]">
        <CounselorPageSection title="검사 정보" className="flex min-h-0 flex-col xl:col-start-1 xl:row-start-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={FORM_LABEL}>
                  기관/단체/그룹명 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  className={FORM_INPUT}
                  placeholder="예: 2025 OO고 3학년"
                  value={cohortName}
                  onChange={(e) => setCohortName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className={FORM_LABEL}>
                  안내 제목 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  className={FORM_INPUT}
                  placeholder="예: 개인 심리검사"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div>
                <label className={FORM_LABEL}>안내 메시지 (선택)</label>
                <WelcomeMessageSamplePicker
                  disabled={loading}
                  onPick={(text) => setWelcomeMessage(text)}
                />
                <textarea
                  rows={2}
                  className={`${FORM_INPUT} min-h-[3.5rem] resize-y`}
                  placeholder="내담자에게 보여줄 안내 문구"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className={FORM_LABEL}>포함할 검사</label>
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-sm text-slate-400">
                    {selectedTestCount}개 선택
                  </span>
                </div>
                <div className={TEST_PICKER_SCROLL}>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {counselorAssessmentTestOptions.map((t) => {
                      const checked = selectedTestIds.has(t.testId);
                      return (
                        <label
                          key={t.testId}
                          className={`flex items-start gap-2.5 rounded-md px-2 py-2 text-base leading-snug transition-colors cursor-pointer hover:bg-white/5 ${checked ? 'text-sky-100' : 'text-slate-300'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTest(t.testId)}
                            disabled={loading}
                            className="mt-1 shrink-0 rounded accent-sky-500"
                          />
                          <span>{t.name}</span>
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
          className="flex min-h-0 flex-1 flex-col overflow-hidden xl:col-start-2 xl:row-start-1"
          toolbar={
            recipients.length > 0 ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                  recipients.length > GROUP_RECIPIENT_MAX
                    ? 'bg-red-500/15 text-red-300'
                    : 'bg-emerald-500/15 text-emerald-300'
                }`}
              >
                {recipients.length.toLocaleString('ko-KR')}명
              </span>
            ) : null
          }
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className={`hidden md:grid ${recipientHeaderClass()}`}>
              <span>이름 *</span>
              <span>이메일</span>
              <span>휴대폰</span>
              <span />
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {manualRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`${recipientGridClass()} rounded-lg border border-white/5 bg-[#101f38]/40 px-2 py-2 md:border-0 md:bg-transparent md:px-0 md:py-0.5`}
                  >
                    <div>
                      <span className="mb-1 block text-xs text-slate-500 md:hidden">이름 *</span>
                      <input
                        ref={(el) => {
                          recipientNameRefs.current[idx] = el;
                        }}
                        placeholder="이름"
                        className={FORM_INPUT}
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
                        className={FORM_INPUT}
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
                        className={FORM_INPUT}
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
            <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-white/10 bg-[#101f38]/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800/80"
                  disabled={loading}
                >
                  CSV/엑셀 첨부
                </button>
                <button
                  type="button"
                  onClick={downloadGroupRecipientSampleCsv}
                  className="text-sm text-sky-300 transition hover:text-sky-200"
                >
                  샘플(CSV)
                </button>
                <button
                  type="button"
                  onClick={downloadGroupRecipientSampleTxt}
                  className="text-sm text-sky-300 transition hover:text-sky-200"
                >
                  샘플(TXT)
                </button>
                {!fileLabel ? (
                  <span className="text-sm text-slate-500">
                    최대 {GROUP_RECIPIENT_MAX.toLocaleString('ko-KR')}명
                  </span>
                ) : null}
              </div>
              {fileLabel ? (
                <div
                  className="rounded-lg border border-sky-500/25 bg-sky-950/25 px-3 py-2.5"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-xs font-medium text-sky-300/90">첨부된 파일</p>
                  <p className="mt-1 break-all text-sm font-medium leading-snug text-white">{fileLabel}</p>
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
            {recipients.length >= GROUP_NOTIFY_WARN_THRESHOLD ? (
              <p className="shrink-0 text-sm leading-snug text-amber-200/90">
                {GROUP_NOTIFY_WARN_THRESHOLD}명 이상은 「발급만」 또는 「발급 후 선택 발송」을 권장합니다.
              </p>
            ) : null}
          </div>
        </CounselorPageSection>

        <CounselorPageSection
          title="발급 · 발송"
          className="flex min-h-0 flex-1 flex-col xl:col-start-3 xl:row-start-1 xl:self-stretch"
          bodyClassName="flex min-h-0 flex-1 flex-col"
        >
          {error ? (
            <p
              className="mb-3 shrink-0 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2.5 text-sm leading-snug text-red-300"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5 py-2">
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
                발송 없이 이 화면에서 Excel로 코드·비밀번호 저장
              </span>
            </button>
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
    </form>
  );
}
