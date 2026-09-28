import type {
  ClientPortalProgressLabel,
  CounselorClientPortalDetailResult,
  CounselorClientPortalListItem,
  CounselorPortalTestAssignmentRow,
} from '@/types/clientPortal';
import type { DispatchTestResult } from '@/lib/clientPortalApi';
import {
  buildTestsForPortal,
  dedupeDispatchTestsByTestId,
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

/** 내담자 목록 펼침 — 진행현황과 동일하게 배정된 모든 상담(코드) 검사 행 */
export function buildExpandTestsForClientList(
  item: CounselorClientPortalListItem,
  assessmentMeta: Record<string, AssessmentMetaEntry>,
  results: RealtimeTestResultDoc[],
  fallbackPrimaryTests?: DispatchTestResult[] | null,
): DispatchTestResult[] {
  const aids = item.assessments.map((a) => a.assessmentId).filter(Boolean);
  if (aids.length === 0) {
    return fallbackPrimaryTests?.length ? fallbackPrimaryTests : [];
  }
  const rows: DispatchTestResult[] = [];
  for (const aid of aids) {
    const meta = assessmentMeta[aid];
    if (!meta?.testList?.length) continue;
    rows.push(...buildTestsForPortal(item.portalId, meta.testList, results));
  }
  if (rows.length > 0) return dedupeDispatchTestsByTestId(rows);
  return fallbackPrimaryTests?.length ? dedupeDispatchTestsByTestId(fallbackPrimaryTests) : [];
}

function mergeProgressWithCareSlice(
  testProgress: CounselorClientPortalListItem['progress'],
  careSlice?: CounselorClientPortalListItem['progressCare'],
): CounselorClientPortalListItem['progress'] {
  const careTotal = careSlice?.totalTests ?? 0;
  const careCompleted = careSlice?.completedTests ?? 0;
  const totalTests = testProgress.totalTests + careTotal;
  const completedTests = testProgress.completedTests + careCompleted;
  const percent = totalTests ? Math.round((completedTests / totalTests) * 100) : 0;
  return {
    totalTests,
    completedTests,
    percent,
    label: progressLabel(totalTests, completedTests),
  };
}

export function computePortalProgress(
  portalId: string,
  assessmentIds: string[],
  assessmentMeta: Record<string, AssessmentMetaEntry>,
  results: RealtimeTestResultDoc[],
  careSlice?: CounselorClientPortalListItem['progressCare'],
): CounselorClientPortalListItem['progress'] {
  const merged: DispatchTestResult[] = [];
  for (const aid of assessmentIds) {
    const meta = assessmentMeta[aid];
    if (!meta) continue;
    merged.push(...buildTestsForPortal(portalId, meta.testList, results));
  }
  const unique = dedupeDispatchTestsByTestId(merged);
  const testProgress = {
    totalTests: unique.length,
    completedTests: unique.filter((t) => t.status === 'completed').length,
    percent: 0,
    label: progressLabel(0, 0) as CounselorClientPortalListItem['progress']['label'],
  };
  testProgress.percent = testProgress.totalTests
    ? Math.round((testProgress.completedTests / testProgress.totalTests) * 100)
    : 0;
  testProgress.label = progressLabel(testProgress.totalTests, testProgress.completedTests);
  return mergeProgressWithCareSlice(testProgress, careSlice);
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
      progress: computePortalProgress(
        item.portalId,
        assessmentIds,
        assessmentMeta,
        results,
        item.progressCare,
      ),
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
