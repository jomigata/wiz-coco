'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthLink from '@/components/auth/AuthLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import CounselorSlashInfoCell from '@/components/counselor/CounselorSlashInfoCell';
import {
  fetchCounselorCohortMonitoring,
  fetchCounselorMonitoringHub,
  fetchCounselorOrgLiaisons,
  type CounselorOrgLiaison,
} from '@/lib/clientPortalApi';
import {
  listAssessments,
  readCachedAssessmentsList,
  type CounselorAssessment,
} from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  readCachedCounselorDashboard,
  writeCachedCounselorDashboard,
} from '@/lib/counselorDashboardCache';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import { INDIVIDUAL_COHORT_KEY } from '@/lib/monitoringRealtime';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import {
  counselorListBodyRowClass,
  counselorListHeaderRowClass,
  counselorListNoThClass,
  counselorListTableWrapperClass,
  counselorListTdCompactClass,
  counselorListThClass,
  counselorResultMetricClass,
  formatCounselorIssueDate,
} from '@/lib/counselorListTableStyles';
import type {
  CounselorCohortMonitoringResult,
  CounselorMonitoringHubResult,
} from '@/types/clientPortal';

function resultStatusCounts(a: CounselorAssessment) {
  const dispatchSent = a.dispatchSentCount ?? 0;
  const dispatchFailed = a.dispatchFailedCount ?? 0;
  const testComplete = a.testCompleteCount ?? a.emailsCompletedAllTestsCount ?? 0;
  const testIncomplete = a.testIncompleteCount ?? a.emailsNotCompletedAllTestsCount ?? 0;
  const dispatchTotal = Math.max(testComplete + testIncomplete, dispatchSent + dispatchFailed);
  return { dispatchFailed, testIncomplete, dispatchTotal };
}

function formatUsageEndDate(iso: string | undefined): string {
  const s = (iso || '').trim();
  if (!s) return '무기한';
  try {
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('ko-KR');
  } catch {
    return s;
  }
}

function isExpired(iso: string | undefined): boolean {
  const s = (iso || '').trim();
  if (!s) return false;
  try {
    return new Date(`${s}T23:59:59`) < new Date();
  } catch {
    return false;
  }
}

