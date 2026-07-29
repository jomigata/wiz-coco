'use client';

import React from 'react';

type Props = {
  page: number;
  totalPages: number;
  currentCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  unit?: string;
};

export default function CounselorListPagination({
  page,
  totalPages,
  currentCount,
  totalCount,
  onPageChange,
  unit = '건',
}: Props) {
  if (totalCount === 0) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const showPages =
    totalPages <= 7
      ? pages
      : pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs text-slate-500 sm:text-sm">
      <span>
        {currentCount}
        {unit}/총{totalCount}
        {unit}
      </span>
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded border border-white/10 px-2 py-0.5 text-slate-300 hover:bg-white/5 disabled:opacity-40"
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
                  className={`min-w-[1.75rem] rounded border px-2 py-0.5 tabular-nums ${
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
            className="rounded border border-white/10 px-2 py-0.5 text-slate-300 hover:bg-white/5 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  );
}
