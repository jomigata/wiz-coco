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

/**
 * 사용종료일 — 네이티브 date 입력.
 * - 우측 달력 아이콘 없음
 * - 필드 클릭 시 달력 표시 (마우스 날짜 선택)
 * - 연·월·일 세그먼트에 포커스된 채 숫자 키 입력도 가능
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

  const inputClass = [
    FORM_INPUT,
    compact ? 'py-2.5 text-sm' : '',
    'cursor-pointer [color-scheme:dark]',
    // 네이티브 달력 아이콘만 숨김 (오버레이하지 않음 → 세그먼트 키보드 입력 유지)
    '[&::-webkit-calendar-picker-indicator]:hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <input
      id={id}
      ref={inputRef}
      type="date"
      className={inputClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={() => {
        if (disabled) return;
        openDatePicker(inputRef);
      }}
      disabled={disabled}
      aria-label="사용종료일"
    />
  );
}
