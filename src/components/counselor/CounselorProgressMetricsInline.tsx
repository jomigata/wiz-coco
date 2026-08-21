'use client';

import React from 'react';
import { counselorMetricValueClass } from '@/lib/counselorListTableStyles';

export type CounselorProgressMetricItem = {
  label: string;
  value: number;
};

type Props = {
  totalClients: number;
  items: CounselorProgressMetricItem[];
  className?: string;
  tone?: 'dark' | 'light';
};

/** (총내담자:3, 검사완료2) 형식 — 값이 총내담자보다 작으면 빨간색 */
export default function CounselorProgressMetricsInline({
  totalClients,
  items,
  className = '',
  tone = 'dark',
}: Props) {
  const light = tone === 'light';
  return (
    <span className={`tabular-nums ${className}`}>
      (
      <span className={light ? 'text-slate-500' : 'text-slate-400'}>총내담자:</span>
      <span className={`font-semibold ${light ? 'text-slate-700' : 'text-slate-200'}`}>{totalClients}</span>
      {items.map((item) => (
        <React.Fragment key={item.label}>
          , <span className={light ? 'text-slate-500' : 'text-slate-400'}>{item.label}</span>
          <span className={counselorMetricValueClass(item.value, totalClients, tone)}>{item.value}</span>
        </React.Fragment>
      ))}
      )
    </span>
  );
}
