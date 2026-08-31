import type { AssessmentDispatchStatus, DispatchRecipient } from '@/lib/clientPortalApi';
import { readCachedAssessmentsList, type CounselorAssessment } from '@/lib/assessmentApi';
import { getCounselorUidSync } from '@/lib/counselorAuth';
import {
  readAnyCachedDispatchStatus,
  writeCachedDispatchStatus,
} from '@/lib/counselorSessionCache';

const DISPATCH_SEED_PREFIX = 'wizcoco:dispatch-seed:';
const PENDING_RESOLVE_PREFIX = 'wizcoco:dispatch-pending-resolve:';
const PENDING_ERROR_PREFIX = 'wizcoco:dispatch-pending-error:';
export const PENDING_DISPATCH_ID_PREFIX = 'pending:';

export const DISPATCH_ISSUING_NOTICE_BASE =
  '개인코드 (나의코드) 의 발송량에 따라 시간이 길어질 수 있습니다.';

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

export function resolveDispatchFetchId(assessmentId: string): string | null {
  const id = assessmentId.trim();
  if (!id) return null;
  if (isPendingDispatchAssessmentId(id)) {
    return readPendingDispatchResolution(id);
  }
  return id;
}

const TERMINAL_NOTIFY_STATUSES = new Set(['sent', 'partial', 'failed', 'skipped']);

function resolveMergedNotifyStatus(
  fetched: string | undefined,
  prior: string | undefined,
): string | undefined {
  const next = fetched?.trim();
  const prev = prior?.trim();
  if (!next) return prev;
  if (!prev) return next;
  if (TERMINAL_NOTIFY_STATUSES.has(next)) return next;
  if (TERMINAL_NOTIFY_STATUSES.has(prev) && !TERMINAL_NOTIFY_STATUSES.has(next)) return prev;
  return next;
}

function recipientIdentityKey(recipient: DispatchRecipient, index: number): string {
  const portalId = recipient.portalId?.trim() || '';
  if (portalId && !portalId.startsWith('optimistic-')) return portalId;
  return [
    recipient.displayName?.trim() || '',
    recipient.email?.trim() || '',
    recipient.phone?.trim() || '',
    String(index),
  ].join('|');
}

function hasOptimisticPortalIds(recipients: DispatchRecipient[] | undefined): boolean {
  return (recipients || []).some((row) => (row.portalId || '').startsWith('optimistic-'));
}

export function isOptimisticDispatchStatus(status: AssessmentDispatchStatus | null | undefined): boolean {
  if (!status) return false;
  if (isPendingDispatchAssessmentId(status.assessmentId)) return true;
  if (!status.joinAccessCode?.trim() && (status.recipients?.length ?? 0) > 0) return true;
  return hasOptimisticPortalIds(status.recipients);
}

export function mergeDispatchStatusWithCache(
  cached: AssessmentDispatchStatus | null,
  fetched: AssessmentDispatchStatus,
): AssessmentDispatchStatus {
  if (!cached?.recipients?.length) return fetched;
  if (!fetched.recipients?.length) return cached;

  const cachedByKey = new Map(
    cached.recipients.map((row, index) => [recipientIdentityKey(row, index), row]),
  );

  const recipients = fetched.recipients.map((row, index) => {
    const key = recipientIdentityKey(row, index);
    const prior =
      cachedByKey.get(key) ||
      cached.recipients.find(
        (candidate) =>
          candidate.displayName?.trim() === row.displayName?.trim() &&
          (candidate.email?.trim() || '') === (row.email?.trim() || '') &&
          (candidate.phone?.trim() || '') === (row.phone?.trim() || ''),
      );

    if (!prior) return row;

    return {
      ...prior,
      ...row,
      displayName: row.displayName?.trim() || prior.displayName,
      email: row.email?.trim() || prior.email,
      phone: row.phone?.trim() || prior.phone,
      myCode: row.myCode?.trim() || prior.myCode,
      joinAccessCode: row.joinAccessCode?.trim() || prior.joinAccessCode,
      notifyStatus: resolveMergedNotifyStatus(row.notifyStatus, prior.notifyStatus) || row.notifyStatus || prior.notifyStatus || 'not_sent',
      notifyAt: row.notifyAt || prior.notifyAt,
      notifySentVia: row.notifySentVia || prior.notifySentVia,
      notifyEmailChannel: row.notifyEmailChannel || prior.notifyEmailChannel,
      notifyPhoneChannel: row.notifyPhoneChannel || prior.notifyPhoneChannel,
      tests: row.tests?.length ? row.tests : prior.tests,
    };
  });

  const mergedPortalIds = new Set(recipients.map((row) => row.portalId).filter(Boolean));
  for (let index = 0; index < cached.recipients.length; index += 1) {
    const cachedRow = cached.recipients[index];
    if (mergedPortalIds.has(cachedRow.portalId)) continue;
    const matchedInFetch = fetched.recipients.some(
      (row, fetchIndex) =>
        recipientIdentityKey(row, fetchIndex) === recipientIdentityKey(cachedRow, index) ||
        (row.displayName?.trim() === cachedRow.displayName?.trim() &&
          (row.email?.trim() || '') === (cachedRow.email?.trim() || '') &&
          (row.phone?.trim() || '') === (cachedRow.phone?.trim() || '')),
    );
    if (matchedInFetch) continue;
    const portalId = cachedRow.portalId || '';
    const stillOptimistic =
      portalId.startsWith('optimistic-') ||
      portalId.startsWith(PENDING_DISPATCH_ID_PREFIX) ||
      cachedRow.notifyStatus === 'sending' ||
      cachedRow.notifyStatus === 'pending';
    if (stillOptimistic) {
      recipients.push(cachedRow);
      mergedPortalIds.add(portalId);
    }
  }

  return {
    ...fetched,
    title: fetched.title?.trim() || cached.title,
    cohortName: fetched.cohortName?.trim() || cached.cohortName,
    joinAccessCode: fetched.joinAccessCode?.trim() || cached.joinAccessCode,
    recipients,
  };
}

export function isDispatchIssuingPhase(
  assessmentId: string,
  status: AssessmentDispatchStatus | null | undefined,
): boolean {
  if (isPendingDispatchAssessmentId(assessmentId)) return true;
  if (hasPendingDispatchIssueSeed(assessmentId)) return true;
  return isOptimisticDispatchStatus(status);
}

export function shouldClearDispatchIssueSeed(status: AssessmentDispatchStatus | null | undefined): boolean {
  if (!status?.recipients?.length) return false;
  if (isOptimisticDispatchStatus(status)) return false;
  return true;
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
  const cached = readAnyCachedDispatchStatus(id, uid);
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
