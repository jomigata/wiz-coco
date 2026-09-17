'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { bulkCreateClientPortals } from '@/lib/clientPortalApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { normalizeRecipientPhone, formatPhoneWhileTyping, formatPhoneDisplay, isValidKrMobilePhone } from '@/lib/phoneFormat';
import { FORM_INPUT, FORM_LABEL } from '@/lib/assessmentFormUi';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import type { CounselorAssessment } from '@/lib/assessmentApi';
import {
  downloadGroupRecipientSampleCsv,
  downloadGroupRecipientSampleTxt,
  getGroupRecipientSamplePreviewText,
} from '@/lib/groupRecipientSampleDownload';
import {
  mergeRecipients,
  parseRecipientFile,
  type RecipientRow,
} from '@/lib/recipientImport';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import CounselorActionCompleteModal from '@/components/counselor/CounselorActionCompleteModal';
import CounselorNotifyConfirmDialog from '@/components/counselor/CounselorNotifyConfirmDialog';
import type { NotifyRecipientContact } from '@/lib/counselorNotifyChannels';

export type AssessmentAddRecipientContext = {
  assessmentId: string;
  accessCode: string;
  cohortName: string;
  title: string;
  createdAt: string;
  totalIssuedCount: number;
  testList: { testId: string; name: string }[];
};

type AddRecipientSuccessInfo = { sent: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  context: AssessmentAddRecipientContext | null;
  onSuccess?: (info: AddRecipientSuccessInfo) => void;
};

function buildContextFromAssessment(a: CounselorAssessment): AssessmentAddRecipientContext {
  const testComplete = a.testCompleteCount ?? a.emailsCompletedAllTestsCount ?? 0;
  const testIncomplete = a.testIncompleteCount ?? a.emailsNotCompletedAllTestsCount ?? 0;
  const dispatchSent = a.dispatchSentCount ?? 0;
  const dispatchFailed = a.dispatchFailedCount ?? 0;
  const totalIssuedCount = Math.max(testComplete + testIncomplete, dispatchSent + dispatchFailed);

  return {
    assessmentId: a.id,
    accessCode: a.accessCode,
    cohortName: getAssessmentOrgLabel(a),
    title: (a.title || '—').trim(),
    createdAt: a.createdAt,
    totalIssuedCount,
    testList: a.testList || [],
  };
}

export { buildContextFromAssessment };

function MiniStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-slate-900/50 px-2 py-1">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-200">{children}</span>
    </span>
  );
}

