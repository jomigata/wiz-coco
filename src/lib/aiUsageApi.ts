import type {
  AiUsageSchemaResponse,
  CounselorAiCreditsMeResponse,
  AiAdminUsageSummary,
  AiAdminCounselorDetail,
  AiUsageLedgerDocument,
} from '@/types/aiUsage';
import { getCounselorToken } from '@/lib/counselorAuth';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}

async function aiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getCounselorToken();
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `AI API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** GET /api/ai/schema — 인증 불필요 */
export async function fetchAiUsageSchema(): Promise<AiUsageSchemaResponse> {
  const res = await fetch(`${getBaseUrl()}/api/ai/schema`);
  if (!res.ok) {
    throw new Error(`AI schema fetch failed: ${res.status}`);
  }
  return res.json() as Promise<AiUsageSchemaResponse>;
}

/** GET /api/ai/credits/me */
export async function fetchCounselorAiCredits(
  limit = 30,
): Promise<CounselorAiCreditsMeResponse> {
  const q = limit ? `?limit=${encodeURIComponent(String(limit))}` : '';
  return aiFetch<CounselorAiCreditsMeResponse>(`/api/ai/credits/me${q}`);
}

/** GET /api/ai/admin/usage/summary */
export async function fetchAiAdminUsageSummary(month?: string): Promise<AiAdminUsageSummary> {
  const q = month ? `?month=${encodeURIComponent(month)}` : '';
  return aiFetch<AiAdminUsageSummary>(`/api/ai/admin/usage/summary${q}`);
}

/** GET /api/ai/admin/usage/ledger */
export async function fetchAiAdminUsageLedger(params?: {
  month?: string;
  counselorUid?: string;
  limit?: number;
}): Promise<{ items: AiUsageLedgerDocument[] }> {
  const search = new URLSearchParams();
  if (params?.month) search.set('month', params.month);
  if (params?.counselorUid) search.set('counselorUid', params.counselorUid);
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return aiFetch<{ items: AiUsageLedgerDocument[] }>(
    `/api/ai/admin/usage/ledger${qs ? `?${qs}` : ''}`,
  );
}

/** GET /api/ai/admin/credits/:uid */
export async function fetchAdminCounselorAiCredits(
  counselorUid: string,
  limit = 30,
): Promise<AiAdminCounselorDetail> {
  return aiFetch<AiAdminCounselorDetail>(
    `/api/ai/admin/credits/${encodeURIComponent(counselorUid)}?limit=${limit}`,
  );
}

/** POST /api/ai/credits/grant */
export async function grantCounselorAiCredits(params: {
  counselorUid: string;
  amount: number;
  reason?: string;
}): Promise<{ counselorUid: string; balance: number; granted: number }> {
  return aiFetch(`/api/ai/credits/grant`, {
    method: 'POST',
    body: JSON.stringify({
      counselorUid: params.counselorUid,
      amount: params.amount,
      reason: params.reason || 'admin_grant',
    }),
  });
}
