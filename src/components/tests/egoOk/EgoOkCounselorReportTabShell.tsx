'use client';

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useMouseEdgeAutoScroll } from '@/lib/useMouseEdgeAutoScroll';

export type CounselorReportTab = {
  id: string;
  label: string;
  short?: string;
  description?: string;
  panel: ReactNode;
};

type Props = {
  tabs: CounselorReportTab[];
  defaultTabId?: string;
  /** fixed nav top (Tailwind top-* class suffix e.g. 16 → top-16) */
  fixedTopClass?: string;
};

const TAB_BAR_FALLBACK_TOP_PX = 64 + 36 + 52;

export default function EgoOkCounselorReportTabShell({
  tabs,
  defaultTabId,
  fixedTopClass = 'top-16',
}: Props) {
  const firstId = tabs[0]?.id ?? '';
  const [activeId, setActiveId] = useState(defaultTabId ?? firstId);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [contentTop, setContentTop] = useState(TAB_BAR_FALLBACK_TOP_PX);

  useMouseEdgeAutoScroll(scrollRef, true, navRef);

  useLayoutEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      if (nav) setContentTop(nav.getBoundingClientRect().bottom);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tabs.length]);

  const displayId = previewId ?? activeId;
  const activePanel =
    tabs.find((t) => t.id === displayId)?.panel ?? tabs.find((t) => t.id === activeId)?.panel;

  const selectTab = useCallback((id: string) => {
    setActiveId(id);
    setPreviewId(null);
  }, []);

  const onTabEnter = useCallback((id: string) => {
    setPreviewId(id);
  }, []);

  const lockPreviewToActive = useCallback(() => {
    if (previewId && previewId !== activeId) {
      setActiveId(previewId);
    }
    setPreviewId(null);
  }, [previewId, activeId]);

  if (!tabs.length) return null;

  return (
    <div className="w-full">
      <nav
        ref={navRef}
        className={`fixed inset-x-0 ${fixedTopClass} z-50 border-b border-white/10 bg-[#070b14]/95 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl`}
        aria-label="검사 결과 섹션"
      >
        <div className="mx-auto flex w-full max-w-[min(100%,112rem)] items-stretch gap-0.5 overflow-x-auto px-2 py-1.5 sm:gap-1 sm:px-4 [scrollbar-width:thin]">
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const isPreview = previewId === tab.id && previewId !== activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                onMouseEnter={() => onTabEnter(tab.id)}
                aria-current={isActive ? 'true' : undefined}
                title={tab.description ?? tab.label}
                className={`group relative shrink-0 rounded-lg px-2.5 py-2 text-left transition sm:min-w-[6.5rem] sm:flex-1 sm:px-3 ${
                  isActive
                    ? 'bg-gradient-to-b from-indigo-500/30 to-indigo-600/10 text-white ring-1 ring-indigo-400/45'
                    : isPreview
                      ? 'bg-white/[0.08] text-indigo-100 ring-1 ring-white/20'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-wide text-indigo-300/90 sm:text-[11px]">
                  {tab.short ?? tab.label}
                </span>
                <span className="mt-0.5 hidden truncate text-xs font-semibold leading-tight sm:block sm:text-sm">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div style={{ paddingTop: contentTop }} onMouseEnter={lockPreviewToActive}>
        <div
          className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/50 via-[#0a0f1a] to-indigo-950/25 shadow-inner"
          style={{ minHeight: `calc(100dvh - ${contentTop}px)` }}
        >
          <div
            ref={scrollRef}
            key={displayId}
            className="absolute inset-0 overflow-auto overscroll-contain px-3 pb-3 pt-0 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6 [scrollbar-width:thin]"
          >
            {activePanel}
          </div>
        </div>
      </div>
    </div>
  );
}
