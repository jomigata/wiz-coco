'use client';

import { useCallback, useEffect, useState } from 'react';

export const COUNSELOR_LIST_PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 30, 50, 100, 200] as const;

export type CounselorListPageSize = (typeof COUNSELOR_LIST_PAGE_SIZE_OPTIONS)[number];

const STORAGE_KEY = 'counselorListPageSize';

function isValidPageSize(value: number): value is CounselorListPageSize {
  return (COUNSELOR_LIST_PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

export function useCounselorListPageSize(defaultSize: CounselorListPageSize = 10) {
  const [pageSize, setPageSizeState] = useState<CounselorListPageSize>(defaultSize);

  useEffect(() => {
    try {
      const stored = parseInt(localStorage.getItem(STORAGE_KEY) || '', 10);
      if (isValidPageSize(stored)) {
        setPageSizeState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setPageSize = useCallback((size: CounselorListPageSize) => {
    setPageSizeState(size);
    try {
      localStorage.setItem(STORAGE_KEY, String(size));
    } catch {
      // ignore
    }
  }, []);

  return { pageSize, setPageSize, pageSizeOptions: COUNSELOR_LIST_PAGE_SIZE_OPTIONS };
}
