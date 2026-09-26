'use client';

import { useLayoutEffect, type RefObject } from 'react';

import {
  resolveCounselorListExpandRow,
  resolveCounselorListMainRow,
  scrollCounselorListExpandIntoView,
} from '@/lib/counselorListExpandScroll';

/** 목록 행 펼침 후 세부가 viewport에 보이도록 스크롤 (비동기 로딩·높이 변화 포함) */
export function useCounselorListExpandScroll(
  scrollContainerRef: RefObject<HTMLElement | null>,
  expandedPortalId: string | null,
  enabled = true,
) {
  useLayoutEffect(() => {
    if (!enabled || !expandedPortalId) return;

    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let mo: MutationObserver | null = null;

    const apply = () => {
      if (cancelled) return;
      const mainRow = resolveCounselorListMainRow(scrollEl, expandedPortalId);
      if (!mainRow) return;
      const expandRow = resolveCounselorListExpandRow(mainRow);
      scrollCounselorListExpandIntoView(scrollEl, mainRow, expandRow);

      if (expandRow) {
        if (!ro) {
          ro = new ResizeObserver(() => apply());
          ro.observe(expandRow);
        }
        if (!mo) {
          mo = new MutationObserver(() => apply());
          mo.observe(expandRow, { childList: true, subtree: true, attributes: true });
        }
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(apply);
    });

    return () => {
      cancelled = true;
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [enabled, expandedPortalId, scrollContainerRef]);
}
