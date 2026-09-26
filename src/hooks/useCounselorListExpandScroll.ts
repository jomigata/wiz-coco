'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';

import { isLastCounselorListMainRow } from '@/lib/counselorListAutoPageSize';
import {
  resetCounselorListScrollTop,
  resolveCounselorListExpandRow,
  resolveCounselorListMainRow,
  scrollCounselorListExpandIntoView,
} from '@/lib/counselorListExpandScroll';

type ExpandScrollOptions = {
  /** 페이지당 「자동」일 때만 마지막 행 펼침 스크롤 적용 */
  autoPageSize?: boolean;
  page?: number;
};

/** 목록 행 펼침 후 세부가 viewport에 보이도록 스크롤 (비동기 로딩·높이 변화 포함) */
export function useCounselorListExpandScroll(
  scrollContainerRef: RefObject<HTMLElement | null>,
  expandedPortalId: string | null,
  enabled = true,
  options: ExpandScrollOptions = {},
) {
  const { autoPageSize = false, page = 1 } = options;
  const prevExpandedRef = useRef<string | null>(null);
  const prevPageRef = useRef(page);

  useLayoutEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!enabled) return;

    if (prevPageRef.current !== page) {
      prevPageRef.current = page;
      prevExpandedRef.current = null;
      if (scrollEl && autoPageSize) {
        resetCounselorListScrollTop(scrollEl);
      }
    }

    if (!expandedPortalId) {
      if (scrollEl && autoPageSize) {
        resetCounselorListScrollTop(scrollEl);
      }
      prevExpandedRef.current = null;
      return;
    }

    if (!scrollEl) return;

    const prevExpanded = prevExpandedRef.current;
    if (autoPageSize && prevExpanded != null && prevExpanded !== expandedPortalId) {
      resetCounselorListScrollTop(scrollEl);
    }
    prevExpandedRef.current = expandedPortalId;

    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let mo: MutationObserver | null = null;

    const apply = () => {
      if (cancelled) return;
      const mainRow = resolveCounselorListMainRow(scrollEl, expandedPortalId);
      if (!mainRow) return;

      const useExpandScroll = !autoPageSize || isLastCounselorListMainRow(scrollEl, mainRow);
      if (!useExpandScroll) {
        ro?.disconnect();
        mo?.disconnect();
        ro = null;
        mo = null;
        return;
      }

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
  }, [enabled, expandedPortalId, scrollContainerRef, autoPageSize, page]);
}
