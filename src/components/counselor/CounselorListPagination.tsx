'use client';

import React from 'react';
import {
  COUNSELOR_LIST_PAGE_SIZE_OPTIONS,
  type CounselorListPageSize,
} from '@/hooks/useCounselorListPageSize';

type Props = {
  page: number;
  totalPages: number;
  currentCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  unit?: string;
  pageSize?: CounselorListPageSize;
  onPageSizeChange?: (size: CounselorListPageSize) => void;
  /** 페이지네이션 우측 끝 (삭제된 목록 등) */
  footerAction?: React.ReactNode;
};

export default function CounselorListPagination({
  page,
  totalPages,
  currentCount,
  totalCount,
  onPageChange,
  unit = '건',
  pageSize,
  onPageSizeChange,
  footerAction,
}: Props) {
  if (totalCount === 0) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const showPages =
    totalPages <= 7
      ? pages
      : pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  const paginationControls = (
    <div className="flex shrink-0 flex-nowrap items-center justify-center gap-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded border border-white/10 px-2 py-0.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
      >
        이전
      </button>
      {showPages.map((p, idx) => {
        const prev = showPages[idx - 1];
        const gap = prev != null && p - prev > 1;
        return (
          <React.Fragment key={p}>
            {gap ? <span className="px-1 text-slate-600">…</span> : null}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[1.75rem] rounded border px-2 py-0.5 text-sm tabular-nums ${
                p === page
                  ? 'border-sky-500/50 bg-sky-600/30 text-sky-200'
                  : 'border-white/10 text-slate-300 hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded border border-white/10 px-2 py-0.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
      >
        다음
      </button>
    </div>
  );

  return (
    <div className="mt-2 shrink-0 border-t border-white/5 pt-2 pb-1">
      {/*
        sm+: auto | 1fr | auto — 가운데 1fr 안에서 페이지를 중앙 정렬
        (= 좌측 블록 끝 ~ 우측 블록 시작 사이의 중앙)
      */}
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-y-0">
        <div className="col-start-1 row-start-1 flex min-w-0 flex-nowrap items-center gap-2 justify-self-start">
          <span className="whitespace-nowrap text-sm text-slate-500">
            {currentCount}
            {unit}/총{totalCount}
            {unit}
          </span>
          {pageSize != null && onPageSizeChange ? (
            <label className="inline-flex shrink-0 items-center gap-1.5 text-sm text-slate-400">
              <span className="sr-only">페이지당 표시</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value) as CounselorListPageSize)}
                className="rounded border border-white/10 bg-[#101f38]/90 px-1.5 py-0.5 text-sm text-slate-200"
                aria-label="페이지당 표시 개수"
              >
                {COUNSELOR_LIST_PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}개씩
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="col-start-2 row-start-1 flex min-w-0 max-w-full justify-self-end sm:col-start-3 sm:max-w-[min(100%,50%)] sm:justify-self-end">
          {footerAction ? (
            <div className="flex max-w-full flex-nowrap items-center justify-end gap-1.5 overflow-x-auto sm:gap-2">
              {footerAction}
            </div>
          ) : null}
        </div>

        <div className="col-span-2 row-start-2 flex min-w-0 justify-center sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:px-1">
          {paginationControls}
        </div>
      </div>
    </div>
  );
}
