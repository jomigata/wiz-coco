'use client';

import React from 'react';

type Props = {
  open: boolean;
  title: string;
  message?: string;
  error?: boolean;
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
  confirmLabel = '확인',
  onConfirm,
  zIndexClass = 'z-[130]',
}: Props) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="counselor-action-complete-title"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl">
        <div
          className={`px-5 py-5 text-center ${
            error
              ? 'border-b border-red-500/25 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900'
              : 'border-b border-emerald-500/25 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900'
          }`}
        >
          <h3 id="counselor-action-complete-title" className="text-base font-semibold text-white">
            {title}
          </h3>
          {message ? <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p> : null}
        </div>
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
      </div>
    </div>
  );
}
