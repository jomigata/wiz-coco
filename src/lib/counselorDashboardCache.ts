import { getCounselorUidSync } from '@/lib/counselorAuth';
import { readSWRCache, writeSWRCache } from '@/utils/staleWhileRevalidateCache';
import type {
  CounselorCohortMonitoringResult,
  CounselorMonitoringHubResult,
} from '@/types/clientPortal';
import type { CounselorOrgLiaison } from '@/lib/clientPortalApi';

const CACHE_SCOPE = 'local' as const;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const HUB_KEY_PREFIX = 'swr:counselorMonitoringHub:';
const COHORTS_KEY_PREFIX = 'swr:counselorCohortMonitoring:';
const LIAISONS_KEY_PREFIX = 'swr:counselorOrgLiaisons:';

function dashboardKeys(counselorUid?: string | null) {
  const uid = (counselorUid ?? getCounselorUidSync())?.trim();
  if (!uid) return null;
  return {
    hub: `${HUB_KEY_PREFIX}${uid}`,
    cohorts: `${COHORTS_KEY_PREFIX}${uid}`,
    liaisons: `${LIAISONS_KEY_PREFIX}${uid}`,
  };
}

export type CounselorDashboardCacheSnapshot = {
  hub: CounselorMonitoringHubResult | null;
  cohorts: CounselorCohortMonitoringResult | null;
  liaisons: CounselorOrgLiaison[];
};

export function readCachedCounselorDashboard(
  counselorUid?: string | null,
): CounselorDashboardCacheSnapshot | null {
  if (typeof window === 'undefined') return null;
  const keys = dashboardKeys(counselorUid);
  if (!keys) return null;
  const hubCached = readSWRCache<CounselorMonitoringHubResult>(keys.hub, {
    scope: CACHE_SCOPE,
    maxAgeMs: CACHE_MAX_AGE_MS,
  });
  const cohortsCached = readSWRCache<CounselorCohortMonitoringResult>(keys.cohorts, {
    scope: CACHE_SCOPE,
    maxAgeMs: CACHE_MAX_AGE_MS,
  });
  const liaisonsCached = readSWRCache<CounselorOrgLiaison[]>(keys.liaisons, {
    scope: CACHE_SCOPE,
    maxAgeMs: CACHE_MAX_AGE_MS,
  });
  const hub = hubCached.isFresh ? hubCached.data : null;
  const cohorts = cohortsCached.isFresh ? cohortsCached.data : null;
  const liaisons = liaisonsCached.isFresh ? liaisonsCached.data : null;
  if (!hub && !cohorts && !liaisons) return null;
  return {
    hub: hub ?? null,
    cohorts: cohorts ?? null,
    liaisons: liaisons ?? [],
  };
}

export function writeCachedCounselorDashboard(
  snapshot: CounselorDashboardCacheSnapshot,
  counselorUid?: string | null,
): void {
  if (typeof window === 'undefined') return;
  const keys = dashboardKeys(counselorUid);
  if (!keys) return;
  if (snapshot.hub) {
    writeSWRCache(keys.hub, snapshot.hub, { scope: CACHE_SCOPE });
  }
  if (snapshot.cohorts) {
    writeSWRCache(keys.cohorts, snapshot.cohorts, { scope: CACHE_SCOPE });
  }
  writeSWRCache(keys.liaisons, snapshot.liaisons, { scope: CACHE_SCOPE });
}
