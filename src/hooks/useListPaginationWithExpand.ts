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
  /** 스크롤 컨테이너 mount 시 재측정 */
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

  const expandShiftActive =
    expandShiftEnabled &&
    expandPage != null &&
    page === expandPage &&
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
    if (page !== expandPage) {
      setFitCount(null);
      return;
    }

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const target = scrollContainerRef.current;
      if (!target) return;
      const next = measureFitCountWithExpand(target, expandedId);
      setFitCount((prev) => (prev === next ? prev : next));
    };

    measure();

    const el = scrollContainerRef.current;
    if (!el) {
      const retry = requestAnimationFrame(measure);
      return () => {
        cancelled = true;
        cancelAnimationFrame(retry);
      };
    }

    const raf1 = requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(measure);
    });

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    const tbody = el.querySelector('tbody');
    if (tbody) {
      ro.observe(tbody);
      const mo = new MutationObserver(() => measure());
      mo.observe(tbody, { childList: true, subtree: true, attributes: true });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf1);
        ro.disconnect();
        mo.disconnect();
      };
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      ro.disconnect();
    };
  }, [
    expandShiftEnabled,
    expandedId,
    expandPage,
    page,
    scrollContainerRef,
    items,
    pageSize,
    scrollMountTick,
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
