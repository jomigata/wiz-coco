'use client';

import React from 'react';

type Props = {
  count?: number | null;
  unit: '건' | '명';
};

/** 관리자 목록 — 플랫폼 전체 건수 (타이틀 우측) */
export default function AdminGlobalTotalBadge({ count, unit }: Props) {
  if (count == null || Number.isNaN(count)) return null;
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-white/15 bg-[#101f38]/90 px-2.5 py-1.5 text-xs text-slate-300 sm:text-sm">
      전체{' '}
      <span className="ml-1 font-semibold tabular-nums text-white">{count.toLocaleString('ko-KR')}</span>
      {unit}
    </span>
  );
}
