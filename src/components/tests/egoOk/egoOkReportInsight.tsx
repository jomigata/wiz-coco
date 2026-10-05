'use client';

import type { ReactNode } from 'react';

export type ReportInsightTone =
  | 'indigo'
  | 'fuchsia'
  | 'sky'
  | 'emerald'
  | 'amber'
  | 'violet'
  | 'rose'
  | 'teal';

const SHELL: Record<ReportInsightTone, string> = {
  indigo: 'bg-indigo-500/10 ring-indigo-400/25',
  fuchsia: 'bg-fuchsia-500/10 ring-fuchsia-400/25',
  sky: 'bg-sky-500/10 ring-sky-400/25',
  emerald: 'bg-emerald-500/10 ring-emerald-400/25',
  amber: 'bg-amber-500/10 ring-amber-400/25',
  violet: 'bg-violet-500/10 ring-violet-400/25',
  rose: 'bg-rose-500/10 ring-rose-400/25',
  teal: 'bg-teal-500/10 ring-teal-400/25',
};

const SHELL_VIVID: Record<ReportInsightTone, string> = {
  indigo: 'bg-gradient-to-br from-indigo-500/45 via-indigo-700/25 to-[#12182e] ring-indigo-300/45',
  fuchsia: 'bg-gradient-to-br from-fuchsia-500/40 via-pink-700/20 to-[#241228] ring-fuchsia-300/45',
  sky: 'bg-gradient-to-br from-sky-400/40 via-blue-700/20 to-[#102033] ring-sky-300/45',
  emerald: 'bg-gradient-to-br from-emerald-400/40 via-emerald-800/25 to-[#0d241c] ring-emerald-300/45',
  amber: 'bg-gradient-to-br from-amber-400/40 via-orange-800/25 to-[#2a1c0c] ring-amber-300/45',
  violet: 'bg-gradient-to-br from-violet-400/45 via-purple-800/25 to-[#1a1230] ring-violet-300/50',
  rose: 'bg-gradient-to-br from-rose-400/45 via-rose-800/25 to-[#2a1218] ring-rose-300/45',
  teal: 'bg-gradient-to-br from-teal-400/40 via-cyan-800/20 to-[#0c2424] ring-teal-300/45',
};

const TITLE: Record<ReportInsightTone, string> = {
  indigo: 'text-indigo-100',
  fuchsia: 'text-fuchsia-100',
  sky: 'text-sky-100',
  emerald: 'text-emerald-100',
  amber: 'text-amber-100',
  violet: 'text-violet-100',
  rose: 'text-rose-100',
  teal: 'text-teal-100',
};

/** 이고그램 「최고/부족 사용에너지」와 동일 계열의 인사이트 블록 */
export function ReportInsightBlock({
  tone,
  title,
  children,
  compact,
  vivid,
  className = '',
}: {
  tone: ReportInsightTone;
  title?: ReactNode;
  children: ReactNode;
  compact?: boolean;
  /** 표지 등 — 배경 색을 더 분명하게 */
  vivid?: boolean;
  className?: string;
}) {
  return (
    <article
      className={`rounded-xl ring-1 ${vivid ? SHELL_VIVID[tone] : SHELL[tone]} ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      {title ? (
        <h3 className={`text-sm font-semibold ${TITLE[tone]}`}>{title}</h3>
      ) : null}
      <div className={title ? 'mt-2' : undefined}>{children}</div>
    </article>
  );
}
