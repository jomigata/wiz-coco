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

/** 상담코드·검사발송 목록 — 진행현황 색상 (발송현황과 동일 계열) */
export function assessmentProgressDisplay(a: CounselorAssessment): {
  text: string;
  className: string;
} {
  const { testIncomplete, testComplete, dispatchTotal } = resultStatusCounts(a);
  const completeSuffix = testComplete > 0 ? ` · 완료 ${testComplete}` : '';

  if (testIncomplete === 0 && testComplete > 0 && dispatchTotal > 0) {
    return { text: `완료${completeSuffix}`, className: 'font-medium text-emerald-200' };
  }
  if (testComplete > 0 && testIncomplete > 0) {
    return { text: `${testIncomplete}${completeSuffix}`, className: 'font-medium text-sky-200' };
  }
  return { text: `${testIncomplete}${completeSuffix}`, className: 'font-medium text-amber-200' };
}

/** QuickSend 등에서 title 끝에 붙는 " · N명" (최초 발송 인원) — 목록 표시에서 제외 */
export function stripAssessmentTitleDispatchCountSuffix(title: string): string {
  return title.replace(/\s·\s*\d+명\s*$/, '').trim();
}

export function assessmentGroupTitleParts(
  a: CounselorAssessment,
): { primary: string; secondary: string | null } {
  const primary = getAssessmentOrgLabel(a);
  const title = stripAssessmentTitleDispatchCountSuffix((a.title || '').trim());
  if (!title || title === '—' || title === primary || title === '완료') {
    return { primary, secondary: null };
  }
  return { primary, secondary: title };
}

export function formatPortalMoveAssessmentLabel(a: CounselorAssessment): string {
  const group = getAssessmentOrgLabel(a);
  const code = formatAccessCodeDisplay(a.accessCode || '');
  const title = (a.title || '소속 없음').trim();
  return `${group} (${code}) - ${title}`;
}
