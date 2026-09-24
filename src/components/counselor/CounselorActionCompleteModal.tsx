'use client';

import React from 'react';

export type CounselorDispatchCompleteSummary = {
  targetCount: number;
  addedCount?: number;
  excludedText?: string;
  /** false면 추가만(발송 없음) */
  notifySent?: boolean;
};

/** 발송 완료 팝업 하단 안내 (발송 포함 시) */
function DispatchCompleteStatusHint() {
  return (
    <div className="rounded-xl border border-slate-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/60 px-3.5 py-3 ring-1 ring-white/5">
      <p className="text-[11px] font-semibold leading-relaxed text-slate-300">
        코드전송 결과는{' '}
        <span className="font-bold text-sky-300">&quot;상담진행 현황 - 발송현황&quot;</span> 에서
        확인하세요.
      </p>
      <p className="mt-2 border-t border-white/10 pt-2 text-[11px] font-semibold leading-relaxed text-slate-300">
        실패시 포인트는 실시간{' '}
        <span className="font-bold text-amber-300">재적립</span> 됩니다.
      </p>
    </div>
  );
}

type Props = {
  open: boolean;
  title: string;
  message?: string;
  error?: boolean;
  /** true면 스피너 — 확인 버튼 숨김 */
  loading?: boolean;
  hint?: string;
  notice?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  zIndexClass?: string;
  /** 내담자 추가·발송 완료 — 요약(발송 성공/실패 집계 없음) */
  dispatchSummary?: CounselorDispatchCompleteSummary | null;
};

function DispatchStatCard({
  label,
  value,
  suffix = '',
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: 'neutral' | 'success' | 'sky';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-500/30 bg-emerald-950/35 text-emerald-50'
      : tone === 'sky'
        ? 'border-sky-500/25 bg-sky-950/35 text-sky-50'
        : 'border-white/10 bg-white/[0.04] text-white';
  return (
    <div className={`rounded-xl border px-2 py-2.5 text-center ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function DispatchCompletePanel({ summary }: { summary: CounselorDispatchCompleteSummary }) {
  const showNotify = summary.notifySent !== false;
  const addedCount = summary.addedCount ?? summary.targetCount;

  return (
    <div className="space-y-3 px-4 pb-1 pt-2 text-left">
      {showNotify ? (
        <div className="grid grid-cols-2 gap-2">
          <DispatchStatCard label="발송 대상" value={summary.targetCount} suffix="명" tone="sky" />
          <DispatchStatCard label="내담자 추가" value={addedCount} suffix="명" tone="success" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <DispatchStatCard label="추가 대상" value={summary.targetCount} suffix="명" tone="sky" />
          <DispatchStatCard label="추가 완료" value={addedCount} suffix="명" tone="success" />
        </div>
      )}

      {summary.excludedText ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/35 px-3 py-2.5 text-xs leading-relaxed text-amber-100/95">
          {summary.excludedText}
        </div>
      ) : null}

      {showNotify ? <DispatchCompleteStatusHint /> : null}
    </div>
  );
}

/** 작업 완료(또는 실패) 확인 팝업 */
export default function CounselorActionCompleteModal({
  open,
  title,
  message,
  error = false,
  loading = false,
  hint,
  notice,
  confirmLabel = '확인',
  onConfirm,
  zIndexClass = 'z-[130]',
  dispatchSummary,
}: Props) {
  if (!open) return null;

  const premium = Boolean(dispatchSummary);
  const headerTone = loading
    ? 'border-b border-sky-500/25 bg-gradient-to-r from-sky-950/50 via-slate-900 to-slate-900'
    : error
      ? 'border-b border-red-500/25 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900'
      : 'border-b border-emerald-500/25 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900';

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm`}
      role="dialog"
      aria-modal="true"
      aria-busy={loading}
      aria-labelledby="counselor-action-complete-title"
    >
      <div
        className={`w-full overflow-hidden rounded-2xl shadow-2xl ${
          premium
            ? 'max-w-md border border-sky-400/20 bg-gradient-to-b from-[#0f1a2e] via-[#0a1220] to-[#060d18] ring-1 ring-white/5'
            : 'max-w-sm border border-white/10 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220]'
        }`}
      >
        <div className={`px-5 py-5 text-center ${headerTone}`}>
          {!loading && !error ? (
            <div
              className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30"
              aria-hidden="true"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : loading && !premium ? (
            <div
              className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-sky-500/25 border-t-sky-400"
              aria-hidden="true"
            />
          ) : !loading && error ? (
            <div
              className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400 ring-1 ring-red-400/30"
              aria-hidden="true"
            >
              <span className="text-xl font-bold">!</span>
            </div>
          ) : null}
          <h3 id="counselor-action-complete-title" className="text-base font-bold tracking-tight text-white sm:text-lg">
            {title}
          </h3>
          {!premium && message ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{message}</p>
          ) : null}
          {!premium && hint ? <p className="mt-2 text-xs leading-relaxed text-slate-400">{hint}</p> : null}
          {!premium && notice ? (
            <div
              className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center"
              role="status"
            >
              <p className="text-xs font-semibold leading-snug text-amber-50">{notice}</p>
            </div>
          ) : null}
        </div>

        {premium && dispatchSummary ? <DispatchCompletePanel summary={dispatchSummary} /> : null}

        {premium && message && !loading ? (
          <p className="px-4 pb-2 text-center text-sm text-red-200">{message}</p>
        ) : null}

        {!loading || premium ? (
          <div className="flex justify-center border-t border-white/10 bg-black/20 px-5 py-4">
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors ${
                error
                  ? 'bg-gradient-to-r from-red-700 to-red-600 shadow-red-950/30 hover:from-red-600 hover:to-red-500'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-950/40 hover:from-emerald-500 hover:to-emerald-400'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
