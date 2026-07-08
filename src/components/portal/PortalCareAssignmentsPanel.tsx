'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getCareProgramById } from '@/data/careProgramCatalog';
import { fetchPortalCareAssignments, submitPortalCareProgress } from '@/lib/clientPortalApi';
import { readClientPortalSession } from '@/lib/clientPortalSession';
import type {
  CareProgressEntry,
  CareProgressEntryKind,
  PortalCareAssignmentItem,
} from '@/types/careAssignment';

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

function formatEntryTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function defaultEntryKind(item: PortalCareAssignmentItem): CareProgressEntryKind {
  if (item.programId?.includes('diary') || item.programId?.includes('journal')) {
    return 'journal';
  }
  return 'check_in';
}

function CareProgressForm({
  item,
  onSuccess,
}: {
  item: PortalCareAssignmentItem;
  onSuccess: () => void;
}) {
  const program = item.programId ? getCareProgramById(item.programId) : null;
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [content, setContent] = useState('');
  const [moodScore, setMoodScore] = useState('6');
  const [stressLevel, setStressLevel] = useState('5');
  const [energyLevel, setEnergyLevel] = useState('5');
  const [markCompleted, setMarkCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const selectedSession = program?.sessions.find((s) => s.id === sessionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      setError('로그인이 필요합니다.');
      return;
    }

    setBusy(true);
    setError('');
    setSuccessMsg('');
    try {
      let kind: CareProgressEntryKind = defaultEntryKind(item);
      let title: string | undefined;
      let metadata: Record<string, unknown> | undefined;
      let bodyContent = content.trim();

      if (selectedSession) {
        kind = 'session';
        title = selectedSession.title;
        metadata = { sessionId: selectedSession.id, week: selectedSession.week };
        if (!bodyContent && selectedSession.prompt) {
          bodyContent = selectedSession.prompt;
        }
      } else if (item.type === 'daily_record') {
        kind = 'journal';
      }

      const mood = moodScore ? Number(moodScore) : undefined;
      const stress = stressLevel ? Number(stressLevel) : undefined;
      const energy = energyLevel ? Number(energyLevel) : undefined;
      const result = await submitPortalCareProgress(session.portalToken, item.assignmentId, {
        entry: {
          kind,
          title,
          content: bodyContent || undefined,
          moodScore: Number.isFinite(mood) ? mood : undefined,
          stressLevel: Number.isFinite(stress) ? stress : undefined,
          energyLevel: Number.isFinite(energy) ? energy : undefined,
          metadata,
        },
        markCompleted,
      });

      setSuccessMsg(
        result.assignmentStatus === 'completed'
          ? '과제를 완료했습니다. 수고하셨습니다!'
          : `기록이 저장되었습니다. (진행 ${result.progress?.progressPercent ?? 0}%)`,
      );
      setContent('');
      setSessionId('');
      setMarkCompleted(false);
      onSuccess();
      if (result.assignmentStatus === 'completed') {
        setOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
      >
        오늘 기록하기
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
      <p className="text-sm font-medium text-violet-200">진행 기록 작성</p>

      {program && program.sessions.length > 0 ? (
        <label className="block text-xs text-slate-400">
          세션 선택 (선택)
          <select
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              const s = program.sessions.find((x) => x.id === e.target.value);
              if (s?.prompt && !content) setContent(s.prompt);
            }}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">— 세션 미지정 —</option>
            {program.sessions.map((s, idx) => (
              <option key={s.id} value={s.id}>
                {idx + 1}. W{s.week} {s.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {selectedSession?.instructions ? (
        <p className="text-xs text-slate-500 whitespace-pre-wrap">{selectedSession.instructions}</p>
      ) : null}

      <label className="block text-xs text-slate-400">
        기록 내용
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder={selectedSession?.prompt || '오늘 실천한 내용, 느낌, 생각을 적어 주세요.'}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
        />
      </label>

      <label className="block text-xs text-slate-400">
        기분 (1~10)
        <input
          type="range"
          min={1}
          max={10}
          value={moodScore}
          onChange={(e) => setMoodScore(e.target.value)}
          className="mt-2 w-full"
        />
        <span className="text-sm text-slate-300">{moodScore}</span>
      </label>

      {item.type === 'daily_record' ? (
        <>
          <label className="block text-xs text-slate-400">
            스트레스 (1~10)
            <input
              type="range"
              min={1}
              max={10}
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
              className="mt-2 w-full"
            />
            <span className="text-sm text-slate-300">{stressLevel}</span>
          </label>
          <label className="block text-xs text-slate-400">
            에너지 (1~10)
            <input
              type="range"
              min={1}
              max={10}
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value)}
              className="mt-2 w-full"
            />
            <span className="text-sm text-slate-300">{energyLevel}</span>
          </label>
        </>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={markCompleted}
          onChange={(e) => setMarkCompleted(e.target.checked)}
          className="rounded border-slate-600"
        />
        이 과제를 모두 완료했습니다
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {successMsg ? <p className="text-sm text-emerald-400">{successMsg}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? '저장 중…' : '기록 저장'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
            setSuccessMsg('');
          }}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800"
        >
          닫기
        </button>
      </div>
    </form>
  );
}

function RecentEntries({ entries }: { entries: CareProgressEntry[] }) {
  if (!entries.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-500">최근 기록</p>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
            <div className="flex flex-wrap justify-between gap-2 text-slate-500">
              <span>{e.title || e.kind}</span>
              <span>{formatEntryTime(e.completedAt)}</span>
            </div>
            {e.content ? <p className="mt-1 text-slate-300 whitespace-pre-wrap">{e.content}</p> : null}
            {e.moodScore != null ? <p className="mt-1">기분 {e.moodScore}/10</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CareAssignmentCard({
  item,
  completed,
  onRefresh,
}: {
  item: PortalCareAssignmentItem;
  completed?: boolean;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const program = item.programId ? getCareProgramById(item.programId) : null;
  const badge = progressLabel(item);
  const overdue = !completed && isOverdue(item.dueAt);
  const percent = item.progress?.progressPercent ?? 0;
  const recentEntries = item.progress?.recentEntries ?? [];

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

      {percent > 0 ? (
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

      {!completed ? <CareProgressForm item={item} onSuccess={onRefresh} /> : null}

      <RecentEntries entries={recentEntries} />

      {program && program.sessions.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            {expanded ? '세션 목록 접기' : `세션 안내 보기 (${program.sessions.length}개)`}
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
            <CareAssignmentCard key={item.assignmentId} item={item} onRefresh={() => void load()} />
          ))}
        </div>
      ) : null}

      {completed.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-300">완료한 과제</h2>
          {completed.map((item) => (
            <CareAssignmentCard key={item.assignmentId} item={item} completed onRefresh={() => void load()} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
