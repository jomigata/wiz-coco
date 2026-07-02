'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import { fetchOrgGroupReport, fetchOrgMe, printOrgGroupReport } from '@/lib/orgApi';
import { AuthLoadingState } from '@/components/auth/AuthStatusViews';

function ReportContent() {
  const searchParams = useSearchParams();
  const cohortId = searchParams?.get('cohortId') || '';
  const [report, setReport] = useState<Awaited<ReturnType<typeof fetchOrgGroupReport>> | null>(null);
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cohortId) return;
    Promise.all([fetchOrgGroupReport(cohortId), fetchOrgMe()])
      .then(([r, me]) => {
        setReport(r);
        setOrgName(me.organization?.name || '기관');
      })
      .catch((e) => setError(e instanceof Error ? e.message : '조회 실패'));
  }, [cohortId]);

  if (!cohortId) {
    return <p className="text-slate-400">cohortId가 필요합니다.</p>;
  }

  if (error) {
    return <p className="text-red-300">{error}</p>;
  }

  if (!report) {
    return <p className="text-slate-400">불러오는 중…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-6">
        <p className="text-xs text-indigo-300 mb-1">익명 그룹 통계 · 별도 과금 상품</p>
        <h2 className="text-xl font-bold text-white">{report.cohortName}</h2>
        <p className="text-slate-400 text-sm mt-1">{report.disclaimer}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['참여', report.participantCount],
          ['완료', report.completedCount],
          ['진행 중', report.inProgressCount],
          ['완료율', `${report.completionRatePercent}%`],
        ].map(([label, val]) => (
          <div key={String(label)} className="rounded-lg border border-white/10 p-4 bg-white/5">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-xl font-semibold text-white">{val}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-white font-medium mb-2">검사별 완료 (익명 집계)</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {report.byTest.map((t) => (
            <li key={t.testId} className="flex justify-between border-b border-white/5 pb-2">
              <span>{t.name}</span>
              <span>{t.completedCount}건</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => printOrgGroupReport(report, orgName)}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500"
      >
        PDF / 인쇄 (그룹 리포트)
      </button>
    </div>
  );
}

export default function OrgReportsPage() {
  return (
    <RoleGuard allowedRoles={['org_admin', 'admin']}>
      <div className="p-6 max-w-2xl mx-auto">
        <Link href="/org/dashboard/" className="text-blue-400 text-sm hover:underline">
          ← 대시보드
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4 mb-6">그룹 통계 리포트</h1>
        <Suspense fallback={<AuthLoadingState message="불러오는 중…" />}>
          <ReportContent />
        </Suspense>
      </div>
    </RoleGuard>
  );
}
