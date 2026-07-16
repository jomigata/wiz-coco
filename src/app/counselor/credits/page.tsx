'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import RoleGuard from '@/components/RoleGuard';
import CounselorCheckoutPanel from '@/components/commerce/CounselorCheckoutPanel';
import CounselorAiCreditsPanel from '@/components/counselor/CounselorAiCreditsPanel';
import {
  completeCheckoutFromReturn,
  fetchMyCredits,
  type CounselorCreditsResponse,
} from '@/lib/commerceApi';
import { PILOT_FREE_CREDITS } from '@/data/monetizationCatalog';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

function TabBar({
  tab,
  setTab,
}: {
  tab: 'assessment' | 'ai';
  setTab: (t: 'assessment' | 'ai') => void;
}) {
  return (
    <div className="flex gap-2 mb-6 border-b border-white/10 pb-3">
      <button
        type="button"
        onClick={() => setTab('assessment')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          tab === 'assessment'
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        검사 크레딧
      </button>
      <button
        type="button"
        onClick={() => setTab('ai')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          tab === 'ai'
            ? 'bg-violet-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        AI 크레딧
      </button>
    </div>
  );
}

function CreditsContent() {
  const searchParams = useSearchParams();
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [tab, setTab] = useState<'assessment' | 'ai'>('assessment');
  const [data, setData] = useState<CounselorCreditsResponse | null>(null);
  const [error, setError] = useState('');
  const [payMessage, setPayMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!user) return;
    fetchMyCredits()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : '조회 실패'));
  }, [user]);

  useEffect(() => {
    if (authPending || !user) {
      if (showLoginRequired) setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchMyCredits()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '조회 실패');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authPending, user, showLoginRequired]);

  useEffect(() => {
    if (authPending || !user) return;
    const checkout = searchParams?.get('checkout');
    const paymentKey = searchParams?.get('paymentKey') || '';
    const orderId = searchParams?.get('orderId') || '';
    const amountRaw = searchParams?.get('amount') || '';
    const amount = parseInt(amountRaw, 10);

    if (checkout === 'success' && paymentKey && orderId && amount > 0) {
      completeCheckoutFromReturn({ paymentKey, orderId, amount })
        .then((r) => {
          setPayMessage(`${r.creditsGranted ?? 0}크레딧이 충전되었습니다.`);
          reload();
          window.history.replaceState({}, '', '/counselor/credits/');
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : '결제 확인 실패');
        });
    } else if (checkout === 'fail') {
      setError('결제가 취소되었거나 실패했습니다.');
      window.history.replaceState({}, '', '/counselor/credits/');
    }
  }, [authPending, user, searchParams, reload]);

  if (authPending) {
    return <AuthLoadingState message="크레딧 정보를 불러오는 중…" />;
  }

  if (showLoginRequired || !user) {
    return <AuthRequiredState description="로그인 후 이용할 수 있습니다." />;
  }

  if (tab === 'ai') {
    return (
      <CounselorPageSection title="AI 크레딧" toolbar={<TabBar tab={tab} setTab={setTab} />}>
        <CounselorAiCreditsPanel />
      </CounselorPageSection>
    );
  }

  if (loading && !data) {
    return <AuthLoadingState message="크레딧 정보를 불러오는 중…" />;
  }

  return (
    <CounselorPageSection
      title="검사 크레딧"
      description={`내담자 1명(포털 1개) 발급 = 1크레딧. 파일럿 상담사는 협회에서 ${PILOT_FREE_CREDITS}크레딧을 지급받을 수 있습니다.`}
      toolbar={<TabBar tab={tab} setTab={setTab} />}
    >
      {payMessage && (
        <div className="mb-4 rounded-lg bg-emerald-900/40 border border-emerald-600/40 p-4 text-emerald-200 text-sm">
          {payMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-900/40 border border-red-600/40 p-4 text-red-200 text-sm">
          {error}
        </div>
      )}

      <CounselorCheckoutPanel onSuccess={reload} />

      {data && (
        <>
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-6 mb-6">
            <p className="text-sm text-blue-200 mb-1">보유 크레딧</p>
            <p className="text-4xl font-bold text-white">{data.balance}</p>
            {data.subscription?.planId && (
              <p className="text-sm text-indigo-200 mt-2">
                구독: {data.subscription.planId} · 월 {data.subscription.creditsPerMonth}크레딧
                {data.subscription.currentPeriodEnd
                  ? ` · 만료 ${String(data.subscription.currentPeriodEnd).slice(0, 10)}`
                  : ''}
              </p>
            )}
            {data.enforceCredits ? (
              <p className="text-xs text-amber-300 mt-2">크레딧 부족 시 일괄 발송이 차단됩니다.</p>
            ) : (
              <p className="text-xs text-slate-400 mt-2">
                파일럿 모드: 크레딧 부족 시에도 발송 가능(협회 정책 전환 예정).
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href="/counselor/assessments/new/"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500"
            >
              새 검사코드 만들기
            </Link>
            <Link
              href="/partners/"
              className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm hover:bg-white/10"
            >
              파트너 · 요금 안내
            </Link>
          </div>

          <p className="mb-3 text-sm font-semibold text-slate-300">최근 내역</p>
          <ul className="space-y-2 text-sm">
            {(data.ledger || []).length === 0 && (
              <li className="text-slate-500">아직 내역이 없습니다.</li>
            )}
            {(data.ledger || []).map((row) => (
              <li
                key={row.id}
                className="flex justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-slate-300"
              >
                <span>
                  {row.delta > 0 ? '+' : ''}
                  {row.delta} · {row.reason}
                </span>
                <span className="text-slate-500">잔액 {row.balanceAfter}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </CounselorPageSection>
  );
}
export default function CounselorCreditsPage() {
  return (
    <RoleGuard allowedRoles={['counselor', 'admin']}>
      <React.Suspense fallback={<AuthLoadingState message="불러오는 중…" />}>
        <CreditsContent />
      </React.Suspense>
    </RoleGuard>
  );
}
