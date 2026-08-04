'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import {
  counselorMenuCategories,
  getCounselorCategoryHubHref,
} from '@/data/counselorMenu';
import {
  fetchCounselorCohortMonitoring,
  fetchCounselorMonitoringHub,
  fetchCounselorOrgLiaisons,
  type CounselorOrgLiaison,
} from '@/lib/clientPortalApi';
import {
  readCachedCounselorDashboard,
  writeCachedCounselorDashboard,
} from '@/lib/counselorDashboardCache';
import { INDIVIDUAL_COHORT_KEY } from '@/lib/monitoringRealtime';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import type {
  CounselorCohortMonitoringResult,
  CounselorMonitoringHubResult,
} from '@/types/clientPortal';

const CATEGORY_ACCENT: Record<string, string> = {
  'psych-tests': 'from-sky-600/30 via-sky-500/10',
  tools: 'from-violet-600/25 via-violet-500/10',
  data: 'from-emerald-600/25 via-emerald-500/10',
  sales: 'from-amber-600/25 via-amber-500/10',
};

function StatChip({
  label,
  value,
  sub,
  href,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  sub?: string;
  href?: string;
  tone?: 'default' | 'success' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-300'
      : tone === 'warn'
        ? 'text-amber-300'
        : tone === 'danger'
          ? 'text-red-300'
          : 'text-white';

  const inner = (
    <>
      <p className="truncate text-xs leading-tight text-slate-400 sm:text-sm">{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums leading-none sm:text-2xl ${toneClass}`}>{value}</p>
      {sub ? <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">{sub}</p> : null}
    </>
  );

  const className = `${counselorHubClasses.statCard} min-w-0 px-2.5 py-2.5 sm:px-3.5 sm:py-3 transition-colors hover:border-sky-400/25`;

  if (href) {
    return (
      <AuthLink href={href} className={`block ${className}`}>
        {inner}
      </AuthLink>
    );
  }

  return <div className={className}>{inner}</div>;
}

export default function CounselorHomeDashboard() {
  const { authPending, showLoginRequired } = useAuthResolved();
  const initialCache = useMemo(() => readCachedCounselorDashboard(), []);
  const [hub, setHub] = useState<CounselorMonitoringHubResult | null>(() => initialCache?.hub ?? null);
  const [cohorts, setCohorts] = useState<CounselorCohortMonitoringResult | null>(
    () => initialCache?.cohorts ?? null,
  );
  const [liaisons, setLiaisons] = useState<CounselorOrgLiaison[]>(() => initialCache?.liaisons ?? []);
  const [loading, setLoading] = useState(() => !initialCache?.hub && !initialCache?.cohorts);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const cached = readCachedCounselorDashboard();
    const hasCache = Boolean(cached?.hub || cached?.cohorts);
    if (!hasCache) setLoading(true);
    else setRevalidating(true);
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
      writeCachedCounselorDashboard({ hub: hubData, cohorts: cohortData, liaisons: liaisonData });
    } catch (err) {
      if (!hasCache) {
        setError(err instanceof Error ? err.message : '대시보드 데이터를 불러오지 못했습니다.');
        setHub(null);
        setCohorts(null);
      }
    } finally {
      setLoading(false);
      setRevalidating(false);
    }
  }, []);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      if (!initialCache?.hub && !initialCache?.cohorts) setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load, initialCache?.hub, initialCache?.cohorts]);

  useRedirectOnLoginRequiredError(error);

  const summary = hub?.summary;
  const individualCohort = useMemo(
    () => cohorts?.cohorts.find((c) => c.cohortKey === INDIVIDUAL_COHORT_KEY) ?? null,
    [cohorts?.cohorts],
  );
  const groupCount = cohorts?.summary?.groupCohorts ?? 0;
  const recentActivity = (hub?.recentActivity || []).slice(0, 3);

  if (loading && !hub && !cohorts) {
    return <p className="py-12 text-center text-base text-slate-500">대시보드를 불러오는 중…</p>;
  }

  if (error && !hub && !cohorts) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-base text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] min-h-[32rem] max-h-[920px] flex-col gap-2 overflow-hidden sm:gap-2.5">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-white sm:text-xl">상담관리</h1>
          <p className="text-xs text-slate-400 sm:text-sm">전체 현황과 메뉴를 한 화면에서 확인하세요</p>
        </div>
        {revalidating ? (
          <p className="text-xs text-sky-300/70 sm:text-sm" role="status">
            갱신 중…
          </p>
        ) : null}
      </header>

      <div className="grid shrink-0 grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
        <StatChip
          label="활성 내담자"
          value={summary?.activePortals ?? 0}
          href="/counselor/clients"
        />
        <StatChip
          label="활성 상담코드"
          value={summary?.activeAssessments ?? 0}
          href="/counselor/assessments"
        />
        <StatChip
          label="검사 완료"
          value={summary?.completedRecipients ?? 0}
          sub={`/ ${summary?.totalRecipients ?? 0}명`}
          href="/counselor/test-results"
          tone="success"
        />
        <StatChip
          label="진행 중"
          value={summary?.inProgressRecipients ?? 0}
          href="/counselor/assign-tests"
          tone="warn"
        />
        <StatChip
          label="미시작"
          value={summary?.notStartedRecipients ?? 0}
          href="/counselor/clients"
        />
        <StatChip
          label="그룹 cohort"
          value={groupCount}
          sub={liaisons.length > 0 ? `B2B ${liaisons.length}곳` : undefined}
          href="/counselor/clients"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto md:overflow-hidden xl:grid-cols-4">
        {counselorMenuCategories.map((category) => (
          <section
            key={category.slug}
            className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-sky-400/15 bg-[#1a3358]/90 ${counselorHubClasses.subsection} !p-0`}
          >
            <AuthLink
              href={getCounselorCategoryHubHref(category.slug)}
              className={`flex shrink-0 items-center gap-2.5 border-b border-sky-400/20 bg-gradient-to-r ${CATEGORY_ACCENT[category.slug] ?? 'from-sky-600/25'} to-transparent px-3 py-2.5 transition-colors hover:bg-white/[0.03] sm:px-3.5 sm:py-3`}
            >
              <span className="text-lg leading-none sm:text-xl" aria-hidden>
                {category.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white sm:text-base">{category.category}</p>
                <p className="truncate text-xs text-sky-200/55 sm:text-sm">{category.description}</p>
              </div>
              <span className="shrink-0 text-base text-sky-300/40" aria-hidden>
                →
              </span>
            </AuthLink>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5 sm:p-3">
              {category.subcategories.map((sub) => (
                <div key={sub.name}>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 sm:text-sm">
                    <span aria-hidden>{sub.icon}</span>
                    {sub.name}
                  </p>
                  <ul className="grid grid-cols-2 gap-1.5">
                    {sub.items.map((item) => (
                      <li key={item.href}>
                        <AuthLink
                          href={item.href}
                          title={item.description}
                          className="group flex items-center gap-2 rounded-md border border-white/[0.06] bg-[#101f38]/80 px-2.5 py-2 text-sm text-slate-200 transition-colors hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-white sm:text-base"
                        >
                          <span className="shrink-0 text-base leading-none opacity-80 sm:text-lg" aria-hidden>
                            {item.icon}
                          </span>
                          <span className="min-w-0 truncate font-medium">{item.name}</span>
                        </AuthLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-300 sm:text-base">개별 내담자 진행</p>
            {individualCohort ? (
              <span className="text-sm tabular-nums text-slate-400 sm:text-base">
                {individualCohort.progress.percent}%
              </span>
            ) : null}
          </div>
          {individualCohort ? (
            <>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all"
                  style={{ width: `${individualCohort.progress.percent}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                완료 {individualCohort.completedPortals} · 진행 {individualCohort.inProgressPortals} · 미시작{' '}
                {individualCohort.notStartedPortals}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">개별 내담자 데이터 없음</p>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 sm:px-4 sm:py-3">
          <p className="text-sm font-semibold text-slate-300 sm:text-base">최근 검사 활동</p>
          {recentActivity.length === 0 ? (
            <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">최근 활동 없음</p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {recentActivity.map((item, i) => (
                <li key={`${item.portalId}-${item.testId}-${i}`} className="truncate text-xs text-slate-400 sm:text-sm">
                  <span className="text-slate-200">{item.displayName}</span>
                  <span className="text-slate-500"> · {item.assessmentTitle}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </footer>
    </div>
  );
}
