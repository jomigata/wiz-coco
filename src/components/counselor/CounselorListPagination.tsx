'use client';

import React from 'react';
import {
  COUNSELOR_LIST_PAGE_SIZE_OPTIONS,
  type CounselorListPageSize,
  type CounselorListPageSizeSetting,
} from '@/hooks/useCounselorListPageSize';
import { COUNSELOR_LIST_PAGE_SIZE_AUTO } from '@/lib/counselorListAutoPageSize';

type Props = {
  page: number;
  totalPages: number;
  currentCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  unit?: string;
  pageSizeSetting?: CounselorListPageSizeSetting;
  onPageSizeChange?: (size: CounselorListPageSizeSetting) => void;
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
  pageSizeSetting,
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
              onMouseEnter={() => {
                if (p !== page) onPageChange(p);
              }}
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

  const actionWrapClass =
    'flex w-full min-w-0 flex-row flex-wrap items-center justify-end gap-x-2 gap-y-1.5 [&_button]:shrink-0 sm:w-max sm:max-w-none';

  return (
    <div className="relative z-10 mt-2 shrink-0 border-t border-white/10 bg-[#0f1d33] pt-3 pb-2">
      {/*
        sm+: auto | 1fr | auto — 가운데 1fr 안에서 페이지 중앙 (= 좌측 끝 ~ 우측 시작 사이)
        좁은 화면: 건수 → 페이지 → 버튼(가로 줄바꿈, 세로 1열 스택 방지)
      */}
      <div className="grid w-full grid-cols-1 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:gap-x-2 sm:gap-y-1">
        <div className="flex min-w-0 flex-nowrap items-center gap-2 justify-self-start sm:col-start-1 sm:row-start-1">
          <span className="whitespace-nowrap text-sm text-slate-500">
            {currentCount}
            {unit}/총{totalCount}
            {unit}
          </span>
          {pageSizeSetting != null && onPageSizeChange ? (
            <label className="inline-flex shrink-0 items-center gap-1.5 text-sm text-slate-400">
              <span className="sr-only">페이지당 표시</span>
              <select
                value={pageSizeSetting}
                onChange={(e) => {
                  const raw = e.target.value;
                  onPageSizeChange(
                    raw === COUNSELOR_LIST_PAGE_SIZE_AUTO
                      ? COUNSELOR_LIST_PAGE_SIZE_AUTO
                      : (Number(raw) as CounselorListPageSize),
                  );
                }}
                className="rounded border border-white/10 bg-[#101f38]/90 px-1.5 py-0.5 text-sm text-slate-200"
                aria-label="페이지당 표시 개수"
              >
                <option value={COUNSELOR_LIST_PAGE_SIZE_AUTO}>자동</option>
                {COUNSELOR_LIST_PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}개씩
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="flex min-w-0 justify-center sm:col-start-2 sm:row-start-1 sm:px-1">
          {paginationControls}
        </div>

        {footerAction ? (
          <div className="min-w-0 justify-self-stretch sm:col-start-3 sm:row-start-1 sm:justify-self-end">
            <div className={actionWrapClass}>{footerAction}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
