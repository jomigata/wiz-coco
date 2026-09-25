'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';

import {
  computeExpandAwareTotalPages,
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
  /** 스크롤 컨테이너 mount 시 (expandPage 재계산용) */
  scrollMountTick?: number;
};

export function useListPaginationWithExpand<T>({
  items,
  pageSize = COUNSELOR_LIST_PAGE_SIZE,
  expandedId,
  scrollContainerRef: _scrollContainerRef,
  getRowId,
  expandShiftEnabled = false,
  scrollMountTick: _scrollMountTick = 0,
}: Options<T>) {
  const [page, setPage] = useState(1);

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

  /** 펼침 중 고정: 펼친 행까지 1페이지 분량, 그 다음 항목부터 2페이지 (현재 보는 page와 무관) */
  const expandPageFitCount = expandIndexOnPage != null ? expandIndexOnPage + 1 : null;

  const expandShiftActive =
    expandShiftEnabled &&
    expandPage != null &&
    expandedId != null &&
    expandPageFitCount != null &&
    expandPageFitCount < nominalRowsOnExpandPage;

  const totalPages = useMemo(
    () =>
      computeExpandAwareTotalPages(
        totalCount,
        pageSize,
        expandShiftActive ? expandPage : null,
        expandShiftActive ? expandPageFitCount : null,
      ),
    [totalCount, pageSize, expandShiftActive, expandPage, expandPageFitCount],
  );

  useEffect(() => {
    setPage(1);
  }, [totalCount, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const { startIndex, paginatedItems } = useMemo(
    () =>
      sliceExpandAwarePage(
        items,
        page,
        pageSize,
        expandShiftActive ? expandPage : null,
        expandShiftActive ? expandPageFitCount : null,
      ),
    [items, page, pageSize, expandShiftActive, expandPage, expandPageFitCount],
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
