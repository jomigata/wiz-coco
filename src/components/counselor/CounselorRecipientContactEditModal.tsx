'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { formatPhoneDisplay, isValidKrMobilePhone, normalizeRecipientPhone } from '@/lib/phoneFormat';
import { isValidEmailAddress } from '@/lib/emailValidation';

export type CounselorRecipientContactEditTarget = {
  displayName?: string;
  myCode?: string;
  phone?: string;
  email?: string;
};

type Props = {
  open: boolean;
  target: CounselorRecipientContactEditTarget | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: { phone?: string; email?: string }) => void | Promise<void>;
};

export function validateRecipientContactEdit(phoneInput: string, emailInput: string): string | null {
  const phone = normalizeRecipientPhone(phoneInput);
  const email = emailInput.trim().toLowerCase();
  if (!phone && !email) return '휴대폰 또는 이메일 중 하나 이상 입력해 주세요.';
  if (email && !isValidEmailAddress(email)) return '이메일 형식을 확인해 주세요.';
  if (phone && !isValidKrMobilePhone(phone)) {
    return '휴대폰 번호는 11자리(010-1234-5678) 형식으로 입력해 주세요.';
  }
  return null;
}

export default function CounselorRecipientContactEditModal({
  open,
  target,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !target) return;
    setPhone(target.phone?.trim() ? formatPhoneDisplay(target.phone) : '');
    setEmail(target.email?.trim() || '');
    setError('');
  }, [open, target]);

  const liveValidation = useMemo(() => validateRecipientContactEdit(phone, email), [phone, email]);

  if (!open || !target) return null;

  const handlePhoneChange = (value: string) => {
    const next = formatPhoneDisplay(value) || value;
    setPhone(next);
    setError(validateRecipientContactEdit(next, email) || '');
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError(validateRecipientContactEdit(phone, value) || '');
  };

  const handleSave = () => {
    const msg = validateRecipientContactEdit(phone, email);
    if (msg) {
      setError(msg);
      return;
    }
    const normalizedPhone = normalizeRecipientPhone(phone);
    const normalizedEmail = email.trim().toLowerCase();
    const prevPhone = normalizeRecipientPhone(target.phone || '');
    const prevEmail = (target.email || '').trim().toLowerCase();
    if (normalizedPhone === prevPhone && normalizedEmail === prevEmail) {
      onClose();
      return;
    }
    void onSave({
      phone: normalizedPhone || undefined,
      email: normalizedEmail || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-800 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-3">
          <h3 className="text-lg font-semibold text-white">연락처 수정</h3>
        </div>
        <div className="mt-3 rounded-lg border border-white/10 bg-slate-900/30 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">내담자</p>
          <p className="mt-1 text-base font-semibold text-white">{target.displayName || '내담자'}</p>
          {target.myCode ? (
            <p className="mt-0.5 font-mono text-lg font-semibold tracking-wide text-cyan-200">
              {formatAccessCodeDisplay(target.myCode)}
            </p>
          ) : null}
        </div>
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-white/10 bg-slate-900/30 px-3 py-3">
            <label htmlFor="recipient-edit-phone" className="mb-1.5 block text-xs font-semibold text-slate-400">
              휴대폰
            </label>
            <input
              id="recipient-edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-900/30 px-3 py-3">
            <label htmlFor="recipient-edit-email" className="mb-1.5 block text-xs font-semibold text-slate-400">
              이메일
            </label>
            <input
              id="recipient-edit-email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
          {error || (liveValidation && (phone.trim() || email.trim()) && !saving) ? (
            <p className="text-sm text-red-400" role="alert">
              {error || liveValidation}
            </p>
          ) : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={saving}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || Boolean(liveValidation)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
