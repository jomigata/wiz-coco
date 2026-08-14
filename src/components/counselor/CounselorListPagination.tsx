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

  return (
    <div className="mt-2 grid shrink-0 grid-cols-1 items-center gap-2 border-t border-white/5 pt-2 sm:grid-cols-[1fr_auto_1fr]">
      <div className="flex flex-wrap items-center gap-2 sm:justify-self-start">
        <span className="text-sm text-slate-500">
          {currentCount}
          {unit}/총{totalCount}
          {unit}
        </span>
        {pageSize != null && onPageSizeChange ? (
          <label className="inline-flex items-center gap-1.5 text-sm text-slate-400">
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
      <div className="flex flex-wrap items-center justify-center gap-1 sm:col-start-2">
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
      <div className="hidden items-center justify-end gap-2 sm:flex sm:justify-self-end">
        {footerAction}
        <span className="text-right text-xs text-slate-600">
          {page}/{totalPages}페이지
        </span>
      </div>
    </div>
  );
}
