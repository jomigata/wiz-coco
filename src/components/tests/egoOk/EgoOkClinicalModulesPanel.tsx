'use client';

import { useMemo, useState } from 'react';
import type { EgoOkReport } from '@/lib/egoOkScoring';
import {
  buildClinicalModuleResults,
  CLINICAL_MODULE_PART_LABELS,
} from '@/lib/egoOkClinicalModules';

type Props = {
  report: EgoOkReport;
};

function accuracyBadge(pct: number) {
  return (
    <span
      className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400"
      title="모듈 신뢰도·타당도 환산 참고치"
    >
      신뢰 참고 {pct}%
    </span>
  );
}

function indexBadge(indexPct: number, level: string) {
  const tone =
    level === '높음'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
      : level === '낮음'
        ? 'border-sky-500/40 bg-sky-500/10 text-sky-200'
        : 'border-slate-500/40 bg-slate-500/10 text-slate-300';
  return (
    <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}>
      참고 {indexPct}% · {level}
    </span>
  );
}

export function EgoOkClinicalModulesPanel({ report }: Props) {
  const results = useMemo(() => buildClinicalModuleResults(report), [report]);
  const [partFilter, setPartFilter] = useState<number | 'all'>('all');

  const filtered =
    partFilter === 'all' ? results : results.filter((r) => r.def.part === partFilter);

  return (
    <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">임상·상담 진단 모듈 (30)</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Cronbach α·현장 행동 일치도를 환산한 모듈별 신뢰 참고치와, 현재 검사 점수 기반 참고 지수입니다.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Part</span>
          <select
            className="rounded-md border border-white/10 bg-slate-900/80 px-2 py-1 text-slate-200"
            value={partFilter === 'all' ? 'all' : String(partFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setPartFilter(v === 'all' ? 'all' : Number(v));
            }}
          >
            <option value="all">전체</option>
            {[1, 2, 3, 4, 5, 6].map((p) => (
              <option key={p} value={p}>
                {p}. {CLINICAL_MODULE_PART_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {filtered.map(({ def, indexPct, personalized, levelLabel }) => (
          <article
            key={def.id}
            className="rounded-xl border border-white/10 bg-slate-900/40 p-3 shadow-sm"
          >
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Part {def.part} · #{def.id}
                </p>
                <h4 className="text-sm font-semibold text-slate-100">{def.titleKo}</h4>
                <p className="text-[10px] text-slate-500">{def.titleEn}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {indexBadge(indexPct, levelLabel)}
                {accuracyBadge(def.accuracyPct)}
              </div>
            </header>
            <p className="mt-2 text-xs font-medium text-indigo-200/90">{personalized}</p>
            <dl className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-400">
              <div>
                <dt className="inline font-semibold text-slate-500">특징 </dt>
                <dd className="inline">{def.feature}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-emerald-600/80">장점 </dt>
                <dd className="inline">{def.pros}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-amber-600/80">단점 </dt>
                <dd className="inline">{def.cons}</dd>
              </div>
              <div className="text-[10px] text-slate-600">{def.itemNote}</div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
