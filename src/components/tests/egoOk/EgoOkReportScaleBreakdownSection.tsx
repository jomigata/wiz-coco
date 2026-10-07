'use client';

import { useMemo } from 'react';
import type { EgoOkReport } from '@/lib/egoOkScoring';
import {
  buildPersonalityScaleBreakdown,
  groupBreakdownByMajor,
  groupBreakdownByMiddle,
  type PersonalityScaleBreakdownRow,
} from '@/lib/egoOkPersonalityScaleBreakdown';
import {
  egoOkReportSectionNumber,
  formatEgoOkSectionTitle,
  useEgoOkReportTabNav,
} from '@/components/tests/egoOk/egoOkReportTabNav';

function ScaleRowCard({ row }: { row: PersonalityScaleBreakdownRow }) {
  const nav = useEgoOkReportTabNav();
  const tabNo = egoOkReportSectionNumber(row.relatedTabId);
  const barPct = Math.min(100, row.pct);

  return (
    <button
      type="button"
      onClick={() => nav?.selectTab(row.relatedTabId)}
      className="flex w-full flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:border-indigo-200 hover:ring-indigo-200/70"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{row.middle}</p>
          <p className="text-sm font-bold text-slate-800">{row.minor}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 ring-1 ring-slate-200">
          {row.formTag}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-lg font-bold tabular-nums text-indigo-700">
          {row.raw}
          <span className="text-sm font-medium text-slate-500"> / {row.maxScore}</span>
        </p>
        <p className="font-mono text-sm font-semibold tabular-nums text-slate-600">{row.pct}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-400"
          style={{ width: `${barPct}%` }}
        />
      </div>
      <p className="text-[10px] leading-snug text-slate-500">
        문항 {row.itemCount}개 · No. {row.itemNos.join(', ')}
      </p>
      {tabNo != null ? (
        <p className="text-[10px] font-medium text-indigo-600">
          → {formatEgoOkSectionTitle(tabNo, '상세 탭')} 이동
        </p>
      ) : null}
    </button>
  );
}

export default function EgoOkReportScaleBreakdownSection({ report }: { report: EgoOkReport }) {
  const rows = useMemo(() => buildPersonalityScaleBreakdown(report), [report]);
  const byMajor = useMemo(() => groupBreakdownByMajor(rows), [rows]);

  return (
    <section className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-white p-4 ring-1 ring-indigo-50">
      <header className="mb-4 border-b border-indigo-100/80 pb-3">
        <h2 className="text-base font-bold text-slate-900">90문항 척도별 점수 · 문항 구성</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          타당도 6문항을 제외한 <strong className="font-semibold text-slate-800">90문항</strong> 기준입니다. 대분류
          · 중분류 · 소분류로 정리했으며, 카드를 누르면 연결된 상세 탭으로 이동합니다.
        </p>
      </header>

      <div className="space-y-5">
        {byMajor.map(({ major, rows: majorRows }) => (
          <div key={major}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-700">{major}</h3>
            <div className="space-y-4">
              {groupBreakdownByMiddle(majorRows).map(({ middle, rows: midRows }) => (
                <div key={middle}>
                  <p className="mb-2 text-[11px] font-semibold text-slate-700">{middle}</p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {midRows.map((row) => (
                      <ScaleRowCard key={row.scaleType} row={row} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
