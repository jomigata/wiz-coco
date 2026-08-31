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
    borderWrapper: 'bg-gradient-to-b from-sky-400/50 to-emerald-400/50',
    shell: 'bg-gradient-to-b from-sky-950/42 via-[#101e36]/92 to-emerald-950/42',
    header: 'bg-transparent',
    badge: 'bg-violet-500/25 text-violet-50 border border-violet-400/40 shadow-sm shadow-violet-950/40',
    glow: 'from-sky-400/35 via-transparent to-emerald-400/35',
    ring: 'ring-violet-400/10',
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
  /** true면 툴팁 등이 블록 밖으로 나가도 잘리지 않음 */
  allowOverflow?: boolean;
};

function StepHeader({
  step,
  title,
  subtitle,
  headerPad,
  theme,
}: {
  step: Step;
  title: string;
  subtitle?: string;
  headerPad: string;
  theme: (typeof STEP_THEMES)[Step];
}) {
  return (
    <div className={`relative border-b border-white/[0.07] ${headerPad} ${theme.header}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${theme.badge}`}
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
  );
}

export default function CounselorSendStepBlock({
  step,
  title,
  subtitle,
  children,
  className = '',
  bodyClassName = '',
  compact = false,
  allowOverflow = false,
}: Props) {
  const theme = STEP_THEMES[step];
  const pad = compact ? 'px-3 py-2 sm:px-3.5' : 'px-3.5 py-3 sm:px-4 sm:py-3';
  const headerPad = compact ? 'px-3 py-2 sm:px-3.5' : 'px-3.5 py-2.5 sm:px-4';
  const overflowClass = allowOverflow ? 'overflow-visible' : 'overflow-hidden';

  const inner = (
    <>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${theme.glow}`} />
      <StepHeader step={step} title={title} subtitle={subtitle} headerPad={headerPad} theme={theme} />
      <div className={`${pad} ${allowOverflow ? 'overflow-visible' : ''} ${bodyClassName}`}>{children}</div>
    </>
  );

  if (step === 2) {
    const blend = STEP_THEMES[2];
    return (
      <div
        className={`relative ${overflowClass} rounded-2xl p-px shadow-lg shadow-black/25 ${blend.borderWrapper} ${className}`}
      >
        <div
          className={`relative ${overflowClass} rounded-[calc(1rem-1px)] ring-1 ${blend.ring} ${blend.shell}`}
        >
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${overflowClass} rounded-2xl border shadow-lg shadow-black/25 ring-1 ${'border' in theme ? theme.border : ''} ${theme.shell} ${theme.ring} ${className}`}
    >
      {inner}
    </div>
  );
}

export function getSendStepSectionClasses(step: Step): {
  section: string;
  header: string;
  accent: string;
  borderWrapper?: string;
  useGradientBorder?: boolean;
} {
  if (step === 2) {
    const blend = STEP_THEMES[2];
    return {
      section: `${blend.shell} ring-1 ${blend.ring}`,
      borderWrapper: blend.borderWrapper,
      header: blend.header,
      accent: '',
      useGradientBorder: true,
    };
  }

  const theme = STEP_THEMES[step];
  return {
    section: `${'border' in theme ? theme.border : ''} ${theme.shell} ${theme.ring} ring-1 shadow-lg shadow-black/20`,
    header: theme.header,
    accent:
      step === 1
        ? 'border-t-4 border-t-sky-400'
        : 'border-t-4 border-t-emerald-400',
  };
}
