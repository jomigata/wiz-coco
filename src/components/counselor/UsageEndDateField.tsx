'use client';

import React, { useRef } from 'react';
import { openDatePicker } from '@/lib/assessmentFormUi';

interface UsageEndDateFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

function CalendarIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6 2.5V5M14 2.5V5M3.5 8h13M5 4.5h10a1.1 1.1 0 011.1 1.1v10.4A1.1 1.1 0 0115 17.1H5a1.1 1.1 0 01-1.1-1.1V5.6A1.1 1.1 0 015 4.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 사용종료일 — 네이티브 date 입력.
 * - 연·월·일 앞(좌측) 달력 아이콘
 * - 필드 클릭 시 달력 표시 + 세그먼트 키보드 입력 가능
 */
export default function UsageEndDateField({
  id = 'usage-end-date',
  value,
  onChange,
  disabled = false,
  compact = false,
  className = '',
}: UsageEndDateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (disabled) return;
    openDatePicker(inputRef);
  };

  const inputClass = [
    'min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-3 text-base text-white',
    compact ? 'pl-1 text-sm' : 'pl-1',
    'cursor-pointer [color-scheme:dark] focus:outline-none focus:ring-0',
    'disabled:cursor-not-allowed',
    '[&::-webkit-calendar-picker-indicator]:hidden',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="group"
      className={`flex items-center overflow-hidden rounded-lg border border-white/10 bg-[#101f38]/90 ${
        disabled ? 'opacity-55' : ''
      } ${className}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        openPicker();
      }}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        disabled={disabled}
        className="flex shrink-0 items-center self-stretch border-r border-white/10 px-3 text-sky-400 transition hover:bg-sky-500/10 hover:text-sky-300 disabled:cursor-not-allowed"
        aria-label="사용종료일 달력 열기"
      >
        <CalendarIcon />
      </button>
      <input
        id={id}
        ref={inputRef}
        type="date"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={() => openPicker()}
        disabled={disabled}
        aria-label="사용종료일"
      />
    </div>
  );
}
