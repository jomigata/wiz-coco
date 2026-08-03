'use client';

import React, { useMemo, useState } from 'react';
import { bulkCreateClientPortals } from '@/lib/clientPortalApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { normalizeRecipientPhone } from '@/lib/phoneFormat';
import { FORM_INPUT, FORM_LABEL } from '@/lib/assessmentFormUi';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import { formatCounselorIssueDate } from '@/lib/counselorListTableStyles';
import type { CounselorAssessment } from '@/lib/assessmentApi';
import {
  downloadGroupRecipientSampleCsv,
  downloadGroupRecipientSampleTxt,
  getGroupRecipientSamplePreviewText,
} from '@/lib/groupRecipientSampleDownload';
import {
  mergeRecipients,
  parseRecipientFile,
  formatRecipientRowsPreview,
  type RecipientRow,
} from '@/lib/recipientImport';

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

export default function AssessmentAddRecipientModal({
  open,
  onClose,
  context,
  onSuccess,
}: Props) {
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [pendingRows, setPendingRows] = useState<RecipientRow[]>([]);
  const [addSendNow, setAddSendNow] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addFileRows, setAddFileRows] = useState<RecipientRow[]>([]);
  const [addFileLabel, setAddFileLabel] = useState('');
  const [addFilePreviewText, setAddFilePreviewText] = useState('');
  const [showAddFilePreview, setShowAddFilePreview] = useState(false);
  const [samplePreviewKind, setSamplePreviewKind] = useState<'txt' | 'csv' | null>(null);

  const samplePreviewText = useMemo(() => getGroupRecipientSamplePreviewText(), []);
  const samplePreviewLayout = useMemo(() => {
    const lines = samplePreviewText.split('\n');
    const widthCh = Math.min(72, Math.max(24, ...lines.map((l) => l.length)));
    return { widthCh };
  }, [samplePreviewText]);

  const addFilePreviewLayout = useMemo(() => {
    if (!addFilePreviewText) return null;
    const lines = addFilePreviewText.split('\n');
    const widthCh = Math.min(72, Math.max(24, ...lines.map((l) => l.length)));
    return { widthCh };
  }, [addFilePreviewText]);

  const combinedRows = useMemo(
    () => mergeRecipients(pendingRows, addFileRows),
    [pendingRows, addFileRows],
  );

  const resetForm = () => {
    setDraftName('');
    setDraftEmail('');
    setDraftPhone('');
    setPendingRows([]);
    setAddSendNow(true);
    setAddError('');
    setAddFileRows([]);
    setAddFileLabel('');
    setAddFilePreviewText('');
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
    const email = draftEmail.trim().toLowerCase();
    const phone = normalizeRecipientPhone(draftPhone);
    if (!name) {
      setAddError('이름을 입력해 주세요.');
      return;
    }
    if (!email && !phone) {
      setAddError('이메일 또는 휴대폰 번호가 필요합니다.');
      return;
    }
    setAddError('');
    setPendingRows((prev) => [...prev, { displayName: name, email, phone }]);
    setDraftName('');
    setDraftEmail('');
    setDraftPhone('');
  };

  const removePendingRow = (idx: number) => {
    setPendingRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddRecipientFile = async (file: File | null) => {
    if (!file) return;
    setAddError('');
    try {
      const parsed = await parseRecipientFile(file);
      setAddFileRows(parsed);
      setAddFileLabel(file.name);
      setAddFilePreviewText(formatRecipientRowsPreview(parsed));
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '파일을 읽지 못했습니다.');
      setAddFileRows([]);
      setAddFileLabel('');
      setAddFilePreviewText('');
    }
  };

  const clearAddedFile = () => {
    setAddFileRows([]);
    setAddFileLabel('');
    setAddFilePreviewText('');
    setShowAddFilePreview(false);
  };

  const handleSubmit = async () => {
    if (!context) return;
    const rows = combinedRows;
    if (rows.length === 0) {
      setAddError('개별 입력 또는 파일에서 내담자 1명 이상을 추가해 주세요.');
      return;
    }
    const invalid = rows.find((r) => !r.email.trim() && !r.phone.trim());
    if (invalid) {
      setAddError(`「${invalid.displayName}」님의 이메일 또는 휴대폰 번호가 필요합니다.`);
      return;
    }
    const cohortName = (context.cohortName || context.title || '내담자').trim();
    setAddLoading(true);
    setAddError('');
    try {
      await bulkCreateClientPortals({
        assessmentId: context.assessmentId,
        cohortName,
        title: context.title || cohortName,
        testList: context.testList,
        rows: rows.map((r) => ({
          displayName: r.displayName.trim(),
          email: r.email.trim() || undefined,
          phone: normalizeRecipientPhone(r.phone) || undefined,
          queueNotify: addSendNow,
        })),
        queueNotify: addSendNow,
      });
      const sent = addSendNow;
      resetForm();
      onClose();
      onSuccess?.({ sent });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '내담자 추가에 실패했습니다.');
    } finally {
      setAddLoading(false);
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
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-sky-400/20 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white sm:text-lg">내담자 추가</h3>
              <p className="mt-0.5 truncate text-sm font-medium text-sky-100/90" title={groupTitleLine}>
                {groupTitleLine}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <MiniStat label="코드">
                <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(context.accessCode)}</span>
              </MiniStat>
              <MiniStat label="총발급">
                <span className="tabular-nums">{context.totalIssuedCount}명</span>
              </MiniStat>
              <MiniStat label="발급일">{formatCounselorIssueDate(context.createdAt)}</MiniStat>
            </div>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-sky-100/70">
            나의코드·비밀번호가 자동 발급됩니다.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-visible px-4 py-3 sm:space-y-4 sm:px-5 sm:py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <section className="overflow-visible rounded-xl border border-white/[0.1] bg-[#101f38]/55 p-3 sm:p-3.5">
              <h4 className={FORM_LABEL}>개별 입력</h4>
              <p className="mt-0.5 text-sm text-slate-400">이메일 또는 휴대폰 중 하나 필수</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="add-recipient-name" className={FORM_LABEL}>
                    이름
                  </label>
                  <input
                    id="add-recipient-name"
                    type="text"
                    className={FORM_INPUT}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={handleDraftKeyDown}
                    disabled={addLoading}
                    placeholder="홍길동"
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
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    onKeyDown={handleDraftKeyDown}
                    disabled={addLoading}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="col-span-2 flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="add-recipient-email" className={FORM_LABEL}>
                      이메일
                    </label>
                    <input
                      id="add-recipient-email"
                      type="email"
                      className={FORM_INPUT}
                      value={draftEmail}
                      onChange={(e) => setDraftEmail(e.target.value)}
                      onKeyDown={handleDraftKeyDown}
                      disabled={addLoading}
                      placeholder="email@..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDraftRow}
                    disabled={addLoading}
                    className="shrink-0 rounded-lg bg-sky-600/90 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
                  >
                    입력
                  </button>
                </div>
              </div>
            </section>

            <section className="overflow-visible rounded-xl border border-white/[0.1] bg-[#101f38]/55 p-3 sm:p-3.5">
              <h4 className={FORM_LABEL}>파일 일괄 등록</h4>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-400">
                CSV·Excel — 이름, 이메일, 휴대폰
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept=".csv,.txt,.tsv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  disabled={addLoading}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    void handleAddRecipientFile(file);
                    e.target.value = '';
                  }}
                  className="block min-w-0 flex-1 text-sm text-slate-300 file:mr-2 file:rounded-md file:border-0 file:bg-sky-700/90 file:px-2.5 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-sky-600"
                />
              </div>
              <div
                className="relative z-20 mt-2 overflow-visible"
                onMouseLeave={() => setSamplePreviewKind(null)}
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
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
                    className="pointer-events-none absolute bottom-full left-0 z-[120] mb-1.5 w-full rounded-lg border border-sky-500/45 bg-slate-950/98 p-3 text-left shadow-2xl"
                    role="tooltip"
                    style={{ width: `min(100%, ${samplePreviewLayout.widthCh}ch)` }}
                  >
                    <p className="mb-2 text-sm font-semibold text-sky-300">
                      {samplePreviewKind === 'txt' ? '샘플 텍스트 미리보기' : '샘플 엑셀(CSV) 미리보기'}
                    </p>
                    <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-200">
                      {samplePreviewText}
                    </pre>
                  </div>
                ) : null}
              </div>
              {addFileLabel ? (
                <div className="relative z-20 mt-2 overflow-visible" onMouseLeave={() => setShowAddFilePreview(false)}>
                  <p className="truncate text-sm text-emerald-300">
                    <span
                      className="cursor-help underline decoration-dotted decoration-emerald-400/60 underline-offset-2"
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
                      className="ml-2 text-slate-500 hover:text-red-300"
                      disabled={addLoading}
                    >
                      제거
                    </button>
                  </p>
                  {showAddFilePreview && addFilePreviewText && addFilePreviewLayout ? (
                    <div className="pointer-events-none absolute bottom-full left-0 z-[120] mb-1.5" role="tooltip">
                      <div className="max-w-[min(100vw-2rem,28rem)] rounded-lg border border-sky-500/45 bg-slate-950/98 p-3 text-left shadow-2xl">
                        <p className="mb-2 text-sm font-semibold text-sky-300">파일 내용 미리보기</p>
                        <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-200">
                          {addFilePreviewText}
                          {addFilePreviewText.length >= 4000 ? '\n… (일부만 표시)' : ''}
                        </pre>
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
                {combinedRows.length}명
              </span>
            </div>
            {combinedRows.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">
                개별 입력 후 「입력」을 누르거나 파일을 첨부해 주세요.
              </p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
                {pendingRows.map((row, idx) => (
                  <li
                    key={`pending-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-slate-900/40 px-2.5 py-1.5 text-sm"
                  >
                    <span className="min-w-0 truncate text-slate-200">
                      <span className="font-medium text-white">{row.displayName}</span>
                      {row.email ? <span className="text-slate-500"> · {row.email}</span> : null}
                      {row.phone ? <span className="text-slate-500"> · {row.phone}</span> : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePendingRow(idx)}
                      disabled={addLoading}
                      className="shrink-0 text-slate-500 hover:text-red-300"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </li>
                ))}
                {addFileRows.length > 0 ? (
                  <li className="rounded-md border border-emerald-500/15 bg-emerald-950/20 px-2.5 py-1.5 text-sm text-emerald-300/90">
                    파일에서 {addFileRows.length}명 ({addFileLabel})
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
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
              <p className="text-sm text-red-300" role="alert">
                {addError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-white/[0.08] bg-black/20 px-4 py-3 sm:px-5">
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
            {addLoading ? '추가 중…' : addSendNow ? '추가 후 발송' : '추가만'}
          </button>
        </div>
      </div>
    </div>
  );
}
