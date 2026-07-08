'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthLink from '@/components/auth/AuthLink';
import {
  fetchCounselorCohortMonitoring,
  fetchCounselorMonitoringHub,
  fetchCounselorOrgLiaisons,
  type CounselorOrgLiaison,
} from '@/lib/clientPortalApi';
import { INDIVIDUAL_COHORT_KEY } from '@/lib/monitoringRealtime';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import type {
  CounselorCohortMonitoringItem,
  CounselorCohortMonitoringResult,
  CounselorMonitoringHubResult,
} from '@/types/clientPortal';

type DashboardTab = 'individual' | 'group';

const QUICK_LINKS = [
  { title: '내담자 목록', href: '/counselor/clients', icon: '👥' },
  { title: '검사코드 목록', href: '/counselor/assessments', icon: '📦' },
  { title: '진행 모니터링', href: '/counselor/progress', icon: '📈' },
  { title: '검사코드 관리', href: '/counselor/test-codes', icon: '🔑' },
];

function progressColor(percent: number): string {
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 40) return 'bg-sky-500';
  return 'bg-amber-500';
}

function CohortRow({ cohort }: { cohort: CounselorCohortMonitoringItem }) {
  const isIndividual = cohort.cohortKey === INDIVIDUAL_COHORT_KEY;
  const href = isIndividual
    ? '/counselor/clients'
    : cohort.cohortId
      ? `/counselor/clients?cohortId=${encodeURIComponent(cohort.cohortId)}`
      : '/counselor/clients';

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-white">{cohort.cohortName}</p>
          <p className="text-xs text-slate-500">
            {isIndividual ? '개별 내담자' : `그룹 · ${cohort.portalCount}명`}
          </p>
        </div>
        <span className="text-sm font-semibold text-slate-200">{cohort.progress.percent}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${progressColor(cohort.progress.percent)}`}
          style={{ width: `${cohort.progress.percent}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>완료 {cohort.completedPortals}</span>
        <span>진행 {cohort.inProgressPortals}</span>
        <span>미시작 {cohort.notStartedPortals}</span>
        <AuthLink href={href} className="text-sky-400 hover:text-sky-300">
          상세 →
        </AuthLink>
      </div>
    </div>
  );
}

function OrgLiaisonCard({ org }: { org: CounselorOrgLiaison }) {
  return (
    <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-white">{org.name}</p>
          <p className="text-xs text-slate-500">
            {org.type} · cohort {org.cohortCount} · 크레딧 {org.creditBalance}
          </p>
        </div>
      </div>
      {org.cohorts.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          {org.cohorts.slice(0, 3).map((c) => (
            <li key={c.cohortId}>
              {c.cohortName} — {c.completedCount}/{c.participantCount}명 ({c.completionRatePercent}%)
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-500">등록된 cohort 없음</p>
      )}
    </div>
  );
}

export default function CounselorHomeDashboard() {
  const { authPending, showLoginRequired } = useAuthResolved();
  const [tab, setTab] = useState<DashboardTab>('individual');
  const [hub, setHub] = useState<CounselorMonitoringHubResult | null>(null);
  const [cohorts, setCohorts] = useState<CounselorCohortMonitoringResult | null>(null);
  const [liaisons, setLiaisons] = useState<CounselorOrgLiaison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [hubData, cohortData, liaisonData] = await Promise.all([
        fetchCounselorMonitoringHub(),
        fetchCounselorCohortMonitoring(),
        fetchCounselorOrgLiaisons().catch(() => []),
      ]);
      setHub(hubData);
      setCohorts(cohortData);
      setLiaisons(liaisonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '대시보드 데이터를 불러오지 못했습니다.');
      setHub(null);
      setCohorts(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load]);

  useRedirectOnLoginRequiredError(error);

  const individualCohort = useMemo(
    () =>
      cohorts?.cohorts.find((c) => c.cohortKey === INDIVIDUAL_COHORT_KEY) ?? null,
    [cohorts?.cohorts],
  );

  const groupCohorts = useMemo(
    () => (cohorts?.cohorts || []).filter((c) => c.cohortKey !== INDIVIDUAL_COHORT_KEY),
    [cohorts?.cohorts],
  );

  const summary = hub?.summary;
  const cohortSummary = cohorts?.summary;

  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">대시보드를 불러오는 중…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">활성 내담자</p>
          <p className="mt-1 text-2xl font-bold text-white">{summary?.activePortals ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">활성 검사코드</p>
          <p className="mt-1 text-2xl font-bold text-white">{summary?.activeAssessments ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">검사 완료</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{summary?.completedRecipients ?? 0}</p>
          <p className="text-xs text-slate-500">/ {summary?.totalRecipients ?? 0}명</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">그룹 cohort</p>
          <p className="mt-1 text-2xl font-bold text-white">{cohortSummary?.groupCohorts ?? 0}</p>
          <p className="text-xs text-slate-500">개별 {cohortSummary?.individualCohorts ?? 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setTab('individual')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'individual'
              ? 'bg-sky-600 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          개별 내담자
        </button>
        <button
          type="button"
          onClick={() => setTab('group')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'group'
              ? 'bg-violet-600 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          그룹·기관
        </button>
        <AuthLink
          href="/counselor/progress"
          className="ml-auto text-sm text-sky-400 hover:text-sky-300"
        >
          전체 모니터링 허브 →
        </AuthLink>
      </div>

      {tab === 'individual' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">개별 진행 현황</h2>
            {individualCohort ? (
              <CohortRow cohort={individualCohort} />
            ) : (
              <p className="text-sm text-slate-500">개별 내담자 데이터가 없습니다.</p>
            )}
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-300">
                완료 {summary?.completedRecipients ?? 0}
              </div>
              <div className="rounded-lg bg-sky-500/10 p-3 text-sky-300">
                진행 {summary?.inProgressRecipients ?? 0}
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3 text-amber-300">
                미시작 {summary?.notStartedRecipients ?? 0}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">최근 활동</h2>
            {(hub?.recentActivity || []).length === 0 ? (
              <p className="text-sm text-slate-500">최근 검사 활동이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {(hub?.recentActivity || []).slice(0, 6).map((item, i) => (
                  <li
                    key={`${item.portalId}-${item.testId}-${i}`}
                    className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
                  >
                    <span className="text-white">{item.displayName}</span>
                    <span className="text-slate-500"> · {item.assessmentTitle}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">그룹 cohort ({groupCohorts.length})</h2>
            {groupCohorts.length === 0 ? (
              <p className="text-sm text-slate-500">그룹 cohort가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {groupCohorts.slice(0, 6).map((c) => (
                  <CohortRow key={c.cohortKey} cohort={c} />
                ))}
              </div>
            )}
            <AuthLink
              href="/counselor/progress?view=cohorts"
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              그룹 모니터링 상세 →
            </AuthLink>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">담당 B2B 기관 ({liaisons.length})</h2>
            {liaisons.length === 0 ? (
              <p className="text-sm text-slate-500">liaison으로 배정된 기관이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {liaisons.map((org) => (
                  <OrgLiaisonCard key={org.organizationId} org={org} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">빠른 접근</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10"
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="mt-2 text-sm font-medium text-white">{item.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
