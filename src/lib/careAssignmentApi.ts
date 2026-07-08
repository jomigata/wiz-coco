/**
 * 케어 할당 API 클라이언트 (T-2-01 스펙 · T-2-04 구현 예정)
 */
import { getCounselorToken } from '@/lib/assessmentApi';
import type {
  CreateCareAssignmentInput,
  CreateCareAssignmentResult,
  ListCareAssignmentsParams,
  ListCareAssignmentsResult,
} from '@/types/careAssignment';
import type {
  CareProgramCatalogResult,
  CareProgramCategory,
  CareProgramDefinition,
  CareProgramDetailResult,
} from '@/types/careProgram';
import type { ListCounselorDailyRecordsResult } from '@/types/counselor';

export { CARE_ASSIGNMENT_SCHEMA_VERSION } from '@/types/careAssignment';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}

export type CareAssignmentSchemaMeta = {
  schemaVersion: number;
  collections: { careAssignments: string; careProgress: string };
  enums: {
    assignmentTypes: string[];
    assignmentStatuses: string[];
    assignmentSources: string[];
    priorities: string[];
    progressStatuses: string[];
    progressEntryKinds: string[];
  };
  assignmentTypeLabels: Record<string, string>;
  docs: string;
  implementedEndpoints: string[];
  plannedEndpoints: string[];
};

/** 스키마 메타 조회 (인증 불필요) */
export async function fetchCareAssignmentSchema(): Promise<CareAssignmentSchemaMeta> {
  const res = await fetch(`${getBaseUrl()}/api/care-assignments/schema`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '케어 스키마 조회에 실패했습니다.');
  }
  return data as CareAssignmentSchemaMeta;
}

/** 치료프로그램 카탈로그 목록 (T-2-02) */
export async function fetchCareProgramCatalog(params?: {
  category?: CareProgramCategory;
}): Promise<CareProgramCatalogResult> {
  const search = new URLSearchParams();
  if (params?.category) search.set('category', params.category);
  const qs = search.toString();
  const res = await fetch(`${getBaseUrl()}/api/care-assignments/programs${qs ? `?${qs}` : ''}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '프로그램 카탈로그 조회에 실패했습니다.');
  }
  return data as CareProgramCatalogResult;
}

/** 치료프로그램 상세 메타 (세션 본문은 로컬 카탈로그 병합) */
export async function fetchCareProgramMeta(programId: string): Promise<CareProgramDetailResult> {
  const res = await fetch(
    `${getBaseUrl()}/api/care-assignments/programs/${encodeURIComponent(programId)}`,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '프로그램 조회에 실패했습니다.');
  }
  return data as CareProgramDetailResult;
}

/** 로컬 카탈로그에서 세션 포함 전체 프로그램 (권장) */
export async function fetchCareProgramFull(programId: string): Promise<CareProgramDefinition | null> {
  const { getCareProgramById } = await import('@/data/careProgramCatalog');
  return getCareProgramById(programId) ?? null;
}

/** T-2-04 — 할당 생성 */
export async function createCareAssignments(
  input: CreateCareAssignmentInput,
): Promise<CreateCareAssignmentResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(`${getBaseUrl()}/api/care-assignments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '케어 할당에 실패했습니다.');
  }
  return data as CreateCareAssignmentResult;
}

/** T-2-03/04 — 상담사 할당 목록 */
export async function listCareAssignments(
  params?: ListCareAssignmentsParams,
): Promise<ListCareAssignmentsResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const search = new URLSearchParams();
  if (params?.portalId) search.set('portalId', params.portalId);
  if (params?.status && params.status !== 'all') search.set('status', params.status);
  if (params?.type) search.set('type', params.type);
  if (params?.cohortId) search.set('cohortId', params.cohortId);
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));

  const qs = search.toString();
  const res = await fetch(`${getBaseUrl()}/api/care-assignments${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '케어 할당 목록 조회에 실패했습니다.');
  }
  return data as ListCareAssignmentsResult;
}

/** T-2-09 — 상담사 일상 기록 (포털·마이페이지) */
export async function listCounselorDailyRecords(params?: {
  portalId?: string;
  limit?: number;
}): Promise<ListCounselorDailyRecordsResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const search = new URLSearchParams();
  if (params?.portalId) search.set('portalId', params.portalId);
  if (params?.limit) search.set('limit', String(params.limit));

  const qs = search.toString();
  const res = await fetch(`${getBaseUrl()}/api/care-assignments/daily-records${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '일상 기록 조회에 실패했습니다.');
  }
  return data as ListCounselorDailyRecordsResult;
}

export async function updateCounselorDailyRecordNotes(
  recordId: string,
  counselorNotes: string,
): Promise<{ id: string; counselorNotes: string | null }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(
    `${getBaseUrl()}/api/care-assignments/daily-records/${encodeURIComponent(recordId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ counselorNotes }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '메모 저장에 실패했습니다.');
  }
  return data as { id: string; counselorNotes: string | null };
}
