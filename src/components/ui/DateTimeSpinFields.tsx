'use client';

import React from 'react';

type Props = {
  value: Date;
  onChange: (next: Date) => void;
  className?: string;
};

function SpinColumn({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onInc}
        className="rounded px-2 py-0.5 text-xs text-slate-300 hover:bg-white/10"
        aria-label={`${label} 증가`}
      >
        ▲
      </button>
      <span className="min-w-[2.5rem] rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-center font-mono text-sm text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={onDec}
        className="rounded px-2 py-0.5 text-xs text-slate-300 hover:bg-white/10"
        aria-label={`${label} 감소`}
      >
        ▼
      </button>
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
}

/** 년·월·일·시·분 — 상하 화살표로 조절 */
export default function DateTimeSpinFields({ value, onChange, className = '' }: Props) {
  const bump = (mutate: (d: Date) => void) => {
    const next = new Date(value);
    mutate(next);
    onChange(next);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className={`flex flex-wrap items-end gap-2 ${className}`}>
      <SpinColumn
        label="년"
        value={String(value.getFullYear())}
        onInc={() => bump((d) => d.setFullYear(d.getFullYear() + 1))}
        onDec={() => bump((d) => d.setFullYear(d.getFullYear() - 1))}
      />
      <SpinColumn
        label="월"
        value={pad(value.getMonth() + 1)}
        onInc={() => bump((d) => d.setMonth(d.getMonth() + 1))}
        onDec={() => bump((d) => d.setMonth(d.getMonth() - 1))}
      />
      <SpinColumn
        label="일"
        value={pad(value.getDate())}
        onInc={() => bump((d) => d.setDate(d.getDate() + 1))}
        onDec={() => bump((d) => d.setDate(d.getDate() - 1))}
      />
      <SpinColumn
        label="시"
        value={pad(value.getHours())}
        onInc={() => bump((d) => d.setHours(d.getHours() + 1))}
        onDec={() => bump((d) => d.setHours(d.getHours() - 1))}
      />
      <SpinColumn
        label="분"
        value={pad(value.getMinutes())}
        onInc={() => bump((d) => d.setMinutes(d.getMinutes() + 1))}
        onDec={() => bump((d) => d.setMinutes(d.getMinutes() - 1))}
      />
    </div>
  );
}

export function defaultScheduledDate(): Date {
  return new Date(Date.now() + 60 * 60 * 1000);
}
