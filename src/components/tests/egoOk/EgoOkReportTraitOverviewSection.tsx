'use client';

import { Pattern243PlusInline, Pattern243PlusCode } from '@/components/tests/egoOk/Plus243Display';
import {
  buildIntegratedTraitSections,
  formatEnergyLineWith243Plus,
} from '@/lib/egoOkTraitOverviewSummary';
import type { EgoOkReport, EgoOkScaleScore } from '@/lib/egoOkScoring';

export default function EgoOkReportTraitOverviewSection({
  report,
  peakEgograms,
  lowEgograms,
  formLabel,
}: {
  report: EgoOkReport;
  peakEgograms: EgoOkScaleScore[];
  lowEgograms: EgoOkScaleScore[];
  formLabel: string;
}) {
  const patternLine = report.pattern243.basicPattern?.trim();
  const integrated = buildIntegratedTraitSections(report);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 ring-1 ring-slate-100">
      <header>
        <h3 className="text-base font-bold text-slate-900">개인의 전체적인 성격특성</h3>
        <p className="mt-1 text-xs text-slate-500">다섯 이고그램·243+·오케이그램을 통합한 요약입니다.</p>
      </header>
      <div className="space-y-4 text-sm leading-relaxed text-slate-700">
        <div>
          <p className="flex flex-wrap items-center gap-2">
            <strong className="text-slate-900">243 이고그램 유형</strong>
            <Pattern243PlusCode plus={report.pattern243Plus} />
          </p>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
          <p className="text-xs font-bold text-slate-800">패턴</p>
          <p className="mt-1 font-mono text-base font-extrabold tracking-[0.18em] text-indigo-800">
            {report.patternCode}
          </p>
          {patternLine ? <p className="mt-1 text-xs text-slate-600">{patternLine}</p> : null}
          {formLabel && formLabel !== '—' ? (
            <p className="mt-1 text-xs text-slate-600">{formLabel}</p>
          ) : null}
        </div>

        <p>
          <strong className="text-slate-900">에너지 사용</strong> · {formatEnergyLineWith243Plus(peakEgograms, lowEgograms)}{' '}
          <Pattern243PlusInline plus={report.pattern243Plus} prefix="243+" className="ml-1 inline-flex" />
        </p>

        <p>
          <strong className="text-slate-900">인생태도</strong> · {report.lifePosition.kind} — {report.lifePosition.summary}
        </p>

        <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
          <p className="text-[11px] font-bold text-indigo-900">종합 성격특성</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-800">{integrated.contour}</p>
          <ul className="mt-3 space-y-3">
            {integrated.scaleBlocks.map((b) => (
              <li key={b.id} className="rounded-md bg-white/80 px-2.5 py-2 text-xs ring-1 ring-indigo-100/80">
                <p className="font-bold text-slate-900">{b.title}</p>
                <p className="mt-1 text-slate-700">{b.trait}</p>
                <p className="mt-1 text-slate-600">
                  <span className="font-semibold text-emerald-800">잘 쓰일 때</span> {b.strength || '—'}
                </p>
                <p className="mt-0.5 text-slate-600">
                  <span className="font-semibold text-amber-800">주의할 때</span> {b.caution || '—'}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-slate-800">{integrated.composite}</p>
          {integrated.dynamics.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-slate-700">
              {integrated.dynamics.map((line) => (
                <li key={line.slice(0, 36)}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
