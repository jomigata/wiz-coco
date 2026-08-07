'use client';

import React from 'react';

type PortalAuthTheme = 'start' | 'results' | 'recovery';

const THEME: Record<
  PortalAuthTheme,
  {
    card: string;
    accent: string;
    label: string;
    input: string;
    button: string;
    link: string;
    infoBox: string;
  }
> = {
  start: {
    card: 'bg-[#182438]/90 border border-white/[0.14] shadow-xl shadow-black/30',
    accent: 'text-sky-300/90',
    label: 'text-slate-300',
    input:
      'bg-[#0f1a2e]/80 border border-white/15 text-white placeholder:text-slate-400 focus:ring-sky-500/50 focus:border-sky-400/40',
    button: 'bg-sky-600 hover:bg-sky-500 text-white',
    link: 'text-sky-300 hover:text-sky-200',
    infoBox: 'border border-white/10 bg-white/[0.04] text-slate-300',
  },
  results: {
    card: 'bg-emerald-950/45 border border-emerald-400/35 shadow-xl shadow-emerald-950/40',
    accent: 'text-emerald-200/90',
    label: 'text-emerald-50/90',
    input:
      'bg-emerald-950/50 border border-emerald-400/30 text-white placeholder:text-emerald-200/45 focus:ring-emerald-400/50 focus:border-emerald-300/45',
    button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    link: 'text-emerald-200 hover:text-white',
    infoBox: 'border border-emerald-400/20 bg-emerald-950/35 text-emerald-100/80',
  },
  recovery: {
    card: 'bg-[#182438]/90 border border-white/[0.14] shadow-xl shadow-black/30',
    accent: 'text-sky-300/90',
    label: 'text-slate-300',
    input:
      'bg-[#0f1a2e]/80 border border-white/15 text-white placeholder:text-slate-400 focus:ring-sky-500/50 focus:border-sky-400/40',
    button: 'bg-sky-600 hover:bg-sky-500 text-white',
    link: 'text-sky-300 hover:text-sky-200',
    infoBox: 'border border-white/10 bg-white/[0.04] text-slate-300',
  },
};

function PortalAuthGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 opacity-10" aria-hidden>
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="portal-auth-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#portal-auth-grid)" className="text-slate-300" />
      </svg>
    </div>
  );
}

type Props = {
  theme: PortalAuthTheme;
  children?: React.ReactNode;
  loading?: boolean;
};

export function PortalAuthScreenLayout({ theme, children, loading }: Props) {
  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#060a12] pt-24 flex justify-center">
        <PortalAuthGrid />
        <p className="relative z-10 text-sky-300/80 text-sm">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#060a12]">
      <PortalAuthGrid />
      <div className="relative z-10 pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">{children}</main>
      </div>
    </div>
  );
}

export function PortalAuthCard({
  theme,
  children,
}: {
  theme: PortalAuthTheme;
  children: React.ReactNode;
}) {
  const t = THEME[theme];
  return <div className={`rounded-xl p-8 ${t.card}`}>{children}</div>;
}

export function usePortalAuthTheme(theme: PortalAuthTheme) {
  return THEME[theme];
}
