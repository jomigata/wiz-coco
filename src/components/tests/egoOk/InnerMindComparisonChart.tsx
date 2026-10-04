'use client';

import { ReportInsightBlock } from '@/components/tests/egoOk/egoOkReportInsight';
import {
  INNER_MIND_ALIGNED_MAX,
  type InnerMindPair,
} from '@/lib/egoOkInnerMind';

const SCORE_MAX = 55;

function diffBadge(okMinusEgo: number): { label: string; className: string } {
  const abs = Math.abs(okMinusEgo);
  const label = `${okMinusEgo >= 0 ? '+' : ''}${okMinusEgo}`;
  if (abs <= INNER_MIND_ALIGNED_MAX) {
    return {
      label: `${label} · 동일`,
      className: 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/30',
    };
  }
  return {
    label: `${label} · 차이`,
    className: 'bg-amber-500/15 text-amber-50 ring-amber-400/35',
  };
}

function PairRow({ pair }: { pair: InnerMindPair }) {
  const egoPct = Math.min(100, Math.max(0, (pair.egoScore / SCORE_MAX) * 100));
  const okPct = Math.min(100, Math.max(0, (pair.okScore / SCORE_MAX) * 100));
  const gapLeft = Math.min(egoPct, okPct);
  const gapWidth = Math.abs(egoPct - okPct);
  const badge = diffBadge(pair.okMinusEgo);
  const egoFirst = pair.egoScore <= pair.okScore;

  return (
    <div className="rounded-lg bg-black/20 px-3 py-3 ring-1 ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-100">
          <span className="font-mono text-sky-200">{pair.egoShort}</span>
          <span className="mx-1.5 text-slate-600">↔</span>
          <span className="font-mono text-fuchsia-200">{pair.okShort}</span>
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ring-1 ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="relative mt-4 h-10">
        <div
          className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-800/90 ring-1 ring-white/10"
          aria-hidden
        />
        {gapWidth > 0.35 ? (
          <div
            className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-500/25 via-white/10 to-fuchsia-500/25"
            style={{ left: `${gapLeft}%`, width: `${gapWidth}%` }}
            title={`점수 차 ${Math.abs(pair.okMinusEgo)}`}
          />
        ) : null}

        <div
          className="absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: `${egoPct}%` }}
        >
          <span className="mb-0.5 font-mono text-[10px] font-bold tabular-nums text-sky-200">{pair.egoScore}</span>
          <span
            className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-sky-300 to-sky-600 shadow-[0_0_12px_rgba(56,189,248,0.45)] ring-2 ring-sky-200/40"
            title={`겉(${pair.egoShort}) ${pair.egoScore}점`}
          />
          <span className="mt-1 text-[9px] font-medium uppercase tracking-wide text-sky-300/80">겉</span>
        </div>

        <div
          className="absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: `${okPct}%` }}
        >
          <span className="mb-0.5 font-mono text-[10px] font-bold tabular-nums text-fuchsia-200">{pair.okScore}</span>
          <span
            className="h-3 w-3 rotate-45 rounded-sm bg-gradient-to-br from-fuchsia-300 to-fuchsia-600 shadow-[0_0_12px_rgba(232,121,249,0.45)] ring-2 ring-fuchsia-200/40"
            title={`속(${pair.okShort}) ${pair.okScore}점`}
          />
          <span className="mt-1 text-[9px] font-medium uppercase tracking-wide text-fuchsia-300/80">속</span>
        </div>

        {gapWidth > 0.35 && gapWidth < 18 ? (
          <div
            className="pointer-events-none absolute top-[calc(50%+14px)] z-0 h-px bg-white/20"
            style={{
              left: `${Math.min(egoPct, okPct)}%`,
              width: `${gapWidth}%`,
            }}
          />
        ) : null}
      </div>

      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-slate-600">
        <span>0</span>
        <span className="text-slate-500">
          {egoFirst ? (
            <>
              겉 {pair.egoScore} → 속 {pair.okScore}
            </>
          ) : (
            <>
              속 {pair.okScore} → 겉 {pair.egoScore}
            </>
          )}
        </span>
        <span>{SCORE_MAX}</span>
      </div>
    </div>
  );
}

export default function InnerMindComparisonChart({ pairs }: { pairs: InnerMindPair[] }) {
  return (
    <ReportInsightBlock tone="indigo" title="겉마음 ↔ 속마음 · 한 눈금 비교">
      <p className="text-xs leading-relaxed text-slate-400">
        같은 척도(0–{SCORE_MAX}점) 위에{' '}
        <span className="text-sky-300">● 겉(이고)</span>과{' '}
        <span className="text-fuchsia-300">◆ 속(오케이)</span> 위치를 겹쳐 표시합니다. 두 점 사이 간격이
        차이이며, |차이| {INNER_MIND_ALIGNED_MAX} 이하는 동일 수준으로 봅니다.
      </p>
      <div className="mt-4 space-y-3">
        {pairs.map((pair) => (
          <PairRow key={pair.egoId} pair={pair} />
        ))}
      </div>
    </ReportInsightBlock>
  );
}
