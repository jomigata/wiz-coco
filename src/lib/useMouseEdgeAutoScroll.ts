'use client';

import { useEffect, useRef, type RefObject } from 'react';

const EDGE_SIZE_PX = 48;
const SCROLL_STEP_PX = 14;

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

/** 뷰포트·지정 컨테이너 가장자리에서 마우스 이동 시 자동 스크롤 */
export function useMouseEdgeAutoScroll(containerRef: RefObject<HTMLElement | null>, enabled = true) {
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

    const onMove = (e: MouseEvent) => {
      const runners: Array<() => void> = [];

      const viewport = {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
      };
      const viewDelta = edgeScrollDelta(e.clientX, e.clientY, viewport);
      if (viewDelta.dx || viewDelta.dy) {
        const { dx, dy } = viewDelta;
        runners.push(() => window.scrollBy(dx, dy));
      }

      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (inside) {
          const panelDelta = edgeScrollDelta(e.clientX, e.clientY, rect);
          if (panelDelta.dx || panelDelta.dy) {
            const { dx, dy } = panelDelta;
            runners.push(() => {
              el.scrollLeft += dx;
              el.scrollTop += dy;
            });
          }
        }
      }

      runnersRef.current = runners;
      if (runners.length && !rafRef.current) rafRef.current = requestAnimationFrame(tick);
      if (!runners.length) stop();
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      stop();
    };
  }, [enabled, containerRef]);
}
