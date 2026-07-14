'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { formatPhoneDisplayOr } from '@/lib/phoneFormat';
import { listCounselorClientPortals } from '@/lib/clientPortalApi';
import { counselorClientDetailHref } from '@/lib/counselorClientRoutes';
import { INDIVIDUAL_COHORT_KEY } from '@/lib/monitoringRealtime';
import { applyRealtimeToClientList } from '@/lib/clientPortalRealtime';
import { useCounselorTestResultsRealtime } from '@/hooks/useCounselorTestResultsRealtime';
import CounselorLiveStatusBadge from '@/components/counselor/CounselorLiveStatusBadge';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import type { ClientPortalProgressLabel, CounselorClientPortalListItem } from '@/types/clientPortal';

type StatusFilter = 'active' | 'archived' | 'all';
type ProgressFilter = 'all' | ClientPortalProgressLabel;

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function notifyStatusLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'sent':
      return { text: '발송 완료', className: 'text-emerald-300' };
    case 'pending':
      return { text: '발송 대기', className: 'text-amber-300' };
    case 'failed':
      return { text: '발송 실패', className: 'text-red-400' };
    case 'skipped':
      return { text: '발송 생략', className: 'text-slate-400' };
    default:
      return { text: '미발송', className: 'text-slate-500' };
  }
}

function progressLabel(item: CounselorClientPortalListItem): { text: string; className: string } {
  const { label, percent, completedTests, totalTests } = item.progress;
  if (label === 'completed') {
    return { text: `완료 (${completedTests}/${totalTests})`, className: 'text-emerald-300' };
  }
  if (label === 'in_progress') {
    return { text: `진행 중 ${percent}% (${completedTests}/${totalTests})`, className: 'text-sky-300' };
  }
  if (label === 'not_started') {
    return { text: `미시작 (0/${totalTests})`, className: 'text-amber-300' };
  }
  return { text: '검사 없음', className: 'text-slate-500' };
}

function progressHref(assessmentId: string): string {
  return `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`;
}

