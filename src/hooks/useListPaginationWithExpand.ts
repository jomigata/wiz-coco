'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import {
  computeExpandAwareTotalPages,
  measureFitCountWithExpand,
  nominalRowsOnExpandAwarePage,
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
  /** 펼침을 연 페이지 (2페이지 이후 펼침·슬라이스 기준) */
  const [expandAnchorPage, setExpandAnchorPage] = useState<number | null>(null);
  const lastExpandedIdRef = useRef<string | null>(null);

  const totalCount = items.length;

  useLayoutEffect(() => {
    if (!expandShiftEnabled || !expandedId) {
      setExpandAnchorPage(null);
      lastExpandedIdRef.current = null;
      setFitCount(null);
      return;
    }
    if (lastExpandedIdRef.current !== expandedId) {
      lastExpandedIdRef.current = expandedId;
      setExpandAnchorPage(page);
      setFitCount(null);
    }
  }, [expandShiftEnabled, expandedId, page]);

  const nominalRowsOnExpandPage = useMemo(() => {
    if (expandAnchorPage == null) return pageSize;
    return nominalRowsOnExpandAwarePage(expandAnchorPage, pageSize, totalCount);
  }, [expandAnchorPage, pageSize, totalCount]);

  const expandShiftActive =
    expandShiftEnabled &&
    expandAnchorPage != null &&
    expandedId != null &&
    fitCount != null &&
    fitCount < nominalRowsOnExpandPage;

  const totalPages = useMemo(
    () =>
      computeExpandAwareTotalPages(
        totalCount,
        pageSize,
        expandShiftActive ? expandAnchorPage : null,
        expandShiftActive ? fitCount : null,
      ),
    [totalCount, pageSize, expandShiftActive, expandAnchorPage, fitCount],
  );

  useEffect(() => {
    setPage(1);
    setExpandAnchorPage(null);
    setFitCount(null);
    lastExpandedIdRef.current = null;
  }, [totalCount, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useLayoutEffect(() => {
    if (!expandShiftEnabled || !expandedId || expandAnchorPage == null) {
      return;
    }
    if (page !== expandAnchorPage) {
      return;
    }

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      if (cancelled) return;
      const target = scrollContainerRef.current;
      if (!target) return;
      const next = Math.min(
        measureFitCountWithExpand(target, expandedId),
        nominalRowsOnExpandPage,
      );
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
    expandAnchorPage,
    page,
    scrollContainerRef,
    scrollMountTick,
    nominalRowsOnExpandPage,
  ]);

  const { startIndex, paginatedItems } = useMemo(
    () =>
      sliceExpandAwarePage(
        items,
        page,
        pageSize,
        expandShiftActive ? expandAnchorPage : null,
        expandShiftActive ? fitCount : null,
      ),
    [items, page, pageSize, expandShiftActive, expandAnchorPage, fitCount],
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
