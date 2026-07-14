'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthLink from '@/components/auth/AuthLink';
import { listCareAssignments } from '@/lib/careAssignmentApi';
import { useCounselorCareRealtime } from '@/hooks/useCounselorCareRealtime';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import {
  collectCareRecentActivity,
  summarizeCareAssignments,
} from '@/lib/careMonitoringRealtime';
import { counselorClientDetailHref } from '@/lib/counselorClientRoutes';
import type { CounselorCareAssignmentListItem } from '@/types/careAssignment';

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

function assignmentTypeLabel(type: string): string {
  switch (type) {
    case 'treatment_program':
      return '치료 프로그램';
    case 'daily_record':
      return '일기·기록';
    case 'additional_assessment':
      return '추가 검사';
    case 'custom_task':
      return '맞춤 과제';
    default:
      return type;
  }
}

function entryKindLabel(kind: string): string {
  switch (kind) {
    case 'session':
      return '세션';
    case 'journal':
      return '일기';
    case 'check_in':
      return '체크인';
    case 'note':
      return '메모';
    case 'assessment':
      return '검사';
    default:
      return kind;
  }
}

function progressBadge(item: CounselorCareAssignmentListItem): { text: string; className: string } {
  if (item.status === 'completed') {
    return { text: '완료', className: 'text-emerald-300 bg-emerald-500/15' };
  }
  const p = item.progress;
  if (!p || p.status === 'not_started') {
    return { text: '미시작', className: 'text-amber-300 bg-amber-500/15' };
  }
  if (p.status === 'completed') {
    return { text: '완료', className: 'text-emerald-300 bg-emerald-500/15' };
  }
  return { text: '진행 중', className: 'text-sky-300 bg-sky-500/15' };
}

function isOverdue(item: CounselorCareAssignmentListItem): boolean {
  if (item.status !== 'active' || !item.dueAt) return false;
  const due = new Date(item.dueAt.slice(0, 10));
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function CareAssignmentCard({ item }: { item: CounselorCareAssignmentListItem }) {
  const badge = progressBadge(item);
  const percent = item.progress?.progressPercent ?? 0;
  const overdue = isOverdue(item);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{item.title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {item.portalDisplayName || '내담자'} · {assignmentTypeLabel(item.type)}
          </p>
          {item.dueAt ? (
            <p className={`mt-1 text-xs ${overdue ? 'text-red-300' : 'text-slate-500'}`}>
              마감 {item.dueAt.slice(0, 10)}
              {overdue ? ' (지남)' : ''}
            </p>
          ) : null}
        </div>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.text} {percent}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>
          기록 <strong className="text-slate-200">{item.progress?.entryCount ?? 0}</strong>건
        </span>
        {item.progress?.lastActivityAt ? (
          <span>
            최근 활동 <strong className="text-slate-200">{formatDateTime(item.progress.lastActivityAt)}</strong>
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AuthLink
          href={counselorClientDetailHref(item.portalId)}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
        >
          내담자 보기
        </AuthLink>
        <AuthLink
          href="/counselor/treatment-plans"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
        >
          치료 할당
        </AuthLink>
      </div>
    </div>
  );
}

export default function CounselorCareMonitoringView() {
  const { authPending, showLoginRequired, user } = useAuthResolved();
  const [baseItems, setBaseItems] = useState<CounselorCareAssignmentListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCareAssignments({
        status: statusFilter === 'active' ? 'active' : 'all',
        limit: 100,
      });
      setBaseItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '치료·과제 목록을 불러오지 못했습니다.');
      setBaseItems(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load]);

  useRedirectOnLoginRequiredError(error);

  const { data: liveItems, isLive, liveError, lastUpdatedAt } = useCounselorCareRealtime(
    user?.uid,
    baseItems,
    !authPending && !showLoginRequired && !!baseItems,
  );

  const items = liveItems ?? baseItems ?? [];
  const summary = useMemo(() => summarizeCareAssignments(items), [items]);
  const recentActivity = useMemo(() => collectCareRecentActivity(items), [items]);

  const liveUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">치료·과제 모니터링을 불러오는 중…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            내담자에게 할당한 치료 프로그램·과제의 진행 상황을 실시간으로 확인합니다. 내담자가 포털에서 기록을
            제출하면 이 화면에 반영됩니다.
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
            href="/counselor/treatment-plans"
            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            + 치료·과제 할당
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">활성 과제</p>
          <p className="mt-1 text-2xl font-semibold text-white">{summary.active}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">진행 중</p>
          <p className="mt-1 text-2xl font-semibold text-sky-300">{summary.inProgress}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">미시작</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{summary.notStarted}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">완료</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.completed}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">마감 지남</p>
          <p className="mt-1 text-2xl font-semibold text-red-300">{summary.overdue}</p>
        </div>
      </div>

      {summary.overdue > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          마감일이 지난 활성 과제가 {summary.overdue}건 있습니다. 내담자에게 리마인드를 보내거나 마감일을 조정해
          주세요.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'active' | 'all')}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="active">활성 과제만</option>
          <option value="all">전체 (완료 포함)</option>
        </select>
        <AuthLink href="/counselor/treatment-plans" className="text-sm text-violet-400 hover:text-violet-300">
          치료 계획 관리 →
        </AuthLink>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">과제별 진행</h2>
        {items.filter((item) => statusFilter === 'all' || item.status === 'active').length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
            <p className="text-slate-300">모니터링할 치료·과제가 없습니다.</p>
            <AuthLink
              href="/counselor/treatment-plans"
              className="mt-4 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              치료·과제 할당하기
            </AuthLink>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items
              .filter((item) => statusFilter === 'all' || item.status === 'active')
              .map((item) => (
                <CareAssignmentCard key={item.id} item={item} />
              ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">최근 진행 기록</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500">아직 제출된 진행 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">시각</th>
                  <th className="px-4 py-3 font-medium">내담자</th>
                  <th className="px-4 py-3 font-medium">과제</th>
                  <th className="px-4 py-3 font-medium">유형</th>
                  <th className="px-4 py-3 font-medium">내용</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((row) => (
                  <tr
                    key={`${row.assignmentId}-${row.entryId}`}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-2.5 text-xs text-slate-400">{formatDateTime(row.completedAt)}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={counselorClientDetailHref(row.portalId)}
                        className="text-slate-200 hover:text-violet-300"
                      >
                        {row.portalDisplayName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{row.assignmentTitle}</td>
                    <td className="px-4 py-2.5 text-slate-400">{entryKindLabel(row.kind)}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-slate-400">
                      {row.title || row.content || '—'}
                      {row.moodScore != null ? ` (기분 ${row.moodScore})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
