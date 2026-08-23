'use client';

import React from 'react';
import { TestResultItem } from '@/lib/assessmentApi';
import {
  formatCompletedAt,
  pickFinalResultId,
  resultSubmittedLabel,
  sortCompletedResultsForDisplay,
} from '@/lib/portalTestResults';

export type PortalTestListItem = {
  testId: string;
  name?: string;
};

export type PortalTestListProps = {
  accessCode: string;
  assessmentId: string;
  testList: PortalTestListItem[];
  results: TestResultItem[];
  onStartTest: (testId: string, resultId?: string) => void;
  onViewResult: (params: {
    testName: string;
    resultId: string;
    roundNumber: number | null;
    resultItem: TestResultItem;
  }) => void;
  /** 이전 상담 레거시 — 시작 비활성 */
  readOnly?: boolean;
};

export default function PortalTestList({
  testList,
  results,
  onStartTest,
  onViewResult,
  readOnly = false,
}: PortalTestListProps) {
  if (!testList.length) {
    return <p className="text-slate-500 text-sm">등록된 검사가 없습니다.</p>;
  }

  return (
    <ul className="space-y-2">
      {testList.map((t, index) => {
        const testName = t.name || t.testId;
        const completedResults = results.filter(
          (r) => r.status === 'completed' && String(r.testId) === String(t.testId),
        );
        const finalResultId = pickFinalResultId(completedResults);
        const completedResultsForDisplay = sortCompletedResultsForDisplay(
          completedResults,
          finalResultId,
        );
        const hasCompleted = completedResults.length > 0;

        return (
          <li
            key={t.testId}
            className="rounded-lg border border-slate-600 bg-slate-700/80 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/35 bg-cyan-950/40 text-sm font-bold tabular-nums text-cyan-300"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="font-medium text-white">{testName}</span>
                  {!hasCompleted && !readOnly ? (
                    <button
                      type="button"
                      onClick={() => onStartTest(String(t.testId))}
                      className="shrink-0 text-sm text-cyan-300 transition hover:text-cyan-200"
                    >
                      시작하기 →
                    </button>
                  ) : null}
                </div>
                <span
                  className={`mt-2 inline-block rounded px-2 py-0.5 text-xs ${
                    hasCompleted
                      ? 'border border-emerald-700/40 bg-emerald-900/50 text-emerald-300'
                      : 'border border-amber-700/30 bg-amber-900/40 text-amber-200'
                  }`}
                >
                  {hasCompleted ? '검사 실시 완료' : '미실시'}
                </span>

                {hasCompleted ? (
                  <div className="mt-3 space-y-2 border-t border-slate-600/70 pt-3">
                    {completedResultsForDisplay.map((r) => (
                      <div
                        key={r.resultId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2.5 text-sm"
                      >
                        <p className="text-slate-300">
                          검사 일시{' '}
                          <span className="font-medium text-white">
                            {formatCompletedAt(resultSubmittedLabel(r))}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            onViewResult({
                              testName,
                              resultId: r.resultId,
                              roundNumber: null,
                              resultItem: r,
                            })
                          }
                          className="shrink-0 text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          결과보기
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
