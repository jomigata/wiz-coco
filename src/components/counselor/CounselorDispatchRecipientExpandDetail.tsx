'use client';

import React from 'react';
import Link from 'next/link';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { buildAssessmentProgressHref } from '@/lib/counselorAssessmentListSearch';
import { DISPATCH_SUCCESS_TEXT_CLASS } from '@/lib/dispatchRecipientDisplay';
import {
  counselorListTheadClass,
} from '@/lib/counselorListTableStyles';
import CounselorNextTestRecommendCard from '@/components/counselor/CounselorNextTestRecommendCard';
import CounselorQuickCareRecommendCard from '@/components/counselor/CounselorQuickCareRecommendCard';
import type { DispatchRecipient, DispatchTestResult } from '@/lib/clientPortalApi';

function formatCompletedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function testLetterLabel(index: number): string {
  return `${String.fromCharCode(97 + index)}.`;
}

function isMovedOutRecipient(r: DispatchRecipient): boolean {
  return r.moveStatus === 'moved_out';
}

export type CounselorDispatchRecipientExpandContentProps = {
  recipient: DispatchRecipient;
  tests: DispatchTestResult[];
  assessmentId: string;
  searchQuery?: string;
  showRecommendCards?: boolean;
  onOpenResult?: (resultId: string) => void;
  onRestoreTombstone?: (tombstoneId: string) => void;
  restoreLoading?: boolean;
  onRecommendAssigned?: () => void;
};

export function CounselorDispatchRecipientExpandContent({
  recipient,
  tests,
  assessmentId,
  searchQuery = '',
  showRecommendCards = false,
  onOpenResult,
  onRestoreTombstone,
  restoreLoading = false,
  onRecommendAssigned,
}: CounselorDispatchRecipientExpandContentProps) {
  const r = recipient;

  return (
    <>
      {isMovedOutRecipient(r) ? (
        <div className="mb-3 rounded-lg border border-slate-600/80 bg-slate-950/55 px-4 py-3 text-sm">
          <p className="font-medium text-slate-300">
            상담코드 ({formatAccessCodeDisplay(r.movedToJoinAccessCode || '') || '—'}) 로 이동 완료
          </p>
          <p className="mt-1 text-slate-400">
            {r.movedToAssessmentTitle || '다른 상담코드'}(
            {formatAccessCodeDisplay(r.movedToJoinAccessCode || '') || '—'})로 이동했습니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.movedToAssessmentId ? (
              <Link
                href={buildAssessmentProgressHref(r.movedToAssessmentId, searchQuery)}
                className="rounded-md border border-sky-500/40 bg-sky-950/40 px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-900/50"
                onClick={(e) => e.stopPropagation()}
              >
                이동한 상담코드로 가기
              </Link>
            ) : null}
            {r.tombstoneId && onRestoreTombstone ? (
              <button
                type="button"
                disabled={restoreLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onRestoreTombstone(r.tombstoneId!);
                }}
                className="rounded-md border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-900/40 disabled:opacity-50"
              >
                이전 코드로 복구
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {tests.length === 0 ? (
        <p className="rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm text-slate-500">
          등록된 검사 항목이 없습니다.
        </p>
      ) : (
        <div className="max-w-2xl overflow-hidden rounded-lg border border-slate-600/80 bg-slate-950/55 shadow-inner">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-10" />
              <col />
              <col className="w-[5.5rem]" />
              <col className="w-[10.5rem]" />
              <col className="w-[5.5rem]" />
            </colgroup>
            <thead className={counselorListTheadClass}>
              <tr className="border-b border-slate-700/70 bg-slate-900/40 text-xs text-slate-400">
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
                    <td className="px-3 py-2.5 align-top tabular-nums text-slate-500">
                      {testLetterLabel(testIndex)}
                    </td>
                    <td className="break-words px-3 py-2.5 align-top text-white">
                      {t.testName || t.testId}
                    </td>
                    <td className={`px-3 py-2.5 align-top ${st.className}`}>{st.text}</td>
                    <td className="px-3 py-2.5 align-top text-xs leading-relaxed text-slate-400">
                      {formatCompletedAt(t.completedAt)}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      {t.status === 'completed' && t.resultId && onOpenResult ? (
                        <button
                          type="button"
                          onClick={() => onOpenResult(t.resultId!)}
                          className="whitespace-nowrap text-blue-400 hover:text-blue-300"
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
      {showRecommendCards && !isMovedOutRecipient(r) ? (
        <>
          <CounselorNextTestRecommendCard
            assessmentId={assessmentId}
            recipient={r}
            onAssigned={onRecommendAssigned}
          />
          <CounselorQuickCareRecommendCard recipient={r} onAssigned={onRecommendAssigned} />
        </>
      ) : null}
    </>
  );
}

type ExpandRowProps = CounselorDispatchRecipientExpandContentProps & {
  leadingColSpan: number;
  detailColSpan: number;
};

export default function CounselorDispatchRecipientExpandRow({
  leadingColSpan,
  detailColSpan,
  ...contentProps
}: ExpandRowProps) {
  return (
    <tr>
      <td
        colSpan={leadingColSpan}
        className="border-b border-slate-700/60 bg-slate-900/20 p-0"
        aria-hidden="true"
      />
      <td
        colSpan={detailColSpan}
        className="border-b border-slate-700/60 bg-slate-900/20 px-3 py-3 pb-4 align-top"
      >
        <CounselorDispatchRecipientExpandContent {...contentProps} />
      </td>
    </tr>
  );
}
