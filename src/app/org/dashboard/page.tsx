'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { fetchOrgMe, type OrgCohortSummary } from '@/lib/orgApi';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

export default function OrgDashboardPage() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchOrgMe>> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authPending || !user) {
      if (showLoginRequired) setLoading(false);
      return;
    }
    fetchOrgMe()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : '조회 실패'))
      .finally(() => setLoading(false));
  }, [authPending, user, showLoginRequired]);

  if (authPending || loading) {
    return (
      <RoleGuard allowedRoles={['org_admin', 'admin']}>
        <AuthLoadingState message="기관 대시보드 불러오는 중…" />
      </RoleGuard>
    );
  }

  if (showLoginRequired || !user) {
    return (
      <RoleGuard allowedRoles={['org_admin', 'admin']}>
        <AuthRequiredState description="로그인 후 이용할 수 있습니다." />
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['org_admin', 'admin']}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">기관 대시보드</h1>
        <p className="text-slate-400 text-sm mb-6">
          {data?.organization?.name || '기관'} · B2B 선결제 · 내담자 0원 입장
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/40 border border-red-600/40 p-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                <p className="text-xs text-emerald-300">기관 크레딧</p>
                <p className="text-3xl font-bold text-white">{data.creditBalance}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:col-span-2">
                <p className="text-xs text-slate-400">안내</p>
                <p className="text-sm text-slate-300 mt-1">
                  1크레딧 = 내담자 1명. 기관 선결제로 임직원·학생은 코드만으로 무료 검사합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/org/dispatch/"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500"
              >
                일괄 발송 (선결제)
              </Link>
              <Link href="/partners/" className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm">
                B2B 안내
              </Link>
            </div>

            <h2 className="text-lg font-semibold text-white mb-3">cohort · 학급/부서 현황</h2>
            <CohortTable cohorts={data.cohorts || []} />
          </>
        )}
      </div>
    </RoleGuard>
  );
}

function CohortTable({ cohorts }: { cohorts: OrgCohortSummary[] }) {
  if (!cohorts.length) {
    return <p className="text-slate-500 text-sm">아직 cohort가 없습니다. 일괄 발송으로 시작하세요.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-sm text-slate-300">
        <thead className="bg-white/5 text-slate-400">
          <tr>
            <th className="px-3 py-2 text-left">이름</th>
            <th className="px-3 py-2 text-right">인원</th>
            <th className="px-3 py-2 text-right">완료</th>
            <th className="px-3 py-2 text-right">완료율</th>
            <th className="px-3 py-2 text-left">리포트</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.cohortId} className="border-t border-white/5">
              <td className="px-3 py-2">{c.cohortName}</td>
              <td className="px-3 py-2 text-right">{c.participantCount}</td>
              <td className="px-3 py-2 text-right">{c.completedCount}</td>
              <td className="px-3 py-2 text-right">{c.completionRatePercent}%</td>
              <td className="px-3 py-2">
                <Link
                  href={`/org/reports/?cohortId=${encodeURIComponent(c.cohortId)}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  익명 통계
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
