'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import AssessmentEditForm from '@/components/counselor/AssessmentEditForm';

type Props = {
  open: boolean;
  assessmentId: string | null;
  onClose: () => void;
  onSaved?: () => void;
};

export default function AssessmentEditModal({ open, assessmentId, onClose, onSaved }: Props) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !assessmentId || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[96dvh] w-full max-w-[min(80rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sky-400/20 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3 sm:px-5">
          <h3 className="text-base font-bold text-white sm:text-lg">상담코드 수정</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-3">
          <AssessmentEditForm
            assessmentId={assessmentId}
            variant="modal"
            onCancel={onClose}
            onSaved={onSaved}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
