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
import {
  ASSESSMENT_LIST_SORT_OPTIONS,
  formatAssessmentSelectLabel,
  sortCounselorAssessments,
  type AssessmentListSortKey,
} from '@/lib/assessmentSortOptions';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { listAssessments, type CounselorAssessment } from '@/lib/assessmentApi';
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
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import * as XLSX from 'xlsx';

export type RecipientRow = { displayName: string; email: string; phone: string };

type SendMode = 'none' | 'all' | 'select';

const EMPTY_ROW: RecipientRow = { displayName: '', email: '', phone: '' };

function recipientKey(row: Pick<RecipientRow, 'displayName' | 'email' | 'phone'>): string {
  return `${row.displayName.trim()}|${row.email.trim()}|${row.phone.trim()}`.toLowerCase();
}

const FORM_INPUT =
  'w-full rounded-lg border border-white/10 bg-[#101f38]/90 px-3 py-2.5 text-base text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400/50 disabled:cursor-not-allowed disabled:opacity-55';
const FORM_LABEL = 'mb-1.5 block text-sm font-semibold text-slate-300';
const FORM_HINT = 'text-sm text-slate-400 leading-relaxed';
/** 포함할 검사 목록 스크롤 영역 */
const TEST_PICKER_SCROLL =
  'max-h-[14rem] overflow-y-auto overscroll-y-contain rounded-lg border border-white/10 bg-[#101f38]/60 p-3';

function recipientGridClass(selectMode: boolean): string {
  return selectMode
    ? 'grid grid-cols-[2.75rem_minmax(5.5rem,1fr)_minmax(7rem,1.2fr)_minmax(6.5rem,1fr)_3rem] items-center gap-x-2 gap-y-1'
    : 'grid grid-cols-[minmax(5.5rem,1fr)_minmax(7rem,1.2fr)_minmax(6.5rem,1fr)_3rem] items-center gap-x-2 gap-y-1';
}

function recipientHeaderClass(selectMode: boolean): string {
  return `${recipientGridClass(selectMode)} shrink-0 border-b border-white/10 pb-2 text-sm font-semibold text-sky-200/90`;
}

function recipientPhoneFromRaw(raw: unknown): string {
  const normalized = normalizeRecipientPhone(raw);
  return normalized ? formatPhoneDisplay(normalized) : '';
}

function parseRecipientSheetRows(rows: unknown[][]): RecipientRow[] {
  if (!rows.length) return [];

  const firstCell = String(rows[0]?.[0] ?? '').trim();
  const hasHeader = firstCell.includes('이름') || firstCell.toLowerCase().includes('name');
  const startIdx = hasHeader ? 1 : 0;

  const parsed: RecipientRow[] = [];
  for (let i = startIdx; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row?.length) continue;
    const displayName = String(row[0] ?? '').trim();
    if (!displayName) continue;
    parsed.push({
      displayName,
      email: String(row[1] ?? '').trim(),
      phone: recipientPhoneFromRaw(row[2]),
    });
  }
  return parsed;
}

function parseRecipientText(text: string): RecipientRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const rows: RecipientRow[] = [];
  const startIdx =
    lines[0].includes('이름') || lines[0].toLowerCase().includes('name') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i += 1) {
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());
    if (!parts[0]) continue;
    rows.push({
      displayName: parts[0],
      email: parts[1] || '',
      phone: recipientPhoneFromRaw(parts[2] || ''),
    });
  }
  return rows;
}

