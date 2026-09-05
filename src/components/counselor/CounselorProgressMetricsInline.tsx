'use client';

import React from 'react';
import { counselorMetricValueClass } from '@/lib/counselorListTableStyles';

export type CounselorProgressMetricItem = {
  label: string;
  value: number;
  /** success: 완료·검사완료 — danger: 미완료(양수일 때 적색) */
  tone?: 'default' | 'success' | 'danger';
};

type Props = {
  totalClients: number;
  items: CounselorProgressMetricItem[];
  className?: string;
  /** false면 총내담자(최초 발송 수) 표시 생략 */
  showTotalClients?: boolean;
};

function metricValueClass(item: CounselorProgressMetricItem, totalClients: number): string {
  if (item.tone === 'success') {
    return item.value > 0
      ? 'font-semibold tabular-nums text-emerald-300'
      : 'font-semibold tabular-nums text-slate-400';
  }
  if (item.tone === 'danger') {
    return item.value > 0
      ? 'font-semibold tabular-nums text-red-400'
      : 'font-semibold tabular-nums text-slate-400';
  }
  return counselorMetricValueClass(item.value, totalClients);
}

/** (총내담자:3, 검사완료2) 형식 — 값이 총내담자보다 작으면 빨간색 */
export default function CounselorProgressMetricsInline({
  totalClients,
  items,
  className = '',
  showTotalClients = true,
}: Props) {
  return (
    <span className={`tabular-nums ${className}`}>
      (
      {showTotalClients ? (
        <>
          <span className="text-slate-400">총내담자:</span>
          <span className="font-semibold text-slate-200">{totalClients}</span>
        </>
      ) : null}
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {showTotalClients || index > 0 ? ', ' : null}
          <span className="text-slate-400">{item.label}</span>
          <span className={metricValueClass(item, totalClients)}>{item.value}</span>
        </React.Fragment>
      ))}
      )
    </span>
  );
}
