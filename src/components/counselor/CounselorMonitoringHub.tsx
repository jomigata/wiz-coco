'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import CounselorCohortMonitoringView from '@/components/counselor/CounselorCohortMonitoringView';
import CounselorCareMonitoringView from '@/components/counselor/CounselorCareMonitoringView';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { fetchCounselorMonitoringHub } from '@/lib/clientPortalApi';
import { filterHubByCohort, INDIVIDUAL_COHORT_KEY } from '@/lib/monitoringRealtime';
import { counselorClientDetailHref } from '@/lib/counselorClientRoutes';
import { useCounselorMonitoringRealtime } from '@/hooks/useCounselorMonitoringRealtime';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import type { CounselorMonitoringAssessment } from '@/types/clientPortal';

export type MonitoringHubView = 'overview' | 'cohorts' | 'care';

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function progressHref(assessmentId: string): string {
  return `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`;
}

function statusBadge(label: string): { text: string; className: string } {
  switch (label) {
    case 'completed':
      return { text: '완료', className: 'text-emerald-300 bg-emerald-500/15' };
    case 'in_progress':
      return { text: '진행 중', className: 'text-sky-300 bg-sky-500/15' };
    case 'not_started':
      return { text: '미시작', className: 'text-amber-300 bg-amber-500/15' };
    default:
      return { text: '검사 없음', className: 'text-slate-500 bg-slate-500/15' };
  }
}

