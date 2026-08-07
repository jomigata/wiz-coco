'use client';

import React from 'react';

type PortalAuthTheme = 'start' | 'results' | 'recovery';

const PAGE_BG: Record<PortalAuthTheme, string> = {
  start: 'bg-[#060a12]',
  results: 'bg-[#060a12]',
  /** 청·녹 제외 — 짙은 슬레이트·보라(흰 글자 대비) */
  recovery: 'bg-[#1a1520]',
};

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
    loadingText: string;
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
    loadingText: 'text-sky-300/80',
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
    loadingText: 'text-emerald-200/80',
  },
  recovery: {
    card: 'bg-[#2a2438]/95 border border-violet-300/20 shadow-xl shadow-black/40',
    accent: 'text-violet-200/90',
    label: 'text-slate-200',
    input:
      'bg-[#1f1a2a]/90 border border-violet-200/25 text-white placeholder:text-slate-400 focus:ring-violet-400/45 focus:border-violet-300/40',
    button: 'bg-violet-600 hover:bg-violet-500 text-white',
    link: 'text-violet-200 hover:text-white',
    infoBox: 'border border-violet-300/15 bg-violet-950/25 text-slate-300',
    loadingText: 'text-violet-200/80',
  },
};

type Props = {
  theme: PortalAuthTheme;
  children?: React.ReactNode;
  loading?: boolean;
};

export function PortalAuthScreenLayout({ theme, children, loading }: Props) {
  const pageBg = PAGE_BG[theme];
  const t = THEME[theme];

  if (loading) {
    return (
      <div className={`relative min-h-screen ${pageBg} pt-24 flex justify-center`}>
        <p className={`relative z-10 text-sm ${t.loadingText}`}>불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${pageBg}`}>
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

export function portalAuthPageBg(theme: PortalAuthTheme): string {
  return PAGE_BG[theme];
}
