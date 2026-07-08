import type {
  ClientPortalProgressLabel,
  CounselorClientPortalDetailResult,
  CounselorClientPortalListItem,
  CounselorPortalTestAssignmentRow,
} from '@/types/clientPortal';
import {
  buildTestsForPortal,
  type RealtimeTestResultDoc,
} from '@/lib/dispatchRealtime';

export type AssessmentMetaEntry = {
  testList: { testId: string; name: string }[];
};

function progressLabel(total: number, completed: number): ClientPortalProgressLabel {
  if (total <= 0) return 'no_tests';
  if (completed <= 0) return 'not_started';
  if (completed >= total) return 'completed';
  return 'in_progress';
}

function derivePortalTestStatus(
  completedCount: number,
  requiredCount: number,
): 'completed' | 'in_progress' | 'not_started' {
  if (requiredCount <= 0) return 'not_started';
  if (completedCount <= 0) return 'not_started';
  if (completedCount >= requiredCount) return 'completed';
  return 'in_progress';
}

function isoFromFirestore(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    const sec = (value as { _seconds?: number })._seconds;
    if (typeof sec === 'number') return new Date(sec * 1000).toISOString();
  }
  return null;
}

export function computePortalProgress(
  portalId: string,
  assessmentIds: string[],
  assessmentMeta: Record<string, AssessmentMetaEntry>,
  results: RealtimeTestResultDoc[],
): CounselorClientPortalListItem['progress'] {
  let totalTests = 0;
  let completedTests = 0;

  for (const aid of assessmentIds) {
    const meta = assessmentMeta[aid];
    if (!meta) continue;
    const tests = buildTestsForPortal(portalId, meta.testList, results);
    totalTests += tests.length;
    completedTests += tests.filter((t) => t.status === 'completed').length;
  }

  const percent = totalTests ? Math.round((completedTests / totalTests) * 100) : 0;
  return {
    totalTests,
    completedTests,
    percent,
    label: progressLabel(totalTests, completedTests),
  };
}

export function applyRealtimeToClientList(
  items: CounselorClientPortalListItem[],
  assessmentMeta: Record<string, AssessmentMetaEntry>,
  results: RealtimeTestResultDoc[],
): CounselorClientPortalListItem[] {
  if (!results.length) return items;
  return items.map((item) => {
    const assessmentIds = item.assessments.map((a) => a.assessmentId);
    return {
      ...item,
      progress: computePortalProgress(item.portalId, assessmentIds, assessmentMeta, results),
    };
  });
}

export function applyRealtimeToClientDetail(
  base: CounselorClientPortalDetailResult,
  results: RealtimeTestResultDoc[],
): CounselorClientPortalDetailResult {
  if (!results.length) return base;

  const portalId = base.portal.portalId;
  const portalResults = results.filter((r) => (r.portalId || '').trim() === portalId);

  const assessments = base.assessments.map((assessment) => {
    const assessmentResults = portalResults.filter(
      (r) => (r.assessmentId || '').trim() === assessment.assessmentId,
    );
    const tests = buildTestsForPortal(portalId, assessment.testList, assessmentResults);
    const requiredCount = tests.length;
    const completedCount = tests.filter((t) => t.status === 'completed').length;
    return {
      ...assessment,
      tests,
      requiredCount,
      completedCount,
      testStatus: derivePortalTestStatus(completedCount, requiredCount),
    };
  });

  let totalTests = 0;
  let completedTests = 0;
  for (const a of assessments) {
    totalTests += a.requiredCount;
    completedTests += a.completedCount;
  }
  const percent = totalTests ? Math.round((completedTests / totalTests) * 100) : 0;

  const recentMap = new Map(base.recentResults.map((r) => [r.resultId, r]));
  for (const doc of portalResults) {
    if ((doc.status || '').trim().toLowerCase() !== 'completed') continue;
    if (recentMap.has(doc.id)) continue;
    recentMap.set(doc.id, {
      resultId: doc.id,
      assessmentId: (doc.assessmentId || '').trim(),
      testId: (doc.testId || '').trim(),
      testType: (doc.testId || '').trim(),
      status: 'completed',
      completedAt: isoFromFirestore(doc.completedAt),
      createdAt: null,
    });
  }

  const recentResults = Array.from(recentMap.values())
    .sort((a, b) => (b.completedAt || b.createdAt || '').localeCompare(a.completedAt || a.createdAt || ''))
    .slice(0, 30);

  return {
    ...base,
    assessments,
    progress: {
      totalTests,
      completedTests,
      percent,
      label: progressLabel(totalTests, completedTests),
    },
    recentResults,
  };
}

export function applyRealtimeToAssignmentList(
  items: CounselorPortalTestAssignmentRow[],
  results: RealtimeTestResultDoc[],
): CounselorPortalTestAssignmentRow[] {
  if (!results.length) return items;

  return items.map((row) => {
    const portalResults = results.filter(
      (r) =>
        (r.portalId || '').trim() === row.portalId &&
        (r.assessmentId || '').trim() === row.assessmentId,
    );
    const tests = buildTestsForPortal(row.portalId, [{ testId: row.testId, name: row.testName }], portalResults);
    const match = tests[0];
    if (!match || match.status === row.status) return row;
    return {
      ...row,
      status: match.status,
      completedAt: match.completedAt,
      resultId: match.resultId,
    };
  });
}