function isValidEmailAddress(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function TargetRowContactDisplay({ row }: { row: RecipientRow }) {
  const phone = formatPhoneDisplay((row.phone || '').trim());
  const email = (row.email || '').trim();
  const invalid = targetRowInvalid(row);
  if (invalid && !phone && !email) {
    return <span className="text-red-400"> (부적합)</span>;
  }
  const parts: string[] = [];
  if (phone) parts.push(phone);
  if (email) {
    const emailInvalid = !isValidEmailAddress(email);
    parts.push(emailInvalid ? `${email} (부적합)` : email);
  }
  if (parts.length === 0) {
    return <span className="text-red-400"> (부적합)</span>;
  }
  return (
    <span className="text-slate-300">
      {' · '}
      {parts.join(' · ')}
      {invalid ? <span className="text-red-400"> (부적합)</span> : null}
    </span>
  );
}

function targetRowInvalid(row: RecipientRow): boolean {
  const phone = normalizeRecipientPhone(row.phone);
  const email = (row.email || '').trim();
  if (!phone && !email) return true;
  if (phone && !isValidKrMobilePhone(phone)) return true;
  if (email && !isValidEmailAddress(email)) return true;
  return false;
}

export default function AssessmentAddRecipientModal({
  open,
  onClose,
  context,
  onSuccess,
}: Props) {
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [pendingRows, setPendingRows] = useState<RecipientRow[]>([]);
  const [addSendNow, setAddSendNow] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [addComplete, setAddComplete] = useState<{
    title: string;
    message: string;
    sent: boolean;
    error?: boolean;
  } | null>(null);
  const [addError, setAddError] = useState('');
  const [addFileRows, setAddFileRows] = useState<RecipientRow[]>([]);
  const [addFileLabel, setAddFileLabel] = useState('');
  const [showAddFilePreview, setShowAddFilePreview] = useState(false);
  const [samplePreviewKind, setSamplePreviewKind] = useState<'txt' | 'csv' | null>(null);
  const [notifyConfirmOpen, setNotifyConfirmOpen] = useState(false);

  const samplePreviewText = useMemo(() => getGroupRecipientSamplePreviewText(), []);
  const samplePreviewLayout = useMemo(() => {
    const lines = samplePreviewText.split('\n');
    const widthCh = Math.min(72, Math.max(24, ...lines.map((l) => l.length)));
    return { widthCh };
  }, [samplePreviewText]);

  const combinedRows = useMemo(
    () => mergeRecipients(pendingRows, addFileRows),
    [pendingRows, addFileRows],
  );

  const notifyRecipients = useMemo<NotifyRecipientContact[]>(
    () =>
      combinedRows.map((r) => ({
        displayName: r.displayName,
        phone: r.phone,
        email: r.email,
        groupName: context?.cohortName,
        affiliation: context?.title,
      })),
    [combinedRows, context?.cohortName, context?.title],
  );

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open, context?.assessmentId]);

  const resetForm = () => {
    setDraftName('');
    setDraftPhone('');
    setDraftEmail('');
    setPendingRows([]);
    setAddSendNow(true);
    setAddError('');
    setAddFileRows([]);
    setAddFileLabel('');
    setShowAddFilePreview(false);
    setSamplePreviewKind(null);
  };

  const handleClose = () => {
    if (addLoading) return;
    resetForm();
    onClose();
  };

  const handleAddDraftRow = () => {
    const name = draftName.trim();
    const phone = normalizeRecipientPhone(draftPhone);
    const email = draftEmail.trim().toLowerCase();
    if (!name) {
      setAddError('이름을 입력해 주세요.');
      return;
    }
    setAddError('');
    setPendingRows((prev) => [
      ...prev,
      { displayName: name, phone: phone ? formatPhoneDisplay(phone) : '', email },
    ]);
    setDraftName('');
    setDraftPhone('');
    setDraftEmail('');
  };

  const removePendingRow = (idx: number) => {
    setPendingRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeTargetRow = (idx: number) => {
    const pendingLen = pendingRows.length;
    if (idx < pendingLen) {
      removePendingRow(idx);
      return;
    }
    const fileIdx = idx - pendingLen;
    setAddFileRows((prev) => prev.filter((_, i) => i !== fileIdx));
  };

  const handleAddRecipientFile = async (file: File | null) => {
    if (!file) return;
    setAddError('');
    try {
      const parsed = await parseRecipientFile(file);
      setAddFileRows(parsed);
      setAddFileLabel(file.name);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '파일을 읽지 못했습니다.');
      setAddFileRows([]);
      setAddFileLabel('');
    }
  };

  const clearAddedFile = () => {
    setAddFileRows([]);
    setAddFileLabel('');
    setShowAddFilePreview(false);
  };

  const handleSubmit = () => {
    if (!context) return;
    const rows = combinedRows;
    if (rows.length === 0) {
      setAddError('개별 입력 또는 파일에서 내담자 1명 이상을 추가해 주세요.');
      return;
    }
    const invalid = rows.find((r) => targetRowInvalid(r));
    if (invalid) {
      setAddError(`추가 대상 목록에 부적합 항목이 있습니다. 「${invalid.displayName}」님의 연락처를 확인해 주세요.`);
      return;
    }
    setAddError('');
    if (addSendNow) {
      setNotifyConfirmOpen(true);
      return;
    }
    void executeSubmit(undefined);
  };

  const executeSubmit = async (notifyChannels: ('email' | 'phone')[] | undefined) => {
    if (!context) return;
    const rows = combinedRows;
    const cohortName = (context.cohortName || context.title || '내담자').trim();
    setAddLoading(true);
    setAddError('');
    setNotifyConfirmOpen(false);
    try {
      await bulkCreateClientPortals({
        assessmentId: context.assessmentId,
        cohortName,
        title: context.title || cohortName,
        testList: context.testList,
        rows: rows.map((r) => ({
          displayName: r.displayName.trim(),
          phone: normalizeRecipientPhone(r.phone) || undefined,
          email: (r.email || '').trim().toLowerCase() || undefined,
          queueNotify: addSendNow,
        })),
        queueNotify: addSendNow,
        notifyChannels: addSendNow ? notifyChannels : undefined,
      });
      setAddComplete({
        title: addSendNow ? '발송 완료' : '추가 완료',
        message: addSendNow
          ? `${rows.length}명에게 접속 정보를 발송했습니다.`
          : `${rows.length}명을 추가했습니다.`,
        sent: addSendNow,
      });
    } catch (err) {
      setAddComplete({
        title: addSendNow ? '발송 실패' : '추가 실패',
        message: err instanceof Error ? err.message : '내담자 추가에 실패했습니다.',
        sent: addSendNow,
        error: true,
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleCompleteConfirm = () => {
    const info = addComplete;
    setAddComplete(null);
    resetForm();
    onClose();
    if (info && !info.error) {
      onSuccess?.({ sent: info.sent });
    }
  };

  if (!open || !context) return null;

  const groupTitleLine = `${context.cohortName} / ${context.title}`;

  const handleDraftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDraftRow();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-visible rounded-2xl border border-sky-400/20 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-sky-400/20 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3 sm:px-5">
          <h3 className="text-base font-bold text-white sm:text-lg">내담자 추가</h3>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-medium text-sky-100/90" title={groupTitleLine}>
              {groupTitleLine}
            </p>
            <MiniStat label="상담코드">
              <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(context.accessCode)}</span>
            </MiniStat>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-visible px-4 py-3 sm:px-5 sm:py-4">
          <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
            <section className="flex flex-col overflow-visible rounded-2xl border border-sky-400/15 bg-gradient-to-br from-[#101f38]/90 via-[#0f1a30]/95 to-[#0a1220]/90 p-4 shadow-inner shadow-black/20 lg:col-span-7">
              <div className="mb-3 border-b border-white/10 pb-2">
                <h4 className="text-sm font-bold tracking-tight text-sky-100">개별 입력</h4>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
                <div className="flex min-w-0 flex-col gap-3">
                  <div>
                    <label htmlFor="add-recipient-name" className={FORM_LABEL}>
                      이름<span className="text-yellow-400">(필수)</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      id="add-recipient-name"
                      type="text"
                      className={`${FORM_INPUT} w-full !px-2`}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={handleDraftKeyDown}
                      disabled={addLoading}
                      placeholder="홍길동"
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label htmlFor="add-recipient-phone" className={FORM_LABEL}>
                      휴대폰(선택)
                    </label>
                    <input
                      id="add-recipient-phone"
                      type="tel"
                      inputMode="numeric"
                      className={`${FORM_INPUT} w-full tabular-nums !px-2`}
                      value={draftPhone}
                      onChange={(e) => setDraftPhone(formatPhoneWhileTyping(e.target.value))}
                      onKeyDown={handleDraftKeyDown}
                      disabled={addLoading}
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div>
                    <label htmlFor="add-recipient-email" className={FORM_LABEL}>
                      이메일(선택)
                    </label>
                    <input
                      id="add-recipient-email"
                      type="email"
                      className={`${FORM_INPUT} w-full !px-2`}
                      value={draftEmail}
                      onChange={(e) => setDraftEmail(e.target.value)}
                      onKeyDown={handleDraftKeyDown}
                      disabled={addLoading}
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddDraftRow}
                  disabled={addLoading}
                  className="min-h-[8.5rem] w-full shrink-0 rounded-xl bg-gradient-to-b from-sky-600 to-cyan-600 px-5 text-sm font-semibold text-white shadow-md shadow-sky-950/30 transition hover:from-sky-500 hover:to-cyan-500 disabled:opacity-50 sm:w-24"
                >
                  입력
                </button>
              </div>
            </section>

            <section className="flex flex-col overflow-visible rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-[#0f1f36]/90 via-[#0d1830]/95 to-[#0a1220]/90 p-4 shadow-inner shadow-black/20 lg:col-span-5">
              <div className="mb-3 border-b border-white/10 pb-2">
                <h4 className="text-sm font-bold tracking-tight text-emerald-100">파일 일괄 등록</h4>
                <p className="mt-0.5 text-xs text-slate-400">CSV·Excel — 이름(필수), 휴대폰(선택), 이메일(선택)</p>
              </div>
              <div className="rounded-xl border border-dashed border-white/15 bg-black/25 p-3">
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept=".csv,.txt,.tsv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  disabled={addLoading}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    void handleAddRecipientFile(file);
                    e.target.value = '';
                  }}
                  className="block w-full text-sm text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-700/90 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-600"
                />
              </div>
              </div>
              <div
                className="relative z-20 mt-2 overflow-visible"
                onMouseLeave={() => setSamplePreviewKind(null)}
              >
                <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                  <span className="text-slate-400">샘플받기</span>
                  <button
                    type="button"
                    onClick={downloadGroupRecipientSampleTxt}
                    onMouseEnter={() => setSamplePreviewKind('txt')}
                    onFocus={() => setSamplePreviewKind('txt')}
                    onBlur={() => setSamplePreviewKind(null)}
                    className="text-sky-300 transition hover:text-sky-200"
                  >
                    (텍스트파일)
                  </button>
                  <button
                    type="button"
                    onClick={downloadGroupRecipientSampleCsv}
                    onMouseEnter={() => setSamplePreviewKind('csv')}
                    onFocus={() => setSamplePreviewKind('csv')}
                    onBlur={() => setSamplePreviewKind(null)}
                    className="text-sky-300 transition hover:text-sky-200"
                  >
                    (엑셀파일)
                  </button>
                </div>
                {samplePreviewKind && samplePreviewText && samplePreviewLayout ? (
                  <div
                    className="pointer-events-none absolute bottom-full right-0 z-[200] mb-1.5 w-full rounded-lg border border-sky-500/40 bg-slate-950 p-2.5 text-left shadow-2xl sm:w-max"
                    role="tooltip"
                    style={{ width: `min(100%, ${samplePreviewLayout.widthCh}ch)` }}
                  >
                    <p className="mb-1 text-xs font-semibold text-sky-300">
                      {samplePreviewKind === 'txt' ? '샘플 텍스트 미리보기' : '샘플 엑셀(CSV) 미리보기'}
                    </p>
                    <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-snug text-slate-200">
                      {samplePreviewText}
                    </pre>
                  </div>
                ) : null}
              </div>
              {addFileLabel ? (
                <div className="relative z-20 mt-2 overflow-visible" onMouseLeave={() => setShowAddFilePreview(false)}>
                  <p className="text-sm text-emerald-300">
                    <span
                      className="cursor-help break-all underline decoration-dotted decoration-emerald-400/60 underline-offset-2"
                      onMouseEnter={() => setShowAddFilePreview(true)}
                      onFocus={() => setShowAddFilePreview(true)}
                      onBlur={() => setShowAddFilePreview(false)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${addFileLabel} 파일 내용 미리보기`}
                    >
                      {addFileLabel}
                    </span>
                    {' · '}
                    {addFileRows.length}명
                    <button
                      type="button"
                      onClick={clearAddedFile}
                      className="ml-2 font-medium text-red-500 hover:text-red-400"
                      disabled={addLoading}
                    >
                      삭제
                    </button>
                  </p>
                  {showAddFilePreview && addFileRows.length > 0 ? (
                    <div className="pointer-events-none absolute left-0 top-full z-[200] mt-1.5" role="tooltip">
                      <div className="max-w-[min(100vw-2rem,40rem)] overflow-x-auto rounded-lg border border-sky-500/40 bg-slate-950 p-2.5 text-left shadow-2xl">
                        <p className="mb-1 text-xs font-semibold text-sky-300">파일 내용 미리보기</p>
                        <div className="max-h-32 space-y-0.5 overflow-y-auto">
                          {addFileRows.slice(0, 50).map((row, idx) => (
                            <p
                              key={`${row.displayName}-${row.phone}-${idx}`}
                              className="whitespace-nowrap font-mono text-xs leading-snug text-slate-200"
                            >
                              {[row.displayName, row.phone, row.email]
                                .map((p) => (p || '').trim())
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          ))}
                          {addFileRows.length > 50 ? (
                            <p className="text-xs text-slate-500">… 외 {(addFileRows.length - 50).toLocaleString('ko-KR')}명</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0d1830]/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className={FORM_LABEL}>추가 대상 목록</h4>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-sm font-semibold text-slate-300">
                총 {combinedRows.length}명
              </span>
            </div>
            {combinedRows.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">
                개별 입력 후 「입력」을 누르거나 파일을 첨부해 주세요.
              </p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
                {combinedRows.map((row, idx) => (
                  <li
                    key={`target-${idx}-${row.displayName}-${row.phone}-${row.email}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-slate-900/40 px-2.5 py-1.5 text-sm leading-snug"
                  >
                    <span className="min-w-0 break-words text-white">
                      <span className="font-medium">{row.displayName}</span>
                      <TargetRowContactDisplay row={row} />
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTargetRow(idx)}
                      disabled={addLoading}
                      className="shrink-0 text-slate-500 hover:text-red-300"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {addError ? (
            <p className="text-sm text-red-300" role="alert">
              {addError}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-sky-400/20 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-normal text-white">나의코드·비밀번호가 자동 발급됩니다.</p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={addLoading}
                className="rounded-lg border border-white/10 bg-slate-700/80 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={addLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-900/25 transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {addLoading ? '추가 중…' : '추가 후 발송'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <CounselorActionProgressOverlay
        open={addLoading}
        zIndexClass="z-[120]"
        title={addSendNow ? '발송 진행 중…' : '내담자 추가 중…'}
        message={
          addSendNow
            ? `${combinedRows.length}명에게 접속 정보를 발송하고 있습니다.`
            : `${combinedRows.length}명을 추가하고 있습니다.`
        }
        hint="창을 닫지 말고 잠시만 기다려 주세요."
        notice={
          addSendNow
            ? '코드 발송량에 따라,  1~2분 이상 걸릴 수 있습니다.'
            : undefined
        }
      />
      <CounselorActionCompleteModal
        open={Boolean(addComplete)}
        title={addComplete?.title ?? ''}
        message={addComplete?.message}
        error={addComplete?.error}
        onConfirm={handleCompleteConfirm}
        zIndexClass="z-[130]"
      />
      <CounselorNotifyConfirmDialog
        open={notifyConfirmOpen}
        kind="add_recipient"
        hideChannels
        recipients={notifyRecipients}
        loading={addLoading}
        confirmLabel="추가·발송"
        onConfirm={(channels) => void executeSubmit(channels)}
        onCancel={() => setNotifyConfirmOpen(false)}
      />
    </div>
  );
}
