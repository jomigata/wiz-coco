'use client';

import React from 'react';

export type SortOrder = 'asc' | 'desc';

interface Props {
  label: string;
  sortKey: string;
  activeKey: string;
  order: SortOrder;
  onSort: (key: string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export default function SortableTableHeader({
  label,
  sortKey,
  activeKey,
  order,
  onSort,
  className = '',
  align = 'left',
}: Props) {
  const active = activeKey === sortKey;
  const alignCls =
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <th scope="col" className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex w-full items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 ${alignCls}`}
      >
        <span>{label}</span>
        <span className={`text-[10px] leading-none ${active ? 'text-sky-300' : 'text-slate-600'}`}>
          {active ? (order === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}
