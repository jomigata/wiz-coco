'use client';

import React from 'react';
import { TestResultItem } from '@/lib/assessmentApi';
import {
  formatCompletedAt,
  pickFinalResultId,
  resultSubmittedLabel,
  sortCompletedResultsForDisplay,
} from '@/lib/portalTestResults';
import type { PortalDashboardAssessment } from '@/lib/clientPortalApi';
import { PORTAL_COMPLETED_RESULTS_TITLE } from '@/lib/portalCareManagerLabels';

type Props = {
  assessments: PortalDashboardAssessment[];
  resultsByCode: Record<string, TestResultItem[]>;
  onViewResult: (params: {
    accessCode: string;
    testName: string;
    resultId: string;
    roundNumber: number | null;
    resultItem: TestResultItem;
  }) => void;
};

export default function PortalReportsPanel({ assessments, resultsByCode, onViewResult }: Props) {
  const rows: Array<{
    key: string;
    groupTitle: string;
    testName: string;
    completedAt: string;
    resultId: string;
    accessCode: string;
    resultItem: TestResultItem;
  }> = [];

  for (const a of assessments) {
    const code = (a.accessCode || '').replace(/\s/g, '').toUpperCase();
    const results = resultsByCode[code] || [];
    const org = (a.cohortName || a.title || '—').trim();
    const title = (a.title || '—').trim();
    const groupTitle = !title || title === org ? org : `${org} / ${title}`;

    for (const t of a.testList || []) {
      const completedResults = results.filter(
        (r) => r.status === 'completed' && String(r.testId) === String(t.testId),
      );
      if (!completedResults.length) continue;
      const finalResultId = pickFinalResultId(completedResults);
      const sorted = sortCompletedResultsForDisplay(completedResults, finalResultId);
      const latest = sorted[0];
      if (!latest) continue;
      rows.push({
        key: `${a.assessmentId}:${t.testId}:${latest.resultId}`,
        groupTitle,
        testName: t.name || t.testId,
        completedAt: formatCompletedAt(resultSubmittedLabel(latest)),
        resultId: latest.resultId,
        accessCode: code,
        resultItem: latest,
      });
    }
  }

  if (!rows.length) {
    return (
      <section className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-6">
        <h2 className="text-base font-semibold text-white">{PORTAL_COMPLETED_RESULTS_TITLE}</h2>
        <p className="mt-3 text-sm text-slate-400">완료된 검사 결과가 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-5">
      <h2 className="mb-4 text-base font-semibold text-white">{PORTAL_COMPLETED_RESULTS_TITLE}</h2>
      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={row.key}>
            <button
              type="button"
              onClick={() =>
                onViewResult({
                  accessCode: row.accessCode,
                  testName: row.testName,
                  resultId: row.resultId,
                  roundNumber: null,
                  resultItem: row.resultItem,
                })
              }
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-600 bg-slate-700/80 px-4 py-3 text-left transition hover:border-violet-500/40 hover:bg-slate-700"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {index + 1}. {row.testName}
                  <span className="ml-2 font-normal text-slate-400">· {row.completedAt}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{row.groupTitle}</p>
              </div>
              <span className="shrink-0 text-sm text-violet-300">결과보기 →</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
