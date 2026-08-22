'use client';

import React from 'react';
import Link from 'next/link';
import {
  portalHomeTaskButtonLabel,
  portalHomeTaskSubtitle,
  type PortalHomeTask,
} from '@/lib/portalHomeTask';

type Props = {
  displayName: string;
  counselorName?: string;
  counselorEmail?: string;
  task: PortalHomeTask;
  onPrimaryAction: () => void;
  onOpenRecords: () => void;
};

export default function PortalHomeHero({
  displayName,
  counselorName,
  counselorEmail,
  task,
  onPrimaryAction,
  onOpenRecords,
}: Props) {
  const counselorLabel = (counselorName || '').trim() || '담당 상담사';
  const showCounselorBadge = task.kind === 'all_done' || task.kind === 'test';

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-600 bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-6 shadow-xl">
        <p className="text-sm text-slate-400">내 검사실</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{displayName}님</h1>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-lg"
            aria-hidden
          >
            👤
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-200/80">담당 상담사</p>
            <p className="mt-0.5 truncate text-base font-semibold text-white">{counselorLabel}</p>
            {counselorEmail ? (
              <p className="mt-0.5 truncate text-xs text-slate-400">{counselorEmail}</p>
            ) : null}
            {showCounselorBadge ? (
              <p className="mt-2 inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                {task.kind === 'all_done' ? '상담사 확인 중' : '상담사와 함께 진행 중'}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-500/35 bg-cyan-950/20 p-6 shadow-lg shadow-cyan-950/20">
        <p className="text-sm font-semibold text-cyan-200">오늘 할 일</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{portalHomeTaskSubtitle(task)}</p>
        <button
          type="button"
          onClick={task.kind === 'all_done' || task.kind === 'empty' ? onOpenRecords : onPrimaryAction}
          className="mt-5 w-full rounded-xl bg-cyan-500 px-4 py-4 text-base font-bold text-slate-950 shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-400 active:scale-[0.99]"
        >
          {portalHomeTaskButtonLabel(task)}
        </button>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <button
          type="button"
          onClick={onOpenRecords}
          className="text-sm font-medium text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
        >
          기록 · 도움말
        </button>
        <Link
          href="/portal/guide/"
          className="text-sm font-medium text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline"
        >
          이용 안내
        </Link>
      </div>
    </div>
  );
}
