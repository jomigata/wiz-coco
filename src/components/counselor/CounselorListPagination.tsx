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
    <div className="mt-2 grid shrink-0 grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
      <span className="text-sm text-slate-500 sm:justify-self-start">
        {currentCount}
        {unit}/총{totalCount}
        {unit}
      </span>
      {totalPages > 1 ? (
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
      ) : (
        <span className="hidden sm:block sm:col-start-2" aria-hidden="true" />
      )}
      <span className="hidden sm:block" aria-hidden="true" />
    </div>
  );
}
