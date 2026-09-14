'use client';

import React from 'react';
import { formatPhoneDisplay } from '@/lib/phoneFormat';

/** 연락처 2줄 분량 고정 + 세로 중앙 정렬 */
export const RECIPIENT_CONTACT_CELL_HEIGHT_CLASS = 'min-h-[3.25rem]';

type Props = {
  phone?: string | null;
  email?: string | null;
  className?: string;
  emptyClassName?: string;
};

export default function RecipientContactCell({
  phone,
  email,
  className = 'text-slate-300',
  emptyClassName = 'text-slate-500',
}: Props) {
  const phoneText = formatPhoneDisplay((phone || '').trim());
  const emailText = (email || '').trim().toLowerCase();

  if (!phoneText && !emailText) {
    return (
      <div
        className={`flex ${RECIPIENT_CONTACT_CELL_HEIGHT_CLASS} items-center text-sm ${emptyClassName}`}
      >
        —
      </div>
    );
  }

  return (
    <div
      className={`flex ${RECIPIENT_CONTACT_CELL_HEIGHT_CLASS} min-w-0 flex-col justify-center text-sm leading-snug ${className}`}
    >
      {phoneText ? (
        <span className="block truncate tabular-nums">{phoneText}</span>
      ) : (
        <span className="block min-h-[1.25rem] text-transparent select-none" aria-hidden>
          —
        </span>
      )}
      {emailText ? (
        <span className="mt-0.5 block break-all text-slate-300">{emailText}</span>
      ) : (
        <span className="mt-0.5 block min-h-[1.25rem] text-transparent select-none" aria-hidden>
          —
        </span>
      )}
    </div>
  );
}
