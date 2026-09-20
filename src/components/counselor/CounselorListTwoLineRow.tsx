'use client';

import React from 'react';

type CounselorListSecondaryRowProps = {
  colSpan: number;
  children: React.ReactNode;
  className?: string;
};

/** 목록 2번째 줄 — 가로 스크롤 대신 메타·액션을 아래 줄에 배치 */
export function CounselorListSecondaryRow({
  colSpan,
  children,
  className = '',
}: CounselorListSecondaryRowProps) {
  return (
    <tr className={`border-b border-white/10 bg-white/[0.02] ${className}`}>
      <td colSpan={colSpan} className="px-4 py-2 align-middle text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">{children}</div>
      </td>
    </tr>
  );
}

type FieldProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function CounselorListSecondaryField({ label, children, className = '' }: FieldProps) {
  return (
    <span className={`inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 ${className}`}>
      <span className="shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <span className="min-w-0 text-slate-200">{children}</span>
    </span>
  );
}

export const counselorListRowSpanCellClass = 'align-top';
