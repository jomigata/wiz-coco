import type {
  AssessmentDispatchStatus,
  DispatchRecipient,
  DispatchTestResult,
} from '@/lib/clientPortalApi';

export type RealtimeTestResultDoc = {
  id: string;
  portalId?: string;
  assessmentId?: string;
  testId?: string;
  status?: string;
  completedAt?: unknown;
};

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

function normalizeResultStatus(status: string | undefined): 'completed' | 'in_progress' {
  const s = (status || '').trim().toLowerCase().replace(/-/g, '_');
  return s === 'completed' ? 'completed' : 'in_progress';
}

function pickBestResultsForPortal(
  portalId: string,
  results: RealtimeTestResultDoc[],
): Map<string, { resultId: string; status: 'completed' | 'in_progress'; completedAt: string | null }> {
  const byTest = new Map<
    string,
    { resultId: string; status: 'completed' | 'in_progress'; completedAt: string | null }
  >();

  for (const doc of results) {
    if ((doc.portalId || '').trim() !== portalId) continue;
    const testId = (doc.testId || '').trim();
    if (!testId) continue;

    const status = normalizeResultStatus(doc.status);
    const completedAt = isoFromFirestore(doc.completedAt);
    const candidate = { resultId: doc.id, status, completedAt };
    const prev = byTest.get(testId);

    if (!prev) {
      byTest.set(testId, candidate);
      continue;
    }
    if (candidate.status === 'completed' && prev.status !== 'completed') {
      byTest.set(testId, candidate);
      continue;
    }
    if (candidate.status === 'completed' && prev.status === 'completed') {
      if ((candidate.completedAt || '') >= (prev.completedAt || '')) {
        byTest.set(testId, candidate);
      }
    }
  }

  return byTest;
}

export function buildTestsForPortal(
  portalId: string,
  testList: { testId: string; name: string }[],
  results: RealtimeTestResultDoc[],
): DispatchTestResult[] {
  const byTest = pickBestResultsForPortal(portalId, results);
  const rows: DispatchTestResult[] = [];

  for (const item of testList) {
    const testId = (item.testId || '').trim();
    if (!testId) continue;
    const testName = (item.name || testId).trim();
    const info = byTest.get(testId);
    if (info?.status === 'completed') {
      rows.push({
        testId,
        testName,
        status: 'completed',
        completedAt: info.completedAt,
        resultId: info.resultId,
      });
    } else if (info) {
      rows.push({
        testId,
        testName,
        status: 'in_progress',
        completedAt: info.completedAt,
        resultId: info.resultId,
      });
    } else {
      rows.push({
        testId,
        testName,
        status: 'not_started',
        completedAt: null,
        resultId: null,
      });
    }
  }

  return rows;
}

function derivePortalTestStatus(
  completedCount: number,
  requiredCount: number,
): DispatchRecipient['testStatus'] {
  if (requiredCount <= 0) return 'not_started';
  if (completedCount <= 0) return 'not_started';
  if (completedCount >= requiredCount) return 'completed';
  return 'in_progress';
}

function mergeRecipient(
  recipient: DispatchRecipient,
  testList: { testId: string; name: string }[],
  results: RealtimeTestResultDoc[],
): DispatchRecipient {
  const tests = buildTestsForPortal(recipient.portalId, testList, results);
  const requiredCount = tests.length;
  const completedCount = tests.filter((t) => t.status === 'completed').length;
  const testStatus = derivePortalTestStatus(completedCount, requiredCount);

  return {
    ...recipient,
    tests,
    requiredCount,
    completedCount,
    testStatus,
  };
}

/** Firestore testResults 스냅샷을 dispatch 현황 recipients에 반영 */
export function applyRealtimeTestResults(
  base: AssessmentDispatchStatus,
  results: RealtimeTestResultDoc[],
): AssessmentDispatchStatus {
  const testList = base.testList || [];
  const recipients = (base.recipients || []).map((r) => mergeRecipient(r, testList, results));
  return { ...base, recipients };
}
