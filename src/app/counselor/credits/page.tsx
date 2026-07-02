'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { fetchMyCredits, type CounselorCreditsResponse } from '@/lib/commerceApi';
import { PILOT_FREE_CREDITS } from '@/data/monetizationCatalog';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

export default function CounselorCreditsPage() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [data, setData] = useState<CounselorCreditsResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  if (authPending || (loading && !data)) {
    return (
      <RoleGuard allowedRoles={['counselor', 'admin']}>
        <AuthLoadingState message="크레딧 정보를 불러오는 중…" />
      </RoleGuard>
    );
  }

  if (showLoginRequired || !user) {
    return (
      <RoleGuard allowedRoles={['counselor', 'admin']}>
        <AuthRequiredState description="로그인 후 이용할 수 있습니다." />
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['counselor', 'admin']}>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">검사 크레딧</h1>
        <p className="text-slate-400 text-sm mb-6">
          내담자 1명(포털 1개) 발급 = 1크레딧. 파일럿 상담사는 협회에서{' '}
          {PILOT_FREE_CREDITS}크레딧을 지급받을 수 있습니다.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/40 border border-red-600/40 p-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-6 mb-6">
              <p className="text-sm text-blue-200 mb-1">보유 크레딧</p>
              <p className="text-4xl font-bold text-white">{data.balance}</p>
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
                요금 · 패키지 안내
              </Link>
            </div>

            <h2 className="text-lg font-semibold text-white mb-3">최근 내역</h2>
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
      </div>
    </RoleGuard>
  );
}
