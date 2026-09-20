'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  /** outer wrapper (e.g. flex-1) */
  className?: string;
};

const SCROLL_EDGE_THRESHOLD = 6;
const HOVER_SCROLL_PX_PER_FRAME = 10;

function TallScrollChevron({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <svg
      className={`h-full w-full min-h-[3rem] max-w-[0.85rem] text-sky-300/95 drop-shadow-[0_0_6px_rgba(56,189,248,0.35)] ${
        isLeft ? 'counselor-scroll-hint-nudge-left' : 'counselor-scroll-hint-nudge-right'
      }`}
      viewBox="0 0 24 200"
      preserveAspectRatio="none"
      aria-hidden
    >
      {isLeft ? (
        <path
          fill="currentColor"
          d="M20 4 L6 100 L20 196 L14 196 L2 100 L14 4 Z"
        />
      ) : (
        <path
          fill="currentColor"
          d="M4 4 L18 100 L4 196 L10 196 L22 100 L10 4 Z"
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
      className={`pointer-events-auto absolute inset-y-0 z-20 flex w-12 shrink-0 items-stretch justify-center border-0 bg-transparent p-0 outline-none ${
        isLeft ? 'left-0' : 'right-0'
      } ${active ? 'cursor-grabbing' : 'cursor-pointer'}`}
    >
      <span
        className={`pointer-events-none absolute inset-y-0 w-14 ${
          isLeft
            ? 'left-0 bg-gradient-to-r from-[#0b1120]/92 via-[#0b1120]/45 to-transparent'
            : 'right-0 bg-gradient-to-l from-[#0b1120]/92 via-[#0b1120]/45 to-transparent'
        }`}
        aria-hidden
      />
      <span
        className={`relative my-1 flex h-[calc(100%-0.5rem)] w-8 flex-col items-center justify-center rounded-lg border transition-colors ${
          active
            ? 'border-sky-400/55 bg-sky-500/15 shadow-[inset_0_0_12px_rgba(56,189,248,0.2)]'
            : 'border-sky-400/30 bg-sky-950/75 hover:border-sky-400/45 hover:bg-sky-900/80'
        }`}
      >
        <TallScrollChevron side={side} />
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

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth - clientWidth > SCROLL_EDGE_THRESHOLD;
    if (!overflow) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(scrollLeft > SCROLL_EDGE_THRESHOLD);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - SCROLL_EDGE_THRESHOLD);
  }, []);

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
        className="pointer-events-none absolute inset-0 z-10 flex items-stretch justify-between"
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
