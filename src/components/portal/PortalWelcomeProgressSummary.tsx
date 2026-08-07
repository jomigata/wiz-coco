'use client';

import React from 'react';

type SummaryBlock = {
  label: string;
  completed: number;
  total: number;
};

type Props = {
  tests: SummaryBlock;
  care: SummaryBlock;
};

function statusBadge(completed: number, total: number): { text: string; className: string } {
  if (total <= 0) {
    return { text: '배정 없음', className: 'bg-slate-700/60 text-slate-300 border-slate-600/60' };
  }
  if (completed >= total) {
    return { text: '완료', className: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40' };
  }
  if (completed > 0) {
    return { text: '진행 중', className: 'bg-sky-950/50 text-sky-300 border-sky-500/40' };
  }
  return { text: '미완료', className: 'bg-amber-950/50 text-amber-300 border-amber-500/40' };
}

function SummaryCard({ block }: { block: SummaryBlock }) {
  const badge = statusBadge(block.completed, block.total);
  return (
    <div className="min-w-[8.5rem] rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{block.label}</p>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="text-sm text-slate-200 tabular-nums">
          <span className="text-lg font-semibold text-white">{block.completed}</span>
          <span className="text-slate-500"> / {block.total}</span>
        </p>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
          {badge.text}
        </span>
      </div>
    </div>
  );
}

/** 내 검사실 환영 영역 — 검사·과제 진행 요약 */
export default function PortalWelcomeProgressSummary({ tests, care }: Props) {
  return (
    <div className="flex flex-wrap items-stretch gap-2 sm:justify-end">
      <SummaryCard block={tests} />
      <SummaryCard block={{ ...care, label: '추가 과제·치료' }} />
    </div>
  );
}
