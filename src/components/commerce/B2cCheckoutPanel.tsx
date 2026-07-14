'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  completeB2cCheckoutFromReturn,
  fetchB2cCatalog,
  fetchMyB2cEntitlements,
  mockCompleteB2cCheckout,
  prepareB2cCheckout,
  startB2cCheckoutRedirect,
  type B2cEntitlements,
  type B2cProduct,
} from '@/lib/b2cApi';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

const TIER_LABELS: Record<string, string> = {
  basic: 'Basic — 요약 리포트',
  premium: 'Premium — 심층 분석',
  pro: 'Pro — 상담 연결 포함',
};

export default function B2cCheckoutPanel() {
  const searchParams = useSearchParams();
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [products, setProducts] = useState<B2cProduct[]>([]);
  const [entitlements, setEntitlements] = useState<B2cEntitlements | null>(null);
  const [mockEnabled, setMockEnabled] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const highlightTier = (searchParams?.get('tier') || '').trim();

  const reloadEntitlements = () => {
    if (!user) return;
    fetchMyB2cEntitlements()
      .then(setEntitlements)
      .catch(() => setEntitlements(null));
  };

  useEffect(() => {
    fetchB2cCatalog()
      .then((cat) => {
        setProducts(cat.products || []);
        setMockEnabled(Boolean(cat.payments?.mockEnabled));
      })
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (authPending || !user) return;
    reloadEntitlements();
  }, [authPending, user]);

  useEffect(() => {
    if (authPending || !user) return;
    const checkout = searchParams?.get('checkout');
    const paymentKey = searchParams?.get('paymentKey') || '';
    const orderId = searchParams?.get('orderId') || '';
    const amount = parseInt(searchParams?.get('amount') || '0', 10);
    if (checkout === 'success' && paymentKey && orderId && amount > 0) {
      completeB2cCheckoutFromReturn({ paymentKey, orderId, amount })
        .then((r) => {
          setMessage(`${r.tierGranted || '이용권'} 활성화되었습니다.`);
          reloadEntitlements();
          window.history.replaceState({}, '', '/discover/shop/');
        })
        .catch((err) => setError(err instanceof Error ? err.message : '결제 확인 실패'));
    } else if (checkout === 'fail') {
      setError('결제가 취소되었거나 실패했습니다.');
      window.history.replaceState({}, '', '/discover/shop/');
    }
  }, [authPending, user, searchParams]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const handlePurchase = async (productId: string) => {
    setLoadingId(productId);
    setError('');
    setMessage('');
    try {
      const result = await startB2cCheckoutRedirect(
        productId,
        `${origin}/discover/shop/?checkout=success`,
        `${origin}/discover/shop/?checkout=fail`,
      );
      if (result.tierGranted) {
        setMessage(`${result.tierGranted} 이용권이 활성화되었습니다.`);
        reloadEntitlements();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 실패');
    } finally {
      setLoadingId(null);
    }
  };

  const handleMock = async (productId: string) => {
    setLoadingId(productId);
    try {
      const prepared = await prepareB2cCheckout(productId);
      const result = await mockCompleteB2cCheckout(prepared.orderId);
      setMessage(`[테스트] ${result.tierGranted} 이용권 활성화`);
      reloadEntitlements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mock 실패');
    } finally {
      setLoadingId(null);
    }
  };

  if (authPending) {
    return <AuthLoadingState message="로그인 확인 중…" />;
  }

  if (showLoginRequired || !user) {
    return (
      <AuthRequiredState
        description="B2C 리포트 구매는 로그인 후 이용할 수 있습니다."
        loginHref="/login"
        autoRedirect={false}
      />
    );
  }

  return (
    <div className="space-y-6">
      {entitlements?.activeTier && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-emerald-100 text-sm">
          현재 이용 등급: <strong className="uppercase">{entitlements.activeTier}</strong>
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-emerald-900/40 border border-emerald-600/30 p-3 text-emerald-200 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-900/40 border border-red-600/30 p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => {
          const tier = p.entitlementTier || '';
          const highlighted =
            highlightTier === tier ||
            (highlightTier === 'basic' && p.id === 'b2c-basic');
          return (
            <div
              key={p.id}
              className={`rounded-xl border p-5 ${
                highlighted ? 'border-violet-400/50 bg-violet-950/30' : 'border-slate-200 bg-white/5'
              }`}
            >
              <h3 className="font-semibold text-white mb-1">{p.name}</h3>
              <p className="text-xs text-slate-400 mb-3">{TIER_LABELS[tier] || tier}</p>
              <p className="text-violet-300 font-bold mb-4">{p.amount.toLocaleString()}원</p>
              <button
                type="button"
                disabled={loadingId === p.id}
                onClick={() => handlePurchase(p.id)}
                className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
              >
                {loadingId === p.id ? '처리 중…' : '구매하기'}
              </button>
              {mockEnabled && (
                <button
                  type="button"
                  disabled={loadingId === p.id}
                  onClick={() => handleMock(p.id)}
                  className="w-full mt-2 py-1.5 text-xs border border-dashed border-amber-500/40 text-amber-200 rounded-lg"
                >
                  테스트 결제
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Discover는 협회 B2B2C 브랜드와 분리된 개인(D2C) 경로입니다.{' '}
        <Link href="/partners/" className="text-violet-300 underline">
          상담사·기관은 여기
        </Link>
      </p>
    </div>
  );
}
