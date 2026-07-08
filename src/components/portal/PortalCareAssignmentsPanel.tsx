'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getCareProgramById } from '@/data/careProgramCatalog';
import { fetchPortalCareAssignments } from '@/lib/clientPortalApi';
import { readClientPortalSession } from '@/lib/clientPortalSession';
import type { PortalCareAssignmentItem } from '@/types/careAssignment';

function priorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return '높음';
    case 'low':
      return '낮음';
    default:
      return '보통';
  }
}

function progressLabel(item: PortalCareAssignmentItem): { text: string; className: string } {
  const p = item.progress;
  if (!p || p.status === 'not_started') {
    return { text: '시작 전', className: 'text-amber-300' };
  }
  if (p.status === 'completed') {
    return { text: `완료 ${p.progressPercent}%`, className: 'text-emerald-300' };
  }
  return { text: `진행 중 ${p.progressPercent}%`, className: 'text-sky-300' };
}

function isOverdue(dueAt: string | null | undefined): boolean {
  if (!dueAt) return false;
  const due = new Date(dueAt.slice(0, 10));
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function CareAssignmentCard({ item, completed }: { item: PortalCareAssignmentItem; completed?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const program = item.programId ? getCareProgramById(item.programId) : null;
  const badge = progressLabel(item);
  const overdue = !completed && isOverdue(item.dueAt);
  const percent = item.progress?.progressPercent ?? 0;

  return (
    <section className="rounded-2xl border border-slate-600 bg-slate-800/80 p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-medium text-white">{item.title}</h3>
          {item.description ? (
            <p className="mt-1 text-sm text-slate-400 line-clamp-2">{item.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {overdue ? (
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">마감 지남</span>
          ) : null}
          <span className={`rounded bg-white/10 px-2 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.text}
          </span>
        </div>
      </div>

      {!completed && percent > 0 ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {item.dueAt ? (
          <span>
            마감 <span className={overdue ? 'text-red-300' : 'text-slate-300'}>{item.dueAt.slice(0, 10)}</span>
          </span>
        ) : null}
        <span>우선순위 {priorityLabel(item.priority)}</span>
        {program ? (
          <span>
            {program.durationWeeks}주 · {program.totalSessions}세션
          </span>
        ) : null}
        {item.progress && item.progress.entryCount > 0 ? (
          <span>기록 {item.progress.entryCount}건</span>
        ) : null}
      </div>

      {item.instructions ? (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-100 whitespace-pre-wrap">
          <span className="text-xs font-medium text-violet-300">담당자 안내</span>
          <p className="mt-1">{item.instructions}</p>
        </div>
      ) : null}

      {program && program.sessions.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            {expanded ? '세션 목록 접기' : `세션 목록 보기 (${program.sessions.length}개)`}
          </button>
          {expanded ? (
            <ol className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-xs text-slate-400">
              {program.sessions.map((s, idx) => (
                <li key={s.id} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-slate-300">
                    {idx + 1}. {s.title}
                  </span>
                  <p className="mt-0.5 text-slate-500">{s.instructions}</p>
                  {s.prompt ? <p className="mt-1 italic text-slate-600">✎ {s.prompt}</p> : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function PortalCareAssignmentsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPortalCareAssignments>> | null>(null);

  const load = useCallback(async () => {
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await fetchPortalCareAssignments(session.portalToken);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '과제를 불러오지 못했습니다.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-slate-400 text-sm py-8 text-center">추가 과제·치료를 불러오는 중…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { active, completed, summary } = data;

  if (summary.activeCount === 0 && summary.completedCount === 0) {
    return (
      <p className="text-slate-400 text-sm py-8 text-center">
        아직 할당된 추가 과제·치료 프로그램이 없습니다.
        <br />
        담당 상담사가 과제를 내면 여기에 표시됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {summary.activeCount > 0 ? (
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span>
            진행 중 <strong className="text-white">{summary.activeCount}</strong>건
          </span>
          {summary.overdueCount > 0 ? (
            <span>
              마감 지남 <strong className="text-red-300">{summary.overdueCount}</strong>건
            </span>
          ) : null}
        </div>
      ) : null}

      {active.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">진행 중 과제</h2>
          {active.map((item) => (
            <CareAssignmentCard key={item.assignmentId} item={item} />
          ))}
        </div>
      ) : null}

      {completed.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">완료한 과제</h2>
          {completed.map((item) => (
            <CareAssignmentCard key={item.assignmentId} item={item} completed />
          ))}
        </div>
      ) : null}

      <p className="text-center text-xs text-slate-600">
        진행 기록 제출 기능은 곧 업데이트됩니다 (T-2-06).
      </p>
    </div>
  );
}
