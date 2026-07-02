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

export interface CounselorSubscription {
  uid?: string;
  planId?: string;
  status?: string;
  creditsPerMonth?: number;
  overagePerCredit?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface CommerceProduct {
  id: string;
  name: string;
  amount: number;
  credits: number;
  type: 'one_time' | 'subscription' | 'b2c_tier';
  channel?: string;
  entitlementTier?: string | null;
  planId?: string | null;
  overagePerCredit?: number | null;
}

export interface CounselorCreditsResponse {
  counselorUid: string;
  balance: number;
  enforceCredits: boolean;
  pilotFreeCredits: number;
  ledger: CreditLedgerEntry[];
  subscription?: CounselorSubscription | null;
  payments?: {
    tossClientKey?: string | null;
    mockEnabled?: boolean;
  };
}

export interface CheckoutPrepareResponse {
  ok: boolean;
  orderId: string;
  amount: number;
  orderName: string;
  productId: string;
  credits: number;
  customerKey: string;
  tossClientKey?: string | null;
  mockEnabled?: boolean;
}

export interface SettlementSummary {
  month: string;
  paymentCount: number;
  totalAmount: number;
  totalCreditsGranted: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  netAssociationAmount: number;
  byProduct: Record<string, { count: number; amount: number; credits: number }>;
  payments: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  uid: string;
  orderId?: string;
  productId?: string;
  amount?: number;
  creditsGranted?: number;
  paymentMethod?: string;
  provider?: string;
  createdAt?: string;
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
  const res = await commerceFetch(
    `/api/commerce/credits/${encodeURIComponent(counselorUid)}?limit=${limit}`,
  );
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

export async function fetchCommerceCatalog(): Promise<{
  products: CommerceProduct[];
  payments?: { tossConfigured?: boolean; tossClientKey?: string; mockEnabled?: boolean };
}> {
  const res = await fetch(`${getBaseUrl()}/api/commerce/catalog`);
  if (!res.ok) {
    throw new Error('카탈로그 조회 실패');
  }
  return res.json();
}

export async function prepareCheckout(productId: string): Promise<CheckoutPrepareResponse> {
  const res = await commerceFetch('/api/commerce/checkout/prepare', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `결제 준비 실패 (${res.status})`);
  }
  return res.json();
}

export async function confirmCheckout(params: {
  orderId: string;
  paymentKey: string;
  amount: number;
}): Promise<{ ok: boolean; creditsGranted?: number; balance?: number }> {
  const res = await commerceFetch('/api/commerce/checkout/confirm', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `결제 확인 실패 (${res.status})`);
  }
  return res.json();
}

export async function mockCompleteCheckout(
  orderId: string,
): Promise<{ ok: boolean; creditsGranted?: number; balance?: number }> {
  const res = await commerceFetch('/api/commerce/checkout/mock-complete', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Mock 결제 실패 (${res.status})`);
  }
  return res.json();
}

export async function fetchSettlementSummary(month: string): Promise<SettlementSummary> {
  const res = await commerceFetch(
    `/api/commerce/settlement/summary?month=${encodeURIComponent(month)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `정산 조회 실패 (${res.status})`);
  }
  return res.json();
}

export async function fetchPaymentHistory(limit = 50): Promise<PaymentRecord[]> {
  const res = await commerceFetch(`/api/commerce/payments?limit=${limit}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `결제 내역 조회 실패 (${res.status})`);
  }
  const data = await res.json();
  return data.payments || [];
}

/** 토스페이먼츠 SDK v2 로드 */
export function loadTossPayments(clientKey: string): Promise<{
  requestPayment: (method: string, options: Record<string, unknown>) => Promise<{ paymentKey: string }>;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('browser only'));
      return;
    }
    const w = window as Window & {
      TossPayments?: (key: string) => {
        requestPayment: (method: string, options: Record<string, unknown>) => Promise<{ paymentKey: string }>;
      };
    };
    if (w.TossPayments) {
      resolve(w.TossPayments(clientKey));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.async = true;
    script.onload = () => {
      if (!w.TossPayments) {
        reject(new Error('TossPayments SDK failed to load'));
        return;
      }
      resolve(w.TossPayments(clientKey));
    };
    script.onerror = () => reject(new Error('TossPayments script load error'));
    document.head.appendChild(script);
  });
}

export async function startCheckoutRedirect(
  productId: string,
  successUrl: string,
  failUrl: string,
): Promise<{ mock?: boolean; creditsGranted?: number; balance?: number }> {
  const prepared = await prepareCheckout(productId);

  if (prepared.mockEnabled && !prepared.tossClientKey) {
    return mockCompleteCheckout(prepared.orderId);
  }

  const clientKey =
    prepared.tossClientKey || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
  if (!clientKey) {
    throw new Error('결제 클라이언트 키가 설정되지 않았습니다. 관리자에게 문의하세요.');
  }

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      'wizcoco_pending_checkout',
      JSON.stringify({ orderId: prepared.orderId, amount: prepared.amount }),
    );
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

export async function completeCheckoutFromReturn(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<{ ok: boolean; creditsGranted?: number; balance?: number }> {
  const result = await confirmCheckout(params);
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('wizcoco_pending_checkout');
  }
  return result;
}

/** @deprecated use startCheckoutRedirect + completeCheckoutFromReturn */
export async function checkoutProduct(
  productId: string,
  successUrl: string,
  failUrl: string,
): Promise<{ creditsGranted?: number; balance?: number }> {
  return startCheckoutRedirect(productId, successUrl, failUrl);
}
