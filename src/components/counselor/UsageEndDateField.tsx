'use client';

import React, { useRef } from 'react';
import { FORM_INPUT, openDatePicker } from '@/lib/assessmentFormUi';

interface UsageEndDateFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export default function UsageEndDateField({
  id = 'usage-end-date',
  value,
  onChange,
  disabled = false,
  compact = false,
  className = '',
}: UsageEndDateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => openDatePicker(inputRef);

  const inputClass = compact
    ? 'min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-2 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-0 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80'
    : `${FORM_INPUT} min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-2 focus:ring-0 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80`;

  return (
    <div
      role="group"
      aria-labelledby={id ? `${id}-label` : undefined}
      className={`flex cursor-text items-center overflow-hidden rounded-lg border border-white/10 bg-[#101f38]/90 ${
        disabled ? 'opacity-55' : ''
      } ${className}`}
      onClick={(e) => {
        if (disabled) return;
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        openPicker();
      }}
    >
      <input
        id={id}
        ref={inputRef}
        type="date"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        disabled={disabled}
        className="flex shrink-0 items-center self-stretch px-3 text-sky-400 transition hover:text-sky-300 disabled:cursor-not-allowed"
        aria-label="사용종료일 달력 열기"
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M6 2.5V5M14 2.5V5M3.5 8h13M5 4.5h10a1.1 1.1 0 011.1 1.1v10.4A1.1 1.1 0 0115 17.1H5a1.1 1.1 0 01-1.1-1.1V5.6A1.1 1.1 0 015 4.5z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
