/**
 * B2C Discover API (Flask /api/b2c)
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

async function b2cFetch(path: string, init?: RequestInit): Promise<Response> {
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

export interface B2cProduct {
  id: string;
  name: string;
  amount: number;
  type: string;
  channel: string;
  entitlementTier?: string | null;
}

export interface MiniCheckQuestion {
  id: string;
  text: string;
  choices: { value: number; label: string }[];
}

export interface MiniCheckResult {
  score: number;
  maxScore: number;
  band: 'low' | 'moderate' | 'high';
  hookMessage: string;
  summary: string;
  disclaimer: string;
  recommendedTier: string;
}

export interface B2cEntitlements {
  uid: string;
  activeTier: string | null;
  purchases?: { tier?: string; productId?: string; expiresAt?: string }[];
}

export async function fetchB2cCatalog(): Promise<{
  products: B2cProduct[];
  payments?: { tossClientKey?: string; mockEnabled?: boolean };
}> {
  const res = await fetch(`${getBaseUrl()}/api/b2c/catalog`);
  if (!res.ok) throw new Error('B2C 카탈로그 조회 실패');
  return res.json();
}

export async function fetchMiniCheckQuestions(): Promise<MiniCheckQuestion[]> {
  const res = await fetch(`${getBaseUrl()}/api/b2c/mini-check/questions`);
  if (!res.ok) throw new Error('미니 검사 문항 로드 실패');
  const data = await res.json();
  return data.questions || [];
}

export async function scoreMiniCheck(answers: Record<string, number>): Promise<MiniCheckResult> {
  const res = await fetch(`${getBaseUrl()}/api/b2c/mini-check/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('결과 계산 실패');
  return res.json();
}

export async function fetchMyB2cEntitlements(): Promise<B2cEntitlements> {
  const res = await b2cFetch('/api/b2c/entitlements/me');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `이용권 조회 실패 (${res.status})`);
  }
  return res.json();
}

export async function prepareB2cCheckout(productId: string) {
  const res = await b2cFetch('/api/b2c/checkout/prepare', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `결제 준비 실패 (${res.status})`);
  }
  return res.json() as Promise<{
    orderId: string;
    amount: number;
    orderName: string;
    entitlementTier?: string;
    customerKey: string;
    tossClientKey?: string;
    mockEnabled?: boolean;
  }>;
}

export async function confirmB2cCheckout(params: {
  orderId: string;
  paymentKey: string;
  amount: number;
}) {
  const res = await b2cFetch('/api/b2c/checkout/confirm', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `결제 확인 실패 (${res.status})`);
  }
  return res.json() as Promise<{ ok: boolean; tierGranted?: string }>;
}

export async function mockCompleteB2cCheckout(orderId: string) {
  const res = await b2cFetch('/api/b2c/checkout/mock-complete', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Mock 결제 실패 (${res.status})`);
  }
  return res.json() as Promise<{ ok: boolean; tierGranted?: string }>;
}

export { loadTossPayments } from '@/lib/commerceApi';

export async function startB2cCheckoutRedirect(
  productId: string,
  successUrl: string,
  failUrl: string,
): Promise<{ mock?: boolean; tierGranted?: string }> {
  const { loadTossPayments } = await import('@/lib/commerceApi');
  const prepared = await prepareB2cCheckout(productId);

  if (prepared.mockEnabled && !prepared.tossClientKey) {
    return mockCompleteB2cCheckout(prepared.orderId);
  }

  const clientKey = prepared.tossClientKey || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
  if (!clientKey) {
    throw new Error('결제 클라이언트 키가 설정되지 않았습니다.');
  }

  const toss = await loadTossPayments(clientKey);
  await toss.requestPayment('CARD', {
    amount: { currency: 'KRW', value: prepared.amount },
    orderId: prepared.orderId,
    orderName: prepared.orderName,
    customerKey: prepared.customerKey,
    successUrl,
    failUrl,
  });
  return {};
}

export async function completeB2cCheckoutFromReturn(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  return confirmB2cCheckout(params);
}

export async function createDeveloperApiKey(name: string): Promise<{
  ok: boolean;
  apiKey: string;
  id: string;
}> {
  const res = await b2cFetch('/api/admin/developer/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `API 키 생성 실패 (${res.status})`);
  }
  return res.json();
}

export async function listDeveloperApiKeys(): Promise<
  { id: string; name?: string; keyPrefix?: string; status?: string }[]
> {
  const res = await b2cFetch('/api/admin/developer/api-keys');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `API 키 목록 실패 (${res.status})`);
  }
  const data = await res.json();
  return data.apiKeys || [];
}
