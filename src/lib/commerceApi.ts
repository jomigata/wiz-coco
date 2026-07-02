/**
 * 협회·상담사 수익화 API (Flask /api/commerce)
 */

import { getCounselorToken } from '@/lib/counselorAuth';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

async function commerceFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getCounselorToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${getBaseUrl()}${path}`, { ...init, headers });
}

export interface CreditLedgerEntry {
  id: string;
  counselorUid: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  createdAt?: string;
  actorUid?: string;
}

export interface CounselorCreditsResponse {
  counselorUid: string;
  balance: number;
  enforceCredits: boolean;
  pilotFreeCredits: number;
  ledger: CreditLedgerEntry[];
}

export async function fetchMyCredits(limit = 20): Promise<CounselorCreditsResponse> {
  const res = await commerceFetch(`/api/commerce/credits/me?limit=${limit}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `크레딧 조회 실패 (${res.status})`);
  }
  return res.json();
}

export async function fetchCounselorCredits(
  counselorUid: string,
  limit = 30,
): Promise<CounselorCreditsResponse & { email?: string; role?: string }> {
  const res = await commerceFetch(`/api/commerce/credits/${encodeURIComponent(counselorUid)}?limit=${limit}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `크레딧 조회 실패 (${res.status})`);
  }
  return res.json();
}

export async function grantCounselorCredits(params: {
  counselorUid: string;
  amount: number;
  reason?: string;
}): Promise<{ ok: boolean; balance: number; granted: number }> {
  const res = await commerceFetch('/api/commerce/credits/grant', {
    method: 'POST',
    body: JSON.stringify({
      counselorUid: params.counselorUid,
      amount: params.amount,
      reason: params.reason || 'admin_grant',
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `크레딧 지급 실패 (${res.status})`);
  }
  return res.json();
}

export async function fetchCommerceCatalog(): Promise<Record<string, unknown>> {
  const res = await fetch(`${getBaseUrl()}/api/commerce/catalog`);
  if (!res.ok) {
    throw new Error('카탈로그 조회 실패');
  }
  return res.json();
}
