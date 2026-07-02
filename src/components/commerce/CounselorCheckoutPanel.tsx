'use client';

import React, { useEffect, useState } from 'react';
import {
  fetchCommerceCatalog,
  mockCompleteCheckout,
  prepareCheckout,
  startCheckoutRedirect,
  type CommerceProduct,
} from '@/lib/commerceApi';

type Props = {
  onSuccess?: () => void;
};

export default function CounselorCheckoutPanel({ onSuccess }: Props) {
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [mockEnabled, setMockEnabled] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCommerceCatalog()
      .then((cat) => {
        setProducts(cat.products || []);
        setMockEnabled(Boolean(cat.payments?.mockEnabled));
      })
      .catch(() => setProducts([]));
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const handlePurchase = async (productId: string) => {
    setLoadingId(productId);
    setError('');
    setMessage('');
    try {
      const successUrl = `${origin}/counselor/credits/?checkout=success`;
      const failUrl = `${origin}/counselor/credits/?checkout=fail`;
      const result = await startCheckoutRedirect(productId, successUrl, failUrl);
      if (result.creditsGranted != null) {
        setMessage(`결제 완료 — ${result.creditsGranted}크레딧 충전됨`);
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 실패');
    } finally {
      setLoadingId(null);
    }
  };

  const handleMockOnly = async (productId: string) => {
    setLoadingId(productId);
    setError('');
    try {
      const prepared = await prepareCheckout(productId);
      const result = await mockCompleteCheckout(prepared.orderId);
      setMessage(`[테스트] ${result.creditsGranted}크레딧 충전 (잔액 ${result.balance})`);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mock 결제 실패');
    } finally {
      setLoadingId(null);
    }
  };

  if (!products.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-2">크레딧 구매 · 구독</h2>
      <p className="text-slate-400 text-sm mb-4">
        결제 완료 시 검사 크레딧이 자동 충전됩니다. 구독 상품은 월간 크레딧 + 초과 건당 요금
        정책이 적용됩니다.
      </p>

      {message && (
        <div className="mb-3 rounded-lg bg-emerald-900/40 border border-emerald-600/30 p-3 text-emerald-200 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg bg-red-900/40 border border-red-600/30 p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-lg border border-white/10 p-4 bg-white/5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-white">{p.name}</h3>
              <span className="text-blue-300 text-sm font-semibold">
                {p.amount.toLocaleString()}원
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {p.credits}크레딧
              {p.type === 'subscription' && p.overagePerCredit
                ? ` · 초과 ${p.overagePerCredit.toLocaleString()}원/건`
                : ''}
            </p>
            <button
              type="button"
              disabled={loadingId === p.id}
              onClick={() => handlePurchase(p.id)}
              className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {loadingId === p.id ? '처리 중…' : '결제하기'}
            </button>
            {mockEnabled && (
              <button
                type="button"
                disabled={loadingId === p.id}
                onClick={() => handleMockOnly(p.id)}
                className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-amber-500/40 text-amber-200 text-xs hover:bg-amber-950/30"
              >
                테스트 결제 (Mock)
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
