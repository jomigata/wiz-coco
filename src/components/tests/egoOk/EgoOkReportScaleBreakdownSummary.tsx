'use client';

import { useMemo } from 'react';
import type { EgoOkReport } from '@/lib/egoOkScoring';
import { buildPersonalityScaleBreakdown } from '@/lib/egoOkPersonalityScaleBreakdown';

/** 종합 요약용 — 90문항 14척도 한눈에 */
export default function EgoOkReportScaleBreakdownSummary({ report }: { report: EgoOkReport }) {
  const rows = useMemo(() => buildPersonalityScaleBreakdown(report), [report]);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/50">
      <table className="w-full min-w-[32rem] text-left text-[11px] text-slate-700">
        <thead>
          <tr className="border-b border-slate-200 bg-white/80 text-[10px] uppercase text-slate-500">
            <th className="px-2 py-1.5">형태</th>
            <th className="px-2 py-1.5">중분류</th>
            <th className="px-2 py-1.5 text-right">점수</th>
            <th className="px-2 py-1.5 text-right">%</th>
            <th className="px-2 py-1.5 text-right">문항</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.scaleType} className="border-b border-slate-100/80">
              <td className="px-2 py-1 font-mono font-bold">{row.formTag}</td>
              <td className="px-2 py-1 text-slate-600">{row.minor.replace(/ \(\d+문항\)$/, '')}</td>
              <td className="px-2 py-1 text-right font-mono tabular-nums">
                {row.raw}/{row.maxScore}
              </td>
              <td className="px-2 py-1 text-right font-mono tabular-nums">{row.pct}%</td>
              <td className="px-2 py-1 text-right tabular-nums">{row.itemCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
