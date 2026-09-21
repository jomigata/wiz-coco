'use client';

import React from 'react';
import type { DispatchTestResult } from '@/lib/clientPortalApi';
import { formatNotifyDate } from '@/lib/dispatchRecipientDisplay';

import CounselorListTableScroll from '@/components/counselor/CounselorListTableScroll';
import CounselorRecipientExpandTestName from '@/components/counselor/CounselorRecipientExpandTestName';

function testStatusLabel(status: DispatchTestResult['status']): { text: string; className: string } {
  if (status === 'completed') return { text: '완료', className: 'text-emerald-300' };
  if (status === 'in_progress') return { text: '진행 중', className: 'text-amber-300' };
  return { text: '미실시', className: 'text-slate-500' };
}

function testLetterLabel(index: number): string {
  return `${String.fromCharCode(97 + index)}.`;
}

type Props = {
  portalId: string;
  tests: DispatchTestResult[];
  leadingColSpan: number;
  detailColSpan: number;
  onOpenResult?: (resultId: string) => void;
};

export default function CounselorRecipientTestsExpandRow({
  portalId,
  tests,
  leadingColSpan,
  detailColSpan,
  onOpenResult,
}: Props) {
  return (
    <tr>
      <td colSpan={leadingColSpan} className="border-b border-slate-700/60 bg-slate-900/20 p-0" aria-hidden />
      <td
        colSpan={detailColSpan}
        className="border-b border-slate-700/60 bg-slate-900/20 px-3 py-3 pb-4 align-top"
      >
        {tests.length === 0 ? (
          <p className="text-sm text-slate-500">배정된 검사 항목이 없습니다.</p>
        ) : (
          <CounselorListTableScroll className="rounded-lg border border-slate-700/50">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 text-xs text-slate-400">
                  <th className="w-10 px-3 py-2 text-left font-medium"> </th>
                  <th className="px-3 py-2 text-left font-medium">검사명</th>
                  <th className="w-24 px-3 py-2 text-left font-medium">진행</th>
                  <th className="w-[10.5rem] px-3 py-2 text-left font-medium">완료일시</th>
                  <th className="w-[5.5rem] px-3 py-2 text-left font-medium">결과 확인</th>
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
                      <td className="px-3 py-2.5 tabular-nums text-slate-500 align-middle">
                        {testLetterLabel(testIndex)}
                      </td>
                      <td className="break-words px-3 py-2.5 text-white align-middle">
                        <CounselorRecipientExpandTestName
                          portalId={portalId}
                          testName={t.testName || ''}
                          testId={t.testId}
                        />
                      </td>
                      <td className={`px-3 py-2.5 align-middle ${st.className}`}>{st.text}</td>
                      <td className="px-3 py-2.5 text-xs leading-relaxed text-slate-400 align-middle">
                        {formatNotifyDate(t.completedAt)}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
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
          </CounselorListTableScroll>
        )}
      </td>
    </tr>
  );
}
