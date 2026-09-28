'use client';

import React, { useEffect, useState } from 'react';
import { defaultScheduleInputValue, parseScheduleInputToIso } from '@/lib/counselorRecommendCardState';

type Props = {
  open: boolean;
  title: string;
  confirmLabel?: string;
  onConfirm: (scheduledAtIso: string) => void;
  onCancel: () => void;
};

export default function CounselorRecommendScheduleDialog({
  open,
  title,
  confirmLabel = '예약 등록',
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState(defaultScheduleInputValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValue(defaultScheduleInputValue());
      setError('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recommend-schedule-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a1220] p-5 shadow-2xl">
        <h3 id="recommend-schedule-title" className="text-base font-semibold text-white">
          {title}
        </h3>
        <p className="mt-1 text-xs text-slate-400">현재 시각 이후로 예약 시각을 선택해 주세요.</p>
        <label className="mt-4 block text-xs font-medium text-slate-300">
          예약 일시
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white"
          />
        </label>
        {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              const iso = parseScheduleInputToIso(value);
              if (!iso) {
                setError('예약 시각은 현재 이후여야 합니다.');
                return;
              }
              onConfirm(iso);
            }}
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
