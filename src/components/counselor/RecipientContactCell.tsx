'use client';

import React from 'react';
import { formatPhoneDisplay } from '@/lib/phoneFormat';

type Props = {
  phone?: string | null;
  email?: string | null;
  className?: string;
  emptyClassName?: string;
};

/** 연락처 — 휴대폰·이메일 각각 한 줄 (한쪽만 있으면 한 줄·행 높이 축소) */
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

  const singleLine = Boolean(phoneText) !== Boolean(emailText);

  if (singleLine) {
    if (phoneText) {
      return (
        <span className={`block text-sm leading-snug tabular-nums ${className}`}>{phoneText}</span>
      );
    }
    return (
      <span className={`block break-all text-sm leading-snug ${className}`}>{emailText}</span>
    );
  }

  return (
    <div className={`min-w-0 text-sm leading-snug ${className}`}>
      <span className="block truncate tabular-nums">{phoneText}</span>
      <span className="mt-0.5 block break-all text-slate-300">{emailText}</span>
    </div>
  );
}
