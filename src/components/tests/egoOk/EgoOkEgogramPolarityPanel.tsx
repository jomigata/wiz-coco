'use client';

import { ReportInsightBlock, type ReportInsightTone } from '@/components/tests/egoOk/egoOkReportInsight';
import {
  buildEgogramPolarityRows,
  type EgogramNegativeBand,
  type EgogramPolarityRow,
} from '@/lib/egoOkEgogramPolarity';
import type { EgoOkScaleScore } from '@/lib/egoOkScoring';

function PolarityBar({ row }: { row: EgogramPolarityRow }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-semibold text-slate-200">{row.id}</span>
        <span className="tabular-nums text-slate-400">
          +{row.positiveRaw} ({row.positivePct}%) · −{row.negativeRaw} ({row.negativePct}%)
        </span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/10">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-indigo-400"
          style={{ width: `${row.positivePct}%` }}
          title={`긍정 ${row.positivePct}%`}
        />
        <div
          className="h-full bg-gradient-to-r from-rose-600 to-amber-500"
          style={{ width: `${row.negativePct}%` }}
          title={`부정 ${row.negativePct}%`}
        />
      </div>
    </div>
  );
}

function bandTone(band: EgogramNegativeBand): ReportInsightTone {
  if (band === 'within40') return 'emerald';
  if (band === 'over60') return 'fuchsia';
  if (band === '56-60' || band === '51-55') return 'amber';
  return 'sky';
}

export default function EgoOkEgogramPolarityPanel({ egogram }: { egogram: EgoOkScaleScore[] }) {
  const rows = buildEgogramPolarityRows(egogram);

  return (
    <div className="space-y-3">
      <ReportInsightBlock tone="indigo" compact title="긍정·부정 사용 비율 안내">
        <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
          각 이고 척도의 긍정·부정 사용 합계와 비율입니다.{' '}
          <strong className="font-normal text-slate-100">부정 40% 이하</strong>를 유지하는 것이 바람직하며, 41%부터
          구간별 주의·대책 강도가 높아집니다.
        </p>
      </ReportInsightBlock>
      <div className="grid gap-3 lg:grid-cols-2">
        <ReportInsightBlock tone="sky" title="긍정 / 부정 비율">
          <div className="space-y-3">
            {rows.map((row) => (
              <PolarityBar key={row.id} row={row} />
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded bg-indigo-400" /> 긍정
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded bg-rose-500" /> 부정
            </span>
          </div>
        </ReportInsightBlock>
        <ReportInsightBlock tone="violet" title="척도별 수치">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-2">척도</th>
                  <th className="py-2 pr-2 text-right">긍정</th>
                  <th className="py-2 pr-2 text-right">부정</th>
                  <th className="py-2 text-right">부정%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 font-mono font-semibold text-white">{row.id}</td>
                    <td className="py-2 text-right tabular-nums">
                      {row.positiveRaw} ({row.positivePct}%)
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {row.negativeRaw} ({row.negativePct}%)
                    </td>
                    <td className="py-2 text-right tabular-nums text-amber-100/90">{row.negativePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportInsightBlock>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <ReportInsightBlock
            key={row.id}
            tone={bandTone(row.band)}
            compact
            title={
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  {row.id} · {row.label}
                </span>
                <span className="text-[10px] font-medium opacity-90">{row.bandLabel}</span>
              </span>
            }
          >
            <div className="space-y-2 text-xs leading-relaxed sm:text-sm">
              <div>
                <p className="font-semibold text-emerald-200/90">긍정 기능 · 장점</p>
                <ul className="mt-1 list-inside list-disc text-slate-300">
                  {row.strengths.map((line) => (
                    <li key={line.slice(0, 20)}>{line}</li>
                  ))}
                </ul>
              </div>
              {row.band === 'within40' ? (
                <p className="text-emerald-200/90">{row.cautions[0]}</p>
              ) : (
                <>
                  <div>
                    <p className="font-semibold text-amber-200/90">주의 · 단점 신호</p>
                    <ul className="mt-1 list-inside list-disc text-slate-300">
                      {row.cautions.map((line) => (
                        <li key={line.slice(0, 20)}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-200/90">대책 · 상담 포인트</p>
                    <ul className="mt-1 list-inside list-disc text-slate-300">
                      {row.remedies.map((line) => (
                        <li key={line.slice(0, 20)}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </ReportInsightBlock>
        ))}
      </div>
    </div>
  );
}
