import type { AssessmentDispatchStatus, DispatchRecipient } from '@/lib/clientPortalApi';
import { readCachedAssessmentsList, type CounselorAssessment } from '@/lib/assessmentApi';
import { getCounselorUidSync } from '@/lib/counselorAuth';
import { readCachedDispatchStatus, writeCachedDispatchStatus } from '@/lib/counselorSessionCache';

const DISPATCH_SEED_PREFIX = 'wizcoco:dispatch-seed:';
const PENDING_RESOLVE_PREFIX = 'wizcoco:dispatch-pending-resolve:';
const PENDING_ERROR_PREFIX = 'wizcoco:dispatch-pending-error:';
export const PENDING_DISPATCH_ID_PREFIX = 'pending:';

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

export function createPendingDispatchAssessmentId(): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${PENDING_DISPATCH_ID_PREFIX}${uuid}`;
}

export function isPendingDispatchAssessmentId(assessmentId: string): boolean {
  return assessmentId.trim().startsWith(PENDING_DISPATCH_ID_PREFIX);
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

/** API 완료 전 — 이름·연락처만 즉시 표시할 optimistic 시드 */
export function seedDispatchStatusBeforeIssue(
  pendingId: string,
  input: Omit<DispatchIssueSeedInput, 'assessmentId' | 'joinAccessCode'>,
  counselorUid?: string | null,
): void {
  seedDispatchStatusAfterIssue(
    {
      ...input,
      assessmentId: pendingId.trim(),
      joinAccessCode: '',
    },
    counselorUid,
  );
}

export function finalizePendingDispatchIssue(
  pendingId: string,
  input: DispatchIssueSeedInput,
  counselorUid?: string | null,
): string {
  const realId = input.assessmentId.trim();
  if (typeof window === 'undefined' || !pendingId.trim() || !realId) return realId;
  seedDispatchStatusAfterIssue(input, counselorUid);
  try {
    sessionStorage.setItem(`${PENDING_RESOLVE_PREFIX}${pendingId.trim()}`, realId);
    sessionStorage.removeItem(`${PENDING_ERROR_PREFIX}${pendingId.trim()}`);
  } catch {
    // ignore
  }
  clearDispatchIssueSeed(pendingId);
  return realId;
}

export function readPendingDispatchResolution(pendingId: string): string | null {
  if (typeof window === 'undefined' || !pendingId.trim()) return null;
  try {
    return sessionStorage.getItem(`${PENDING_RESOLVE_PREFIX}${pendingId.trim()}`)?.trim() || null;
  } catch {
    return null;
  }
}

export function registerPendingDispatchError(pendingId: string, message: string): void {
  if (typeof window === 'undefined' || !pendingId.trim()) return;
  try {
    sessionStorage.setItem(`${PENDING_ERROR_PREFIX}${pendingId.trim()}`, message.trim());
  } catch {
    // ignore
  }
}

export function readPendingDispatchError(pendingId: string): string | null {
  if (typeof window === 'undefined' || !pendingId.trim()) return null;
  try {
    return sessionStorage.getItem(`${PENDING_ERROR_PREFIX}${pendingId.trim()}`)?.trim() || null;
  } catch {
    return null;
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
  if (isPendingDispatchAssessmentId(assessmentId)) return true;
  try {
    return Boolean(sessionStorage.getItem(`${DISPATCH_SEED_PREFIX}${assessmentId.trim()}`));
  } catch {
    return false;
  }
}

export function pendingDispatchPlaceholder(value: string, pending: boolean, placeholder = '발급 중'): string {
  const trimmed = value.trim();
  if (trimmed && trimmed !== '—') return trimmed;
  return pending ? placeholder : trimmed || '—';
}
