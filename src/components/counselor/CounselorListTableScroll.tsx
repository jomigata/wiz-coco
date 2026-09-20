'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  /** outer wrapper (e.g. flex-1) */
  className?: string;
};

const SCROLL_EDGE_THRESHOLD = 6;

function ScrollEdge({
  side,
  visible,
  onScroll,
}: {
  side: 'left' | 'right';
  visible: boolean;
  onScroll: () => void;
}) {
  if (!visible) return null;

  const isLeft = side === 'left';

  return (
    <button
      type="button"
      onClick={onScroll}
      aria-label={isLeft ? '왼쪽으로 더 보기' : '오른쪽으로 더 보기'}
      className={`pointer-events-auto absolute top-0 z-20 flex h-full w-11 items-center justify-center border-0 bg-transparent p-0 ${
        isLeft ? 'left-0' : 'right-0'
      }`}
    >
      <span
        className={`absolute inset-y-2 w-10 bg-gradient-to-r ${
          isLeft
            ? 'from-[#0b1120]/95 via-[#0b1120]/55 to-transparent left-0'
            : 'from-transparent via-[#0b1120]/55 to-[#0b1120]/95 right-0'
        }`}
        aria-hidden
      />
      <span
        className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/35 bg-sky-950/80 text-sky-200 shadow-lg shadow-black/40 ${
          isLeft ? 'counselor-scroll-hint-nudge-left' : 'counselor-scroll-hint-nudge-right'
        }`}
      >
        <svg
          className="h-4 w-4 shrink-0"
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
      </span>
    </button>
  );
}

/** 상담사 목록 테이블 — 가로 스크롤 시 좌·우 끝에 이동 가능 화살표 */
export default function CounselorListTableScroll({ children, className = '' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
    };
  }, [updateScrollHints, children]);

  const scrollByStep = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(200, Math.round(el.clientWidth * 0.55));
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  };

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
          onScroll={() => scrollByStep('left')}
        />
        <ScrollEdge side="right" visible={canScrollRight} onScroll={() => scrollByStep('right')} />
      </div>
    </div>
  );
}
