'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  COUNSELOR_LIST_PAGE_SIZE_AUTO,
  isCounselorListPageSizeAuto,
  measureCounselorListAutoPageSize,
} from '@/lib/counselorListAutoPageSize';

export const COUNSELOR_LIST_PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 30, 50, 100, 200] as const;

export type CounselorListPageSize = (typeof COUNSELOR_LIST_PAGE_SIZE_OPTIONS)[number];

export type CounselorListPageSizeSetting =
  | typeof COUNSELOR_LIST_PAGE_SIZE_AUTO
  | CounselorListPageSize;

const STORAGE_KEY = 'counselorListPageSize';

function isValidPageSize(value: number): value is CounselorListPageSize {
  return (COUNSELOR_LIST_PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

function readStoredSetting(fallback: CounselorListPageSizeSetting): CounselorListPageSizeSetting {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw != null && isCounselorListPageSizeAuto(raw)) return COUNSELOR_LIST_PAGE_SIZE_AUTO;
    const stored = parseInt(raw || '', 10);
    if (isValidPageSize(stored)) return stored;
  } catch {
    // ignore
  }
  return fallback;
}

export function useCounselorListPageSize(
  defaultSetting: CounselorListPageSizeSetting = COUNSELOR_LIST_PAGE_SIZE_AUTO,
) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollMountTick, setScrollMountTick] = useState(0);
  const [pageSizeSetting, setPageSizeSettingState] =
    useState<CounselorListPageSizeSetting>(defaultSetting);
  const [autoPageSize, setAutoPageSize] = useState(10);

  const listScrollRef = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    if (node) setScrollMountTick((x) => x + 1);
  }, []);

  useEffect(() => {
    setPageSizeSettingState(readStoredSetting(defaultSetting));
  }, [defaultSetting]);

  const remeasureAuto = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const next = measureCounselorListAutoPageSize(el);
    setAutoPageSize((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    if (pageSizeSetting !== COUNSELOR_LIST_PAGE_SIZE_AUTO) return;
    remeasureAuto();
    const el = scrollContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => remeasureAuto());
    ro.observe(el);
    const table = el.querySelector('table');
    if (table) ro.observe(table);
    const tbody = el.querySelector('tbody');
    if (tbody) ro.observe(tbody);

    window.addEventListener('resize', remeasureAuto);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', remeasureAuto);
    };
  }, [pageSizeSetting, scrollMountTick, remeasureAuto]);

  useEffect(() => {
    if (pageSizeSetting !== COUNSELOR_LIST_PAGE_SIZE_AUTO) return;
    const id = requestAnimationFrame(() => remeasureAuto());
    return () => cancelAnimationFrame(id);
  }, [autoPageSize, pageSizeSetting, remeasureAuto]);

  const setPageSizeSetting = useCallback((size: CounselorListPageSizeSetting) => {
    setPageSizeSettingState(size);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        size === COUNSELOR_LIST_PAGE_SIZE_AUTO ? COUNSELOR_LIST_PAGE_SIZE_AUTO : String(size),
      );
    } catch {
      // ignore
    }
  }, []);

  const effectivePageSize =
    pageSizeSetting === COUNSELOR_LIST_PAGE_SIZE_AUTO ? autoPageSize : pageSizeSetting;

  return {
    listScrollRef,
    scrollContainerRef,
    pageSizeSetting,
    setPageSizeSetting,
    effectivePageSize,
    pageSizeOptions: COUNSELOR_LIST_PAGE_SIZE_OPTIONS,
  };
}
