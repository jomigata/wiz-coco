'use client';

import React from 'react';
import { formatPhoneDisplay } from '@/lib/phoneFormat';
import { displayContactEmail, displayContactPhone } from '@/lib/contactPrivacy';

type Props = {
  phone?: string | null;
  email?: string | null;
  className?: string;
  emptyClassName?: string;
  /** 목록 셀 세로 중앙 정렬용 */
  stacked?: boolean;
  /** 목록 등 — 마스킹 표시 */
  masked?: boolean;
};

export default function RecipientContactCell({
  phone,
  email,
  className = 'text-slate-300',
  emptyClassName = 'text-slate-500',
  stacked = true,
  masked = false,
}: Props) {
  const phoneText = masked
    ? (phone || '').trim()
      ? displayContactPhone(phone, false)
      : ''
    : formatPhoneDisplay((phone || '').trim());
  const emailRaw = (email || '').trim().toLowerCase();
  const emailText = masked
    ? emailRaw
      ? displayContactEmail(emailRaw, false)
      : ''
    : emailRaw;

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
