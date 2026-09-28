'use client';

import React from 'react';

type Accent = 'violet' | 'teal';

const SHELL: Record<Accent, string> = {
  violet: 'border-violet-500/30 bg-violet-950/25',
  teal: 'border-teal-500/30 bg-teal-950/25',
};

const SECTION: Record<Accent, string> = {
  violet: 'text-violet-300/90',
  teal: 'text-teal-200/90',
};

const BTN_PRIMARY: Record<Accent, string> = {
  violet: 'bg-violet-600/90 hover:bg-violet-500',
  teal: 'bg-teal-600 hover:bg-teal-500',
};

type Props = {
  accent: Accent;
  sectionLabel: string;
  title: string;
  /** 삭제·발송 완료 후 — 제목(흰색) + 옆 상태/복원만 */
  compact?: boolean;
  statusText?: string;
  statusClassName?: string;
  onRestore?: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  error?: string;
};

export default function CounselorRecommendCardLayout({
  accent,
  sectionLabel,
  title,
  compact = false,
  statusText,
  statusClassName = 'text-slate-400',
  onRestore,
  children,
  actions,
  error,
}: Props) {
  if (compact) {
    return (
      <div className={`mt-3 rounded-lg border px-4 py-2.5 ${SHELL[accent]}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-medium text-white">{title}</p>
          {statusText ? (
            <span className={`text-xs font-medium tabular-nums ${statusClassName}`}>{statusText}</span>
          ) : null}
          {onRestore ? (
            <button
              type="button"
              onClick={onRestore}
              className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-sky-200 transition-colors hover:bg-white/5"
            >
              복원
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-3 rounded-lg border px-4 py-3 ${SHELL[accent]}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${SECTION[accent]}`}>
        {sectionLabel}
      </p>
      <p className="mt-1 text-sm font-medium text-white">{title}</p>
      {children}
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      {actions ? <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function recommendPrimaryButtonClass(accent: Accent): string {
  return `rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 sm:text-sm ${BTN_PRIMARY[accent]}`;
}

export function recommendSecondaryButtonClass(): string {
  return 'rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 disabled:opacity-50 sm:text-sm';
}

export function recommendDangerButtonClass(): string {
  return 'rounded-md border border-red-500/35 px-3 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50 sm:text-sm';
}
