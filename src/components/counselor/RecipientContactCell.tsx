'use client';

import React from 'react';
import { formatPhoneDisplay } from '@/lib/phoneFormat';

type Props = {
  phone?: string | null;
  email?: string | null;
  className?: string;
  emptyClassName?: string;
};

/** 연락처 — 이메일·휴대폰 모두 있으면 이메일 위, 휴대폰 아래 */
export default function RecipientContactCell({
  phone,
  email,
  className = 'text-slate-300',
  emptyClassName = 'text-slate-500',
}: Props) {
  const phoneText = formatPhoneDisplay((phone || '').trim());
  const emailText = (email || '').trim();

  if (!phoneText && !emailText) {
    return <span className={emptyClassName}>—</span>;
  }
  if (phoneText && emailText) {
    return (
      <span className={`block ${className}`}>
        <span className="block truncate">{emailText}</span>
        <span className="block truncate tabular-nums">{phoneText}</span>
      </span>
    );
  }
  return (
    <span className={`block truncate tabular-nums ${className}`}>
      {emailText || phoneText}
    </span>
  );
}
