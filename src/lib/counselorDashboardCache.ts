import { readSWRCache, writeSWRCache } from '@/utils/staleWhileRevalidateCache';
import type {
  CounselorCohortMonitoringResult,
  CounselorMonitoringHubResult,
} from '@/types/clientPortal';
import type { CounselorOrgLiaison } from '@/lib/clientPortalApi';

const CACHE_SCOPE = 'local' as const;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const HUB_KEY = 'swr:counselorMonitoringHub';
const COHORTS_KEY = 'swr:counselorCohortMonitoring';
const LIAISONS_KEY = 'swr:counselorOrgLiaisons';

export type CounselorDashboardCacheSnapshot = {
  hub: CounselorMonitoringHubResult | null;
  cohorts: CounselorCohortMonitoringResult | null;
  liaisons: CounselorOrgLiaison[];
};

export function readCachedCounselorDashboard(): CounselorDashboardCacheSnapshot | null {
  if (typeof window === 'undefined') return null;
  const hub = readSWRCache<CounselorMonitoringHubResult>(HUB_KEY, {
    scope: CACHE_SCOPE,
    maxAgeMs: CACHE_MAX_AGE_MS,
  }).data;
  const cohorts = readSWRCache<CounselorCohortMonitoringResult>(COHORTS_KEY, {
    scope: CACHE_SCOPE,
    maxAgeMs: CACHE_MAX_AGE_MS,
  }).data;
  const liaisons = readSWRCache<CounselorOrgLiaison[]>(LIAISONS_KEY, {
    scope: CACHE_SCOPE,
    maxAgeMs: CACHE_MAX_AGE_MS,
  }).data;
  if (!hub && !cohorts && !liaisons) return null;
  return {
    hub: hub ?? null,
    cohorts: cohorts ?? null,
    liaisons: liaisons ?? [],
  };
}

export function writeCachedCounselorDashboard(snapshot: CounselorDashboardCacheSnapshot): void {
  if (typeof window === 'undefined') return;
  if (snapshot.hub) {
    writeSWRCache(HUB_KEY, snapshot.hub, { scope: CACHE_SCOPE });
  }
  if (snapshot.cohorts) {
    writeSWRCache(COHORTS_KEY, snapshot.cohorts, { scope: CACHE_SCOPE });
  }
  writeSWRCache(LIAISONS_KEY, snapshot.liaisons, { scope: CACHE_SCOPE });
}
