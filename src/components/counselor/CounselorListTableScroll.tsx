'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  counselorListScrollEdgeButtonClass,
  counselorListScrollEdgeChevronClass,
} from '@/lib/counselorListTableStyles';

type Props = {
  children: React.ReactNode;
  /** outer wrapper (e.g. flex-1) */
  className?: string;
};

const SCROLL_EDGE_THRESHOLD = 6;
const HOVER_SCROLL_PX_PER_FRAME = 10;
/** 섹션 좌·우 패딩(공백)까지 hover 스크롤 영역 확장 */
const EDGE_HOVER_EXTEND_PX = 20;

function SmallScrollChevron({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <svg
      className={`shrink-0 ${counselorListScrollEdgeChevronClass} ${
        isLeft ? 'counselor-scroll-hint-nudge-left' : 'counselor-scroll-hint-nudge-right'
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {isLeft ? (
        <path d="M14.5 6.5 9 12l5.5 5.5" />
      ) : (
        <path d="M9.5 6.5 15 12l-5.5 5.5" />
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
      className={`pointer-events-auto absolute inset-y-0 z-20 flex shrink-0 items-center justify-center border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 ${
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
      <span className={counselorListScrollEdgeButtonClass(active)}>
        <SmallScrollChevron side={side} />
      </span>
    </button>
  );
}

/** 상담사 목록 테이블 — 가로 스크롤 시 좌·우 끝 세로 화살표 + hover 연속 스크롤 */
export default function CounselorListTableScroll({ children, className = '' }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hoverRafRef = useRef<number | null>(null);
  const hoverDirectionRef = useRef<'left' | 'right' | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
  const [edgeLayout, setEdgeLayout] = useState({ top: 0, height: 0 });

  const measureEdgeLayout = useCallback(() => {
    const wrapper = wrapperRef.current;
    const scrollEl = scrollRef.current;
    if (!wrapper || !scrollEl) return;
    const wrapperRect = wrapper.getBoundingClientRect();
    /** 펼침 상세 행 제외 — 첫·마지막 목록 값(tr) 높이와 동일 */
    const mainRows = scrollEl.querySelectorAll('tbody tr:not([data-counselor-list-expand-row])');

    let top = 0;
    let height = 0;

    if (mainRows.length > 0) {
      const first = mainRows[0];
      const last = mainRows[mainRows.length - 1];
      if (first instanceof HTMLElement && last instanceof HTMLElement) {
        const firstRect = first.getBoundingClientRect();
        const lastRect = last.getBoundingClientRect();
        top = Math.max(0, Math.round(firstRect.top - wrapperRect.top));
        height = Math.max(0, Math.round(lastRect.bottom - firstRect.top));
      }
    }

    setEdgeLayout({ top, height });
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
    const tbody = el.querySelector('tbody');
    if (tbody) ro.observe(tbody);

    const mo = new MutationObserver(() => updateScrollHints());
    mo.observe(el, { childList: true, subtree: true });

    window.addEventListener('resize', updateScrollHints);
    window.addEventListener('scroll', updateScrollHints, true);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', updateScrollHints);
      window.removeEventListener('scroll', updateScrollHints, true);
      stopHoverScroll();
    };
  }, [updateScrollHints, stopHoverScroll, children]);

  return (
    <div ref={wrapperRef} className={`relative min-h-0 ${className}`.trim()}>
      <div
        ref={scrollRef}
        className="counselor-list-table-scroll min-h-0 max-w-full overflow-x-auto overflow-y-visible scroll-smooth"
      >
        {children}
      </div>
      <div
        className={`pointer-events-none absolute z-10 ${
          edgeLayout.height <= 0 ? 'hidden' : ''
        }`}
        style={{
          top: edgeLayout.top,
          height: edgeLayout.height,
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
