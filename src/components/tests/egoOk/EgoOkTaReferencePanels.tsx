'use client';

import {
  EGO_OK_STROKE_THEORY_SUMMARY,
  EGO_OK_TIME_STRUCTURING_SUMMARY,
  TA_OVERVIEW_CHAPTERS,
  formatTaOverviewChapterLabel,
  taOverviewChapterAnchor,
} from '@/lib/egoOkTaOverviewChapters';

export function EgoOkStrokeReferencePanel() {
  const s = EGO_OK_STROKE_THEORY_SUMMARY;
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-300">
      <p className="text-xs text-slate-500">
        출처: docs/internal-materials/ta-overview · stroke(25문항)는 별도 검사
      </p>
      <ul className="list-inside list-disc space-y-2">
        {s.lines.map((line) => (
          <li key={line.slice(0, 28)}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function EgoOkTimeStructuringReferencePanel() {
  const t = EGO_OK_TIME_STRUCTURING_SUMMARY;
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-300">
      <p className="text-xs text-slate-500">
        출처: docs/internal-materials/time-structuring (60문항) · ta-overview 이론 노트
      </p>
      <div className="flex flex-wrap gap-2">
        {t.scales.map((name, i) => (
          <span
            key={name}
            className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-white/10"
          >
            {i + 1}. {name}
          </span>
        ))}
      </div>
      <ul className="list-inside list-disc space-y-2">
        {t.lines.map((line) => (
          <li key={line.slice(0, 28)}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function EgoOkTaOverviewChaptersPanel() {
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-500">
        교류분석 요약정리.xls — 제19·21·22·23·29장은 원문 표기, 나머지는 동일 노트의 부·절
        순서로 붙인 참조 제목입니다. 채점·243+ 해석 기준을 바꾸지 않습니다.
      </p>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TA_OVERVIEW_CHAPTERS.map((ch) => (
          <li
            key={ch.no}
            id={taOverviewChapterAnchor(ch.no)}
            className="scroll-mt-4 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 ring-1 ring-white/5"
          >
            <p className="text-[13px] font-bold text-slate-100">
              {formatTaOverviewChapterLabel(ch)}
              {ch.xlsExplicit ? (
                <span className="ml-1.5 text-[10px] font-semibold text-emerald-400/90">xls</span>
              ) : null}
            </p>
            {ch.teaser ? <p className="mt-1 text-[11px] leading-snug text-slate-400">{ch.teaser}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