function AssessmentCard({ item }: { item: CounselorMonitoringAssessment }) {
  const badge = statusBadge(item.progress.label);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{item.title}</h3>
          <p className="mt-0.5 font-mono text-xs text-slate-400">
            {formatAccessCodeDisplay(item.joinAccessCode)}
          </p>
          {item.cohortName ? (
            <p className="mt-1 text-xs text-slate-500">{item.cohortName}</p>
          ) : null}
        </div>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.text} {item.progress.percent}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-sky-500 transition-all duration-500"
          style={{ width: `${item.progress.percent}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>
          내담자 <strong className="text-slate-200">{item.recipientCount}</strong>명
        </span>
        <span>
          완료 <strong className="text-emerald-300">{item.completedRecipients}</strong>
        </span>
        <span>
          진행 <strong className="text-sky-300">{item.inProgressRecipients}</strong>
        </span>
        <span>
          미시작 <strong className="text-amber-300">{item.notStartedRecipients}</strong>
        </span>
        {item.notifyFailedCount > 0 ? (
          <span>
            발송 실패 <strong className="text-red-400">{item.notifyFailedCount}</strong>
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AuthLink
          href={progressHref(item.assessmentId)}
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
        >
          발송·검사 현황
        </AuthLink>
        <AuthLink
          href="/counselor/clients"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
        >
          내담자 보기
        </AuthLink>
      </div>
    </div>
  );
}

type Props = {
  initialView?: MonitoringHubView;
};

export default function CounselorMonitoringHub({ initialView = 'overview' }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authPending, showLoginRequired, isAuthenticated } = useAuthResolved();
  const [view, setView] = useState<MonitoringHubView>(initialView);
  const [baseData, setBaseData] = useState<Awaited<ReturnType<typeof fetchCounselorMonitoringHub>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cohortFilter, setCohortFilter] = useState('');

  useEffect(() => {
    const param = searchParams.get('view');
    if (param === 'cohorts' || param === 'overview' || param === 'care') {
      setView(param);
    }
  }, [searchParams]);

  const setHubView = useCallback(
    (next: MonitoringHubView) => {
      setView(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'overview') {
        params.delete('view');
      } else {
        params.set('view', next);
      }
      const qs = params.toString();
      router.replace(qs ? `/counselor/progress?${qs}` : '/counselor/progress', { scroll: false });
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCounselorMonitoringHub();
      setBaseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '모니터링 데이터를 불러오지 못했습니다.');
      setBaseData(null);
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

  const assessmentIds = useMemo(
    () => (baseData?.assessments || []).map((a) => a.assessmentId),
    [baseData?.assessments],
  );

  const { data: liveData, isLive, liveError, lastUpdatedAt } = useCounselorMonitoringRealtime(
    assessmentIds,
    baseData,
    isAuthenticated && !authPending,
  );

  const fullHub = liveData ?? baseData;
  const hub = useMemo(
    () => (fullHub && view === 'overview' ? filterHubByCohort(fullHub, cohortFilter) : fullHub),
    [fullHub, cohortFilter, view],
  );

  if (loading && view === 'overview') {
    return <p className="py-12 text-center text-sm text-slate-500">모니터링 허브를 불러오는 중…</p>;
  }

  if (error && view === 'overview') {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  const liveUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <CounselorPageSection
      title="모니터링 뷰"
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setHubView('overview')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              view === 'overview'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => setHubView('care')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              view === 'care'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            치료·과제
          </button>
          <button
            type="button"
            onClick={() => setHubView('cohorts')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              view === 'cohorts'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            그룹
          </button>
        </div>
      }
      noBodyPadding
      bodyClassName="!p-0"
    >
    <div className="space-y-3 p-2.5 sm:p-3">

      {view === 'care' ? (
        <CounselorCareMonitoringView />
      ) : view === 'cohorts' ? (
        <CounselorCohortMonitoringView
          liveHub={fullHub}
          isLive={isLive}
          liveError={liveError}
          lastUpdatedAt={lastUpdatedAt}
        />
      ) : !hub ? null : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                모든 검사코드의 발송·검사 진행을 한 화면에서 확인합니다. 검사코드를 선택하면 알림·재발송·상세
                모니터링으로 이동합니다.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                    실시간 연결됨
                    {liveUpdatedLabel ? <span className="text-slate-500">· {liveUpdatedLabel}</span> : null}
                  </span>
                ) : liveError ? (
                  <span className="text-amber-300">실시간 일시 중단 · API 기준 표시</span>
                ) : (
                  <span className="text-slate-500">실시간 연결 중…</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <AuthLink
                href="/counselor/assessments/new"
                className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
              >
                + 새 검사코드
              </AuthLink>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                새로고침
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">활성 검사코드</p>
              <p className="mt-1 text-2xl font-semibold text-white">{hub.summary.activeAssessments}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">내담자(배정)</p>
              <p className="mt-1 text-2xl font-semibold text-white">{hub.summary.totalRecipients}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">진행 중</p>
              <p className="mt-1 text-2xl font-semibold text-sky-300">{hub.summary.inProgressRecipients}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">검사 완료</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{hub.summary.completedRecipients}</p>
            </div>
          </div>

          {hub.summary.notifyFailedCount > 0 ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              자격증명 발송 실패 {hub.summary.notifyFailedCount}건 — 검사코드별 「발송·검사 현황」에서 재발송할 수
              있습니다.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            >
          <option value="">전체 그룹</option>
          <option value={INDIVIDUAL_COHORT_KEY}>개별 발급</option>
          {hub.cohorts.map((c) => (
                <option key={c.cohortId} value={c.cohortId}>
                  {c.cohortName || c.cohortId}
                </option>
              ))}
            </select>
            <AuthLink href="/counselor/clients" className="text-sm text-sky-400 hover:text-sky-300">
              내담자 CRM →
            </AuthLink>
            <AuthLink href="/counselor/assign-tests" className="text-sm text-sky-400 hover:text-sky-300">
              검사 할당 →
            </AuthLink>
          </div>

          <CounselorPageSection title="검사코드별 진행" className="!rounded-lg">
            {hub.assessments.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
                <p className="text-slate-300">모니터링할 검사코드가 없습니다.</p>
                <AuthLink
                  href="/counselor/assessments/new"
                  className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
                >
                  검사코드 발급하기
                </AuthLink>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {hub.assessments.map((item) => (
                  <AssessmentCard key={item.assessmentId} item={item} />
                ))}
              </div>
            )}
          </CounselorPageSection>

          <CounselorPageSection title="최근 검사 완료" className="!rounded-lg">
            {hub.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">아직 완료된 검사가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3 font-medium">시각</th>
                      <th className="px-4 py-3 font-medium">내담자</th>
                      <th className="px-4 py-3 font-medium">검사코드</th>
                      <th className="px-4 py-3 font-medium">검사</th>
                      <th className="px-4 py-3 font-medium">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hub.recentActivity.map((row) => (
                      <tr
                        key={row.resultId}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-2.5 text-xs text-slate-400">{formatDateTime(row.completedAt)}</td>
                        <td className="px-4 py-2.5">
                          <Link
                            href={counselorClientDetailHref(row.portalId)}
                            className="text-slate-200 hover:text-sky-300"
                          >
                            {row.displayName || '내담자'}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">{row.assessmentTitle}</td>
                        <td className="px-4 py-2.5 text-slate-300">{row.testId}</td>
                        <td className="px-4 py-2.5">
                          <AuthLink
                            href={progressHref(row.assessmentId)}
                            className="text-xs text-sky-400 hover:text-sky-300"
                          >
                            현황
                          </AuthLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CounselorPageSection>
        </>
      )}
    </div>
    </CounselorPageSection>
  );
}
