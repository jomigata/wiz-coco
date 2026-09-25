'use client';

import { useEffect, useLayoutEffect, useMemo, useState, type RefObject } from 'react';

import {
  computeExpandAwareTotalPages,
  measureFitCountWithExpand,
  sliceExpandAwarePage,
} from '@/lib/counselorListAutoPageSize';

import { COUNSELOR_LIST_PAGE_SIZE } from '@/hooks/useListPagination';

type Options<T> = {
  items: T[];
  pageSize?: number;
  expandedId: string | null;
  scrollContainerRef: RefObject<HTMLElement | null>;
  getRowId: (item: T) => string;
  /** 목록 개수 「자동」일 때만 펼침 overflow 페이지 이동 */
  expandShiftEnabled?: boolean;
  scrollMountTick?: number;
};

export function useListPaginationWithExpand<T>({
  items,
  pageSize = COUNSELOR_LIST_PAGE_SIZE,
  expandedId,
  scrollContainerRef,
  getRowId,
  expandShiftEnabled = false,
  scrollMountTick = 0,
}: Options<T>) {
  const [page, setPage] = useState(1);
  const [fitCount, setFitCount] = useState<number | null>(null);

  const totalCount = items.length;

  const expandPage = useMemo(() => {
    if (!expandShiftEnabled || !expandedId) return null;
    const idx = items.findIndex((item) => getRowId(item) === expandedId);
    if (idx < 0) return null;
    return Math.floor(idx / pageSize) + 1;
  }, [items, expandedId, pageSize, getRowId, expandShiftEnabled]);

  const nominalRowsOnExpandPage = useMemo(() => {
    if (expandPage == null) return pageSize;
    return Math.min(pageSize, Math.max(0, totalCount - (expandPage - 1) * pageSize));
  }, [expandPage, pageSize, totalCount]);

  /** 실제로 잘리는 경우에만 fitCount < pageSize → 2페이지 경계 보정 (펼침 페이지와 무관하게 유지) */
  const expandShiftActive =
    expandShiftEnabled &&
    expandPage != null &&
    expandedId != null &&
    fitCount != null &&
    fitCount < nominalRowsOnExpandPage;

  const totalPages = useMemo(
    () =>
      computeExpandAwareTotalPages(
        totalCount,
        pageSize,
        expandShiftActive ? expandPage : null,
        expandShiftActive ? fitCount : null,
      ),
    [totalCount, pageSize, expandShiftActive, expandPage, fitCount],
  );

  useEffect(() => {
    setPage(1);
  }, [totalCount, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useLayoutEffect(() => {
    if (!expandShiftEnabled || !expandedId || expandPage == null) {
      setFitCount(null);
      return;
    }

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      if (cancelled) return;
      const target = scrollContainerRef.current;
      if (!target) return;
      const next = measureFitCountWithExpand(target, expandedId);
      setFitCount((prev) => (prev === next ? prev : next));
    };

    const scheduleMeasure = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(measure, 16);
    };

    measure();
    const raf = requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(measure);
    });

    const el = scrollContainerRef.current;
    if (!el) {
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        if (debounceTimer) clearTimeout(debounceTimer);
      };
    }

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(el);
    const tbody = el.querySelector('tbody');
    if (tbody) {
      ro.observe(tbody);
      const mo = new MutationObserver(() => measure());
      mo.observe(tbody, { childList: true, subtree: true, attributes: true });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        if (debounceTimer) clearTimeout(debounceTimer);
        ro.disconnect();
        mo.disconnect();
      };
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (debounceTimer) clearTimeout(debounceTimer);
      ro.disconnect();
    };
  }, [
    expandShiftEnabled,
    expandedId,
    expandPage,
    scrollContainerRef,
    items,
    scrollMountTick,
    pageSize,
    nominalRowsOnExpandPage,
  ]);

  const { startIndex, paginatedItems } = useMemo(
    () =>
      sliceExpandAwarePage(
        items,
        page,
        pageSize,
        expandShiftActive ? expandPage : null,
        expandShiftActive ? fitCount : null,
      ),
    [items, page, pageSize, expandShiftActive, expandPage, fitCount],
  );

  return {
    page,
    setPage,
    totalPages,
    totalCount,
    pageSize,
    startIndex,
    paginatedItems,
    currentCount: paginatedItems.length,
  };
}
