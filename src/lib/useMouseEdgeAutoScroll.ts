'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export const EDGE_SIZE_PX = 48;
const SCROLL_STEP_PX = 14;

export type EdgeScrollHintState = {
  available: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  active: { top: boolean; right: boolean; bottom: boolean; left: boolean };
};

export const EMPTY_EDGE_SCROLL_HINTS: EdgeScrollHintState = {
  available: { top: false, right: false, bottom: false, left: false },
  active: { top: false, right: false, bottom: false, left: false },
};

function readScrollAvailability(el: HTMLElement) {
  const maxX = Math.max(0, el.scrollWidth - el.clientWidth);
  const maxY = Math.max(0, el.scrollHeight - el.clientHeight);
  return {
    left: el.scrollLeft > 2,
    right: el.scrollLeft < maxX - 2,
    top: el.scrollTop > 2,
    bottom: el.scrollTop < maxY - 2,
  };
}

function deltaToActive(dx: number, dy: number) {
  return {
    left: dx < 0,
    right: dx > 0,
    top: dy < 0,
    bottom: dy > 0,
  };
}

function hintsEqual(a: EdgeScrollHintState, b: EdgeScrollHintState): boolean {
  return (
    a.available.top === b.available.top &&
    a.available.right === b.available.right &&
    a.available.bottom === b.available.bottom &&
    a.available.left === b.available.left &&
    a.active.top === b.active.top &&
    a.active.right === b.active.right &&
    a.active.bottom === b.active.bottom &&
    a.active.left === b.active.left
  );
}

function edgeScrollDelta(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; right: number; bottom: number },
): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  if (clientX - rect.left < EDGE_SIZE_PX) dx = -SCROLL_STEP_PX;
  else if (rect.right - clientX < EDGE_SIZE_PX) dx = SCROLL_STEP_PX;
  if (clientY - rect.top < EDGE_SIZE_PX) dy = -SCROLL_STEP_PX;
  else if (rect.bottom - clientY < EDGE_SIZE_PX) dy = SCROLL_STEP_PX;
  return { dx, dy };
}

export type MouseEdgeAutoScrollOptions = {
  /** true면 window.scrollBy 생략(고정 탭 패널 전용) */
  panelOnly?: boolean;
};

/** 뷰포트·지정 컨테이너 가장자리에서 마우스 이동 시 자동 스크롤 + 방향 힌트 */
export function useMouseEdgeAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
  /** 세로 엣지 스크롤 상한(탭 메뉴 하단). 패널 상단 엣지는 max(패널top, regionTop) */
  regionTopRef?: RefObject<HTMLElement | null>,
  options?: MouseEdgeAutoScrollOptions,
): EdgeScrollHintState {
  const panelOnly = options?.panelOnly ?? false;
  const runnersRef = useRef<Array<() => void>>([]);
  const rafRef = useRef(0);
  const [hints, setHints] = useState<EdgeScrollHintState>(EMPTY_EDGE_SCROLL_HINTS);
  const hintsRef = useRef(hints);

  useEffect(() => {
    if (!enabled) return;

    const stop = () => {
      runnersRef.current = [];
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    const publishHints = (next: EdgeScrollHintState) => {
      if (hintsEqual(hintsRef.current, next)) return;
      hintsRef.current = next;
      setHints(next);
    };

    const refreshAvailability = () => {
      const el = containerRef.current;
      if (!el) return;
      const available = readScrollAvailability(el);
      publishHints({ available, active: hintsRef.current.active });
    };

    const tick = () => {
      for (const run of runnersRef.current) run();
      if (runnersRef.current.length) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = 0;
    };

    const applyEdgeScroll = (e: MouseEvent) => {
      const runners: Array<() => void> = [];
      const regionTop = regionTopRef?.current?.getBoundingClientRect().bottom ?? 0;

      let nextActive = { top: false, right: false, bottom: false, left: false };
      let nextAvailable = hintsRef.current.available;

      const el = containerRef.current;
      if (el) {
        nextAvailable = readScrollAvailability(el);
        const rect = el.getBoundingClientRect();
        const inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (inside) {
          const scrollRegionTop = Math.max(rect.top, regionTop);
          const panelRect = {
            left: rect.left,
            top: scrollRegionTop,
            right: rect.right,
            bottom: rect.bottom,
          };
          const panelDelta = edgeScrollDelta(e.clientX, e.clientY, panelRect);
          if (panelDelta.dx || panelDelta.dy) {
            const { dx, dy } = panelDelta;
            runners.push(() => {
              el.scrollLeft += dx;
              el.scrollTop += dy;
            });
            nextActive = deltaToActive(panelDelta.dx, panelDelta.dy);
          }
        }
      }

      publishHints({ available: nextAvailable, active: nextActive });

      if (!panelOnly && e.clientY >= regionTop) {
        const viewport = {
          left: 0,
          top: regionTop,
          right: window.innerWidth,
          bottom: window.innerHeight,
        };
        const viewDelta = edgeScrollDelta(e.clientX, e.clientY, viewport);
        if (viewDelta.dx || viewDelta.dy) {
          const { dx, dy } = viewDelta;
          runners.push(() => window.scrollBy(dx, dy));
        }
      }

      runnersRef.current = runners;
      if (runners.length && !rafRef.current) rafRef.current = requestAnimationFrame(tick);
      if (!runners.length) stop();
    };

    const onDocMove = (e: MouseEvent) => applyEdgeScroll(e);

    const el = containerRef.current;
    const onLocalMove = (e: MouseEvent) => applyEdgeScroll(e);
    const onLocalLeave = () => {
      if (panelOnly) {
        stop();
        publishHints({ available: hintsRef.current.available, active: EMPTY_EDGE_SCROLL_HINTS.active });
      }
    };

    document.addEventListener('mousemove', onDocMove, { passive: true });
    if (el) {
      el.addEventListener('mousemove', onLocalMove, { passive: true });
      el.addEventListener('mouseleave', onLocalLeave);
      el.addEventListener('scroll', refreshAvailability, { passive: true });
      refreshAvailability();
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refreshAvailability) : null;
      ro?.observe(el);
      const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(refreshAvailability) : null;
      mo?.observe(el, { childList: true, subtree: true });

      return () => {
        document.removeEventListener('mousemove', onDocMove);
        el.removeEventListener('mousemove', onLocalMove);
        el.removeEventListener('mouseleave', onLocalLeave);
        el.removeEventListener('scroll', refreshAvailability);
        ro?.disconnect();
        mo?.disconnect();
        stop();
      };
    }

    return () => {
      document.removeEventListener('mousemove', onDocMove);
      stop();
    };
  }, [enabled, containerRef, regionTopRef, panelOnly]);

  return hints;
}
