'use client';

import React from 'react';
import { mypageAccountClasses } from '@/components/layout/appChromeTheme';

export function mypageFieldInputClass(extra = ''): string {
  return `${mypageAccountClasses.fieldInput} ${mypageAccountClasses.fieldInputReadOnly} ${extra}`.trim();
}

export function mypageEditableFieldInputClass(extra = ''): string {
  return `${mypageAccountClasses.fieldInput} ${extra}`.trim();
}

type Adornment = 'calendar' | 'chevron';

function FieldAdornment({ type }: { type: Adornment }) {
  if (type === 'calendar') {
    return (
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky-300/55" aria-hidden>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky-300/55" aria-hidden>
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </span>
  );
}

type MypageReadonlyFieldProps = {
  label: string;
  value: string;
  adornment?: Adornment;
  multiline?: boolean;
  emptyLabel?: string;
};

/** 보기 모드 — 수정 폼과 동일한 inset 입력 스타일 (read-only) */
export function MypageReadonlyField({
  label,
  value,
  adornment,
  multiline = false,
  emptyLabel = '정보 없음',
}: MypageReadonlyFieldProps) {
  const display = value?.trim() ? value : emptyLabel;
  const padRight = adornment ? ' pr-10' : '';

  return (
    <div>
      <span className={mypageAccountClasses.fieldLabel}>{label}</span>
      <div className="relative">
        {multiline ? (
          <textarea
            readOnly
            rows={3}
            value={display}
            className={`${mypageFieldInputClass()} min-h-[4.5rem] resize-none${padRight}`}
          />
        ) : (
          <input
            readOnly
            value={display}
            className={`${mypageFieldInputClass()}${padRight}`}
          />
        )}
        {adornment ? <FieldAdornment type={adornment} /> : null}
      </div>
    </div>
  );
}

export function MypageFieldLabel({ children }: { children: React.ReactNode }) {
  return <label className={mypageAccountClasses.fieldLabel}>{children}</label>;
}
