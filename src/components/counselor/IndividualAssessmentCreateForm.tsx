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
import * as XLSX from 'xlsx';

export type RecipientRow = { displayName: string; email: string; phone: string };

const EMPTY_ROW: RecipientRow = { displayName: '', email: '', phone: '' };

const FORM_CARD =
  'rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/45 via-slate-800/25 to-slate-900/55 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-sm';
const FORM_INPUT =
  'w-full px-3 py-2 rounded-lg bg-slate-950/55 border border-white/10 text-white text-sm placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400/50 disabled:cursor-not-allowed disabled:opacity-55';
const FORM_LABEL = 'block text-xs font-medium text-slate-400 mb-1';
/** 포함할 검사: 2열 그리드 기준 5행 높이 (약 11.5rem) */
const TEST_PICKER_SCROLL =
  'max-h-[11.5rem] overflow-y-auto overscroll-y-contain rounded-lg border border-white/10 bg-slate-950/40 p-2';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-200">
      <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500" />
      {children}
    </h2>
  );
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
  const [queueNotify, setQueueNotify] = useState(true);
  const [notifyTiming, setNotifyTiming] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledAtLocal, setScheduledAtLocal] = useState('');
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

  const canSubmit =
    Boolean(user) &&
    !authPending &&
    !loading &&
    !activeJobId &&
    recipients.length <= GROUP_RECIPIENT_MAX;

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
    if (queueNotify && notifyTiming === 'scheduled') {
      if (!scheduledAtLocal.trim()) {
        setError('예약 발송 시각을 선택해 주세요.');
        return;
      }
      const sched = new Date(scheduledAtLocal);
      if (Number.isNaN(sched.getTime()) || sched.getTime() <= Date.now()) {
        setError('예약 발송 시각은 현재 이후여야 합니다.');
        return;
      }
    }
    setLoading(true);
    try {
      const scheduledAt =
        queueNotify && notifyTiming === 'scheduled' && scheduledAtLocal
          ? new Date(scheduledAtLocal).toISOString()
          : undefined;
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
        })),
        queueNotify,
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
        return;
      }

      setCreated(result.created || []);
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
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-4 text-emerald-200 text-sm">
          <p className="font-medium">{created.length}명에게 나의코드·비밀번호가 발급되었습니다.</p>
          {sharedJoinCode ? (
            <p className="mt-2">
              공통 검사코드:{' '}
              <span className="font-mono font-bold text-emerald-100 tracking-wider">
                {formatAccessCodeDisplay(sharedJoinCode)}
              </span>
            </p>
          ) : null}
          {queueNotify ? (
            <p className="mt-1 text-emerald-300/90">
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
            <p className="mt-1 text-emerald-300/90">아래 Excel에서 코드·비밀번호를 확인하세요.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadExcel}
            className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Excel 다운로드
          </button>
          <button
            type="button"
            onClick={() => pushWithAuthSession(router, '/counselor/assessments')}
            className="px-5 py-2.5 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600"
          >
            발송목록
          </button>
        </div>
      </div>
    );
  }

  const selectedTestCount = selectedTestIds.size;

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {/* 검사코드 선택 */}
      <div
        className={`${FORM_CARD} flex shrink-0 flex-wrap items-end gap-3 px-4 py-3`}
      >
        <div className="min-w-[220px] flex-1">
          <label className={FORM_LABEL}>검사코드 선택</label>
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
          <label htmlFor="assessment-sort" className="whitespace-nowrap text-xs text-slate-500">
            정렬
          </label>
          <select
            id="assessment-sort"
            value={listSortKey}
            onChange={(e) => setListSortKey(e.target.value as AssessmentListSortKey)}
            disabled={loading || loadingAssessments}
            className={`${FORM_INPUT} w-auto min-w-[7.5rem] py-1.5 text-xs`}
          >
            {ASSESSMENT_LIST_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {usingExisting && selectedAssessment ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs text-cyan-200">
            {formatAccessCodeDisplay(selectedAssessment.accessCode)}
          </span>
        ) : (
          <span className="hidden pb-2 text-xs text-slate-500 sm:inline">
            기존 코드 선택 시 설정 자동 입력
          </span>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-[1fr_252px] xl:grid-cols-[minmax(300px,340px)_1fr_252px]">
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:col-span-1 xl:contents">
          {/* 검사 정보 */}
          <section
            className={`${FORM_CARD} flex shrink-0 flex-col gap-2.5 p-3 xl:col-start-1 xl:row-start-1`}
          >
            <SectionHeading>검사 정보</SectionHeading>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
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
                <label className={FORM_LABEL}>사용종료일 (선택)</label>
                <input
                  type="date"
                  className={FORM_INPUT}
                  value={usageEndDate}
                  onChange={(e) => setUsageEndDate(e.target.value)}
                  disabled={loading || usingExisting}
                />
              </div>
            </div>
            {usingExisting ? (
              <p className="text-[11px] text-slate-500">검사·메시지는 선택한 코드 설정을 사용합니다.</p>
            ) : null}
            <div className="space-y-2">
              <div>
                <label className={FORM_LABEL}>안내 메시지 (선택)</label>
                <textarea
                  rows={1}
                  className={`${FORM_INPUT} min-h-[2.5rem] resize-none`}
                  placeholder="내담자에게 보여줄 안내 문구"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  disabled={loading || usingExisting}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className={FORM_LABEL}>
                    포함할 검사
                    {usingExisting ? (
                      <span className="font-normal text-slate-500"> · 수정 불가</span>
                    ) : null}
                  </label>
                  {!usingExisting ? (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                      {selectedTestCount}개 선택
                    </span>
                  ) : null}
                </div>
                <div className={TEST_PICKER_SCROLL}>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {counselorAssessmentTestOptions.map((t) => {
                      const checked = selectedTestIds.has(t.testId);
                      const lockedChecked = usingExisting && checked;
                      return (
                        <label
                          key={t.testId}
                          className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                            usingExisting
                              ? 'cursor-default opacity-75'
                              : 'cursor-pointer hover:bg-white/5'
                          } ${lockedChecked ? 'text-red-300' : checked ? 'text-blue-100' : 'text-slate-300'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTest(t.testId)}
                            disabled={loading || usingExisting}
                            className={`mt-0.5 shrink-0 rounded ${lockedChecked ? 'accent-red-500' : 'accent-blue-500'}`}
                          />
                          <span>{t.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 내담자 목록 */}
          <section
            className={`${FORM_CARD} flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3 lg:min-h-0 xl:col-start-2 xl:row-start-1`}
          >
            <div className="flex shrink-0 items-center justify-between gap-2">
              <SectionHeading>내담자 목록</SectionHeading>
              <div className="flex items-center gap-2">
                {recipients.length > 0 ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
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
                  className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 transition hover:bg-blue-500/20"
                  disabled={loading}
                >
                  + 행 추가
                </button>
              </div>
            </div>
            <div className="hidden shrink-0 gap-2 px-0.5 text-[10px] uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[1fr_1fr_1fr_2.5rem]">
              <span>이름 *</span>
              <span>이메일</span>
              <span>휴대폰</span>
              <span />
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
              {manualRows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 items-center gap-1.5 rounded-lg even:bg-white/[0.02] md:grid-cols-[1fr_1fr_1fr_2.5rem] md:px-1 md:py-0.5"
                >
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
                  <input
                    placeholder="이메일"
                    type="email"
                    className={FORM_INPUT}
                    value={row.email}
                    onChange={(e) => updateRow(idx, 'email', e.target.value)}
                    onKeyDown={handleRecipientFieldKeyDown}
                    disabled={loading}
                  />
                  <input
                    placeholder="휴대폰"
                    className={FORM_INPUT}
                    value={row.phone}
                    onChange={(e) => updateRow(idx, 'phone', e.target.value)}
                    onKeyDown={handleRecipientFieldKeyDown}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="justify-self-end px-1 text-xs text-slate-500 transition hover:text-red-400 disabled:opacity-30"
                    disabled={loading || manualRows.length <= 1}
                    title="행 삭제"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 pt-2.5">
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
                className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-slate-800/80"
                disabled={loading}
              >
                CSV/엑셀 첨부
              </button>
              <button
                type="button"
                onClick={downloadGroupRecipientSampleCsv}
                className="text-xs text-blue-300/90 transition hover:text-blue-200"
              >
                샘플(CSV)
              </button>
              <button
                type="button"
                onClick={downloadGroupRecipientSampleTxt}
                className="text-xs text-blue-300/90 transition hover:text-blue-200"
              >
                샘플(TXT)
              </button>
              {fileLabel ? (
                <span className="max-w-[200px] truncate text-xs text-slate-400" title={fileLabel}>
                  {fileLabel} ({fileRows.length}명)
                </span>
              ) : (
                <span className="text-[11px] text-slate-600">최대 {GROUP_RECIPIENT_MAX.toLocaleString('ko-KR')}명</span>
              )}
            </div>
            {recipients.length >= GROUP_NOTIFY_WARN_THRESHOLD && queueNotify ? (
              <p className="shrink-0 text-[11px] leading-snug text-amber-200/80">
                {GROUP_NOTIFY_WARN_THRESHOLD}명 이상은 예약 발송 또는 CSV만 받기를 권장합니다.
              </p>
            ) : null}
          </section>
        </div>

        {/* 발송 설정 + 실행 */}
        <section
          className={`${FORM_CARD} flex shrink-0 flex-col gap-2.5 p-3 lg:col-start-2 lg:row-start-1 xl:col-start-3 xl:self-stretch xl:justify-between`}
        >
          <div className="space-y-3">
            <SectionHeading>접속 정보 발송</SectionHeading>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/5 bg-slate-950/30 p-3 transition hover:border-white/10">
              <input
                type="checkbox"
                checked={queueNotify}
                onChange={(e) => setQueueNotify(e.target.checked)}
                disabled={loading}
                className="mt-0.5 rounded accent-blue-500"
              />
              <span className="text-xs leading-relaxed text-slate-300">
                이메일·문자로 검사코드·나의코드·비밀번호 발송
              </span>
            </label>
            {queueNotify ? (
              <div className="space-y-2 rounded-lg border border-white/5 bg-slate-950/25 p-3">
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="notifyTiming"
                      checked={notifyTiming === 'immediate'}
                      onChange={() => setNotifyTiming('immediate')}
                      disabled={loading}
                      className="accent-blue-500"
                    />
                    <span className="text-slate-300">즉시 발송</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="notifyTiming"
                      checked={notifyTiming === 'scheduled'}
                      onChange={() => setNotifyTiming('scheduled')}
                      disabled={loading}
                      className="accent-blue-500"
                    />
                    <span className="text-slate-300">예약 발송</span>
                  </label>
                </div>
                {notifyTiming === 'scheduled' ? (
                  <input
                    type="datetime-local"
                    value={scheduledAtLocal}
                    onChange={(e) => setScheduledAtLocal(e.target.value)}
                    disabled={loading}
                    className={`${FORM_INPUT} text-xs`}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed text-slate-500">
                발송 없이 Excel로 코드·비밀번호를 확인할 수 있습니다.
              </p>
            )}
            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs leading-snug text-red-300" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 pt-1 xl:mt-auto">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? '발급 중…' : `${recipients.length || 0}명 검사코드 발급`}
            </button>
            <button
              type="button"
              onClick={() => pushWithAuthSession(router, '/counselor/assessments')}
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800/70"
            >
              취소
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}
