'use client';

import React from 'react';
import { formatPhoneMaskedDisplay } from '@/lib/phoneFormat';

type Props = {
  phone?: string | null;
  className?: string;
  emptyClassName?: string;
};

/** 연락처 — 휴대폰만, 가운데 4자리 마스킹 */
export default function RecipientPhoneMaskedCell({
  phone,
  className = 'text-slate-300',
  emptyClassName = 'text-slate-500',
}: Props) {
  const text = formatPhoneMaskedDisplay((phone || '').trim());
  if (!text || text === '—') {
    return <span className={`text-sm ${emptyClassName}`}>—</span>;
  }
  return <span className={`block text-sm tabular-nums leading-snug ${className}`}>{text}</span>;
}
