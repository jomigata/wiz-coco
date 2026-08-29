'use client';

import React from 'react';

type Phase = 'loading' | 'success';

type Props = {
  open: boolean;
  title: string;
  message?: string;
  /** 보조 안내 (예: 창을 닫지 말아 주세요) */
  hint?: string;
  /** 강조 안내 — 소요 시간 등 (별도 박스) */
  notice?: string;
  /** loading: 스피너 · success: 완료 아이콘 + 확인 버튼 */
  phase?: Phase;
  confirmLabel?: string;
  onConfirm?: () => void;
  zIndexClass?: string;
};

/** 상담코드·내담자 작업 중/완료 화면 중앙 안내 */
export default function CounselorActionProgressOverlay({
  open,
  title,
  message,
  hint,
  notice,
  phase = 'loading',
  confirmLabel = '확인',
  onConfirm,
  zIndexClass = 'z-[100]',
}: Props) {
  if (!open) return null;

  const isSuccess = phase === 'success';

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]`}
      role="dialog"
      aria-modal="true"
      aria-busy={!isSuccess}
      aria-labelledby="counselor-action-progress-title"
    >
      <div className="flex w-full max-w-sm flex-col rounded-2xl border border-sky-500/30 bg-[#121f38] px-5 py-6 text-center shadow-2xl shadow-black/50">
        <div className="flex flex-col items-center">
          {isSuccess ? (
            <div
              className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"
              aria-hidden="true"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div
              className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-500/25 border-t-sky-400"
              aria-hidden="true"
            />
          )}
          <h3 id="counselor-action-progress-title" className="text-base font-semibold tracking-tight text-white">
            {title}
          </h3>
          {message ? (
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-100">{message}</p>
          ) : null}
          {hint ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{hint}</p>
          ) : null}
        </div>
        {notice ? (
          <div
            className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center"
            role="status"
          >
            <p className="text-xs font-semibold leading-snug text-amber-50">{notice}</p>
          </div>
        ) : null}
        {isSuccess && onConfirm ? (
          <button
            type="button"
            onClick={onConfirm}
            className="mt-5 w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            {confirmLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
