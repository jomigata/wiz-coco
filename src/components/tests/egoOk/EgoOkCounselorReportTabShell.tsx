'use client';

import { useCallback, useState, type ReactNode } from 'react';

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
  /** Sticky offset below site header (px class token) */
  stickyTopClass?: string;
};

export default function EgoOkCounselorReportTabShell({
  tabs,
  defaultTabId,
  stickyTopClass = 'top-16',
}: Props) {
  const firstId = tabs[0]?.id ?? '';
  const [activeId, setActiveId] = useState(defaultTabId ?? firstId);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const displayId = hoverId ?? activeId;
  const activePanel = tabs.find((t) => t.id === displayId)?.panel ?? tabs.find((t) => t.id === activeId)?.panel;

  const selectTab = useCallback((id: string) => {
    setActiveId(id);
    setHoverId(null);
  }, []);

  const onTabEnter = useCallback((id: string) => {
    setHoverId(id);
  }, []);

  const onTabLeave = useCallback(() => {
    setHoverId(null);
  }, []);

  if (!tabs.length) return null;

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] w-full flex-col">
      <nav
        className={`sticky ${stickyTopClass} z-40 -mx-1 border-y border-white/10 bg-[#070b14]/90 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:-mx-2`}
        aria-label="검사 결과 섹션"
        onMouseLeave={onTabLeave}
      >
        <div className="flex items-stretch gap-0.5 overflow-x-auto px-1 py-1.5 sm:gap-1 sm:px-2 [scrollbar-width:thin]">
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const isPreview = hoverId === tab.id && hoverId !== activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                onMouseEnter={() => onTabEnter(tab.id)}
                onFocus={() => onTabEnter(tab.id)}
                onBlur={onTabLeave}
                aria-current={isActive ? 'true' : undefined}
                title={tab.description ?? tab.label}
                className={`group relative shrink-0 rounded-lg px-3 py-2.5 text-left transition sm:min-w-[7.5rem] sm:flex-1 sm:px-4 ${
                  isActive
                    ? 'bg-gradient-to-b from-indigo-500/25 to-indigo-600/10 text-white ring-1 ring-indigo-400/40'
                    : isPreview
                      ? 'bg-white/[0.06] text-indigo-100 ring-1 ring-white/15'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-300/80 sm:text-xs">
                  {tab.short ?? tab.label}
                </span>
                <span className="mt-0.5 hidden text-sm font-semibold leading-tight text-inherit sm:block">{tab.label}</span>
                {isActive ? (
                  <span className="absolute inset-x-3 -bottom-1.5 h-0.5 rounded-full bg-indigo-400 sm:inset-x-4" />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-none border-t border-white/10 bg-gradient-to-br from-slate-900/40 via-[#0a0f1a] to-indigo-950/30 sm:rounded-b-2xl">
        <div
          key={displayId}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-5 lg:p-6 [scrollbar-width:thin]"
        >
          {activePanel}
        </div>
      </div>
    </div>
  );
}
