'use client';

import React from 'react';
import { TestResultItem } from '@/lib/assessmentApi';
import {
  assignRoundNumbers,
  formatCompletedAt,
  pickFinalResultId,
  resultSubmittedLabel,
  resultUpdatedLabel,
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
  onDeleteResult: (params: {
    resultId: string;
    testName: string;
    accessCode: string;
    roundNumber: number | null;
  }) => void;
  /** 이전 상담 레거시 — 시작·수정·삭제 비활성 */
  readOnly?: boolean;
};

export default function PortalTestList({
  accessCode,
  testList,
  results,
  onStartTest,
  onViewResult,
  onDeleteResult,
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
        const roundById = assignRoundNumbers(completedResults);
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
                        className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2.5 text-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-white">
                              <span>
                                {roundById.get(r.resultId) ?? '—'}회차
                                {finalResultId && r.resultId === finalResultId ? (
                                  <span className="ml-1.5 font-semibold text-red-400">✓ 최종</span>
                                ) : null}
                              </span>
                              <span className="font-normal text-slate-300">
                                {' '}
                                · 제출 {formatCompletedAt(resultSubmittedLabel(r))}
                                {resultUpdatedLabel(r) ? (
                                  <span className="text-slate-400">
                                    {' '}
                                    (수정 {formatCompletedAt(resultUpdatedLabel(r))})
                                  </span>
                                ) : null}
                              </span>
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onViewResult({
                                  testName,
                                  resultId: r.resultId,
                                  roundNumber: roundById.get(r.resultId) ?? null,
                                  resultItem: r,
                                })
                              }
                              className="text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              결과보기
                            </button>
                            {!readOnly && !r.isShared ? (
                              <button
                                type="button"
                                onClick={() => onStartTest(String(t.testId), r.resultId)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                수정
                              </button>
                            ) : null}
                            {!readOnly && !r.isShared ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onDeleteResult({
                                    resultId: r.resultId,
                                    testName,
                                    accessCode,
                                    roundNumber: roundById.get(r.resultId) ?? null,
                                  })
                                }
                                className="text-xs text-red-400 hover:text-red-300"
                              >
                                삭제
                              </button>
                            ) : null}
                          </div>
                        </div>
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
