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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-sky-400/20 bg-gradient-to-r from-sky-600/20 via-sky-500/10 to-transparent px-5 py-4">
          <h3 className="text-lg font-semibold text-white">내담자 추가</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            개별 입력 또는 파일로 등록합니다. 나의코드·비밀번호가 자동 발급됩니다.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-white/[0.06] bg-[#0f1d33]/50 px-5 py-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  그룹명/제목
                </dt>
                <dd className="mt-1 font-medium leading-snug text-white">{groupTitleLine}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  상담코드
                </dt>
                <dd className="mt-1 font-mono text-base tracking-wider text-cyan-300">
                  {formatAccessCodeDisplay(context.accessCode)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  총 발급 코드
                </dt>
                <dd className="mt-1 font-semibold tabular-nums text-white">
                  {context.totalIssuedCount}
                  <span className="ml-0.5 text-sm font-normal text-slate-400">명</span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  최초 코드 발급일
                </dt>
                <dd className="mt-1 text-slate-200">{formatCounselorIssueDate(context.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-5 px-5 py-4">
            <section className="rounded-xl border border-white/[0.08] bg-black/15 p-4">
              <h4 className="text-sm font-semibold text-slate-200">파일 일괄 등록</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                CSV·Excel — 이름, 이메일, 휴대폰 열 (첫 줄 헤더 가능)
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
                className="mt-3 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-700/80 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-sky-600"
              />
              {addFileLabel ? (
                <div className="relative mt-2" onMouseLeave={() => setShowAddFilePreview(false)}>
                  <p className="text-xs text-emerald-300">
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
                        className="rounded-lg border border-sky-500/45 bg-slate-950/98 p-3 text-left shadow-lg"
                        style={{ width: `min(calc(100vw - 3rem), ${addFilePreviewLayout.widthCh}ch)` }}
                      >
                        <p className="mb-2 text-xs font-semibold text-sky-300">파일 내용 미리보기</p>
                        <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-200">
                          {addFilePreviewText}
                          {addFilePreviewText.length >= 4000 ? '\n… (일부만 표시)' : ''}
                        </pre>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="rounded-xl border border-white/[0.08] bg-black/15 p-4">
              <h4 className="text-sm font-semibold text-slate-200">개별 입력</h4>
              <p className="mt-1 text-xs text-slate-500">이메일 또는 휴대폰 중 하나는 필수입니다.</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="add-recipient-name" className="mb-1.5 block text-xs font-medium text-slate-400">
                    이름
                  </label>
                  <input
                    id="add-recipient-name"
                    type="text"
                    className={`${FORM_INPUT} py-2.5`}
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    disabled={addLoading}
                    placeholder="홍길동"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="add-recipient-email" className="mb-1.5 block text-xs font-medium text-slate-400">
                      이메일
                    </label>
                    <input
                      id="add-recipient-email"
                      type="email"
                      className={`${FORM_INPUT} py-2.5`}
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      disabled={addLoading}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="add-recipient-phone" className="mb-1.5 block text-xs font-medium text-slate-400">
                      휴대폰
                    </label>
                    <input
                      id="add-recipient-phone"
                      type="tel"
                      className={`${FORM_INPUT} py-2.5`}
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      disabled={addLoading}
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
              </div>
            </section>

            <label className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300">
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
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
                {addError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-white/[0.08] bg-black/20 px-5 py-3.5">
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
