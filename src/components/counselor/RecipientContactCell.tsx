'use client';

import React from 'react';
import { formatPhoneDisplay } from '@/lib/phoneFormat';

type Props = {
  phone?: string | null;
  className?: string;
  emptyClassName?: string;
};

/** 연락처 — 휴대폰 번호 */
export default function RecipientContactCell({
  phone,
  className = 'text-slate-300',
  emptyClassName = 'text-slate-500',
}: Props) {
  const phoneText = formatPhoneDisplay((phone || '').trim());

  if (!phoneText) {
    return <span className={emptyClassName}>—</span>;
  }
  return <span className={`block truncate tabular-nums ${className}`}>{phoneText}</span>;
}
