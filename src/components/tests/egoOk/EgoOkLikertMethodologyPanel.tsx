'use client';

import { ReportInsightBlock } from '@/components/tests/egoOk/egoOkReportInsight';
import { egoOkReportMethodologyParagraphs } from '@/lib/egoOkLikertInterpretation';

type Props = {
  compact?: boolean;
  title?: string;
};

/** 이고-오케이 보고서 공통 — 5지선다·긍정/부정 % 산출 의미 */
export default function EgoOkLikertMethodologyPanel({
  compact = false,
  title = '응답 척도 · 점수 · 긍정/부정 %',
}: Props) {
  const paragraphs = egoOkReportMethodologyParagraphs();
  return (
    <ReportInsightBlock tone="indigo" compact={compact} title={title}>
      <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-300 sm:text-sm">
        {paragraphs.map((p) => (
          <li key={p.slice(0, 48)}>{p}</li>
        ))}
      </ul>
    </ReportInsightBlock>
  );
}
