import { getCounselorUidSync } from '@/lib/counselorAuth';
import { readSWRCache, writeSWRCache, clearSWRCacheByPrefix } from '@/utils/staleWhileRevalidateCache';
import type { CounselorAssessment } from '@/lib/assessmentApi';
import type { AssessmentDispatchStatus } from '@/lib/clientPortalApi';
import type {
  CounselorClientPortalListResult,
  CounselorMonitoringHubResult,
} from '@/types/clientPortal';

export const COUNSELOR_SWR_PREFIX = 'swr:counselor';
export const COUNSELOR_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const COUNSELOR_CACHE_SCOPE = 'local' as const;

const ASSESSMENT_DETAIL_PREFIX = `${COUNSELOR_SWR_PREFIX}Assessment:`;
const DISPATCH_PREFIX = `${COUNSELOR_SWR_PREFIX}Dispatch:`;
const CLIENT_PORTALS_PREFIX = `${COUNSELOR_SWR_PREFIX}ClientPortals:`;
const TEST_RESULTS_PREFIX = `${COUNSELOR_SWR_PREFIX}TestResults:`;
const ARCHIVED_PREFIX = `${COUNSELOR_SWR_PREFIX}ArchivedAssessments:`;
const CREDITS_PREFIX = `${COUNSELOR_SWR_PREFIX}Credits:`;
const MONITORING_HUB_PREFIX = `${COUNSELOR_SWR_PREFIX}MonitoringHub:`;

function resolveCounselorCacheUid(counselorUid?: string | null): string | null {
  const uid = (counselorUid ?? getCounselorUidSync())?.trim();
  return uid || null;
}

function scopedKey(base: string, counselorUid?: string | null): string | null {
  const uid = resolveCounselorCacheUid(counselorUid);
  if (!uid) return null;
  return `${base}${uid}`;
}

export function clearAllCounselorSessionCache(): void {
  if (typeof window === 'undefined') return;
  clearSWRCacheByPrefix(COUNSELOR_SWR_PREFIX, ['local', 'session']);
  try {
    sessionStorage.removeItem('wizcoco_created_assessment');
  } catch {
    // ignore
  }
}

/** assessments 목록 캐시 키 (listAssessments와 동일 scope) */
export function getAssessmentsListCacheKey(counselorUid?: string | null): string | null {
  return scopedKey(`${COUNSELOR_SWR_PREFIX}AssessmentsList:`, counselorUid);
}

/** @deprecated use getAssessmentsListCacheKey */
export const ASSESSMENTS_LIST_CACHE_KEY = `${COUNSELOR_SWR_PREFIX}AssessmentsList`;

function cacheOpts() {
  return { scope: COUNSELOR_CACHE_SCOPE, maxAgeMs: COUNSELOR_CACHE_MAX_AGE_MS };
}

function readFreshCounselorCache<T>(key: string | null): T | null {
  if (typeof window === 'undefined' || !key) return null;
  const cached = readSWRCache<T>(key, cacheOpts());
  if (!cached.isFresh || cached.data == null) return null;
  return cached.data;
}

export function buildClientPortalsCacheKey(params: {
  counselorUid?: string | null;
  status: string;
  cohortId?: string;
  progress: string;
  tag?: string;
  q?: string;
}): string | null {
  const base = scopedKey(CLIENT_PORTALS_PREFIX, params.counselorUid);
  if (!base) return null;
  return `${base}|${params.status}|${params.cohortId || ''}|${params.progress}|${params.tag || ''}|${params.q || ''}`;
}

export function readCachedClientPortals(
  cacheKey: string | null,
): CounselorClientPortalListResult | null {
  return readFreshCounselorCache<CounselorClientPortalListResult>(cacheKey);
}

