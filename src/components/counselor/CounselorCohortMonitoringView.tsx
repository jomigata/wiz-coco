'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { fetchCounselorCohortMonitoring } from '@/lib/clientPortalApi';
import {
  applyRealtimeToCohortMonitoring,
  INDIVIDUAL_COHORT_KEY,
} from '@/lib/monitoringRealtime';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import type {
  CounselorCohortMonitoringAssessment,
  CounselorCohortMonitoringItem,
  CounselorCohortMonitoringResult,
  CounselorMonitoringHubResult,
} from '@/types/clientPortal';

type Props = {
  liveHub?: CounselorMonitoringHubResult | null;
  isLive?: boolean;
  liveError?: string;
  lastUpdatedAt?: Date | null;
};

function progressHref(assessmentId: string): string {
  return `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`;
}

function clientsHref(cohort: CounselorCohortMonitoringItem): string {
  if (cohort.cohortKey === INDIVIDUAL_COHORT_KEY) {
    return `/counselor/clients?cohortId=${encodeURIComponent(INDIVIDUAL_COHORT_KEY)}`;
  }
  if (cohort.cohortId) {
    return `/counselor/clients?cohortId=${encodeURIComponent(cohort.cohortId)}`;
  }
  return '/counselor/clients';
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

function AssessmentRow({ item }: { item: CounselorCohortMonitoringAssessment }) {
  const badge = statusBadge(item.progress.label);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-200">{item.title}</p>
        <p className="font-mono text-[11px] text-slate-500">
          {formatAccessCodeDisplay(item.joinAccessCode)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>
          {item.completedRecipients}/{item.recipientCount}명
        </span>
        <span className={`rounded px-1.5 py-0.5 font-medium ${badge.className}`}>
          {badge.text} {item.progress.percent}%
        </span>
        <AuthLink
          href={progressHref(item.assessmentId)}
          className="text-sky-400 hover:text-sky-300"
        >
          현황
        </AuthLink>
      </div>
    </div>
  );
}

function CohortCard({ item }: { item: CounselorCohortMonitoringItem }) {
  const badge = statusBadge(item.progress.label);
  const isIndividual = item.cohortKey === INDIVIDUAL_COHORT_KEY;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{item.cohortName}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {isIndividual ? '그룹 미지정 내담자' : `그룹 ID · ${item.cohortId}`}
          </p>
        </div>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.text} {item.progress.percent}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-500"
          style={{ width: `${item.progress.percent}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>
          내담자 <strong className="text-slate-200">{item.portalCount}</strong>명
        </span>
        <span>
          검사코드 <strong className="text-slate-200">{item.assessmentCount}</strong>건
        </span>
        <span>
          완료 <strong className="text-emerald-300">{item.completedPortals}</strong>
        </span>
        <span>
          진행 <strong className="text-sky-300">{item.inProgressPortals}</strong>
        </span>
        <span>
          미시작 <strong className="text-amber-300">{item.notStartedPortals}</strong>
        </span>
        {item.notifyFailedCount > 0 ? (
          <span>
            발송 실패 <strong className="text-red-400">{item.notifyFailedCount}</strong>
          </span>
        ) : null}
      </div>

      {item.assessments.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-slate-500">검사코드별 진행</p>
          {item.assessments.slice(0, 4).map((a) => (
            <AssessmentRow key={a.assessmentId} item={a} />
          ))}
          {item.assessments.length > 4 ? (
            <p className="text-xs text-slate-500">외 {item.assessments.length - 4}건</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <AuthLink
          href={clientsHref(item)}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
        >
          내담자 보기
        </AuthLink>
        {item.assessments[0] ? (
          <AuthLink
            href={progressHref(item.assessments[0].assessmentId)}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            대표 검사 현황
          </AuthLink>
        ) : null}
      </div>
    </div>
  );
}

export default function CounselorCohortMonitoringView({
  liveHub,
  isLive = false,
  liveError = '',
  lastUpdatedAt = null,
}: Props) {
  const { authPending, showLoginRequired } = useAuthResolved();
  const [baseData, setBaseData] = useState<CounselorCohortMonitoringResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCounselorCohortMonitoring();
      setBaseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '그룹 모니터링 데이터를 불러오지 못했습니다.');
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

  const data = useMemo(() => {
    if (!baseData) return null;
    if (!liveHub) return baseData;
    return applyRealtimeToCohortMonitoring(baseData, liveHub);
  }, [baseData, liveHub]);

  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">그룹 모니터링을 불러오는 중…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const liveUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            학급·단체(그룹)별로 내담자 수와 검사 진행률을 집계합니다. 그룹을 선택하면 해당 내담자 CRM으로
            이동합니다.
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
            ) : liveHub ? (
              <span className="text-slate-500">실시간 연결 중…</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          새로고침
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">그룹 수</p>
          <p className="mt-1 text-2xl font-semibold text-white">{data.summary.totalCohorts}</p>
          <p className="mt-1 text-xs text-slate-500">
            단체 {data.summary.groupCohorts} · 개별 {data.summary.individualCohorts}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">내담자(배정)</p>
          <p className="mt-1 text-2xl font-semibold text-white">{data.summary.totalPortals}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">진행 중</p>
          <p className="mt-1 text-2xl font-semibold text-sky-300">{data.summary.inProgressPortals}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">검사 완료</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{data.summary.completedPortals}</p>
        </div>
      </div>

      {data.summary.notifyFailedCount > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          자격증명 발송 실패 {data.summary.notifyFailedCount}건 — 검사코드별 「발송·검사 현황」에서 재발송할 수
          있습니다.
        </div>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">그룹별 진행</h2>
        {data.cohorts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
            <p className="text-slate-300">집계할 그룹이 없습니다.</p>
            <p className="mt-2 text-sm text-slate-500">
              검사코드를 발급하고 내담자를 배정하면 그룹별 진행이 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.cohorts.map((item) => (
              <CohortCard key={item.cohortKey} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
