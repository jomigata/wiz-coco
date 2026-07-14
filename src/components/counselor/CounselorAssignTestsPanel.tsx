'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthLink from '@/components/auth/AuthLink';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { listCounselorPortalTestAssignments } from '@/lib/clientPortalApi';
import { applyRealtimeToAssignmentList } from '@/lib/clientPortalRealtime';
import { useCounselorTestResultsRealtime } from '@/hooks/useCounselorTestResultsRealtime';
import CounselorLiveStatusBadge from '@/components/counselor/CounselorLiveStatusBadge';
import { counselorClientDetailHref } from '@/lib/counselorClientRoutes';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import type {
  CounselorPortalTestAssignmentRow,
  CounselorPortalTestAssignmentStatus,
} from '@/types/clientPortal';
import CounselorPushAssessmentPanel from '@/components/counselor/CounselorPushAssessmentPanel';

type PortalStatusFilter = 'active' | 'archived' | 'all';
type TestStatusFilter = 'all' | CounselorPortalTestAssignmentStatus;

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

function statusLabel(status: CounselorPortalTestAssignmentStatus): { text: string; className: string } {
  switch (status) {
    case 'completed':
      return { text: '완료', className: 'text-emerald-300 bg-emerald-500/15' };
    case 'in_progress':
      return { text: '진행 중', className: 'text-sky-300 bg-sky-500/15' };
    default:
      return { text: '미시작', className: 'text-amber-300 bg-amber-500/15' };
  }
}

function progressHref(assessmentId: string): string {
  return `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`;
}

