'use client';

import React from 'react';

type Props = {
  open: boolean;
  title: string;
  message?: string;
  hint?: string;
  zIndexClass?: string;
};

/** 상담코드·내담자 작업 중 화면 중앙 진행 안내 */
export default function CounselorActionProgressOverlay({
  open,
  title,
  message,
  hint = '잠시만 기다려 주세요.',
  zIndexClass = 'z-[100]',
}: Props) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/75 p-4`}
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="counselor-action-progress-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-800 p-6 text-center shadow-xl">
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400"
          aria-hidden="true"
        />
        <h3 id="counselor-action-progress-title" className="text-lg font-semibold text-white">
          {title}
        </h3>
        {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}
        <p className="mt-3 text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}
