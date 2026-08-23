'use client';

import React from 'react';
import type { PortalLegacyTestGroup, PortalLegacyResultItem } from '@/lib/clientPortalApi';
import { TestResultItem } from '@/lib/assessmentApi';
import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import PortalTestList from '@/components/portal/PortalTestList';

function toTestResultItems(items: PortalLegacyResultItem[]): TestResultItem[] {
  return items.map((r) => ({
    resultId: r.resultId,
    testId: r.testId,
    status: r.status,
    completedAt: r.completedAt,
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
  }));
}

export type PortalLegacyMaterialsPanelProps = {
  legacyTests: PortalLegacyTestGroup[];
  onViewResult: (
    accessCode: string,
    params: {
      testName: string;
      resultId: string;
      roundNumber: number | null;
      resultItem: TestResultItem;
    },
  ) => void;
};

/** 기타 자료 — 이전 상담 완료 검사 (검사명만 표시) */
export default function PortalLegacyMaterialsPanel({
  legacyTests,
  onViewResult,
}: PortalLegacyMaterialsPanelProps) {
  const entries = legacyTests.flatMap((group) => {
    const code = normalizeAccessCodeInput(group.originAccessCode);
    const results = toTestResultItems(group.results);
    return (group.testList || []).map((t) => ({
      key: `${group.originAssessmentId}:${t.testId}`,
      accessCode: code,
      assessmentKey: `legacy-${group.originAssessmentId}-${t.testId}`,
      test: t,
      results: results.filter((r) => String(r.testId) === String(t.testId)),
    }));
  });

  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-slate-600 bg-slate-800/80 p-6">
        <p className="text-slate-400 text-sm">기타 자료가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <PortalTestList
          key={entry.key}
          accessCode={entry.accessCode}
          assessmentId={entry.assessmentKey}
          testList={[entry.test]}
          results={entry.results}
          onStartTest={() => {}}
          onViewResult={({ testName, resultId, roundNumber, resultItem }) =>
            onViewResult(entry.accessCode, { testName, resultId, roundNumber, resultItem })
          }
          readOnly
        />
      ))}
    </div>
  );
}
