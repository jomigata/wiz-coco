'use client';

import React from 'react';
import IndividualAssessmentCreateForm from '@/components/counselor/IndividualAssessmentCreateForm';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AssessmentCreateModal({ open, onClose, onCreated }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="my-2 flex max-h-[96dvh] w-full max-w-[min(96rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl sm:my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sky-400/20 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3 sm:px-5">
          <h3 className="text-base font-bold text-white sm:text-lg">상담코드 생성</h3>
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
          <IndividualAssessmentCreateForm
            variant="modal"
            onClose={onClose}
            onIssued={() => {
              onCreated?.();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
