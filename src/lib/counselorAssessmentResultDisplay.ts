import type { CounselorAssessment } from '@/lib/assessmentApi';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';

export function resultStatusCounts(a: CounselorAssessment) {
  const dispatchSent = a.dispatchSentCount ?? 0;
  const dispatchFailed = a.dispatchFailedCount ?? 0;
  const dispatchSending = a.dispatchSendingCount ?? 0;
  const testComplete = a.testCompleteCount ?? a.emailsCompletedAllTestsCount ?? 0;
  const testIncomplete = a.testIncompleteCount ?? a.emailsNotCompletedAllTestsCount ?? 0;
  const dispatchTotal = Math.max(testComplete + testIncomplete, dispatchSent + dispatchFailed + dispatchSending);
  return {
    dispatchFailed,
    dispatchSending,
    testIncomplete,
    testComplete,
    dispatchTotal,
    dispatchSent,
  };
}

export function formatDispatchFailedMetric(a: CounselorAssessment): string {
  const { dispatchSending, dispatchFailed } = resultStatusCounts(a);
  if (dispatchSending > 0) return '발송중…';
  return String(dispatchFailed);
}

export function formatTestIncompleteMetric(a: CounselorAssessment): string {
  const { testIncomplete, testComplete, dispatchTotal } = resultStatusCounts(a);
  if (testIncomplete === 0 && testComplete > 0 && dispatchTotal > 0) return '완료';
  return String(testIncomplete);
}

export function assessmentGroupTitleParts(
  a: CounselorAssessment,
): { primary: string; secondary: string | null } {
  const primary = getAssessmentOrgLabel(a);
  const title = (a.title || '').trim();
  if (!title || title === '—' || title === primary || title === '완료') {
    return { primary, secondary: null };
  }
  return { primary, secondary: title };
}

export function formatPortalMoveAssessmentLabel(a: CounselorAssessment): string {
  const group = getAssessmentOrgLabel(a);
  const code = formatAccessCodeDisplay(a.accessCode || '');
  const title = (a.title || '제목 없음').trim();
  return `${group} (${code}) - ${title}`;
}
