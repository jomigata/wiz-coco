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
const ARCHIVED_PREFIX = `${COUNSELOR_SWR_PREFIX}ArchivedAssessments`;
const CREDITS_PREFIX = `${COUNSELOR_SWR_PREFIX}Credits:`;

export function clearAllCounselorSessionCache(): void {
  if (typeof window === 'undefined') return;
  clearSWRCacheByPrefix(COUNSELOR_SWR_PREFIX, ['local', 'session']);
  // legacy dashboard cache keys (same prefix)
  try {
    sessionStorage.removeItem('wizcoco_created_assessment');
  } catch {
    // ignore
  }
}

/** assessments 목록 캐시 키 (listAssessments와 동일 scope) */
export const ASSESSMENTS_LIST_CACHE_KEY = `${COUNSELOR_SWR_PREFIX}AssessmentsList`;

function cacheOpts() {
  return { scope: COUNSELOR_CACHE_SCOPE, maxAgeMs: COUNSELOR_CACHE_MAX_AGE_MS };
}

export function buildClientPortalsCacheKey(params: {
  status: string;
  cohortId?: string;
  progress: string;
  tag?: string;
  q?: string;
}): string {
  return `${CLIENT_PORTALS_PREFIX}${params.status}|${params.cohortId || ''}|${params.progress}|${params.tag || ''}|${params.q || ''}`;
}

export function readCachedClientPortals(
  cacheKey: string,
): CounselorClientPortalListResult | null {
  if (typeof window === 'undefined') return null;
  return readSWRCache<CounselorClientPortalListResult>(cacheKey, cacheOpts()).data;
}

export function writeCachedClientPortals(
  cacheKey: string,
  data: CounselorClientPortalListResult,
): void {
  if (typeof window === 'undefined') return;
  writeSWRCache(cacheKey, data, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedAssessmentDetail(assessmentId: string): CounselorAssessment | null {
  if (typeof window === 'undefined' || !assessmentId) return null;
  return readSWRCache<CounselorAssessment>(`${ASSESSMENT_DETAIL_PREFIX}${assessmentId}`, cacheOpts()).data;
}

export function writeCachedAssessmentDetail(assessmentId: string, data: CounselorAssessment): void {
  if (typeof window === 'undefined' || !assessmentId) return;
  writeSWRCache(`${ASSESSMENT_DETAIL_PREFIX}${assessmentId}`, data, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedDispatchStatus(assessmentId: string): AssessmentDispatchStatus | null {
  if (typeof window === 'undefined' || !assessmentId) return null;
  return readSWRCache<AssessmentDispatchStatus>(`${DISPATCH_PREFIX}${assessmentId}`, cacheOpts()).data;
}

export function writeCachedDispatchStatus(
  assessmentId: string,
  data: AssessmentDispatchStatus,
): void {
  if (typeof window === 'undefined' || !assessmentId) return;
  writeSWRCache(`${DISPATCH_PREFIX}${assessmentId}`, data, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedMonitoringHub(): CounselorMonitoringHubResult | null {
  if (typeof window === 'undefined') return null;
  return readSWRCache<CounselorMonitoringHubResult>(`${COUNSELOR_SWR_PREFIX}MonitoringHub`, cacheOpts()).data;
}

export function writeCachedMonitoringHub(data: CounselorMonitoringHubResult): void {
  if (typeof window === 'undefined') return;
  writeSWRCache(`${COUNSELOR_SWR_PREFIX}MonitoringHub`, data, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedTestResults<T>(uid: string): T[] | null {
  if (typeof window === 'undefined' || !uid) return null;
  const cached = readSWRCache<{ rows: T[] }>(`${TEST_RESULTS_PREFIX}${uid}`, cacheOpts()).data;
  return cached?.rows ?? null;
}

export function writeCachedTestResults<T>(uid: string, rows: T[]): void {
  if (typeof window === 'undefined' || !uid) return;
  writeSWRCache(`${TEST_RESULTS_PREFIX}${uid}`, { rows }, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedArchivedAssessments<T>(): T[] | null {
  if (typeof window === 'undefined') return null;
  const cached = readSWRCache<{ items: T[] }>(ARCHIVED_PREFIX, cacheOpts()).data;
  return cached?.items ?? null;
}

export function writeCachedArchivedAssessments<T>(items: T[]): void {
  if (typeof window === 'undefined') return;
  writeSWRCache(ARCHIVED_PREFIX, { items }, { scope: COUNSELOR_CACHE_SCOPE });
}

export function readCachedCredits<T>(uid: string): T | null {
  if (typeof window === 'undefined' || !uid) return null;
  return readSWRCache<T>(`${CREDITS_PREFIX}${uid}`, cacheOpts()).data;
}

export function writeCachedCredits<T>(uid: string, data: T): void {
  if (typeof window === 'undefined' || !uid) return;
  writeSWRCache(`${CREDITS_PREFIX}${uid}`, data, { scope: COUNSELOR_CACHE_SCOPE });
}
