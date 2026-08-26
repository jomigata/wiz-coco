'use client';

import React from 'react';

type Props = {
  value: Date;
  onChange: (next: Date) => void;
  className?: string;
};

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 예약 일시 — 브라우저 datetime-local 입력 (간편 선택) */
export default function DateTimeSpinFields({ value, onChange, className = '' }: Props) {
  const minValue = toLocalInputValue(new Date());

  return (
    <input
      type="datetime-local"
      value={toLocalInputValue(value)}
      min={minValue}
      onChange={(e) => {
        const next = new Date(e.target.value);
        if (!Number.isNaN(next.getTime())) onChange(next);
      }}
      className={`rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none ${className}`}
    />
  );
}

export function defaultScheduledDate(): Date {
  return new Date(Date.now() + 60 * 60 * 1000);
}
