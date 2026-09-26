'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import {
  computeExpandAwareTotalPagesMulti,
  measureFitCountWithExpand,
  sliceExpandAwarePageMulti,
  sliceExpandAwarePageStartIndex,
} from '@/lib/counselorListAutoPageSize';

import { COUNSELOR_LIST_PAGE_SIZE } from '@/hooks/useListPagination';

export type ExpandedByPage = Record<number, string>;

export function toggleExpandedByPage(
  prev: ExpandedByPage,
  page: number,
  portalId: string,
): ExpandedByPage {
  const next = { ...prev };
  for (const key of Object.keys(next)) {
    const p = Number(key);
    if (p > page) delete next[p];
  }
  if (next[page] === portalId) delete next[page];
  else next[page] = portalId;
  return next;
}

function nominalRowsOnPage(
  pageNum: number,
  pageSize: number,
  totalItems: number,
  fitCountByPage: ReadonlyMap<number, number>,
): number {
  const start = sliceExpandAwarePageStartIndex(pageNum, pageSize, totalItems, fitCountByPage);
  return Math.min(pageSize, Math.max(0, totalItems - start));
}

type Options<T> = {
  items: T[];
  pageSize?: number;
  expandedByPage: ExpandedByPage;
  scrollContainerRef: RefObject<HTMLElement | null>;
  getRowId: (item: T) => string;
  /** 목록 개수 「자동」일 때만 펼침 overflow 페이지 이동 */
  expandShiftEnabled?: boolean;
  scrollMountTick?: number;
};

export function useListPaginationWithExpand<T>({
  items,
  pageSize = COUNSELOR_LIST_PAGE_SIZE,
  expandedByPage,
  scrollContainerRef,
  getRowId,
  expandShiftEnabled = false,
  scrollMountTick = 0,
}: Options<T>) {
  const [page, setPage] = useState(1);
  const [fitCountByPage, setFitCountByPage] = useState<Map<number, number>>(() => new Map());
  const fitCountByPageRef = useRef(fitCountByPage);
  fitCountByPageRef.current = fitCountByPage;
  const lastExpandedOnPageRef = useRef<Map<number, string>>(new Map());

  const totalCount = items.length;
  const expandedIdOnView = expandedByPage[page] ?? null;

  useEffect(() => {
    setFitCountByPage((prev) => {
      const next = new Map(prev);
      for (const p of Array.from(next.keys())) {
        if (!expandedByPage[p]) next.delete(p);
      }
      return next;
    });
    for (const p of Array.from(lastExpandedOnPageRef.current.keys())) {
      if (!expandedByPage[p]) lastExpandedOnPageRef.current.delete(p);
    }
  }, [expandedByPage]);

  useLayoutEffect(() => {
    if (!expandShiftEnabled) return;
    for (const key of Object.keys(expandedByPage)) {
      const p = Number(key);
      const id = expandedByPage[p];
      if (lastExpandedOnPageRef.current.get(p) !== id) {
        lastExpandedOnPageRef.current.set(p, id);
        setFitCountByPage((prev) => {
          if (!prev.has(p)) return prev;
          const next = new Map(prev);
          next.delete(p);
          return next;
        });
      }
    }
  }, [expandShiftEnabled, expandedByPage]);

  const shiftFitMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const [p, fit] of Array.from(fitCountByPage.entries())) {
      const nominal = nominalRowsOnPage(p, pageSize, totalCount, fitCountByPage);
      if (fit < nominal) map.set(p, fit);
    }
    return map;
  }, [fitCountByPage, pageSize, totalCount]);

  const totalPages = useMemo(
    () => computeExpandAwareTotalPagesMulti(totalCount, pageSize, shiftFitMap),
    [totalCount, pageSize, shiftFitMap],
  );

  useEffect(() => {
    setPage(1);
    setFitCountByPage(new Map());
    lastExpandedOnPageRef.current.clear();
  }, [totalCount, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useLayoutEffect(() => {
    if (!expandShiftEnabled || !expandedIdOnView) {
      return;
    }

    const measurePage = page;
    const nominal = nominalRowsOnPage(
      measurePage,
      pageSize,
      totalCount,
      fitCountByPageRef.current,
    );

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      if (cancelled) return;
      const target = scrollContainerRef.current;
      if (!target) return;
      const raw = measureFitCountWithExpand(target, expandedIdOnView);
      const next = Math.min(raw, nominal);
      setFitCountByPage((prev) => {
        const cur = prev.get(measurePage);
        if (next >= nominal) {
          if (cur === undefined) return prev;
          const out = new Map(prev);
          out.delete(measurePage);
          return out;
        }
        if (cur === next) return prev;
        const out = new Map(prev);
        out.set(measurePage, next);
        return out;
      });
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
    expandedIdOnView,
    page,
    scrollContainerRef,
    scrollMountTick,
    pageSize,
    totalCount,
  ]);

  const { startIndex, paginatedItems } = useMemo(
    () => sliceExpandAwarePageMulti(items, page, pageSize, shiftFitMap),
    [items, page, pageSize, shiftFitMap],
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
    expandedIdOnPage: expandedIdOnView,
  };
}
