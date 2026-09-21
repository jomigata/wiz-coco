'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  /** outer wrapper (e.g. flex-1) */
  className?: string;
};

const SCROLL_EDGE_THRESHOLD = 6;
const HOVER_SCROLL_PX_PER_FRAME = 10;
/** 가로 스크롤바(8px) 위 여백 */
const SCROLLBAR_GUTTER_PX = 12;
/** 섹션 좌·우 패딩(공백)까지 hover 스크롤 영역 확장 */
const EDGE_HOVER_EXTEND_PX = 20;

function SmallScrollChevron({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-sky-300/95 ${
        isLeft ? 'counselor-scroll-hint-nudge-left' : 'counselor-scroll-hint-nudge-right'
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      {isLeft ? (
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.25 4.5a.75.75 0 010 1.08l-4.25 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}

function ScrollEdge({
  side,
  visible,
  active,
  onEnter,
  onLeave,
}: {
  side: 'left' | 'right';
  visible: boolean;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  if (!visible) return null;

  const isLeft = side === 'left';

  return (
    <button
      type="button"
      aria-label={isLeft ? '왼쪽으로 스크롤 (마우스를 올리세요)' : '오른쪽으로 스크롤 (마우스를 올리세요)'}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className={`pointer-events-auto absolute inset-y-0 z-20 flex shrink-0 items-stretch justify-center border-0 bg-transparent p-0 outline-none ${
        isLeft ? 'left-0' : 'right-0'
      } ${active ? 'cursor-grabbing' : 'cursor-pointer'}`}
      style={{ width: 36 + EDGE_HOVER_EXTEND_PX }}
    >
      <span
        className={`pointer-events-none absolute inset-y-0 ${
          isLeft
            ? 'left-0 bg-gradient-to-r from-[#0b1120]/90 via-[#0b1120]/40 to-transparent'
            : 'right-0 bg-gradient-to-l from-[#0b1120]/90 via-[#0b1120]/40 to-transparent'
        }`}
        style={{ width: 40 + EDGE_HOVER_EXTEND_PX }}
        aria-hidden
      />
      <span
        className={`relative flex h-full w-5 flex-col items-center justify-center rounded-md border transition-colors ${
          active
            ? 'border-sky-400/50 bg-sky-500/12 shadow-[inset_0_0_8px_rgba(56,189,248,0.15)]'
            : 'border-sky-400/25 bg-sky-950/70 hover:border-sky-400/40 hover:bg-sky-900/75'
        }`}
      >
        <SmallScrollChevron side={side} />
      </span>
    </button>
  );
}

/** 상담사 목록 테이블 — 가로 스크롤 시 좌·우 끝 세로 화살표 + hover 연속 스크롤 */
export default function CounselorListTableScroll({ children, className = '' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hoverRafRef = useRef<number | null>(null);
  const hoverDirectionRef = useRef<'left' | 'right' | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
  const [edgeLayout, setEdgeLayout] = useState({ top: 0, bottom: SCROLLBAR_GUTTER_PX });

  const measureEdgeLayout = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const elRect = el.getBoundingClientRect();
    const thead = el.querySelector('thead');
    /** 펼침 상세 행 제외 — 목록 값(tr) 구간에만 좌·우 스크롤 힌트 */
    const mainRows = el.querySelectorAll('tbody tr:not([data-counselor-list-expand-row])');

    let top = 0;
    let bottom = SCROLLBAR_GUTTER_PX;

    if (mainRows.length > 0) {
      const first = mainRows[0];
      const last = mainRows[mainRows.length - 1];
      if (first instanceof HTMLElement && last instanceof HTMLElement) {
        const firstRect = first.getBoundingClientRect();
        const lastRect = last.getBoundingClientRect();
        top = Math.max(0, Math.round(firstRect.top - elRect.top));
        const lastBottom = lastRect.bottom - elRect.top;
        bottom = Math.max(SCROLLBAR_GUTTER_PX, Math.round(el.clientHeight - lastBottom));
      }
    } else if (thead instanceof HTMLElement) {
      top = Math.max(0, Math.round(thead.getBoundingClientRect().height));
    }

    setEdgeLayout({ top, bottom });
  }, []);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    measureEdgeLayout();
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth - clientWidth > SCROLL_EDGE_THRESHOLD;
    if (!overflow) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(scrollLeft > SCROLL_EDGE_THRESHOLD);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - SCROLL_EDGE_THRESHOLD);
  }, [measureEdgeLayout]);

  const stopHoverScroll = useCallback(() => {
    hoverDirectionRef.current = null;
    setHoverSide(null);
    if (hoverRafRef.current != null) {
      cancelAnimationFrame(hoverRafRef.current);
      hoverRafRef.current = null;
    }
  }, []);

  const startHoverScroll = useCallback(
    (direction: 'left' | 'right') => {
      stopHoverScroll();
      hoverDirectionRef.current = direction;
      setHoverSide(direction);

      const tick = () => {
        const el = scrollRef.current;
        const dir = hoverDirectionRef.current;
        if (!el || !dir) return;

        const { scrollLeft, scrollWidth, clientWidth } = el;
        const maxLeft = scrollWidth - clientWidth;
        const delta = dir === 'left' ? -HOVER_SCROLL_PX_PER_FRAME : HOVER_SCROLL_PX_PER_FRAME;
        const next = Math.max(0, Math.min(maxLeft, scrollLeft + delta));

        if (next === scrollLeft) {
          stopHoverScroll();
          updateScrollHints();
          return;
        }

        el.scrollLeft = next;
        updateScrollHints();
        hoverRafRef.current = requestAnimationFrame(tick);
      };

      hoverRafRef.current = requestAnimationFrame(tick);
    },
    [stopHoverScroll, updateScrollHints],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollHints();

    const onScroll = () => updateScrollHints();
    el.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateScrollHints());
    ro.observe(el);
    const content = el.firstElementChild;
    if (content) ro.observe(content);
    const thead = el.querySelector('thead');
    if (thead) ro.observe(thead);

    const mo = new MutationObserver(() => updateScrollHints());
    mo.observe(el, { childList: true, subtree: true });

    window.addEventListener('resize', updateScrollHints);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', updateScrollHints);
      stopHoverScroll();
    };
  }, [updateScrollHints, stopHoverScroll, children]);

  return (
    <div className={`relative min-h-0 ${className}`.trim()}>
      <div
        ref={scrollRef}
        className="counselor-list-table-scroll min-h-0 max-w-full overflow-x-auto overflow-y-visible scroll-smooth"
      >
        {children}
      </div>
      <div
        className="pointer-events-none absolute z-10"
        style={{
          top: edgeLayout.top,
          bottom: edgeLayout.bottom,
          left: -EDGE_HOVER_EXTEND_PX,
          right: -EDGE_HOVER_EXTEND_PX,
        }}
        aria-hidden={!canScrollLeft && !canScrollRight}
      >
        <ScrollEdge
          side="left"
          visible={canScrollLeft}
          active={hoverSide === 'left'}
          onEnter={() => startHoverScroll('left')}
          onLeave={stopHoverScroll}
        />
        <ScrollEdge
          side="right"
          visible={canScrollRight}
          active={hoverSide === 'right'}
          onEnter={() => startHoverScroll('right')}
          onLeave={stopHoverScroll}
        />
      </div>
    </div>
  );
}
