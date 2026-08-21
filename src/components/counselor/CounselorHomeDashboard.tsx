'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AuthLink from '@/components/auth/AuthLink';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import {
  fetchCounselorCohortMonitoring,
  fetchCounselorMonitoringHub,
  fetchCounselorOrgLiaisons,
  type CounselorOrgLiaison,
} from '@/lib/clientPortalApi';
import {
  listAssessments,
  type CounselorAssessment,
} from '@/lib/assessmentApi';
import { fetchMyCredits } from '@/lib/commerceApi';
import { fetchCounselorAiCredits } from '@/lib/aiUsageApi';
import {
  readCachedCounselorDashboard,
  writeCachedCounselorDashboard,
} from '@/lib/counselorDashboardCache';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import type {
  CounselorCohortMonitoringResult,
  CounselorMonitoringHubResult,
} from '@/types/clientPortal';
import {
  assessmentGroupTitleParts,
  resultStatusCounts,
} from '@/lib/counselorAssessmentResultDisplay';
import CounselorRevenueLinksFooter from '@/components/counselor/CounselorRevenueLinksFooter';

function needsSend(a: CounselorAssessment): boolean {
  const { dispatchSent, dispatchFailed, dispatchSending, testComplete, testIncomplete } =
    resultStatusCounts(a);
  const neverTouched =
    dispatchSent === 0 &&
    dispatchFailed === 0 &&
    dispatchSending === 0 &&
    testComplete === 0 &&
    testIncomplete === 0;
  return neverTouched || dispatchFailed > 0;
}

function isIncompleteAssessment(a: CounselorAssessment): boolean {
  const { testIncomplete, dispatchSending } = resultStatusCounts(a);
  return testIncomplete > 0 || dispatchSending > 0;
}

function isRecentResult(iso: string | null | undefined, withinHours = 48): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t <= withinHours * 60 * 60 * 1000;
}

function TodayTile({
  label,
  value,
  hint,
  href,
  accent,
  cta,
}: {
  label: string;
  value: number | string;
  hint: string;
  href: string;
  accent: 'sky' | 'amber' | 'emerald' | 'violet';
  cta: string;
}) {
  const accentMap = {
    sky: 'border-sky-400/25 bg-sky-500/10',
    amber: 'border-amber-400/25 bg-amber-500/10',
    emerald: 'border-emerald-400/25 bg-emerald-500/10',
    violet: 'border-violet-400/25 bg-violet-500/10',
  };

  return (
    <AuthLink href={href} className="block h-full">
      <div
        className={`flex h-full flex-col rounded-xl border p-4 transition-colors hover:border-white/25 ${accentMap[accent]}`}
      >
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-3 text-3xl font-bold tabular-nums leading-none text-white">{value}</p>
        <p className="mt-2 flex-1 text-xs text-slate-400">{hint}</p>
        <p className="mt-3 text-xs font-medium text-sky-300">{cta}</p>
      </div>
    </AuthLink>
  );
}

type TodayRow = {
  id: string;
  kind: 'send' | 'incomplete' | 'result';
  title: string;
  hint: string;
  href: string;
};

