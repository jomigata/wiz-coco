import type { AssessmentDispatchStatus, DispatchRecipient } from '@/lib/clientPortalApi';
import { readCachedAssessmentsList, type CounselorAssessment } from '@/lib/assessmentApi';
import { getCounselorUidSync } from '@/lib/counselorAuth';
import { readCachedDispatchStatus, writeCachedDispatchStatus } from '@/lib/counselorSessionCache';

const DISPATCH_SEED_PREFIX = 'wizcoco:dispatch-seed:';

export type DispatchIssueSeedInput = {
  assessmentId: string;
  title: string;
  cohortName: string;
  joinAccessCode: string;
  testList: { testId: string; name: string }[];
  recipients: Array<{
    portalId?: string;
    displayName: string;
    email?: string;
    phone?: string;
    myCode?: string;
    accessCode?: string;
  }>;
  queueNotify?: boolean;
};

function buildTests(testList: { testId: string; name: string }[]) {
  return testList.map((t) => ({
    testId: t.testId,
    testName: t.name,
    status: 'not_started' as const,
    completedAt: null,
    resultId: null,
  }));
}

function buildRecipientRow(
  row: DispatchIssueSeedInput['recipients'][number],
  joinAccessCode: string,
  testList: { testId: string; name: string }[],
  queueNotify: boolean,
  index: number,
): DispatchRecipient {
  const hasEmail = Boolean(row.email?.trim());
  const hasPhone = Boolean(row.phone?.trim());
  const notifyStatus = queueNotify ? 'sending' : 'not_sent';

  return {
    portalId: row.portalId?.trim() || `optimistic-${index}`,
    displayName: row.displayName.trim() || '내담자',
    email: row.email?.trim() || '',
    phone: row.phone?.trim() || '',
    myCode: row.myCode?.trim() || row.accessCode?.trim() || '',
    joinAccessCode,
    notifyStatus,
    notifyError: null,
    notifyAt: null,
    notifySentVia: null,
    notifyKind: 'initial',
    notifyEmailChannel: hasEmail && queueNotify ? 'sending' : undefined,
    notifyPhoneChannel: hasPhone && queueNotify ? 'sending' : undefined,
    testStatus: 'not_started',
    completedCount: 0,
    requiredCount: testList.length,
    tests: buildTests(testList),
  };
}

export function buildDispatchStatusFromIssueSeed(input: DispatchIssueSeedInput): AssessmentDispatchStatus {
  const joinAccessCode = input.joinAccessCode.trim();
  const queueNotify = input.queueNotify !== false;

  return {
    assessmentId: input.assessmentId.trim(),
    title: input.title.trim(),
    cohortName: input.cohortName.trim(),
    joinAccessCode,
    testList: input.testList,
    recipients: input.recipients.map((row, index) =>
      buildRecipientRow(row, joinAccessCode, input.testList, queueNotify, index),
    ),
  };
}

export function seedDispatchStatusAfterIssue(
  input: DispatchIssueSeedInput,
  counselorUid?: string | null,
): void {
  if (typeof window === 'undefined' || !input.assessmentId.trim()) return;
  const status = buildDispatchStatusFromIssueSeed(input);
  const uid = (counselorUid ?? getCounselorUidSync())?.trim() || undefined;
  writeCachedDispatchStatus(input.assessmentId.trim(), status, uid);
  try {
    sessionStorage.setItem(
      `${DISPATCH_SEED_PREFIX}${input.assessmentId.trim()}`,
      JSON.stringify({ seededAt: Date.now(), queueNotify: input.queueNotify !== false }),
    );
  } catch {
    // ignore
  }
}

export function clearDispatchIssueSeed(assessmentId: string): void {
  if (typeof window === 'undefined' || !assessmentId.trim()) return;
  try {
    sessionStorage.removeItem(`${DISPATCH_SEED_PREFIX}${assessmentId.trim()}`);
  } catch {
    // ignore
  }
}

function buildShellFromAssessment(assessment: CounselorAssessment): AssessmentDispatchStatus {
  return {
    assessmentId: assessment.id,
    title: assessment.title,
    cohortName: assessment.cohortName || '',
    joinAccessCode: assessment.accessCode,
    testList: assessment.testList || [],
    recipients: [],
  };
}

/** 상담진행 현황 — 발급 직후 캐시·목록 캐시로 즉시 렌더 */
export function resolveInitialDispatchStatus(
  assessmentId: string,
  counselorUid?: string | null,
): AssessmentDispatchStatus | null {
  const id = assessmentId.trim();
  if (!id) return null;

  const uid = (counselorUid ?? getCounselorUidSync())?.trim() || undefined;
  const cached = readCachedDispatchStatus(id, uid);
  if (cached?.recipients?.length) return cached;
  if (cached) return cached;

  const list = readCachedAssessmentsList(uid);
  const fromList = list?.find((a) => a.id === id);
  if (fromList) return buildShellFromAssessment(fromList);

  return null;
}

export function hasPendingDispatchIssueSeed(assessmentId: string): boolean {
  if (typeof window === 'undefined' || !assessmentId.trim()) return false;
  try {
    return Boolean(sessionStorage.getItem(`${DISPATCH_SEED_PREFIX}${assessmentId.trim()}`));
  } catch {
    return false;
  }
}