export function writeCachedClientPortals(
  cacheKey: string | null,
  data: CounselorClientPortalListResult,
): void {
  if (typeof window === 'undefined' || !cacheKey) return;
  writeSWRCache(cacheKey, data, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedAssessmentDetail(
  assessmentId: string,
  counselorUid?: string | null,
): CounselorAssessment | null {
  if (!assessmentId) return null;
  const key = scopedKey(ASSESSMENT_DETAIL_PREFIX, counselorUid);
  if (!key) return null;
  return readFreshCounselorCache<CounselorAssessment>(`${key}:${assessmentId}`);
}

export function writeCachedAssessmentDetail(
  assessmentId: string,
  data: CounselorAssessment,
  counselorUid?: string | null,
): void {
  if (typeof window === 'undefined' || !assessmentId) return;
  const key = scopedKey(ASSESSMENT_DETAIL_PREFIX, counselorUid);
  if (!key) return;
  writeSWRCache(`${key}:${assessmentId}`, data, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedDispatchStatus(
  assessmentId: string,
  counselorUid?: string | null,
): AssessmentDispatchStatus | null {
  if (!assessmentId) return null;
  const key = scopedKey(DISPATCH_PREFIX, counselorUid);
  if (!key) return null;
  return readFreshCounselorCache<AssessmentDispatchStatus>(`${key}:${assessmentId}`);
}

/** fresh 여부와 관계없이 마지막 캐시 반환 (발급 직후 재진입 시 즉시 표시) */
export function readAnyCachedDispatchStatus(
  assessmentId: string,
  counselorUid?: string | null,
): AssessmentDispatchStatus | null {
  if (!assessmentId || typeof window === 'undefined') return null;
  const key = scopedKey(DISPATCH_PREFIX, counselorUid);
  if (!key) return null;
  const cached = readSWRCache<AssessmentDispatchStatus>(`${key}:${assessmentId}`, cacheOpts());
  return cached.data ?? null;
}

export function writeCachedDispatchStatus(
  assessmentId: string,
  data: AssessmentDispatchStatus,
  counselorUid?: string | null,
): void {
  if (typeof window === 'undefined' || !assessmentId) return;
  const key = scopedKey(DISPATCH_PREFIX, counselorUid);
  if (!key) return;
  writeSWRCache(`${key}:${assessmentId}`, data, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedMonitoringHub(
  counselorUid?: string | null,
): CounselorMonitoringHubResult | null {
  return readFreshCounselorCache<CounselorMonitoringHubResult>(
    scopedKey(MONITORING_HUB_PREFIX, counselorUid),
  );
}

export function writeCachedMonitoringHub(
  data: CounselorMonitoringHubResult,
  counselorUid?: string | null,
): void {
  if (typeof window === 'undefined') return;
  const key = scopedKey(MONITORING_HUB_PREFIX, counselorUid);
  if (!key) return;
  writeSWRCache(key, data, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedTestResults<T>(uid: string): T[] | null {
  if (!uid) return null;
  const cached = readFreshCounselorCache<{ rows: T[] }>(`${TEST_RESULTS_PREFIX}${uid}`);
  return cached?.rows ?? null;
}

export function writeCachedTestResults<T>(uid: string, rows: T[]): void {
  if (typeof window === 'undefined' || !uid) return;
  writeSWRCache(`${TEST_RESULTS_PREFIX}${uid}`, { rows }, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedArchivedAssessments<T>(counselorUid?: string | null): T[] | null {
  const cached = readFreshCounselorCache<{ items: T[] }>(
    scopedKey(ARCHIVED_PREFIX, counselorUid),
  );
  return cached?.items ?? null;
}

export function writeCachedArchivedAssessments<T>(
  items: T[],
  counselorUid?: string | null,
): void {
  if (typeof window === 'undefined') return;
  const key = scopedKey(ARCHIVED_PREFIX, counselorUid);
  if (!key) return;
  writeSWRCache(key, { items }, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedCredits<T>(uid: string): T | null {
  if (!uid) return null;
  return readFreshCounselorCache<T>(`${CREDITS_PREFIX}${uid}`);
}

export function writeCachedCredits<T>(uid: string, data: T): void {
  if (typeof window === 'undefined' || !uid) return;
  writeSWRCache(`${CREDITS_PREFIX}${uid}`, data, { scope: COUNSELOR_CACHE_SCOPE });
}
