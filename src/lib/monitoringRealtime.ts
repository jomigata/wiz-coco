import type {
  CounselorMonitoringAssessment,
  CounselorMonitoringHubResult,
  CounselorCohortMonitoringResult,
  CounselorCohortMonitoringItem,
  CounselorCohortMonitoringAssessment,
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

export const INDIVIDUAL_COHORT_KEY = '__individual__';

function recipientMatchesCohortFilter(
  recipient: { cohortId?: string | null; cohortKey?: string },
  cohortFilter: string,
): boolean {
  if (!cohortFilter) return true;
  if (cohortFilter === INDIVIDUAL_COHORT_KEY) {
    return cohortKeyFromRecipient(recipient) === INDIVIDUAL_COHORT_KEY;
  }
  return (recipient.cohortId || '').trim() === cohortFilter;
}

export function filterHubByCohort(
  hub: CounselorMonitoringHubResult,
  cohortFilter: string,
): CounselorMonitoringHubResult {
  if (!cohortFilter) return hub;

  const assessments = hub.assessments
    .map((assessment) => {
      const recipients = assessment.recipients.filter((r) =>
        recipientMatchesCohortFilter(r, cohortFilter),
      );
      if (recipients.length === 0) return null;

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
        recipientCount: recipients.length,
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
    })
    .filter((a): a is CounselorMonitoringAssessment => a !== null);

  const summary = {
    activeAssessments: assessments.length,
    activePortals: hub.summary.activePortals,
    totalRecipients: assessments.reduce((n, a) => n + a.recipientCount, 0),
    completedRecipients: assessments.reduce((n, a) => n + a.completedRecipients, 0),
    inProgressRecipients: assessments.reduce((n, a) => n + a.inProgressRecipients, 0),
    notStartedRecipients: assessments.reduce((n, a) => n + a.notStartedRecipients, 0),
    notifyFailedCount: hub.summary.notifyFailedCount,
  };

  const assessmentIds = new Set(assessments.map((a) => a.assessmentId));
  const recentActivity = hub.recentActivity.filter((row) => assessmentIds.has(row.assessmentId));

  return {
    ...hub,
    summary,
    assessments,
    recentActivity,
  };
}

function cohortKeyFromRecipient(recipient: {
  cohortKey?: string;
  cohortId?: string | null;
}): string {
  if (recipient.cohortKey) return recipient.cohortKey;
  const cid = (recipient.cohortId || '').trim();
  return cid || INDIVIDUAL_COHORT_KEY;
}

function rollupPortalStatus(
  entries: Array<{ completedCount: number; requiredCount: number; testStatus: string }>,
): 'completed' | 'in_progress' | 'not_started' {
  let portalTotal = 0;
  let portalCompleted = 0;
  let portalHasProgress = false;
  for (const e of entries) {
    portalTotal += e.requiredCount;
    portalCompleted += e.completedCount;
    if (e.testStatus === 'in_progress' || e.testStatus === 'completed') {
      portalHasProgress = true;
    }
  }
  if (portalTotal > 0 && portalCompleted >= portalTotal) return 'completed';
  if (portalHasProgress || portalCompleted > 0) return 'in_progress';
  return 'not_started';
}

export function applyRealtimeToCohortMonitoring(
  base: CounselorCohortMonitoringResult,
  liveHub: CounselorMonitoringHubResult,
): CounselorCohortMonitoringResult {
  const baseByKey = new Map(base.cohorts.map((c) => [c.cohortKey, c]));

  type PortalRollup = {
    cohortKey: string;
    portalId: string;
    entries: Array<{ assessmentId: string; completedCount: number; requiredCount: number; testStatus: string }>;
  };

  const portalRollups = new Map<string, PortalRollup>();

  for (const assessment of liveHub.assessments) {
    for (const recipient of assessment.recipients) {
      const cohortKey = cohortKeyFromRecipient(recipient);
      const portalId = recipient.portalId;
      const key = `${cohortKey}::${portalId}`;
      let rollup = portalRollups.get(key);
      if (!rollup) {
        rollup = { cohortKey, portalId, entries: [] };
        portalRollups.set(key, rollup);
      }
      rollup.entries.push({
        assessmentId: assessment.assessmentId,
        completedCount: recipient.completedCount,
        requiredCount: recipient.requiredCount,
        testStatus: recipient.testStatus,
      });
    }
  }

  const cohortAgg = new Map<
    string,
    {
      portalIds: Set<string>;
      completedPortals: number;
      inProgressPortals: number;
      notStartedPortals: number;
      totalTests: number;
      completedTests: number;
      assessments: Map<string, CounselorCohortMonitoringAssessment>;
    }
  >();

  for (const rollup of Array.from(portalRollups.values())) {
    const { cohortKey, portalId, entries } = rollup;
    let agg = cohortAgg.get(cohortKey);
    if (!agg) {
      agg = {
        portalIds: new Set(),
        completedPortals: 0,
        inProgressPortals: 0,
        notStartedPortals: 0,
        totalTests: 0,
        completedTests: 0,
        assessments: new Map(),
      };
      cohortAgg.set(cohortKey, agg);
    }

    if (!agg.portalIds.has(portalId)) {
      agg.portalIds.add(portalId);
      const portalStatus = rollupPortalStatus(entries);
      if (portalStatus === 'completed') agg.completedPortals += 1;
      else if (portalStatus === 'in_progress') agg.inProgressPortals += 1;
      else agg.notStartedPortals += 1;
    }

    for (const entry of entries) {
      agg.totalTests += entry.requiredCount;
      agg.completedTests += entry.completedCount;

      let ass = agg.assessments.get(entry.assessmentId);
      if (!ass) {
        const hubAss = liveHub.assessments.find((a) => a.assessmentId === entry.assessmentId);
        ass = {
          assessmentId: entry.assessmentId,
          title: hubAss?.title || '검사코드',
          joinAccessCode: hubAss?.joinAccessCode || '',
          recipientCount: 0,
          completedRecipients: 0,
          inProgressRecipients: 0,
          notStartedRecipients: 0,
          totalTests: 0,
          completedTests: 0,
          progress: {
            totalTests: 0,
            completedTests: 0,
            percent: 0,
            label: 'no_tests' as ClientPortalProgressLabel,
          },
        };
        agg.assessments.set(entry.assessmentId, ass);
      }

      ass.recipientCount += 1;
      ass.totalTests += entry.requiredCount;
      ass.completedTests += entry.completedCount;
      if (entry.testStatus === 'completed') ass.completedRecipients += 1;
      else if (entry.testStatus === 'in_progress') ass.inProgressRecipients += 1;
      else ass.notStartedRecipients += 1;
    }
  }

  const cohorts: CounselorCohortMonitoringItem[] = [];

  for (const [cohortKey, agg] of Array.from(cohortAgg.entries())) {
    const seed = baseByKey.get(cohortKey);
    const totalTests = agg.totalTests;
    const completedTests = agg.completedTests;
    const percent = totalTests ? Math.round((completedTests / totalTests) * 100) : 0;

    const assessments: CounselorCohortMonitoringAssessment[] = Array.from(agg.assessments.values()).map(
      (a) => {
        const aPercent = a.totalTests ? Math.round((a.completedTests / a.totalTests) * 100) : 0;
        return {
          ...a,
          progress: {
            totalTests: a.totalTests,
            completedTests: a.completedTests,
            percent: aPercent,
            label: progressLabel(a.totalTests, a.completedTests),
          },
        };
      },
    );
    assessments.sort((a, b) => -(a.progress.percent - b.progress.percent) || a.title.localeCompare(b.title));

    cohorts.push({
      cohortId: seed?.cohortId ?? (cohortKey === INDIVIDUAL_COHORT_KEY ? '' : cohortKey),
      cohortKey,
      cohortName: seed?.cohortName ?? (cohortKey === INDIVIDUAL_COHORT_KEY ? '개별 발급' : cohortKey),
      portalCount: agg.portalIds.size,
      assessmentCount: agg.assessments.size,
      completedPortals: agg.completedPortals,
      inProgressPortals: agg.inProgressPortals,
      notStartedPortals: agg.notStartedPortals,
      notifyFailedCount: seed?.notifyFailedCount ?? 0,
      totalTests,
      completedTests,
      progress: {
        totalTests,
        completedTests,
        percent,
        label: progressLabel(totalTests, completedTests),
      },
      assessments,
    });
  }

  cohorts.sort(
    (a, b) =>
      Number(a.cohortKey === INDIVIDUAL_COHORT_KEY) - Number(b.cohortKey === INDIVIDUAL_COHORT_KEY) ||
      -(a.progress.percent - b.progress.percent) ||
      a.cohortName.localeCompare(b.cohortName),
  );

  return {
    summary: {
      totalCohorts: cohorts.length,
      groupCohorts: cohorts.filter((c) => c.cohortKey !== INDIVIDUAL_COHORT_KEY).length,
      individualCohorts: cohorts.filter((c) => c.cohortKey === INDIVIDUAL_COHORT_KEY).length,
      totalPortals: cohorts.reduce((n, c) => n + c.portalCount, 0),
      completedPortals: cohorts.reduce((n, c) => n + c.completedPortals, 0),
      inProgressPortals: cohorts.reduce((n, c) => n + c.inProgressPortals, 0),
      notStartedPortals: cohorts.reduce((n, c) => n + c.notStartedPortals, 0),
      notifyFailedCount: base.summary.notifyFailedCount,
    },
    cohorts,
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
