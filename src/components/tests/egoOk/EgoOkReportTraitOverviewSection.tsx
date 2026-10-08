'use client';

import {
  buildIntegratedEgogramTraitSummary,
  formatEnergyLineWith243Plus,
  formatReport243PlusCode,
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
  const plus243 = formatReport243PlusCode(report.pattern243Plus);
  const integrated = buildIntegratedEgogramTraitSummary(report);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 ring-1 ring-slate-100">
      <header>
        <h3 className="text-base font-bold text-slate-900">개인의 전체적인 성격특성</h3>
        <p className="mt-1 text-xs text-slate-500">
          CP·NP·A·FC·AC 다섯 이고그램과 243+ 9단계를 통합한 요약입니다.
        </p>
      </header>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        <p>
          <strong className="text-slate-900">243 이고그램 유형</strong> · 패턴{' '}
          <span className="font-mono font-bold tracking-wider text-indigo-700">{report.patternCode}</span>
          {patternLine ? ` — ${patternLine}` : ''} / 243+ {plus243}
        </p>
        {formLabel && formLabel !== '—' ? (
          <p>
            <strong className="text-slate-900">형태 요약</strong> · {formLabel}
          </p>
        ) : null}
        <p>
          <strong className="text-slate-900">에너지 사용</strong> ·{' '}
          {formatEnergyLineWith243Plus(peakEgograms, lowEgograms, report.pattern243Plus)}
        </p>
        <p>
          <strong className="text-slate-900">인생태도</strong> · {report.lifePosition.kind} — {report.lifePosition.summary}
        </p>
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 text-xs leading-relaxed text-slate-800">
          <p className="mb-1 text-[11px] font-bold text-indigo-800">다섯 이고그램 통합 요약</p>
          {integrated.split('\n\n').map((para) => (
            <p key={para.slice(0, 40)} className="mt-2 first:mt-0">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
