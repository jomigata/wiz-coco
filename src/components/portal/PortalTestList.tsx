'use client';

import React from 'react';
import { TestResultItem } from '@/lib/assessmentApi';
import {
  assignRoundNumbers,
  formatCompletedAt,
  makeTestExpandKey,
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
  expandedTestKey: string | null;
  onExpandedChange: (key: string | null) => void;
  onStartTest: (testId: string, resultId?: string) => void;
  onViewResult: (params: {
    testName: string;
    resultId: string;
    roundNumber: number | null;
    resultItem: TestResultItem;
  }) => void;
  onDeleteResult: (params: { resultId: string; testName: string; accessCode: string }) => void;
};

export default function PortalTestList({
  accessCode,
  assessmentId,
  testList,
  results,
  expandedTestKey,
  onExpandedChange,
  onStartTest,
  onViewResult,
  onDeleteResult,
}: PortalTestListProps) {
  if (!testList.length) {
    return <p className="text-slate-500 text-sm">등록된 검사가 없습니다.</p>;
  }

  return (
    <ul className="space-y-2">
      {testList.map((t) => {
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
        const expandKey = makeTestExpandKey(assessmentId, String(t.testId));
        const isExpanded = expandedTestKey === expandKey;

        return (
          <li key={t.testId}>
            <button
              type="button"
              onClick={() => {
                if (!hasCompleted) {
                  onStartTest(String(t.testId));
                  return;
                }
                onExpandedChange(isExpanded ? null : expandKey);
              }}
              className="w-full text-left py-3 px-4 rounded-lg bg-slate-700/80 border border-slate-600 hover:bg-slate-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-white font-medium">{testName}</span>
                <span className="text-slate-400 text-sm">
                  {hasCompleted
                    ? `${completedResults.length}회 완료 · ${isExpanded ? '접기' : '내역 보기'}`
                    : '미완료 · 시작하기'}{' '}
                  →
                </span>
              </div>
              <span
                className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                  hasCompleted
                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40'
                    : 'bg-amber-900/40 text-amber-200 border border-amber-700/30'
                }`}
              >
                {hasCompleted ? '검사 실시 완료' : '미실시'}
              </span>
            </button>

            {hasCompleted && isExpanded ? (
              <div className="mt-2 ml-2 pl-3 border-l-2 border-slate-600 space-y-2">
                {completedResultsForDisplay.map((r) => (
                  <div
                    key={r.resultId}
                    className="rounded-lg bg-slate-800/80 border border-slate-600 px-3 py-2.5 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-medium">
                          <span>
                            {roundById.get(r.resultId) ?? '—'}회차
                            {finalResultId && r.resultId === finalResultId ? (
                              <span className="ml-1.5 text-red-400 font-semibold">✓ 최종</span>
                            ) : null}
                          </span>
                          <span className="text-slate-300 font-normal">
                            {' '}
                            · 제출 {formatCompletedAt(resultSubmittedLabel(r))}
                            {r.updatedAt ? (
                              <span className="text-slate-400">
                                {' '}
                                (수정 {formatCompletedAt(r.updatedAt)})
                              </span>
                            ) : null}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
                          className="text-emerald-400 hover:text-emerald-300 text-xs"
                        >
                          결과보기
                        </button>
                        {!r.isShared ? (
                          <button
                            type="button"
                            onClick={() => onStartTest(String(t.testId), r.resultId)}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            수정
                          </button>
                        ) : null}
                        {!r.isShared ? (
                          <button
                            type="button"
                            onClick={() =>
                              onDeleteResult({
                                resultId: r.resultId,
                                testName,
                                accessCode,
                              })
                            }
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            삭제
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onStartTest(String(t.testId))}
                  className="text-xs text-cyan-400 hover:text-cyan-300 px-1 py-1"
                >
                  재검사하기
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
