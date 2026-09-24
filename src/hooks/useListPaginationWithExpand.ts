'use client';

import { useEffect, useLayoutEffect, useMemo, useState, type RefObject } from 'react';

import {
  computeExpandAwareTotalPages,
  measureVisibleMainRowsInScroll,
  sliceExpandAwarePage,
} from '@/lib/counselorListAutoPageSize';

import { COUNSELOR_LIST_PAGE_SIZE } from '@/hooks/useListPagination';

type Options<T> = {
  items: T[];
  pageSize?: number;
  expandedId: string | null;
  scrollContainerRef: RefObject<HTMLElement | null>;
  getRowId: (item: T) => string;
};

export function useListPaginationWithExpand<T>({
  items,
  pageSize = COUNSELOR_LIST_PAGE_SIZE,
  expandedId,
  scrollContainerRef,
  getRowId,
}: Options<T>) {
  const [page, setPage] = useState(1);
  const [fitCount, setFitCount] = useState<number | null>(null);

  const totalCount = items.length;

  const expandPage = useMemo(() => {
    if (!expandedId) return null;
    const idx = items.findIndex((item) => getRowId(item) === expandedId);
    if (idx < 0) return null;
    return Math.floor(idx / pageSize) + 1;
  }, [items, expandedId, pageSize, getRowId]);

  const expandShiftActive =
    expandPage != null && fitCount != null && fitCount < pageSize;

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
    if (!expandedId || expandPage == null) {
      setFitCount(null);
      return;
    }
    if (page !== expandPage) return;

    const el = scrollContainerRef.current;
    if (!el) return;

    const measure = () => {
      const next = measureVisibleMainRowsInScroll(el, expandedId);
      setFitCount((prev) => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    const tbody = el.querySelector('tbody');
    if (tbody) ro.observe(tbody);

    return () => ro.disconnect();
  }, [expandedId, expandPage, page, scrollContainerRef, items, pageSize]);

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
