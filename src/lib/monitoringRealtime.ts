import type {
  CounselorMonitoringAssessment,
  CounselorMonitoringHubResult,
  ClientPortalProgressLabel,
} from '@/types/clientPortal';
import type { RealtimeTestResultDoc } from '@/lib/dispatchRealtime';
import { buildTestsForPortal } from '@/lib/dispatchRealtime';

function derivePortalTestStatus(
  completedCount: number,
  requiredCount: number,
): 'completed' | 'in_progress' | 'not_started' {
  if (requiredCount <= 0) return 'not_started';
  if (completedCount <= 0) return 'not_started';
  if (completedCount >= requiredCount) return 'completed';
  return 'in_progress';
}

function progressLabel(total: number, completed: number): ClientPortalProgressLabel {
  if (total <= 0) return 'no_tests';
  if (completed <= 0) return 'not_started';
  if (completed >= total) return 'completed';
  return 'in_progress';
}

function mergeAssessment(
  assessment: CounselorMonitoringAssessment,
  results: RealtimeTestResultDoc[],
): CounselorMonitoringAssessment {
  const aid = assessment.assessmentId;
  const assessmentResults = results.filter((r) => (r.assessmentId || '').trim() === aid);
  const testList = assessment.testList || [];

  const recipients = assessment.recipients.map((recipient) => {
    const tests = buildTestsForPortal(recipient.portalId, testList, assessmentResults);
    const requiredCount = tests.length;
    const completedCount = tests.filter((t) => t.status === 'completed').length;
    return {
      ...recipient,
      completedCount,
      requiredCount,
      testStatus: derivePortalTestStatus(completedCount, requiredCount),
    };
  });

  let completedRecipients = 0;
  let inProgressRecipients = 0;
  let notStartedRecipients = 0;
  let totalTests = 0;
  let completedTests = 0;

  for (const r of recipients) {
    totalTests += r.requiredCount;
    completedTests += r.completedCount;
    if (r.testStatus === 'completed') completedRecipients += 1;
    else if (r.testStatus === 'in_progress') inProgressRecipients += 1;
    else notStartedRecipients += 1;
  }

  const percent = totalTests ? Math.round((completedTests / totalTests) * 100) : 0;

  return {
    ...assessment,
    recipients,
    completedRecipients,
    inProgressRecipients,
    notStartedRecipients,
    totalTests,
    completedTests,
    progress: {
      totalTests,
      completedTests,
      percent,
      label: progressLabel(totalTests, completedTests),
    },
  };
}

export function applyRealtimeToMonitoringHub(
  base: CounselorMonitoringHubResult,
  results: RealtimeTestResultDoc[],
): CounselorMonitoringHubResult {
  const assessments = base.assessments.map((a) => mergeAssessment(a, results));

  const summary = {
    activeAssessments: assessments.length,
    activePortals: base.summary.activePortals,
    totalRecipients: assessments.reduce((n, a) => n + a.recipientCount, 0),
    completedRecipients: assessments.reduce((n, a) => n + a.completedRecipients, 0),
    inProgressRecipients: assessments.reduce((n, a) => n + a.inProgressRecipients, 0),
    notStartedRecipients: assessments.reduce((n, a) => n + a.notStartedRecipients, 0),
    notifyFailedCount: base.summary.notifyFailedCount,
  };

  const portalNames = new Map<string, string>();
  for (const a of assessments) {
    for (const r of a.recipients) {
      portalNames.set(r.portalId, r.displayName);
    }
  }

  const recentFromLive: CounselorMonitoringHubResult['recentActivity'] = [];
  for (const doc of results) {
    if (normalizeResultStatus(doc.status) !== 'completed') continue;
    const aid = (doc.assessmentId || '').trim();
    const pid = (doc.portalId || '').trim();
    const assessment = assessments.find((a) => a.assessmentId === aid);
    if (!assessment || !pid) continue;
    recentFromLive.push({
      resultId: doc.id,
      portalId: pid,
      displayName: portalNames.get(pid) || '',
      assessmentId: aid,
      assessmentTitle: assessment.title,
      testId: (doc.testId || '').trim(),
      completedAt: isoFromFirestore(doc.completedAt),
    });
  }

  const recentActivity = [...recentFromLive]
    .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
    .slice(0, 40);

  const fallbackRecent =
    recentActivity.length > 0 ? recentActivity : base.recentActivity;

  return {
    ...base,
    summary,
    assessments,
    recentActivity: fallbackRecent,
  };
}

function normalizeResultStatus(status: string | undefined): 'completed' | 'in_progress' {
  const s = (status || '').trim().toLowerCase().replace(/-/g, '_');
  return s === 'completed' ? 'completed' : 'in_progress';
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