export default function CounselorAssignTestsPanel() {
  const { authPending, showLoginRequired, isAuthenticated } = useAuthResolved();
  const [items, setItems] = useState<CounselorPortalTestAssignmentRow[]>([]);
  const [cohorts, setCohorts] = useState<{ cohortId: string; cohortName: string }[]>([]);
  const [assessments, setAssessments] = useState<{ assessmentId: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [portalStatusFilter, setPortalStatusFilter] = useState<PortalStatusFilter>('active');
  const [testStatusFilter, setTestStatusFilter] = useState<TestStatusFilter>('all');
  const [cohortFilter, setCohortFilter] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('');
  const [selectedPortalIds, setSelectedPortalIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCounselorPortalTestAssignments({
        status: portalStatusFilter,
        testStatus: testStatusFilter,
        cohortId: cohortFilter || undefined,
        assessmentId: assessmentFilter || undefined,
        q: query.trim() || undefined,
      });
      setItems(data.items || []);
      setCohorts(data.cohorts || []);
      setAssessments(data.assessments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [portalStatusFilter, testStatusFilter, cohortFilter, assessmentFilter, query]);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load]);

  useRedirectOnLoginRequiredError(error);

  const assessmentIds = useMemo(
    () => assessments.map((a) => a.assessmentId),
    [assessments],
  );

  const { results: liveResults, isLive, liveError, lastUpdatedAt } =
    useCounselorTestResultsRealtime(assessmentIds, isAuthenticated && !authPending);

  const displayItems = useMemo(
    () => applyRealtimeToAssignmentList(items, liveResults),
    [items, liveResults],
  );

  const stats = useMemo(() => {
    const completed = displayItems.filter((i) => i.status === 'completed').length;
    const inProgress = displayItems.filter((i) => i.status === 'in_progress').length;
    const notStarted = displayItems.filter((i) => i.status === 'not_started').length;
    return { total: displayItems.length, completed, inProgress, notStarted };
  }, [displayItems]);

  const selectablePortals = useMemo(() => {
    const map = new Map<
      string,
      { portalId: string; displayName: string; assessmentIds: Set<string> }
    >();
    for (const row of displayItems) {
      if (row.portalStatus !== 'active') continue;
      const existing = map.get(row.portalId);
      if (existing) {
        existing.assessmentIds.add(row.assessmentId);
      } else {
        map.set(row.portalId, {
          portalId: row.portalId,
          displayName: row.displayName || '내담자',
          assessmentIds: new Set([row.assessmentId]),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName, 'ko'),
    );
  }, [displayItems]);

  const togglePortal = (portalId: string) => {
    setSelectedPortalIds((prev) => {
      const next = new Set(prev);
      if (next.has(portalId)) next.delete(portalId);
      else next.add(portalId);
      return next;
    });
  };

  const selectedAssignedAssessmentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const portal of selectablePortals) {
      if (!selectedPortalIds.has(portal.portalId)) continue;
      portal.assessmentIds.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }, [selectablePortals, selectedPortalIds]);

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            발급된 검사코드에 연결된 내담자별 검사 항목 진행 현황입니다. 새 내담자·검사 발급은 검사코드
            만들기에서 진행하세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>
              전체 <strong className="text-slate-200">{stats.total}</strong>건
            </span>
            <span>
              미시작 <strong className="text-amber-300">{stats.notStarted}</strong>건
            </span>
            <span>
              진행 중 <strong className="text-sky-300">{stats.inProgress}</strong>건
            </span>
            <span>
              완료 <strong className="text-emerald-300">{stats.completed}</strong>건
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
          <AuthLink
            href="/counselor/clients"
            className="inline-flex items-center rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            내담자 목록
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-medium text-slate-200">신규 내담자 + 검사코드</h3>
          <p className="mt-1 text-xs text-slate-500">
            새 검사코드를 만들면서 내담자 나의코드·PIN을 함께 발급합니다.
          </p>
          <AuthLink
            href="/counselor/assessments/new"
            className="mt-3 inline-flex text-sm text-sky-400 hover:text-sky-300"
          >
            검사코드 만들기 →
          </AuthLink>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-medium text-slate-200">기존 검사코드에 내담자 추가</h3>
          <p className="mt-1 text-xs text-slate-500">
            이미 만든 검사코드에 수신자를 추가할 때는 만들기 화면에서 기존 코드를 선택하세요.
          </p>
          <AuthLink
            href="/counselor/assessments/new"
            className="mt-3 inline-flex text-sm text-sky-400 hover:text-sky-300"
          >
            기존 코드에 추가 →
          </AuthLink>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void load();
          }}
          placeholder="이름·이메일·나의코드 검색"
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
          value={testStatusFilter}
          onChange={(e) => setTestStatusFilter(e.target.value as TestStatusFilter)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="all">전체 진행 상태</option>
          <option value="not_started">미시작</option>
          <option value="in_progress">진행 중</option>
          <option value="completed">완료</option>
        </select>
        <select
          value={portalStatusFilter}
          onChange={(e) => setPortalStatusFilter(e.target.value as PortalStatusFilter)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="active">활성 내담자</option>
          <option value="archived">보관(삭제)됨</option>
          <option value="all">전체 내담자</option>
        </select>
        <select
          value={cohortFilter}
          onChange={(e) => setCohortFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">전체 그룹</option>
          {cohorts.map((c) => (
            <option key={c.cohortId} value={c.cohortId}>
              {c.cohortName || c.cohortId}
            </option>
          ))}
        </select>
        <select
          value={assessmentFilter}
          onChange={(e) => setAssessmentFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">전체 검사코드</option>
          {assessments.map((a) => (
            <option key={a.assessmentId} value={a.assessmentId}>
              {a.title}
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
        <p className="py-12 text-center text-sm text-slate-500">검사 할당 목록을 불러오는 중…</p>
      ) : displayItems.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
          <p className="text-slate-300">조건에 맞는 검사 할당이 없습니다.</p>
          <p className="mt-2 text-sm text-slate-500">
            검사코드를 발급하면 내담자별 검사 항목이 여기에 표시됩니다.
          </p>
          <AuthLink
            href="/counselor/assessments/new"
            className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            검사코드 발급하기
          </AuthLink>
        </div>
      ) : (
        <>
          {selectablePortals.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-400">추가 검사 push 대상 내담자 선택</p>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPortalIds(
                      selectedPortalIds.size === selectablePortals.length
                        ? new Set()
                        : new Set(selectablePortals.map((p) => p.portalId)),
                    )
                  }
                  className="text-xs text-sky-400 hover:text-sky-300"
                >
                  {selectedPortalIds.size === selectablePortals.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectablePortals.map((p) => {
                  const selected = selectedPortalIds.has(p.portalId);
                  return (
                    <button
                      key={p.portalId}
                      type="button"
                      onClick={() => togglePortal(p.portalId)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        selected
                          ? 'border-sky-500/50 bg-sky-500/20 text-sky-200'
                          : 'border-white/15 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {p.displayName}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {selectedPortalIds.size > 0 ? (
            <CounselorPushAssessmentPanel
              portalIds={Array.from(selectedPortalIds)}
              assignedAssessmentIds={selectedAssignedAssessmentIds}
              onSuccess={() => {
                setSelectedPortalIds(new Set());
                void load();
              }}
            />
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">내담자</th>
                <th className="px-4 py-3 font-medium">나의코드</th>
                <th className="px-4 py-3 font-medium">검사코드</th>
                <th className="px-4 py-3 font-medium">검사 항목</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">완료일</th>
                <th className="px-4 py-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((row) => {
                const badge = statusLabel(row.status);
                const rowKey = `${row.portalId}:${row.assessmentId}:${row.testId}`;
                return (
                  <tr key={rowKey} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link
                        href={counselorClientDetailHref(row.portalId)}
                        className="font-medium text-slate-100 hover:text-sky-300"
                      >
                        {row.displayName || '내담자'}
                      </Link>
                      {row.cohortName ? (
                        <p className="mt-0.5 text-xs text-slate-500">{row.cohortName}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {formatAccessCodeDisplay(row.accessCode)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{row.assessmentTitle}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        {formatAccessCodeDisplay(row.joinAccessCode)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{row.testName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(row.completedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Link
                          href={counselorClientDetailHref(row.portalId)}
                          className="text-sky-400 hover:text-sky-300"
                        >
                          상세
                        </Link>
                        <Link href={progressHref(row.assessmentId)} className="text-sky-400 hover:text-sky-300">
                          진행현황
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
