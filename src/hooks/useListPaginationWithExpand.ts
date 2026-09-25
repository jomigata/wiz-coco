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

  const expandIndexOnPage = useMemo(() => {
    if (!expandShiftEnabled || !expandedId || expandPage == null) return null;
    const idx = items.findIndex((item) => getRowId(item) === expandedId);
    if (idx < 0) return null;
    return idx - (expandPage - 1) * pageSize;
  }, [expandShiftEnabled, expandedId, expandPage, items, pageSize, getRowId]);

  /** 펼침 직후 DOM 측정 전에도 펼친 행 아래는 현재 페이지에서 제외 (7·8번 → 2페이지) */
  const expandMinFit =
    expandIndexOnPage != null && page === expandPage ? expandIndexOnPage + 1 : null;

  const effectiveFitCount =
    expandShiftEnabled && expandedId && expandPage != null && page === expandPage
      ? (fitCount ?? expandMinFit)
      : fitCount;

  const expandShiftActive =
    expandShiftEnabled &&
    expandPage != null &&
    page === expandPage &&
    expandedId != null &&
    effectiveFitCount != null &&
    effectiveFitCount < nominalRowsOnExpandPage;

  const totalPages = useMemo(
    () =>
      computeExpandAwareTotalPages(
        totalCount,
        pageSize,
        expandShiftActive ? expandPage : null,
        expandShiftActive ? effectiveFitCount : null,
      ),
    [totalCount, pageSize, expandShiftActive, expandPage, effectiveFitCount],
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
      const measured = measureFitCountWithExpand(target, expandedId);
      let next = measured;
      if (expandMinFit != null) {
        next = Math.max(expandMinFit, measured);
        if (target.scrollHeight > target.clientHeight + 1 && next > expandMinFit) {
          next = expandMinFit;
        }
        next = Math.min(next, nominalRowsOnExpandPage);
      }
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
    expandMinFit,
    nominalRowsOnExpandPage,
  ]);

  const { startIndex, paginatedItems } = useMemo(
    () =>
      sliceExpandAwarePage(
        items,
        page,
        pageSize,
        expandShiftActive ? expandPage : null,
        expandShiftActive ? effectiveFitCount : null,
      ),
    [items, page, pageSize, expandShiftActive, expandPage, effectiveFitCount],
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