function mergeRecipients(manual: RecipientRow[], fromFile: RecipientRow[]): RecipientRow[] {
  const combined = [...manual, ...fromFile].filter((r) => r.displayName.trim());
  const seen = new Set<string>();
  return combined.filter((r) => {
    const key = `${r.displayName}|${r.email}|${r.phone}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyAssessmentToForm(a: CounselorAssessment, setters: {
  setTitle: (v: string) => void;
  setWelcomeMessage: (v: string) => void;
  setUsageEndDate: (v: string) => void;
  setSelectedTestIds: (v: Set<string>) => void;
}) {
  setters.setTitle(a.title || '');
  setters.setWelcomeMessage(a.welcomeMessage || '');
  setters.setUsageEndDate((a.usageEndDate || '').trim());
  setters.setSelectedTestIds(
    new Set((a.testList || []).map((t) => String(t.testId)).filter(Boolean))
  );
}

export default function IndividualAssessmentCreateForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scheduledDateRef = useRef<HTMLInputElement>(null);
  const scheduledTimeRef = useRef<HTMLInputElement>(null);
  const usageEndDateRef = useRef<HTMLInputElement>(null);
  const recipientNameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user, authPending, showLoginRequired } = useAuthResolved();

  const [groupAssessments, setGroupAssessments] = useState<CounselorAssessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [listSortKey, setListSortKey] = useState<AssessmentListSortKey>('createdDesc');

  const [cohortName, setCohortName] = useState('');
  const [title, setTitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [usageEndDate, setUsageEndDate] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [manualRows, setManualRows] = useState<RecipientRow[]>([{ ...EMPTY_ROW }]);
  const [fileRows, setFileRows] = useState<RecipientRow[]>([]);
  const [fileLabel, setFileLabel] = useState('');
  const [sendMode, setSendMode] = useState<SendMode>('none');
  const [notifySelected, setNotifySelected] = useState<Set<string>>(new Set());
  const [notifyTiming, setNotifyTiming] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
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
  const [lastSendMode, setLastSendMode] = useState<SendMode>('none');

  const sortedGroupAssessments = useMemo(
    () => sortCounselorAssessments(groupAssessments, listSortKey),
    [groupAssessments, listSortKey]
  );

  const usingExisting = Boolean(selectedAssessmentId.trim());
  const selectedAssessment = useMemo(
    () => groupAssessments.find((a) => a.id === selectedAssessmentId) ?? null,
    [groupAssessments, selectedAssessmentId]
  );

  const loadGroupAssessments = useCallback(async () => {
    setLoadingAssessments(true);
    try {
      const data = await listAssessments();
      const items = (data.assessments || []).filter(
        (a) => (a.issueType || 'shared') === 'individual'
      );
      setGroupAssessments(items);
    } catch {
      setGroupAssessments([]);
    } finally {
      setLoadingAssessments(false);
    }
  }, []);

  useEffect(() => {
    if (!user || authPending) return;
    void loadGroupAssessments();
  }, [user, authPending, loadGroupAssessments]);

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
          setCreated(full.created || []);
          setNotifyQueued(full.notifyQueued);
          setSharedJoinCode(full.joinAccessCode || '');
          setScheduledAtIso(full.scheduledAt ?? null);
          setActiveJobId(null);
          setJobProgress(null);
        } else if (status.status === 'failed') {
          setError(status.error || '대량 발급 작업이 실패했습니다.');
          setActiveJobId(null);
          setJobProgress(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '작업 상태 조회에 실패했습니다.');
          setActiveJobId(null);
          setJobProgress(null);
        }
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeJobId]);

  const populateFromAssessment = useCallback((a: CounselorAssessment) => {
    applyAssessmentToForm(a, {
      setTitle,
      setWelcomeMessage,
      setUsageEndDate,
      setSelectedTestIds,
    });
  }, []);

  const handleAssessmentSelect = (id: string) => {
    setSelectedAssessmentId(id);
    setError('');
    if (!id) return;
    const found = groupAssessments.find((a) => a.id === id);
    if (found) {
      populateFromAssessment(found);
      if (found.cohortName) setCohortName(found.cohortName);
    }
  };

  const recipients = useMemo(
    () => mergeRecipients(manualRows, fileRows),
    [manualRows, fileRows]
  );

  const notifyTargetCount = useMemo(() => {
    if (sendMode === 'none') return 0;
    if (sendMode === 'all') return recipients.length;
    return recipients.filter((r) => notifySelected.has(recipientKey(r))).length;
  }, [sendMode, recipients, notifySelected]);

  const willNotify = sendMode !== 'none' && notifyTargetCount > 0;

  const canSubmit =
    Boolean(user) &&
    !authPending &&
    !loading &&
    !activeJobId &&
    recipients.length <= GROUP_RECIPIENT_MAX;

  const minScheduledDate = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const minScheduledTime = useMemo(() => {
    if (scheduledDate !== minScheduledDate) return '00:00';
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [scheduledDate, minScheduledDate]);

  const scheduledAtLocal = useMemo(() => {
    if (!scheduledDate.trim() || !scheduledTime.trim()) return '';
    return `${scheduledDate}T${scheduledTime}`;
  }, [scheduledDate, scheduledTime]);

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
    if (usingExisting) return;
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

  const toggleNotifyRecipient = (row: RecipientRow) => {
    const key = recipientKey(row);
    setNotifySelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllNotifyRecipients = () => {
    const keys = recipients.map((r) => recipientKey(r));
    const allOn = keys.length > 0 && keys.every((k) => notifySelected.has(k));
    setNotifySelected(allOn ? new Set() : new Set(keys));
  };

  const handleSendModeChange = (mode: SendMode) => {
    setSendMode(mode);
    if (mode === 'all') {
      setNotifySelected(new Set(recipients.map((r) => recipientKey(r))));
    } else if (mode === 'none') {
      setNotifySelected(new Set());
    }
  };

  useEffect(() => {
    if (sendMode === 'all') {
      setNotifySelected(new Set(recipients.map((r) => recipientKey(r))));
    }
  }, [recipients, sendMode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLabel(file.name);
    const lowerName = file.name.toLowerCase();
    try {
      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
        setFileRows(parseRecipientSheetRows(rows));
      } else {
        const text = await file.text();
        setFileRows(parseRecipientText(text));
      }
    } catch {
      setError('파일을 읽지 못했습니다. CSV·텍스트·엑셀 형식을 확인해 주세요.');
      setFileRows([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreated([]);
    setSharedJoinCode('');

    if (!cohortName.trim()) {
      setError('기관/단체/그룹명을 입력해 주세요.');
      return;
    }
    if (!usingExisting && !title.trim()) {
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
    if (!usingExisting && testList.length === 0) {
      setError('포함할 검사를 1개 이상 선택해 주세요.');
      return;
    }
    if (willNotify && notifyTiming === 'scheduled') {
      if (!scheduledDate.trim() || !scheduledTime.trim()) {
        setError('예약 발송 날짜와 시간(시·분)을 선택해 주세요.');
        return;
      }
      const sched = new Date(scheduledAtLocal);
      if (Number.isNaN(sched.getTime()) || sched.getTime() <= Date.now()) {
        setError('예약 발송 시각은 현재 이후여야 합니다.');
        return;
      }
    }
    if (sendMode === 'select' && notifyTargetCount === 0) {
      setError('선택 발송 대상을 1명 이상 선택해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const scheduledAt =
        willNotify && notifyTiming === 'scheduled' && scheduledAtLocal
          ? new Date(scheduledAtLocal).toISOString()
          : undefined;
      setLastSendMode(sendMode);
      const result = await bulkCreateClientPortals({
        cohortName: cohortName.trim().slice(0, 120),
        title: (title.trim() || selectedAssessment?.title || cohortName.trim() || '검사').slice(0, 200),
        welcomeMessage: welcomeMessage.trim(),
        usageEndDate: usageEndDate.trim(),
        testList: usingExisting
          ? (selectedAssessment?.testList || []).map((t) => ({
              testId: String(t.testId),
              name: t.name || String(t.testId),
            }))
          : testList,
        rows: recipients.map((r) => ({
          displayName: r.displayName.trim(),
          email: r.email.trim() || undefined,
          phone: normalizeRecipientPhone(r.phone) || undefined,
          queueNotify:
            sendMode === 'all'
              ? true
              : sendMode === 'select'
                ? notifySelected.has(recipientKey(r))
                : false,
        })),
        queueNotify: willNotify,
        scheduledAt,
        assessmentId: usingExisting ? selectedAssessmentId : undefined,
      });

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
        setScheduledAtIso(result.scheduledAt ?? scheduledAt ?? null);
        setLastCreatedAssessmentId(result.assessmentId || selectedAssessmentId || '');
        return;
      }

      setCreated(result.created || []);
      setLastCreatedAssessmentId(result.assessmentId || selectedAssessmentId || '');
      setSharedJoinCode(result.joinAccessCode || result.created?.[0]?.joinAccessCode || '');
      setNotifySent(result.notifySent ?? 0);
      setNotifyFailed(result.notifyFailed ?? 0);
      setNotifyQueued(result.notifyQueued);
      setScheduledAtIso(result.scheduledAt ?? scheduledAt ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사코드 발급에 실패했습니다.');
    } finally {
      setLoading(false);
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
    setLastSendMode('none');
    setError('');
    setManualRows([{ ...EMPTY_ROW }]);
    setFileRows([]);
    setFileLabel('');
    setSendMode('none');
    setNotifySelected(new Set());
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
    const didNotify = lastSendMode !== 'none';
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
                {lastSendMode === 'select' ? (
                  <span className="text-sky-200">선택 {notifyTargetCount}명 · </span>
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

  const selectedTestCount = selectedTestIds.size;
  const selectSendMode = sendMode === 'select';

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <CounselorPageSection title="검사코드 선택">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1">
            <label className={FORM_LABEL}>기존 검사코드 불러오기</label>
            <select
              value={selectedAssessmentId}
              onChange={(e) => handleAssessmentSelect(e.target.value)}
              disabled={loading || loadingAssessments}
              className={FORM_INPUT}
            >
              <option value="">+ 새 검사코드 만들기</option>
              {sortedGroupAssessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {formatAssessmentSelectLabel(a)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="assessment-sort" className="whitespace-nowrap text-sm text-slate-400">
              정렬
            </label>
            <select
              id="assessment-sort"
              value={listSortKey}
              onChange={(e) => setListSortKey(e.target.value as AssessmentListSortKey)}
              disabled={loading || loadingAssessments}
              className={`${FORM_INPUT} w-auto min-w-[9rem] py-2 text-base`}
            >
              {ASSESSMENT_LIST_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {usingExisting && selectedAssessment ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-base text-cyan-200">
              {formatAccessCodeDisplay(selectedAssessment.accessCode)}
            </span>
          ) : (
            <span className="hidden pb-2 text-sm text-slate-400 sm:inline">
              기존 코드 선택 시 설정이 자동으로 채워집니다.
            </span>
          )}
        </div>
      </CounselorPageSection>

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
                  disabled={loading || usingExisting}
                />
              </div>
              <div>
                <label className={FORM_LABEL}>
                  안내 제목 {!usingExisting ? <span className="text-red-400">*</span> : null}
                </label>
                <input
                  type="text"
                  required={!usingExisting}
                  maxLength={200}
                  className={FORM_INPUT}
                  placeholder="예: 개인 심리검사"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading || usingExisting}
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
                    disabled={loading || usingExisting}
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
                    disabled={loading || usingExisting}
                  />
                </div>
              </div>
            </div>
            {usingExisting ? (
              <p className={FORM_HINT}>검사·메시지는 선택한 코드 설정을 사용합니다.</p>
            ) : null}
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div>
                <label className={FORM_LABEL}>안내 메시지 (선택)</label>
                <textarea
                  rows={2}
                  className={`${FORM_INPUT} min-h-[3.5rem] resize-y`}
                  placeholder="내담자에게 보여줄 안내 문구"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  disabled={loading || usingExisting}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className={FORM_LABEL}>
                    포함할 검사
                    {usingExisting ? (
                      <span className="font-normal text-slate-500"> · 수정 불가</span>
                    ) : null}
                  </label>
                  {!usingExisting ? (
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-sm text-slate-400">
                      {selectedTestCount}개 선택
                    </span>
                  ) : null}
                </div>
                <div className={TEST_PICKER_SCROLL}>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {counselorAssessmentTestOptions.map((t) => {
                      const checked = selectedTestIds.has(t.testId);
                      const lockedChecked = usingExisting && checked;
                      return (
                        <label
                          key={t.testId}
                          className={`flex items-start gap-2.5 rounded-md px-2 py-2 text-base leading-snug transition-colors ${
                            usingExisting
                              ? 'cursor-default opacity-75'
                              : 'cursor-pointer hover:bg-white/5'
                          } ${lockedChecked ? 'text-red-300' : checked ? 'text-sky-100' : 'text-slate-300'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTest(t.testId)}
                            disabled={loading || usingExisting}
                            className={`mt-1 shrink-0 rounded ${lockedChecked ? 'accent-red-500' : 'accent-sky-500'}`}
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
            <div className="flex items-center gap-2">
              {recipients.length > 0 ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                    recipients.length > GROUP_RECIPIENT_MAX
                      ? 'bg-red-500/15 text-red-300'
                      : 'bg-emerald-500/15 text-emerald-300'
                  }`}
                >
                  {recipients.length.toLocaleString('ko-KR')}명
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => addRow()}
                className="rounded-lg border border-sky-500/35 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
                disabled={loading}
              >
                + 행 추가
              </button>
            </div>
          }
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className={`hidden md:grid ${recipientHeaderClass(selectSendMode)}`}>
              {selectSendMode ? <span className="text-center">발송</span> : null}
              <span>이름 *</span>
              <span>이메일</span>
              <span>휴대폰</span>
              <span />
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {manualRows.map((row, idx) => {
                const notifyKey = recipientKey(row);
                const showNotifyCheckbox = selectSendMode && Boolean(row.displayName.trim());
                return (
                  <div
                    key={idx}
                    className={`${recipientGridClass(selectSendMode)} rounded-lg border border-white/5 bg-[#101f38]/40 px-2 py-2 md:border-0 md:bg-transparent md:px-0 md:py-0.5`}
                  >
                    {selectSendMode ? (
                      <div className="flex items-center justify-center md:justify-center">
                        {showNotifyCheckbox ? (
                          <input
                            type="checkbox"
                            checked={notifySelected.has(notifyKey)}
                            onChange={() => toggleNotifyRecipient(row)}
                            disabled={loading}
                            className="h-4 w-4 rounded accent-sky-500"
                            title="발송 대상 선택"
                            aria-label={`${row.displayName || '내담자'} 발송 선택`}
                          />
                        ) : (
                          <span className="inline-block h-4 w-4" aria-hidden />
                        )}
                      </div>
                    ) : null}
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
                );
              })}
            </div>
            {selectSendMode && fileRows.length > 0 ? (
              <div className="shrink-0 rounded-lg border border-white/10 bg-[#101f38]/60 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-300">
                    파일에서 불러온 내담자 ({fileRows.length}명)
                  </p>
                  <button
                    type="button"
                    onClick={toggleAllNotifyRecipients}
                    className="text-sm text-sky-300 hover:text-sky-200"
                    disabled={loading || recipients.length === 0}
                  >
                    {recipients.every((r) => notifySelected.has(recipientKey(r))) ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <ul className="max-h-32 space-y-1.5 overflow-y-auto text-base">
                  {fileRows.map((row, i) => (
                    <li key={`${recipientKey(row)}-${i}`}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded px-1 py-1 hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={notifySelected.has(recipientKey(row))}
                          onChange={() => toggleNotifyRecipient(row)}
                          disabled={loading}
                          className="h-4 w-4 rounded accent-sky-500"
                        />
                        <span className="text-slate-200">{row.displayName}</span>
                        <span className="truncate text-slate-400">
                          {row.email || row.phone || '연락처 없음'}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
              />
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
              {fileLabel ? (
                <span className="max-w-[240px] truncate text-sm text-slate-400" title={fileLabel}>
                  {fileLabel} ({fileRows.length}명)
                </span>
              ) : (
                <span className="text-sm text-slate-500">
                  최대 {GROUP_RECIPIENT_MAX.toLocaleString('ko-KR')}명
                </span>
              )}
            </div>
            {recipients.length >= GROUP_NOTIFY_WARN_THRESHOLD && willNotify ? (
              <p className="shrink-0 text-sm leading-snug text-amber-200/90">
                {GROUP_NOTIFY_WARN_THRESHOLD}명 이상은 예약 발송 또는 Excel만 받기를 권장합니다.
              </p>
            ) : null}
          </div>
        </CounselorPageSection>

        <CounselorPageSection
          title="접속 정보 발송"
          className="flex shrink-0 flex-col xl:col-start-3 xl:row-start-1 xl:self-stretch"
          bodyClassName="flex flex-col justify-between gap-4"
        >
          <div className="space-y-4">
            <p className={FORM_HINT}>
              발급과 동시에 이메일·문자를 보낼지 선택하세요. 미발송 시 Excel에서 코드를 확인할 수 있습니다.
            </p>
            <div className="space-y-2 rounded-lg border border-white/10 bg-[#101f38]/60 p-4">
              <div className="flex flex-col gap-3 text-base">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition hover:border-white/10 hover:bg-white/[0.03] has-[:checked]:border-sky-500/40 has-[:checked]:bg-sky-500/10">
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === 'none'}
                    onChange={() => handleSendModeChange('none')}
                    disabled={loading}
                    className="mt-1 accent-sky-500"
                  />
                  <span>
                    <span className="block font-semibold text-slate-200">발송 안 함</span>
                    <span className="block text-sm text-slate-400">Excel로 코드·비밀번호 확인</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition hover:border-white/10 hover:bg-white/[0.03] has-[:checked]:border-sky-500/40 has-[:checked]:bg-sky-500/10">
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === 'all'}
                    onChange={() => handleSendModeChange('all')}
                    disabled={loading}
                    className="mt-1 accent-sky-500"
                  />
                  <span>
                    <span className="block font-semibold text-slate-200">
                      즉시 전체 발송 ({recipients.length}명)
                    </span>
                    <span className="block text-sm text-slate-400">등록된 모든 내담자에게 발송</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition hover:border-white/10 hover:bg-white/[0.03] has-[:checked]:border-sky-500/40 has-[:checked]:bg-sky-500/10">
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === 'select'}
                    onChange={() => handleSendModeChange('select')}
                    disabled={loading}
                    className="mt-1 accent-sky-500"
                  />
                  <span>
                    <span className="block font-semibold text-slate-200">
                      선택 발송
                      {selectSendMode ? ` (${notifyTargetCount}명)` : ''}
                    </span>
                    <span className="block text-sm text-slate-400">내담자 목록에서 체크한 대상만 발송</span>
                  </span>
                </label>
              </div>
              {selectSendMode ? (
                <p className="text-sm text-amber-200/90">내담자 목록 왼쪽 체크박스로 발송 대상을 선택하세요.</p>
              ) : null}
            </div>
            {willNotify ? (
              <div className="space-y-3 rounded-lg border border-white/10 bg-[#101f38]/60 p-4">
                <p className="text-sm font-semibold text-slate-300">발송 시점</p>
                <div className="flex flex-wrap gap-4 text-base">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="notifyTiming"
                      checked={notifyTiming === 'immediate'}
                      onChange={() => setNotifyTiming('immediate')}
                      disabled={loading}
                      className="accent-sky-500"
                    />
                    <span className="text-slate-200">즉시 발송</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="notifyTiming"
                      checked={notifyTiming === 'scheduled'}
                      onChange={() => setNotifyTiming('scheduled')}
                      disabled={loading}
                      className="accent-sky-500"
                    />
                    <span className="text-slate-200">예약 발송</span>
                  </label>
                </div>
                {notifyTiming === 'scheduled' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="scheduled-date" className={FORM_LABEL}>
                        예약 날짜
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => openDatePicker(scheduledDateRef)}
                          disabled={loading}
                          className="absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center rounded-l-lg border-r border-white/10 text-sky-400 transition hover:bg-sky-500/10 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="예약 날짜 달력 열기"
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
                          id="scheduled-date"
                          ref={scheduledDateRef}
                          type="date"
                          value={scheduledDate}
                          min={minScheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          onClick={() => openDatePicker(scheduledDateRef)}
                          disabled={loading}
                          className={`${FORM_INPUT} py-2.5 pl-11 pr-2 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden`}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="scheduled-time" className={FORM_LABEL}>
                        예약 시간 (시·분)
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => openDatePicker(scheduledTimeRef)}
                          disabled={loading}
                          className="absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center rounded-l-lg border-r border-white/10 text-sky-400 transition hover:bg-sky-500/10 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="예약 시간 선택 열기"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path
                              d="M10 5.5v4.25l2.75 1.6M10 3a7 7 0 100 14 7 7 0 000-14z"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <input
                          id="scheduled-time"
                          ref={scheduledTimeRef}
                          type="time"
                          value={scheduledTime}
                          min={scheduledDate === minScheduledDate ? minScheduledTime : undefined}
                          step={60}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          onClick={() => openDatePicker(scheduledTimeRef)}
                          disabled={loading}
                          className={`${FORM_INPUT} py-2.5 pl-11 pr-2 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden`}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {error ? (
              <p
                className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2.5 text-sm leading-snug text-red-300"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2.5 border-t border-white/10 pt-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 text-base font-bold text-white shadow-lg shadow-sky-900/30 transition hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? '발급 중…' : `${recipients.length || 0}명 검사코드 발급`}
            </button>
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