export default function CounselorClientList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authPending, showLoginRequired, isAuthenticated } = useAuthResolved();
  const [items, setItems] = useState<CounselorClientPortalListItem[]>([]);
  const [assessmentMeta, setAssessmentMeta] = useState<
    Record<string, { testList: { testId: string; name: string }[] }>
  >({});
  const [cohorts, setCohorts] = useState<{ cohortId: string; cohortName: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [cohortFilter, setCohortFilter] = useState('');

  useEffect(() => {
    const fromUrl = searchParams.get('cohortId');
    if (fromUrl !== null) {
      setCohortFilter(fromUrl);
    }
  }, [searchParams]);

  const updateCohortFilter = useCallback(
    (value: string) => {
      setCohortFilter(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('cohortId', value);
      } else {
        params.delete('cohortId');
      }
      const qs = params.toString();
      router.replace(qs ? `/counselor/clients?${qs}` : '/counselor/clients', { scroll: false });
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCounselorClientPortals({
        status: statusFilter,
        cohortId: cohortFilter || undefined,
        progress: progressFilter,
        tag: tagFilter || undefined,
        q: query.trim() || undefined,
      });
      setItems(data.items || []);
      setCohorts(data.cohorts || []);
      setTags(data.tags || []);
      setAssessmentMeta(data.assessmentMeta || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cohortFilter, progressFilter, tagFilter, query]);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load]);

  useRedirectOnLoginRequiredError(error);

  const assessmentIds = useMemo(
    () => Object.keys(assessmentMeta),
    [assessmentMeta],
  );

  const { results: liveResults, isLive, liveError, lastUpdatedAt } =
    useCounselorTestResultsRealtime(assessmentIds, isAuthenticated && !authPending);

  const displayItems = useMemo(
    () => applyRealtimeToClientList(items, assessmentMeta, liveResults),
    [items, assessmentMeta, liveResults],
  );

  const stats = useMemo(() => {
    const completed = displayItems.filter((i) => i.progress.label === 'completed').length;
    const inProgress = displayItems.filter((i) => i.progress.label === 'in_progress').length;
    return { total: displayItems.length, completed, inProgress };
  }, [displayItems]);

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            발급한 나의코드(내 검사실) 내담자를 한곳에서 조회합니다. 검사 진행·발송 현황은 검사코드별
            진행현황에서 상세히 확인할 수 있습니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>
              전체 <strong className="text-slate-200">{stats.total}</strong>명
            </span>
            <span>
              진행 중 <strong className="text-sky-300">{stats.inProgress}</strong>명
            </span>
            <span>
              완료 <strong className="text-emerald-300">{stats.completed}</strong>명
            </span>
            <CounselorLiveStatusBadge
              isLive={isLive}
              liveError={liveError}
              lastUpdatedAt={lastUpdatedAt}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AuthLink
            href="/counselor/assessments/new"
            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            + 새 검사코드 발급
          </AuthLink>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void load();
          }}
          placeholder="이름·이메일·휴대폰·나의코드 검색"
          className="w-full max-w-sm rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          검색
        </button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="active">활성 내담자</option>
          <option value="archived">보관(삭제)됨</option>
          <option value="all">전체 상태</option>
        </select>
        <select
          value={progressFilter}
          onChange={(e) => setProgressFilter(e.target.value as ProgressFilter)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="all">전체 진행</option>
          <option value="in_progress">진행 중</option>
          <option value="not_started">미시작</option>
          <option value="completed">완료</option>
          <option value="no_tests">검사 없음</option>
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">전체 태그</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>
        <select
          value={cohortFilter}
          onChange={(e) => updateCohortFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">전체 그룹</option>
          <option value={INDIVIDUAL_COHORT_KEY}>개별 발급</option>
          {cohorts.map((c) => (
            <option key={c.cohortId} value={c.cohortId}>
              {c.cohortName || c.cohortId}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">내담자 목록을 불러오는 중…</p>
      ) : displayItems.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
          <p className="text-slate-300">조건에 맞는 내담자가 없습니다.</p>
          <p className="mt-2 text-sm text-slate-500">
            검사코드를 발급하면 내담자가 여기에 표시됩니다.
          </p>
          <AuthLink
            href="/counselor/assessments/new"
            className="mt-4 inline-block text-sm text-sky-400 hover:text-sky-300"
          >
            새 검사코드 만들기 →
          </AuthLink>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">내담자</th>
                <th className="px-4 py-3 font-medium">나의코드</th>
                <th className="px-4 py-3 font-medium">연락처</th>
                <th className="px-4 py-3 font-medium">그룹</th>
                <th className="px-4 py-3 font-medium">태그</th>
                <th className="px-4 py-3 font-medium">검사 진행</th>
                <th className="px-4 py-3 font-medium">자격증명 발송</th>
                <th className="px-4 py-3 font-medium">최근 접속</th>
                <th className="px-4 py-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayItems.map((item) => {
                const notify = notifyStatusLabel(item.notifyStatus);
                const progress = progressLabel(item);
                const primaryAssessment = item.assessments[0];

                return (
                  <tr key={item.portalId} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">
                        <Link
                          href={counselorClientDetailHref(item.portalId)}
                          className="hover:text-sky-300"
                        >
                          {item.displayName || '—'}
                        </Link>
                      </div>
                      <div className="text-xs text-slate-500">
                        등록 {formatDateTime(item.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-sky-200">
                      {formatAccessCodeDisplay(item.accessCode)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      <div>{item.email || '—'}</div>
                      <div className="text-slate-500">{formatPhoneDisplayOr(item.phone, '—')}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {item.cohortName || '—'}
                      {item.assignedAssessmentCount > 0 ? (
                        <div className="text-slate-500">검사코드 {item.assignedAssessmentCount}건</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {(item.counselorTags || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(item.counselorTags || []).map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-200"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${progress.className}`}>{progress.text}</span>
                      {item.assessments.length > 0 ? (
                        <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                          {item.assessments.slice(0, 2).map((a) => (
                            <li key={a.assessmentId} className="truncate max-w-[12rem]">
                              {a.title}
                            </li>
                          ))}
                          {item.assessments.length > 2 ? (
                            <li>외 {item.assessments.length - 2}건</li>
                          ) : null}
                        </ul>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${notify.className}`}>{notify.text}</span>
                      {item.notifyAt ? (
                        <div className="text-[11px] text-slate-500">{formatDateTime(item.notifyAt)}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDateTime(item.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={counselorClientDetailHref(item.portalId)}
                          className="text-xs text-sky-400 hover:text-sky-300"
                        >
                          상세 보기
                        </Link>
                        {primaryAssessment ? (
                          <Link
                            href={progressHref(primaryAssessment.assessmentId)}
                            className="text-xs text-sky-400 hover:text-sky-300"
                          >
                            진행현황
                          </Link>
                        ) : null}
                        <Link
                          href="/counselor/test-results"
                          className="text-xs text-slate-400 hover:text-slate-200"
                        >
                          검사 결과
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
