'use client';

import { formatEgogramEnergyHeadline } from '@/lib/egogramEnergyStageComments';
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

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 ring-1 ring-slate-100">
      <header>
        <h3 className="text-base font-bold text-slate-900">개인의 전체적인 성격특성</h3>
        <p className="mt-1 text-xs text-slate-500">학지사 결과지 「개인의 전체적인 성격특성」 항목에 대응합니다.</p>
      </header>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        <p>
          <strong className="text-slate-900">243 이고그램 유형</strong> · 패턴{' '}
          <span className="font-mono font-bold tracking-wider text-indigo-700">{report.patternCode}</span>
          {patternLine ? ` — ${patternLine}` : ''}
        </p>
        {formLabel && formLabel !== '—' ? (
          <p>
            <strong className="text-slate-900">형태 요약</strong> · {formLabel}
          </p>
        ) : null}
        <p>
          <strong className="text-slate-900">에너지 사용</strong> · 가장 높은 쪽{' '}
          {peakEgograms.map((s) => formatEgogramEnergyHeadline(s)).join(' · ')}, 상대적으로 낮은 쪽{' '}
          {lowEgograms.map((s) => formatEgogramEnergyHeadline(s)).join(' · ')}
        </p>
        <p>
          <strong className="text-slate-900">인생태도</strong> · {report.lifePosition.kind} — {report.lifePosition.summary}
        </p>
      </div>
    </div>
  );
}
