'use client';

import React from 'react';

const STEP_THEMES = {
  1: {
    border: 'border-sky-400/30',
    shell: 'bg-gradient-to-br from-sky-950/45 via-[#101e36]/95 to-indigo-950/35',
    header: 'bg-gradient-to-r from-sky-600/40 via-sky-500/18 to-indigo-600/12',
    badge: 'bg-sky-500/25 text-sky-50 border border-sky-400/40 shadow-sm shadow-sky-950/40',
    glow: 'from-sky-400/30 via-sky-300/10 to-transparent',
    ring: 'ring-sky-400/15',
  },
  2: {
    border: 'border-violet-400/30',
    shell: 'bg-gradient-to-br from-violet-950/40 via-[#101e36]/95 to-fuchsia-950/30',
    header: 'bg-gradient-to-r from-violet-600/35 via-purple-500/16 to-fuchsia-600/10',
    badge: 'bg-violet-500/25 text-violet-50 border border-violet-400/40 shadow-sm shadow-violet-950/40',
    glow: 'from-violet-400/30 via-fuchsia-300/10 to-transparent',
    ring: 'ring-violet-400/15',
  },
  3: {
    border: 'border-emerald-400/30',
    shell: 'bg-gradient-to-br from-emerald-950/40 via-[#101e36]/95 to-teal-950/35',
    header: 'bg-gradient-to-r from-emerald-600/35 via-teal-500/16 to-cyan-600/10',
    badge: 'bg-emerald-500/25 text-emerald-50 border border-emerald-400/40 shadow-sm shadow-emerald-950/40',
    glow: 'from-emerald-400/30 via-teal-300/10 to-transparent',
    ring: 'ring-emerald-400/15',
  },
} as const;

type Step = keyof typeof STEP_THEMES;

type Props = {
  step: Step;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
};

export default function CounselorSendStepBlock({
  step,
  title,
  subtitle,
  children,
  className = '',
  bodyClassName = '',
  compact = false,
}: Props) {
  const theme = STEP_THEMES[step];
  const pad = compact ? 'px-3 py-3 sm:px-4' : 'px-4 py-4 sm:px-5 sm:py-4';
  const headerPad = compact ? 'px-3 py-2.5 sm:px-4' : 'px-4 py-3 sm:px-5';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-lg shadow-black/25 ring-1 ${theme.border} ${theme.shell} ${theme.ring} ${className}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${theme.glow}`} />
      <div className={`border-b border-white/[0.07] ${headerPad} ${theme.header}`}>
        <div className="flex items-start gap-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${theme.badge}`}
            aria-hidden
          >
            {step}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold tracking-tight text-white sm:text-base">{title}</h3>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className={`${pad} ${bodyClassName}`}>{children}</div>
    </div>
  );
}

export function getSendStepSectionClasses(step: Step): {
  section: string;
  header: string;
  accent: string;
} {
  const theme = STEP_THEMES[step];
  return {
    section: `${theme.border} ${theme.shell} ${theme.ring} ring-1 shadow-lg shadow-black/20`,
    header: theme.header,
    accent:
      step === 1
        ? 'border-t-4 border-t-sky-400'
        : step === 2
          ? 'border-t-4 border-t-violet-400'
          : 'border-t-4 border-t-emerald-400',
  };
}
