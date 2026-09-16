'use client';

import React from 'react';
import { formatPhoneDisplay } from '@/lib/phoneFormat';

type Props = {
  phone?: string | null;
  email?: string | null;
  className?: string;
  emptyClassName?: string;
  /** 목록 셀 세로 중앙 정렬용 */
  stacked?: boolean;
};

export default function RecipientContactCell({
  phone,
  email,
  className = 'text-slate-300',
  emptyClassName = 'text-slate-500',
  stacked = true,
}: Props) {
  const phoneText = formatPhoneDisplay((phone || '').trim());
  const emailText = (email || '').trim().toLowerCase();

  if (!phoneText && !emailText) {
    return null;
  }

  if (!stacked) {
    return (
      <span className={`text-sm ${className}`}>
        {[phoneText, emailText].filter(Boolean).join(' · ')}
      </span>
    );
  }

  return (
    <div className={`flex min-w-0 flex-col justify-center gap-0.5 text-sm leading-snug ${className}`}>
      {phoneText ? <span className="block tabular-nums">{phoneText}</span> : null}
      {emailText ? <span className="block break-all text-slate-300">{emailText}</span> : null}
    </div>
  );
}
