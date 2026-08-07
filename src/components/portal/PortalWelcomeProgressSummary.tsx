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

function tone(completed: number, total: number) {
  if (total <= 0) {
    return {
      ring: 'border-slate-500/50 bg-slate-800/60',
      accent: 'text-slate-400',
      badge: '없음',
      badgeClass: 'bg-slate-700/80 text-slate-300',
    };
  }
  if (completed >= total) {
    return {
      ring: 'border-emerald-400/60 bg-emerald-950/35',
      accent: 'text-emerald-300',
      badge: '완료',
      badgeClass: 'bg-emerald-500/25 text-emerald-200',
    };
  }
  if (completed > 0) {
    return {
      ring: 'border-sky-400/55 bg-sky-950/35',
      accent: 'text-sky-300',
      badge: '진행',
      badgeClass: 'bg-sky-500/25 text-sky-200',
    };
  }
  return {
    ring: 'border-amber-400/55 bg-amber-950/30',
    accent: 'text-amber-300',
    badge: '대기',
    badgeClass: 'bg-amber-500/25 text-amber-200',
  };
}

function CompactStat({ block }: { block: SummaryBlock }) {
  const t = tone(block.completed, block.total);
  return (
    <div
      className={`flex min-w-[7.5rem] flex-1 items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 sm:min-w-[8.5rem] sm:px-4 ${t.ring}`}
    >
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold tracking-wide text-slate-300">{block.label}</p>
        <p className="mt-0.5 tabular-nums leading-none">
          <span className={`text-2xl font-bold ${t.accent}`}>{block.completed}</span>
          <span className="text-base font-medium text-slate-500"> / {block.total}</span>
        </p>
      </div>
      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${t.badgeClass}`}>
        {t.badge}
      </span>
    </div>
  );
}

/** 내 검사실 환영 영역 — 검사·과제 진행 요약 */
export default function PortalWelcomeProgressSummary({ tests, care }: Props) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[18rem]">
      <CompactStat block={{ ...tests, label: '검사' }} />
      <CompactStat block={{ ...care, label: '과제·치료' }} />
    </div>
  );
}
