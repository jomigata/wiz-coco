'use client';

import React from 'react';
import { formatPhoneDisplay } from '@/lib/phoneFormat';

type Props = {
  phone?: string | null;
  email?: string | null;
  className?: string;
  emptyClassName?: string;
};

/** 연락처 — 휴대폰·이메일 각각 한 줄 */
export default function RecipientContactCell({
  phone,
  email,
  className = 'text-slate-300',
  emptyClassName = 'text-slate-500',
}: Props) {
  const phoneText = formatPhoneDisplay((phone || '').trim());
  const emailText = (email || '').trim().toLowerCase();

  if (!phoneText && !emailText) {
    return <span className={emptyClassName}>—</span>;
  }

  return (
    <div className={`min-w-0 text-sm leading-snug ${className}`}>
      {phoneText ? (
        <span className="block truncate tabular-nums">{phoneText}</span>
      ) : (
        <span className={`block ${emptyClassName}`}>—</span>
      )}
      {emailText ? (
        <span className="mt-0.5 block truncate text-slate-300">{emailText}</span>
      ) : (
        <span className={`mt-0.5 block ${emptyClassName}`}>—</span>
      )}
    </div>
  );
}
