'use client';

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  EGO_OK_REPORT_PANEL_OUTER,
  EGO_OK_REPORT_PANEL_SCROLL,
  EGO_OK_REPORT_TAB_BAR,
} from '@/components/tests/egoOk/egoOkReportChrome';
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

const TAB_BAR_FALLBACK_BOTTOM_PX = 64 + 36 + 52;

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
  const [navBottomPx, setNavBottomPx] = useState(TAB_BAR_FALLBACK_BOTTOM_PX);

  useMouseEdgeAutoScroll(scrollRef, true, navRef, { panelOnly: true });

  useLayoutEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      if (nav) setNavBottomPx(nav.getBoundingClientRect().bottom);
    };
    measure();
    window.addEventListener('resize', measure);
    const nav = navRef.current;
    const ro = nav && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (nav && ro) ro.observe(nav);
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
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

  const panelHeight = `calc(100dvh - ${navBottomPx}px - 0.5rem)`;

  return (
    <div className="w-full">
      <nav
        ref={navRef}
        className={`fixed inset-x-0 ${fixedTopClass} z-50 ${EGO_OK_REPORT_TAB_BAR}`}
        aria-label="검사 결과 섹션"
      >
        <div className="mx-auto flex w-full max-w-[min(100%,112rem)] items-stretch gap-1 overflow-x-auto px-2 py-2 sm:gap-1.5 sm:px-4 [scrollbar-width:thin]">
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
                className={`group relative shrink-0 rounded-lg px-3 py-2.5 text-left transition-all duration-200 sm:min-w-[7rem] sm:flex-1 sm:px-3.5 ${
                  isActive
                    ? 'border-2 border-white bg-white/15 text-white shadow-[0_0_20px_rgba(255,255,255,0.12)]'
                    : isPreview
                      ? 'border-2 border-white/80 bg-white/10 text-white'
                      : 'border border-white/35 bg-black/25 text-slate-200 hover:border-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span
                  className={`block text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}
                >
                  {tab.short ?? tab.label}
                </span>
                <span
                  className={`mt-0.5 hidden truncate text-xs font-semibold leading-tight sm:block sm:text-sm ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive ? (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-white" />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      <div
        className={`fixed inset-x-2 bottom-2 z-40 ${EGO_OK_REPORT_PANEL_OUTER}`}
        style={{ top: navBottomPx, height: panelHeight }}
        onMouseEnter={lockPreviewToActive}
      >
        <div
          ref={scrollRef}
          className={`h-full overflow-auto overscroll-contain p-2 [scrollbar-width:thin] ${EGO_OK_REPORT_PANEL_SCROLL}`}
        >
          <div key={displayId} className="flex min-h-min flex-col gap-2">
            {activePanel}
          </div>
        </div>
      </div>

      <div className="pointer-events-none invisible" style={{ height: panelHeight }} aria-hidden />
    </div>
  );
}
