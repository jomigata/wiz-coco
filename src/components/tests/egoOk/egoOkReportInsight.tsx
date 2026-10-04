'use client';

import type { ReactNode } from 'react';

export type ReportInsightTone = 'indigo' | 'fuchsia' | 'sky' | 'emerald' | 'amber' | 'violet';

const SHELL: Record<ReportInsightTone, string> = {
  indigo: 'bg-indigo-500/10 ring-indigo-400/25',
  fuchsia: 'bg-fuchsia-500/10 ring-fuchsia-400/25',
  sky: 'bg-sky-500/10 ring-sky-400/25',
  emerald: 'bg-emerald-500/10 ring-emerald-400/25',
  amber: 'bg-amber-500/10 ring-amber-400/25',
  violet: 'bg-violet-500/10 ring-violet-400/25',
};

const TITLE: Record<ReportInsightTone, string> = {
  indigo: 'text-indigo-100',
  fuchsia: 'text-fuchsia-100',
  sky: 'text-sky-100',
  emerald: 'text-emerald-100',
  amber: 'text-amber-100',
  violet: 'text-violet-100',
};

/** 이고그램 「최고/부족 사용에너지」와 동일 계열의 인사이트 블록 */
export function ReportInsightBlock({
  tone,
  title,
  children,
  compact,
  className = '',
}: {
  tone: ReportInsightTone;
  title?: ReactNode;
  children: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <article
      className={`rounded-xl ring-1 ${SHELL[tone]} ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      {title ? (
        <h3 className={`text-sm font-semibold ${TITLE[tone]}`}>{title}</h3>
      ) : null}
      <div className={title ? 'mt-2' : undefined}>{children}</div>
    </article>
  );
}

export const COVER_STAT_TONES: ReportInsightTone[] = [
  'indigo',
  'sky',
  'violet',
  'emerald',
  'amber',
  'fuchsia',
  'indigo',
  'sky',
  'violet',
];
