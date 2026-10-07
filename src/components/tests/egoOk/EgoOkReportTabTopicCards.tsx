'use client';

import type { KeyboardEvent } from 'react';
import { buildExecutiveExtraSummaries } from '@/lib/egoOkExecutiveExtraSummaries';
import type { InnerMindPair } from '@/lib/egoOkInnerMind';
import type { EgoOkReport, EgoOkScaleScore } from '@/lib/egoOkScoring';
import { useEgoOkReportTabNav, type EgoOkReportTabId } from '@/components/tests/egoOk/egoOkReportTabNav';

export default function EgoOkReportTabTopicCards({
  report,
  peakEgograms,
  lowEgograms,
  innerMindPairs,
  formLabel,
}: {
  report: EgoOkReport;
  peakEgograms: EgoOkScaleScore[];
  lowEgograms: EgoOkScaleScore[];
  innerMindPairs: InnerMindPair[];
  formLabel: string;
}) {
  const nav = useEgoOkReportTabNav();
  const items = buildExecutiveExtraSummaries(
    report,
    peakEgograms,
    lowEgograms,
    innerMindPairs,
    formLabel,
  ).filter((s) => s.relatedTabId && s.relatedTabId !== 'cover');

  if (items.length === 0) return null;

  return (
    <section className="mt-4 space-y-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 ring-1 ring-violet-100/80">
      <header>
        <h2 className="text-base font-bold text-slate-900">탭별 한 줄 정리</h2>
        <p className="mt-1 text-xs text-slate-600">
          8개 요약 블록 외 · 각 탭 해석과 연결되는 추가 개요입니다. 클릭하면 해당 탭으로 이동합니다.
        </p>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const tabId = item.relatedTabId as EgoOkReportTabId;
          const go = () => nav?.selectTab(tabId);
          const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              go();
            }
          };
          return (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={go}
              onKeyDown={onKeyDown}
              className="cursor-pointer rounded-xl border border-white/80 bg-white/90 p-3 text-left shadow-sm ring-1 ring-violet-100 transition hover:ring-2 hover:ring-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
            >
              <h3 className="text-xs font-bold text-violet-900">{item.title}</h3>
              <p className="mt-1 line-clamp-4 text-[11px] leading-relaxed text-slate-600">{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
