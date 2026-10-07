'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  EGO_OK_REPORT_PANEL_OUTER,
  EGO_OK_REPORT_PANEL_SCROLL,
  EGO_OK_REPORT_TAB_ACTIVE,
  EGO_OK_REPORT_TAB_BAR,
  EGO_OK_REPORT_TAB_IDLE,
  EGO_OK_REPORT_TAB_PREVIEW,
} from '@/components/tests/egoOk/egoOkReportChrome';
import EdgeScrollHintOverlay from '@/components/tests/egoOk/EdgeScrollHintOverlay';
import {
  EgoOkReportTabNavContext,
  formatEgoOkSectionTitle,
} from '@/components/tests/egoOk/egoOkReportTabNav';
import { useMouseEdgeAutoScroll, useScrollEdgeHints } from '@/lib/useMouseEdgeAutoScroll';

export type CounselorReportTab = {
  id: string;
  label: string;
  short?: string;
  description?: string;
  /** cover(종합 요약) 제외 일련번호 */
  sectionNo?: number;
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
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [navBottomPx, setNavBottomPx] = useState(TAB_BAR_FALLBACK_BOTTOM_PX);

  useMouseEdgeAutoScroll(scrollRef, true, navRef, { panelOnly: true });
  useMouseEdgeAutoScroll(tabScrollRef, true, undefined, { panelOnly: true, horizontalOnly: true });
  const panelScrollHints = useScrollEdgeHints(scrollRef, true, navRef);
  const tabScrollHints = useScrollEdgeHints(tabScrollRef, true);

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

  const tabNav = useMemo(() => ({ selectTab }), [selectTab]);

  return (
    <EgoOkReportTabNavContext.Provider value={tabNav}>
    <div className="w-full">
      <nav
        ref={navRef}
        className={`fixed inset-x-0 ${fixedTopClass} z-50 ${EGO_OK_REPORT_TAB_BAR}`}
        aria-label="검사 결과 섹션"
      >
        <div className="relative mx-auto w-full max-w-[min(100%,112rem)] px-3 py-2.5 sm:px-4">
          <div
            ref={tabScrollRef}
            className="flex items-stretch gap-2 overflow-x-auto sm:gap-2 [scrollbar-width:thin]"
          >
            {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const isPreview = previewId === tab.id && previewId !== activeId;
            const shell = isActive
              ? EGO_OK_REPORT_TAB_ACTIVE
              : isPreview
                ? EGO_OK_REPORT_TAB_PREVIEW
                : EGO_OK_REPORT_TAB_IDLE;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                onMouseEnter={() => onTabEnter(tab.id)}
                aria-current={isActive ? 'true' : undefined}
                title={tab.description ?? tab.label}
                className={`group relative min-h-[3.25rem] shrink-0 rounded-[0.65rem] px-3 py-2 text-left transition-[border-color,background,box-shadow,color] duration-200 ease-out sm:min-w-[7.25rem] sm:flex-1 sm:px-3.5 ${shell}`}
              >
                <span
                  className={`block text-[11px] font-medium leading-none tracking-tight ${
                    isActive ? 'text-white/90' : isPreview ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {tab.short ?? tab.label}
                </span>
                <span
                  className={`mt-1 block truncate text-[13px] font-bold leading-snug sm:text-sm ${
                    isActive ? 'text-white' : isPreview ? 'text-white/95' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {formatEgoOkSectionTitle(tab.sectionNo, tab.label)}
                </span>
              </button>
            );
          })}
          </div>
          <EdgeScrollHintOverlay hints={tabScrollHints} axes="horizontal" pinEdges />
        </div>
      </nav>

      <div
        className={`fixed inset-x-2 bottom-2 z-40 ${EGO_OK_REPORT_PANEL_OUTER}`}
        style={{ top: navBottomPx, height: panelHeight }}
        onMouseEnter={lockPreviewToActive}
      >
        <div className="relative h-full min-h-0">
          <div
            ref={scrollRef}
            className={`h-full overflow-auto overscroll-contain p-2 [scrollbar-width:thin] ${EGO_OK_REPORT_PANEL_SCROLL}`}
          >
            <div key={displayId} className="flex min-h-min flex-col gap-2">
              {activePanel}
            </div>
          </div>
          <EdgeScrollHintOverlay hints={panelScrollHints} pinEdges />
        </div>
      </div>

      <div className="pointer-events-none invisible" style={{ height: panelHeight }} aria-hidden />
    </div>
    </EgoOkReportTabNavContext.Provider>
  );
}
