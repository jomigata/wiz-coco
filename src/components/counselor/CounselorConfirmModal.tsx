'use client';

import React from 'react';

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  zIndexClass?: string;
};

/** 확인/취소 선택 팝업 (화면 중앙) */
export default function CounselorConfirmModal({
  open,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  onConfirm,
  onCancel,
  zIndexClass = 'z-[130]',
}: Props) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="counselor-confirm-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`border-b px-6 py-5 ${
            destructive
              ? 'border-red-500/25 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900'
              : 'border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900 to-slate-900'
          }`}
        >
          <h3 id="counselor-confirm-title" className="text-lg font-semibold text-white">
            {title}
          </h3>
          {message ? <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p> : null}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              destructive ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
