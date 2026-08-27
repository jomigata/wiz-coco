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
        const latestResult = completedResultsForDisplay[0];

        const openResult = () => {
          if (!latestResult) return;
          onViewResult({
            testName,
            resultId: latestResult.resultId,
            roundNumber: null,
            resultItem: latestResult,
          });
        };

        return (
          <li
            key={t.testId}
            className={`rounded-lg border border-slate-600 bg-slate-700/80 px-4 py-3 ${
              readOnly
                ? hasCompleted
                  ? 'cursor-pointer transition hover:border-emerald-500/35 hover:bg-slate-700'
                  : ''
                : 'cursor-pointer transition hover:border-cyan-500/35 hover:bg-slate-700'
            }`}
            onClick={() => {
              if (readOnly) {
                if (hasCompleted) openResult();
                return;
              }
              if (hasCompleted) {
                openResult();
              } else {
                onStartTest(String(t.testId));
              }
            }}
            onKeyDown={
              readOnly && !hasCompleted
                ? undefined
                : (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (hasCompleted) openResult();
                      else if (!readOnly) onStartTest(String(t.testId));
                    }
                  }
            }
            role={readOnly && !hasCompleted ? undefined : 'button'}
            tabIndex={readOnly && !hasCompleted ? undefined : 0}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/35 bg-cyan-950/40 text-sm font-bold tabular-nums text-cyan-300"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-white">{testName}</span>
                  {hasCompleted ? (
                    <span className="shrink-0 text-sm text-emerald-400">결과보기 →</span>
                  ) : !readOnly ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartTest(String(t.testId));
                      }}
                      className="shrink-0 text-sm text-cyan-300 transition hover:text-cyan-200"
                    >
                      시작하기 →
                    </button>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs ${
                      hasCompleted
                        ? 'border border-emerald-700/40 bg-emerald-900/50 text-emerald-300'
                        : 'border border-amber-700/30 bg-amber-900/40 text-amber-200'
                    }`}
                  >
                    {hasCompleted ? '검사 실시 완료' : '미실시'}
                  </span>
                  {hasCompleted && latestResult ? (
                    <span className="text-[11px] text-slate-400">
                      {formatCompletedAt(resultSubmittedLabel(latestResult))}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