function isExpiringSoon(iso: string | undefined, withinDays = 7): boolean {
  const s = (iso || '').trim();
  if (!s || isExpired(s)) return false;
  try {
    const end = new Date(`${s}T23:59:59`).getTime();
    const now = Date.now();
    return end - now <= withinDays * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function InsightTile({
  emoji,
  label,
  value,
  hint,
  href,
  accent,
}: {
  emoji: string;
  label: string;
  value: number | string;
  hint: string;
  href?: string;
  accent: 'sky' | 'amber' | 'emerald' | 'violet';
}) {
  const accentMap = {
    sky: 'border-sky-400/25 bg-sky-500/10 text-sky-100',
    amber: 'border-amber-400/25 bg-amber-500/10 text-amber-100',
    emerald: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100',
    violet: 'border-violet-400/25 bg-violet-500/10 text-violet-100',
  };

  const inner = (
    <div className={`rounded-xl border p-3 transition-colors hover:border-white/20 ${accentMap[accent]}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xl leading-none" aria-hidden>
          {emoji}
        </span>
        <p className="text-2xl font-bold tabular-nums leading-none text-white">{value}</p>
      </div>
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
    </div>
  );

  if (href) {
    return (
      <AuthLink href={href} className="block">
        {inner}
      </AuthLink>
    );
  }
  return inner;
}

export default function CounselorHomeDashboard() {
  const router = useRouter();
  const { authPending, showLoginRequired } = useAuthResolved();
  const initialCache = useMemo(() => readCachedCounselorDashboard(), []);
  const [hub, setHub] = useState<CounselorMonitoringHubResult | null>(() => initialCache?.hub ?? null);
  const [cohorts, setCohorts] = useState<CounselorCohortMonitoringResult | null>(
    () => initialCache?.cohorts ?? null,
  );
  const [liaisons, setLiaisons] = useState<CounselorOrgLiaison[]>(() => initialCache?.liaisons ?? []);
  const [assessments, setAssessments] = useState<CounselorAssessment[]>(
    () => readCachedAssessmentsList() ?? [],
  );
  const [loading, setLoading] = useState(() => !initialCache?.hub && !initialCache?.cohorts);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState('');

  const cellLinkClass =
    'cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/60 rounded-sm';

  const load = useCallback(async () => {
    const cached = readCachedCounselorDashboard();
    const hasCache = Boolean(cached?.hub || cached?.cohorts);
    if (!hasCache) setLoading(true);
    else setRevalidating(true);
    setError('');
    try {
      const [hubData, cohortData, liaisonData, assessmentData] = await Promise.all([
        fetchCounselorMonitoringHub(),
        fetchCounselorCohortMonitoring(),
        fetchCounselorOrgLiaisons().catch(() => []),
        listAssessments().catch(() => ({ assessments: readCachedAssessmentsList() ?? [] })),
      ]);
      setHub(hubData);
      setCohorts(cohortData);
      setLiaisons(liaisonData);
      setAssessments(assessmentData.assessments || []);
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
  const recentActivity = (hub?.recentActivity || []).slice(0, 5);

  const recentAssessments = useMemo(() => {
    return [...assessments]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [assessments]);

  const attentionCount = useMemo(
    () =>
      assessments.filter((a) => {
        const { dispatchFailed, testIncomplete } = resultStatusCounts(a);
        return dispatchFailed > 0 || testIncomplete > 0;
      }).length,
    [assessments],
  );

  const expiringSoonCount = useMemo(
    () => assessments.filter((a) => isExpiringSoon(a.usageEndDate)).length,
    [assessments],
  );

  const completionPercent = useMemo(() => {
    const total = summary?.totalRecipients ?? 0;
    const done = summary?.completedRecipients ?? 0;
    if (total <= 0) return 0;
    return Math.round((done / total) * 100);
  }, [summary?.totalRecipients, summary?.completedRecipients]);

  const totalParticipants = useMemo(
    () =>
      assessments.reduce((sum, a) => {
        const { dispatchTotal } = resultStatusCounts(a);
        return sum + dispatchTotal;
      }, 0),
    [assessments],
  );

  const goToProgress = (assessmentId: string) => {
    router.push(`/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`);
  };

  if (loading && !hub && !cohorts) {
    return <p className="py-12 text-center text-sm text-slate-500">대시보드를 불러오는 중…</p>;
  }

  if (error && !hub && !cohorts) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <CounselorPageSection
      title="상담관리"
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      dense
      description={
        <>
          상담코드 <span className="font-semibold text-white">{assessments.length}</span>개 · 응시자{' '}
          <span className="font-semibold text-cyan-300">{totalParticipants}</span>명 · 완료{' '}
          <span className="font-semibold text-emerald-300">{summary?.completedRecipients ?? 0}</span>명 · 활성 내담자{' '}
          <span className="font-semibold text-sky-300">{summary?.activePortals ?? 0}</span>명
          {revalidating ? (
            <span className="ml-2 text-sky-200/60">(갱신 중…)</span>
          ) : null}
        </>
      }
      toolbar={
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <AuthLink
            href="/counselor/clients"
            className="rounded-md border border-white/10 bg-[#101f38]/90 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5 sm:text-sm"
          >
            내담자 목록
          </AuthLink>
          <AuthLink
            href="/counselor/assessments"
            className="rounded-md border border-white/10 bg-[#101f38]/90 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5 sm:text-sm"
          >
            상담코드 목록
          </AuthLink>
          <AuthLink
            href="/counselor/assessments/new"
            className="rounded-md bg-sky-600/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500 sm:text-sm"
          >
            + 상담코드 생성
          </AuthLink>
        </div>
      }
    >
      <motion.div
        className="flex min-h-0 flex-1 flex-col gap-3 p-2.5 text-sm sm:p-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
          <InsightTile
            emoji="⚡"
            label="확인 필요"
            value={attentionCount}
            hint="발송실패·미완료 상담코드"
            href="/counselor/assessments"
            accent="amber"
          />
          <InsightTile
            emoji="🏃"
            label="진행 중"
            value={summary?.inProgressRecipients ?? 0}
            hint="검사 진행 중인 내담자"
            href="/counselor/assign-tests"
            accent="sky"
          />
          <InsightTile
            emoji="⏳"
            label="만료 임박"
            value={expiringSoonCount}
            hint="7일 이내 사용 종료"
            href="/counselor/assessments"
            accent="violet"
          />
          <InsightTile
            emoji="✅"
            label="전체 완료율"
            value={`${completionPercent}%`}
            hint={`완료 ${summary?.completedRecipients ?? 0} / ${summary?.totalRecipients ?? 0}명`}
            href="/counselor/test-results"
            accent="emerald"
          />
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-sky-400/20 bg-[#0f1d33]/60">
            <div className="flex shrink-0 items-center justify-between border-b border-sky-400/20 bg-gradient-to-r from-sky-600/20 to-transparent px-3 py-2.5">
              <h3 className="text-sm font-bold text-white sm:text-base">최근 상담코드</h3>
              <AuthLink href="/counselor/assessments" className="text-xs text-sky-400 hover:text-sky-300">
                전체 보기 →
              </AuthLink>
            </div>
            {recentAssessments.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
                <p className="text-sm text-slate-400">등록된 상담코드가 없습니다</p>
                <AuthLink
                  href="/counselor/assessments/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-sky-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
                >
                  첫 상담코드 생성
                </AuthLink>
              </div>
            ) : (
              <div className={`min-h-0 flex-1 ${counselorListTableWrapperClass}`}>
                <table className="w-max min-w-full table-fixed text-sm">
                  <thead>
                    <tr className={counselorListHeaderRowClass}>
                      <th className={counselorListNoThClass}>No.</th>
                      <th className={`${counselorListThClass} whitespace-nowrap`}>발급일</th>
                      <th className={`${counselorListThClass} whitespace-nowrap text-center`}>상담코드</th>
                      <th className={counselorListThClass}>그룹명 / 제목</th>
                      <th className={`${counselorListThClass} whitespace-nowrap text-center`}>
                        <span className="block">결과현황</span>
                        <span className="mt-0.5 block text-[10px] font-normal leading-tight text-slate-500">
                          (총 / 실패 / 미완료)
                        </span>
                      </th>
                      <th className={`${counselorListThClass} whitespace-nowrap text-center`}>사용 종료일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAssessments.map((a, idx) => {
                      const { dispatchFailed, testIncomplete, dispatchTotal } = resultStatusCounts(a);
                      const expired = isExpired(a.usageEndDate);
                      const infoPrimary = getAssessmentOrgLabel(a);
                      const infoSecondary = (a.title || '—').trim();

                      return (
                        <tr key={a.id} className={counselorListBodyRowClass}>
                          <td className={`${counselorListTdCompactClass} tabular-nums text-slate-500`}>
                            {idx + 1}
                          </td>
                          <td
                            className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-white`}
                            onClick={() => goToProgress(a.id)}
                          >
                            <span className={cellLinkClass}>{formatCounselorIssueDate(a.createdAt)}</span>
                          </td>
                          <td
                            className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-center`}
                            onClick={() => goToProgress(a.id)}
                          >
                            <span className={`${cellLinkClass} font-mono tracking-wide text-cyan-300/95`}>
                              {formatAccessCodeDisplay(a.accessCode)}
                            </span>
                          </td>
                          <td
                            className={`max-w-[14rem] ${counselorListTdCompactClass} cursor-pointer`}
                            onClick={() => goToProgress(a.id)}
                          >
                            <CounselorSlashInfoCell
                              primary={infoPrimary}
                              secondary={infoSecondary}
                              showTooltip={false}
                              className={cellLinkClass}
                            />
                            {expired ? (
                              <span className="ml-1 inline-block rounded-full border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-red-300">
                                만료
                              </span>
                            ) : isExpiringSoon(a.usageEndDate) ? (
                              <span className="ml-1 inline-block rounded-full border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-amber-300">
                                임박
                              </span>
                            ) : null}
                          </td>
                          <td className={`whitespace-nowrap ${counselorListTdCompactClass} text-center`}>
                            (
                            <span className="px-1 font-medium tabular-nums text-slate-300">{dispatchTotal}</span>
                            /
                            <span
                              className={`px-1 font-medium tabular-nums ${counselorResultMetricClass(dispatchFailed)}`}
                            >
                              {dispatchFailed}
                            </span>
                            /
                            <span
                              className={`px-1 font-medium tabular-nums ${counselorResultMetricClass(testIncomplete)}`}
                            >
                              {testIncomplete}
                            </span>
                            )
                          </td>
                          <td
                            className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-center ${expired ? 'text-red-400' : ''}`}
                            onClick={() => goToProgress(a.id)}
                          >
                            <span className={cellLinkClass}>{formatUsageEndDate(a.usageEndDate)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto">
            <div className="rounded-xl border border-sky-400/20 bg-[#0f1d33]/60 p-3">
              <p className="text-sm font-bold text-white">내담자 진행 요약</p>
              {individualCohort ? (
                <>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-xs text-slate-400">개별 내담자</p>
                    <p className="text-lg font-bold tabular-nums text-sky-300">
                      {individualCohort.progress.percent}%
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${individualCohort.progress.percent}%` }}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[11px]">
                    <div className="rounded-md bg-emerald-500/10 py-1 text-emerald-300">
                      완료 {individualCohort.completedPortals}
                    </div>
                    <div className="rounded-md bg-sky-500/10 py-1 text-sky-300">
                      진행 {individualCohort.inProgressPortals}
                    </div>
                    <div className="rounded-md bg-amber-500/10 py-1 text-amber-300">
                      미시작 {individualCohort.notStartedPortals}
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-500">내담자 데이터 없음</p>
              )}
              <AuthLink
                href="/counselor/clients"
                className="mt-2 inline-block text-xs text-sky-400 hover:text-sky-300"
              >
                내담자 목록 →
              </AuthLink>
            </div>

            <div className="rounded-xl border border-sky-400/20 bg-[#0f1d33]/60 p-3">
              <p className="text-sm font-bold text-white">최근 검사 활동</p>
              {recentActivity.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">최근 활동 없음</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {recentActivity.map((item, i) => (
                    <li
                      key={`${item.portalId}-${item.testId}-${i}`}
                      className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs"
                    >
                      <span className="font-medium text-slate-200">{item.displayName}</span>
                      <span className="block truncate text-slate-500">{item.assessmentTitle}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {liaisons.length > 0 ? (
              <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-3">
                <p className="text-sm font-bold text-white">B2B 기관</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-400">
                  {liaisons.slice(0, 3).map((org) => (
                    <li key={org.organizationId} className="truncate">
                      <span className="text-violet-200">{org.name}</span>
                      <span className="text-slate-500"> · cohort {org.cohortCount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-xl border border-sky-400/20 bg-[#0f1d33]/60 p-3">
              <p className="text-sm font-bold text-white">빠른 이동</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {[
                  { href: '/counselor/assessments/new', label: '코드 생성', icon: '➕' },
                  { href: '/counselor/clients', label: '내담자', icon: '👥' },
                  { href: '/counselor/test-results', label: '결과 분석', icon: '📊' },
                  { href: '/counselor/credits', label: '크레딧', icon: '💳' },
                  { href: '/counselor/schedule', label: '상담 일정', icon: '📅' },
                  { href: '/counselor/assign-tests', label: '검사 할당', icon: '📋' },
                ].map((item) => (
                  <AuthLink
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-[#101f38]/80 px-2 py-2 text-xs text-slate-200 transition-colors hover:border-sky-400/30 hover:bg-sky-500/10"
                  >
                    <span aria-hidden>{item.icon}</span>
                    <span className="truncate font-medium">{item.label}</span>
                  </AuthLink>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </CounselorPageSection>
  );
}
