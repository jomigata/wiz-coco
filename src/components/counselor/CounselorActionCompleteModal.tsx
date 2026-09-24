'use client';

import React from 'react';

type Props = {
  open: boolean;
  title: string;
  message?: string;
  error?: boolean;
  /** true면 스피너만 — 확인 버튼 숨김 (발송·추가 API 대기) */
  loading?: boolean;
  hint?: string;
  notice?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  zIndexClass?: string;
};

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
}: Props) {
  if (!open) return null;

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
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl">
        <div className={`px-5 py-5 text-center ${headerTone}`}>
          {loading ? (
            <div
              className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-sky-500/25 border-t-sky-400"
              aria-hidden="true"
            />
          ) : null}
          <h3 id="counselor-action-complete-title" className="text-base font-semibold text-white">
            {title}
          </h3>
          {message ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{message}</p>
          ) : null}
          {hint ? <p className="mt-2 text-xs leading-relaxed text-slate-400">{hint}</p> : null}
          {notice ? (
            <div
              className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center"
              role="status"
            >
              <p className="text-xs font-semibold leading-snug text-amber-50">{notice}</p>
            </div>
          ) : null}
        </div>
        {!loading ? (
          <div className="flex justify-center px-5 py-4">
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                error ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-500'
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
