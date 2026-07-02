'use client';

import React, { useMemo, useRef } from 'react';

type ScheduledParts = {
  date: string;
  hour24: number;
  minute: number;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  inputClassName?: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function defaultParts(): ScheduledParts {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  return {
    date: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
    hour24: now.getHours(),
    minute: now.getMinutes(),
  };
}

function parseValue(value: string): ScheduledParts {
  if (!value.trim()) return defaultParts();
  const [datePart, timePart] = value.split('T');
  const [h, m] = (timePart || '09:00').split(':').map((x) => parseInt(x, 10));
  return {
    date: datePart || defaultParts().date,
    hour24: Number.isNaN(h) ? 9 : Math.min(23, Math.max(0, h)),
    minute: Number.isNaN(m) ? 0 : Math.min(59, Math.max(0, m)),
  };
}

function compose(parts: ScheduledParts): string {
  return `${parts.date}T${pad2(parts.hour24)}:${pad2(parts.minute)}`;
}

function to12Hour(hour24: number): { hour12: number; isPm: boolean } {
  const isPm = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;
  return { hour12, isPm };
}

function from12Hour(hour12: number, isPm: boolean): number {
  if (isPm) return hour12 === 12 ? 12 : hour12 + 12;
  return hour12 === 12 ? 0 : hour12;
}

function SpinnerColumn({
  label,
  valueText,
  onInc,
  onDec,
  disabled,
}: {
  label: string;
  valueText: string;
  onInc: () => void;
  onDec: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex w-11 flex-col items-stretch rounded-md border border-white/10 bg-slate-950/60">
      <button
        type="button"
        onClick={onInc}
        disabled={disabled}
        aria-label={`${label} 증가`}
        className="flex h-6 items-center justify-center text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 8 L6 4 L10 8 Z" fill="currentColor" />
        </svg>
      </button>
      <span
        className="border-y border-white/10 py-1 text-center text-sm font-medium tabular-nums text-white"
        aria-label={label}
      >
        {valueText}
      </span>
      <button
        type="button"
        onClick={onDec}
        disabled={disabled}
        aria-label={`${label} 감소`}
        className="flex h-6 items-center justify-center text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4 L6 8 L10 4 Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}

export default function ScheduledNotifyDatetimeField({
  value,
  onChange,
  disabled,
  min,
  inputClassName = '',
}: Props) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const parts = useMemo(() => parseValue(value), [value]);
  const { hour12, isPm } = to12Hour(parts.hour24);

  const minDate = min?.split('T')[0] ?? '';

  const emit = (next: Partial<ScheduledParts & { hour12?: number; isPm?: boolean }>) => {
    let date = next.date ?? parts.date;
    let hour24 = next.hour24 ?? parts.hour24;
    let minute = next.minute ?? parts.minute;

    if (next.hour12 !== undefined || next.isPm !== undefined) {
      hour24 = from12Hour(next.hour12 ?? hour12, next.isPm ?? isPm);
    }

    hour24 = ((hour24 % 24) + 24) % 24;
    minute = ((minute % 60) + 60) % 60;

    if (!date) return;
    onChange(compose({ date, hour24, minute }));
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el || disabled) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <button
          type="button"
          onClick={openDatePicker}
          disabled={disabled}
          className="absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center rounded-l-lg border-r border-white/10 text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="날짜 달력 열기"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M6 2.5V5M14 2.5V5M3.5 8h13M5 4.5h10a1.1 1.1 0 011.1 1.1v10.4A1.1 1.1 0 0115 17.1H5a1.1 1.1 0 01-1.1-1.1V5.6A1.1 1.1 0 015 4.5z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={parts.date}
          min={minDate || undefined}
          onChange={(e) => emit({ date: e.target.value })}
          onClick={openDatePicker}
          disabled={disabled}
          className={`${inputClassName} w-full py-2 pl-10 pr-2 text-xs [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-white/10 bg-slate-950/60 p-0.5 text-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => emit({ isPm: false })}
            className={`rounded px-2.5 py-1 transition ${
              !isPm ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            오전
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => emit({ isPm: true })}
            className={`rounded px-2.5 py-1 transition ${
              isPm ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            오후
          </button>
        </div>

        <SpinnerColumn
          label="시"
          valueText={pad2(hour12)}
          disabled={disabled}
          onInc={() => emit({ hour12: hour12 >= 12 ? 1 : hour12 + 1 })}
          onDec={() => emit({ hour12: hour12 <= 1 ? 12 : hour12 - 1 })}
        />

        <span className="text-slate-500 font-medium">:</span>

        <SpinnerColumn
          label="분"
          valueText={pad2(parts.minute)}
          disabled={disabled}
          onInc={() => emit({ minute: parts.minute >= 59 ? 0 : parts.minute + 1 })}
          onDec={() => emit({ minute: parts.minute <= 0 ? 59 : parts.minute - 1 })}
        />
      </div>
    </div>
  );
}
