import { getCounselorToken } from '@/lib/counselorAuth';

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_FLASK_API_URL?.trim();
  return url || 'http://localhost:5000';
}

async function adminFetch(path: string, init?: RequestInit) {
  const token = await getCounselorToken();
  if (!token) throw new Error('관리자 로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '요청에 실패했습니다.');
  }
  return data;
}

export type PermanentlyDeletedAssessment = {
  id: string;
  accessCode: string;
  title: string;
  counselorId: string;
  targetAudience: string;
  cohortName: string;
  permanentlyDeletedAt: string | null;
};

export type PermanentlyDeletedPortal = {
  portalId: string;
  displayName: string;
  email: string;
  phone: string;
  myCode: string;
  counselorId: string;
  assessmentId: string;
  permanentlyDeletedAt: string | null;
};

export async function fetchPermanentlyDeletedRecords(): Promise<{
  assessments: PermanentlyDeletedAssessment[];
  portals: PermanentlyDeletedPortal[];
}> {
  return adminFetch('/api/admin/permanently-deleted');
}

export async function restorePermanentlyDeletedRecords(body: {
  assessmentIds?: string[];
  portalIds?: string[];
}): Promise<{ restoredAssessments: number; restoredPortals: number; failed: number }> {
  return adminFetch('/api/admin/permanently-deleted/restore', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function purgePermanentlyDeletedRecords(body: {
  assessmentIds?: string[];
  portalIds?: string[];
  confirm: 'PURGE';
}): Promise<{ purgedAssessments: number; purgedPortals: number; failed: number }> {
  return adminFetch('/api/admin/permanently-deleted/purge', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
