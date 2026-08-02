'use client';

import React, { useMemo, useState } from 'react';
import { bulkCreateClientPortals } from '@/lib/clientPortalApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { normalizeRecipientPhone } from '@/lib/phoneFormat';
import { FORM_INPUT } from '@/lib/assessmentFormUi';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import { formatCounselorIssueDate } from '@/lib/counselorListTableStyles';
import type { CounselorAssessment } from '@/lib/assessmentApi';
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

type Props = {
  open: boolean;
  onClose: () => void;
  context: AssessmentAddRecipientContext | null;
  onSuccess?: () => void;
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

function InfoCard({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-sky-400/15 bg-[#0f1d33]/70 px-3 py-2.5 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 min-w-0 text-sm leading-snug text-white">{children}</div>
    </div>
  );
}

export default function AssessmentAddRecipientModal({
  open,
  onClose,
  context,
  onSuccess,
}: Props) {
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addSendNow, setAddSendNow] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addFileRows, setAddFileRows] = useState<RecipientRow[]>([]);
  const [addFileLabel, setAddFileLabel] = useState('');
  const [addFilePreviewText, setAddFilePreviewText] = useState('');
  const [showAddFilePreview, setShowAddFilePreview] = useState(false);

  const addFilePreviewLayout = useMemo(() => {
    if (!addFilePreviewText) return null;
    const lines = addFilePreviewText.split('\n');
    const widthCh = Math.min(72, Math.max(24, ...lines.map((l) => l.length)));
    return { widthCh };
  }, [addFilePreviewText]);

  const resetForm = () => {
    setAddName('');
    setAddEmail('');
    setAddPhone('');
    setAddSendNow(true);
    setAddError('');
    setAddFileRows([]);
    setAddFileLabel('');
    setAddFilePreviewText('');
    setShowAddFilePreview(false);
  };

  const handleClose = () => {
    if (addLoading) return;
    resetForm();
    onClose();
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

  const handleSubmit = async () => {
    if (!context) return;
    const manualRows: RecipientRow[] = addName.trim()
      ? [
          {
            displayName: addName.trim(),
            email: addEmail.trim().toLowerCase(),
            phone: normalizeRecipientPhone(addPhone),
          },
        ]
      : [];
    const rows = mergeRecipients(manualRows, addFileRows);
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
      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '내담자 추가에 실패했습니다.');
    } finally {
      setAddLoading(false);
    }
  };

  if (!open || !context) return null;

  const groupTitleLine = `${context.cohortName}/${context.title}`;
  const compactInput = `${FORM_INPUT} py-2 text-sm`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      onClick={handleClose}
    >
      <div
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-sky-400/20 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3 sm:px-5">
          <h3 className="text-base font-bold text-white sm:text-lg">내담자 추가</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-sky-100/70 sm:text-sm">
            나의코드·비밀번호가 자동 발급됩니다.
          </p>
        </div>

        <div className="space-y-3 px-4 py-3 sm:space-y-4 sm:px-5 sm:py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <InfoCard label="그룹명/제목" className="col-span-2 sm:col-span-2">
              <p className="truncate font-medium" title={groupTitleLine}>
                {groupTitleLine}
              </p>
            </InfoCard>
            <InfoCard label="상담코드">
              <p className="font-mono text-base font-bold tracking-wider text-cyan-300">
                {formatAccessCodeDisplay(context.accessCode)}
              </p>
            </InfoCard>
            <InfoCard label="총 발급">
              <p className="font-semibold tabular-nums">
                {context.totalIssuedCount}
                <span className="ml-0.5 text-xs font-normal text-slate-400">명</span>
              </p>
            </InfoCard>
            <InfoCard label="최초 발급일" className="col-span-2 sm:col-span-4">
              <p className="text-slate-200">{formatCounselorIssueDate(context.createdAt)}</p>
            </InfoCard>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <section className="rounded-xl border border-white/[0.1] bg-[#101f38]/55 p-3 sm:p-3.5">
              <h4 className="text-sm font-bold text-sky-100">개별 입력</h4>
              <p className="mt-0.5 text-[11px] text-slate-500">이메일 또는 휴대폰 중 하나 필수</p>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label htmlFor="add-recipient-name" className="mb-1 block text-[11px] font-medium text-slate-400">
                    이름
                  </label>
                  <input
                    id="add-recipient-name"
                    type="text"
                    className={compactInput}
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    disabled={addLoading}
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label htmlFor="add-recipient-email" className="mb-1 block text-[11px] font-medium text-slate-400">
                    이메일
                  </label>
                  <input
                    id="add-recipient-email"
                    type="email"
                    className={compactInput}
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    disabled={addLoading}
                    placeholder="email@..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="add-recipient-phone" className="mb-1 block text-[11px] font-medium text-slate-400">
                    휴대폰
                  </label>
                  <input
                    id="add-recipient-phone"
                    type="tel"
                    className={compactInput}
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    disabled={addLoading}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/[0.1] bg-[#101f38]/55 p-3 sm:p-3.5">
              <h4 className="text-sm font-bold text-sky-100">파일 일괄 등록</h4>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                CSV·Excel — 이름, 이메일, 휴대폰
              </p>
              <input
                type="file"
                accept=".csv,.txt,.tsv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                disabled={addLoading}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  void handleAddRecipientFile(file);
                  e.target.value = '';
                }}
                className="mt-2.5 block w-full min-w-0 text-xs text-slate-300 file:mr-2 file:rounded-md file:border-0 file:bg-sky-700/90 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-sky-600"
              />
              {addFileLabel ? (
                <div className="relative mt-2" onMouseLeave={() => setShowAddFilePreview(false)}>
                  <p className="truncate text-xs text-emerald-300">
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
                  </p>
                  {showAddFilePreview && addFilePreviewText && addFilePreviewLayout ? (
                    <div className="absolute left-0 top-full z-30 pt-1.5" role="tooltip">
                      <div
                        className="max-w-[min(100vw-2rem,28rem)] rounded-lg border border-sky-500/45 bg-slate-950/98 p-3 text-left shadow-lg"
                      >
                        <p className="mb-2 text-xs font-semibold text-sky-300">파일 내용 미리보기</p>
                        <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-200">
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
              <p className="text-xs text-red-300 sm:text-sm" role="alert">
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
