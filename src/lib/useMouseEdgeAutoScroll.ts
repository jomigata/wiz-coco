'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

const EDGE_SIZE_PX = 48;
const SCROLL_STEP_PX = 14;

export type EdgeScrollHintSide = 'top' | 'right' | 'bottom' | 'left';

export type EdgeScrollHintState = {
  available: Record<EdgeScrollHintSide, boolean>;
  active: Record<EdgeScrollHintSide, boolean>;
};

const EMPTY_EDGE_SCROLL_HINTS: EdgeScrollHintState = {
  available: { top: false, right: false, bottom: false, left: false },
  active: { top: false, right: false, bottom: false, left: false },
};

function scrollEdgeAvailability(el: HTMLElement, tolerancePx = 3): Record<EdgeScrollHintSide, boolean> {
  return {
    top: el.scrollTop > tolerancePx,
    bottom: el.scrollTop + el.clientHeight < el.scrollHeight - tolerancePx,
    left: el.scrollLeft > tolerancePx,
    right: el.scrollLeft + el.clientWidth < el.scrollWidth - tolerancePx,
  };
}

/** 스크롤 가능 방향 + 마우스가 가장자리에 있을 때 활성 방향 (화살표 힌트용) */
export function useScrollEdgeHints(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
  /** 세로 엣지 상한(탭 바 하단). 패널 전용일 때 전달 */
  regionTopRef?: RefObject<HTMLElement | null>,
) {
  const [hints, setHints] = useState<EdgeScrollHintState>(EMPTY_EDGE_SCROLL_HINTS);

  useEffect(() => {
    if (!enabled) {
      setHints(EMPTY_EDGE_SCROLL_HINTS);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const refreshAvailable = () => {
      const available = scrollEdgeAvailability(el);
      setHints((prev) => ({
        available,
        active: {
          top: prev.active.top && available.top,
          bottom: prev.active.bottom && available.bottom,
          left: prev.active.left && available.left,
          right: prev.active.right && available.right,
        },
      }));
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) {
        setHints((prev) => ({ ...prev, active: EMPTY_EDGE_SCROLL_HINTS.active }));
        return;
      }

      const regionTop = regionTopRef?.current?.getBoundingClientRect().bottom ?? rect.top;
      const scrollRegionTop = Math.max(rect.top, regionTop);
      const panelRect = {
        left: rect.left,
        top: scrollRegionTop,
        right: rect.right,
        bottom: rect.bottom,
      };
      const { dx, dy } = edgeScrollDelta(e.clientX, e.clientY, panelRect);
      const available = scrollEdgeAvailability(el);

      setHints({
        available,
        active: {
          top: dy < 0 && available.top,
          bottom: dy > 0 && available.bottom,
          left: dx < 0 && available.left,
          right: dx > 0 && available.right,
        },
      });
    };

    const onLeave = () => {
      setHints((prev) => ({ ...prev, active: EMPTY_EDGE_SCROLL_HINTS.active }));
    };

    refreshAvailable();
    el.addEventListener('scroll', refreshAvailable, { passive: true });
    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', refreshAvailable);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refreshAvailable) : null;
    ro?.observe(el);
    Array.from(el.children).forEach((child) => {
      if (child instanceof HTMLElement) ro?.observe(child);
    });

    return () => {
      el.removeEventListener('scroll', refreshAvailable);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', refreshAvailable);
      ro?.disconnect();
    };
  }, [enabled, containerRef, regionTopRef]);

  return hints;
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
  /** 가로 스크롤만 (탭 메뉴 등) */
  horizontalOnly?: boolean;
  /** 세로 스크롤만 */
  verticalOnly?: boolean;
};

/** 뷰포트·지정 컨테이너 가장자리에서 마우스 이동 시 자동 스크롤 */
export function useMouseEdgeAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
  /** 세로 엣지 스크롤 상한(탭 메뉴 하단). 패널 상단 엣지는 max(패널top, regionTop) */
  regionTopRef?: RefObject<HTMLElement | null>,
  options?: MouseEdgeAutoScrollOptions,
) {
  const panelOnly = options?.panelOnly ?? false;
  const horizontalOnly = options?.horizontalOnly ?? false;
  const verticalOnly = options?.verticalOnly ?? false;
  const runnersRef = useRef<Array<() => void>>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const stop = () => {
      runnersRef.current = [];
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    const tick = () => {
      for (const run of runnersRef.current) run();
      if (runnersRef.current.length) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = 0;
    };

    const applyEdgeScroll = (e: MouseEvent) => {
      const runners: Array<() => void> = [];
      const regionTop = regionTopRef?.current?.getBoundingClientRect().bottom ?? 0;

      const el = containerRef.current;
      if (el) {
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
          let panelDelta = edgeScrollDelta(e.clientX, e.clientY, panelRect);
          if (horizontalOnly) panelDelta = { ...panelDelta, dy: 0 };
          if (verticalOnly) panelDelta = { ...panelDelta, dx: 0 };
          if (panelDelta.dx || panelDelta.dy) {
            const { dx, dy } = panelDelta;
            runners.push(() => {
              el.scrollLeft += dx;
              el.scrollTop += dy;
            });
          }
        }
      }

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
      if (panelOnly) stop();
    };

    document.addEventListener('mousemove', onDocMove, { passive: true });
    if (el) {
      el.addEventListener('mousemove', onLocalMove, { passive: true });
      el.addEventListener('mouseleave', onLocalLeave);
    }

    return () => {
      document.removeEventListener('mousemove', onDocMove);
      if (el) {
        el.removeEventListener('mousemove', onLocalMove);
        el.removeEventListener('mouseleave', onLocalLeave);
      }
      stop();
    };
  }, [enabled, containerRef, regionTopRef, panelOnly, horizontalOnly, verticalOnly]);
}