export default function CounselorHomeDashboard() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const counselorUid = user?.uid;
  const initialCache = useMemo(
    () => (counselorUid ? readCachedCounselorDashboard(counselorUid) : null),
    [counselorUid],
  );
  const [hub, setHub] = useState<CounselorMonitoringHubResult | null>(() => initialCache?.hub ?? null);
  const [cohorts, setCohorts] = useState<CounselorCohortMonitoringResult | null>(
    () => initialCache?.cohorts ?? null,
  );
  const [liaisons, setLiaisons] = useState<CounselorOrgLiaison[]>(() => initialCache?.liaisons ?? []);
  const [assessments, setAssessments] = useState<CounselorAssessment[]>([]);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [aiCreditBalance, setAiCreditBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(() => !initialCache?.hub && !initialCache?.cohorts);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const cached = counselorUid ? readCachedCounselorDashboard(counselorUid) : null;
    const hasCache = Boolean(cached?.hub || cached?.cohorts);
    if (!hasCache) setLoading(true);
    else setRevalidating(true);
    setError('');
    try {
      const [hubData, cohortData, liaisonData, assessmentData, credits, aiCredits] =
        await Promise.all([
          fetchCounselorMonitoringHub(),
          fetchCounselorCohortMonitoring(),
          fetchCounselorOrgLiaisons().catch(() => []),
          listAssessments().catch(() => ({ assessments: [] as CounselorAssessment[] })),
          fetchMyCredits(1).catch(() => null),
          fetchCounselorAiCredits(1).catch(() => null),
        ]);
      setHub(hubData);
      setCohorts(cohortData);
      setLiaisons(liaisonData);
      setAssessments(assessmentData.assessments || []);
      setCreditBalance(credits ? credits.balance : null);
      setAiCreditBalance(aiCredits ? aiCredits.balance : null);
      writeCachedCounselorDashboard(
        { hub: hubData, cohorts: cohortData, liaisons: liaisonData },
        counselorUid,
      );
    } catch (err) {
      if (!hasCache) {
        setError(err instanceof Error ? err.message : '오늘 화면을 불러오지 못했습니다.');
        setHub(null);
        setCohorts(null);
      }
    } finally {
      setLoading(false);
      setRevalidating(false);
    }
  }, [counselorUid]);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      if (!initialCache?.hub && !initialCache?.cohorts) setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load, initialCache?.hub, initialCache?.cohorts]);

  useRedirectOnLoginRequiredError(error);

  const summary = hub?.summary;
  const sendAssessments = useMemo(() => assessments.filter(needsSend), [assessments]);
  const incompleteAssessments = useMemo(
    () => assessments.filter(isIncompleteAssessment),
    [assessments],
  );
  const incompletePeople = useMemo(
    () => incompleteAssessments.reduce((sum, a) => sum + resultStatusCounts(a).testIncomplete, 0),
    [incompleteAssessments],
  );
  const recentResults = useMemo(
    () => (hub?.recentActivity || []).filter((item) => isRecentResult(item.completedAt)),
    [hub?.recentActivity],
  );

  const sendCount = sendAssessments.length + (summary?.notifyFailedCount ?? 0);
  const incompleteCount =
    incompletePeople > 0
      ? incompletePeople
      : (summary?.inProgressRecipients ?? 0) + (summary?.notStartedRecipients ?? 0);
  const newResultCount = recentResults.length;
  const remainingLabel =
    creditBalance === null ? '—' : String(creditBalance);
  const creditsLow = creditBalance !== null && creditBalance < 20;

  const todayRows = useMemo((): TodayRow[] => {
    const rows: TodayRow[] = [];
    for (const a of sendAssessments.slice(0, 4)) {
      const { dispatchFailed } = resultStatusCounts(a);
      const { primary } = assessmentGroupTitleParts(a);
      rows.push({
        id: `send-${a.id}`,
        kind: 'send',
        title: primary,
        hint: dispatchFailed > 0 ? `발송 실패 ${dispatchFailed}명 · 다시 보내기` : '아직 보내지 않음',
        href: `/counselor/assessments/progress?assessmentId=${encodeURIComponent(a.id)}`,
      });
    }
    for (const a of incompleteAssessments.slice(0, 4)) {
      const { testIncomplete } = resultStatusCounts(a);
      const { primary } = assessmentGroupTitleParts(a);
      rows.push({
        id: `inc-${a.id}`,
        kind: 'incomplete',
        title: primary,
        hint: `안 끝난 검사 ${testIncomplete}명`,
        href: `/counselor/assessments/progress?assessmentId=${encodeURIComponent(a.id)}`,
      });
    }
    for (const item of recentResults.slice(0, 4)) {
      rows.push({
        id: `res-${item.resultId}`,
        kind: 'result',
        title: item.displayName || '내담자',
        hint: `${item.assessmentTitle || '검사'} 결과`,
        href: '/counselor/test-results',
      });
    }
    return rows.slice(0, 8);
  }, [sendAssessments, incompleteAssessments, recentResults]);

  if (loading && !hub && !cohorts) {
    return (
      <LoadingMessage
        className="py-12"
        message="오늘 할 일을 로딩중…"
        textClassName="text-sm text-slate-500"
      />
    );
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
      title="오늘"
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      dense
      description={
        <>
          회기 전에 이 네 칸만 보면 됩니다
          {revalidating ? <span className="ml-2 text-sky-200/60">(갱신 중…)</span> : null}
          {liaisons.length > 0 ? (
            <span className="ml-2 text-slate-500">· 기관 {liaisons.length}</span>
          ) : null}
        </>
      }
      toolbar={
        <AuthLink
          href="/counselor/assessments/new"
          className="rounded-md bg-sky-600/90 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500 sm:text-sm"
        >
          + 상담코드 보내기
        </AuthLink>
      }
    >
      <motion.div
        className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-2.5 text-sm sm:p-3 lg:grid-cols-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2">
          <TodayTile
            label="오늘 보낼 것"
            value={sendCount}
            hint="아직 안 보낸 코드 · 발송 실패"
            href="/counselor/assessments/new"
            accent="sky"
            cta="지금 보내기 →"
          />
          <TodayTile
            label="안 끝난 검사"
            value={incompleteCount}
            hint="내담자가 아직 끝내지 않음"
            href="/counselor/assessments"
            accent="amber"
            cta="진행 보기 →"
          />
          <TodayTile
            label="새 결과"
            value={newResultCount}
            hint="최근 완료된 검사"
            href="/counselor/test-results"
            accent="emerald"
            cta="결과 확인 →"
          />
          <TodayTile
            label="남은 횟수"
            value={remainingLabel}
            hint={
              creditsLow
                ? '크레딧이 적습니다 · 필요할 때만 충전'
                : aiCreditBalance === null
                  ? '검사 크레딧'
                  : `검사 크레딧 · AI ${aiCreditBalance}`
            }
            href="/counselor/credits"
            accent="violet"
            cta={creditsLow ? '충전하기 →' : '잔액 보기 →'}
          />
        </div>

        <div className="flex min-h-[16rem] flex-1 flex-col overflow-hidden rounded-xl border border-sky-400/20 bg-[#0f1d33]/60 lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between border-b border-sky-400/20 px-3 py-2.5">
            <h3 className="text-sm font-bold text-white">오늘 할 일</h3>
            <AuthLink href="/counselor/assessments" className="text-xs text-sky-400 hover:text-sky-300">
              전체 목록 →
            </AuthLink>
          </div>
          {todayRows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
              {loading || revalidating ? (
                <LoadingMessage
                  layout="inline"
                  message="데이터를 로딩중…"
                  textClassName="text-sm text-slate-400"
                />
              ) : (
                <>
                  <p className="text-sm text-slate-300">지금은 확인할 일이 없습니다</p>
                  <p className="mt-1 text-xs text-slate-500">내담자에게 검사를 보내면 여기에 쌓입니다</p>
                  <AuthLink
                    href="/counselor/assessments/new"
                    className="mt-4 inline-flex rounded-md bg-sky-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
                  >
                    상담코드 보내기
                  </AuthLink>
                </>
              )}
            </div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-white/[0.06] overflow-y-auto">
              {todayRows.map((row) => (
                <li key={row.id}>
                  <AuthLink
                    href={row.href}
                    className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{row.title}</p>
                      <p className="truncate text-xs text-slate-400">{row.hint}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-slate-500">
                      {row.kind === 'send' ? '보내기' : row.kind === 'incomplete' ? '진행' : '결과'}
                    </span>
                  </AuthLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
      <CounselorRevenueLinksFooter creditBalance={creditBalance} orgLiaisonCount={liaisons.length} />
    </CounselorPageSection>
  );
}
