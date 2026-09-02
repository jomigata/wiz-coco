'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { fetchMyCredits } from '@/lib/commerceApi';
import {
  PUBLIC_CLAIM_CHANNEL_OPTIONS,
  PUBLIC_CLAIM_PHONE_POINT_COST,
  creditsToPoints,
  formatPoints,
  phoneChannelAffordable,
  resolvePublicClaimChannelForCounselor,
  type PublicClaimChannel,
  normalizePublicClaimChannel,
} from '@/lib/publicClaimDelivery';

const FIELD_LABEL = 'mb-1.5 block text-sm font-semibold text-slate-200';
const OPTION_BASE =
  'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors';
const OPTION_ACTIVE = 'border-sky-400/45 bg-sky-500/10';
const OPTION_IDLE = 'border-white/10 bg-[#121f38]/80 hover:border-white/20';

type Props = {
  value: PublicClaimChannel;
  onChange: (value: PublicClaimChannel) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  hintOverride?: string | null;
};

export default function PublicClaimChannelField({
  value,
  onChange,
  disabled = false,
  className = '',
  label = '코드전송 방법',
  hintOverride,
}: Props) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyCredits(5)
      .then((data) => {
        if (!cancelled) setBalance(typeof data.balance === 'number' ? data.balance : 0);
      })
      .catch(() => {
        if (!cancelled) setBalance(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const phoneAffordable = balance === null ? true : phoneChannelAffordable(balance);

  useEffect(() => {
    if (balance === null) return;
    const resolved = resolvePublicClaimChannelForCounselor(value, balance);
    if (resolved !== value) onChange(resolved);
  }, [balance, value, onChange]);

  const hint = useMemo(() => {
    if (hintOverride !== undefined) return hintOverride;
    if (balance === null) return null;
    if (!phoneAffordable) {
      return `보유 ${formatPoints(creditsToPoints(balance))} — ${formatPoints(PUBLIC_CLAIM_PHONE_POINT_COST)} 미만이어서 이메일(무료)로만 설정됩니다.`;
    }
    return `1포인트 = 10원 · 보유 ${formatPoints(creditsToPoints(balance))}. 무료 검사코드 받기에서 내담자 연락처 종류를 결정합니다.`;
  }, [balance, hintOverride, phoneAffordable]);

  return (
    <div className={className}>
      <p className={FIELD_LABEL}>
        {label} <span className="text-red-400">*</span>
      </p>
      <div className="space-y-2">
        {PUBLIC_CLAIM_CHANNEL_OPTIONS.map((opt) => {
          const isPhone = opt.value === 'phone';
          const optionDisabled = disabled || (isPhone && !phoneAffordable);
          const active = normalizePublicClaimChannel(value) === opt.value;
          return (
            <label
              key={opt.value}
              className={`${OPTION_BASE} ${active ? OPTION_ACTIVE : OPTION_IDLE} ${
                optionDisabled ? 'cursor-not-allowed opacity-55' : ''
              }`}
            >
              <input
                type="radio"
                name="public_claim_channel"
                value={opt.value}
                checked={active}
                disabled={optionDisabled}
                onChange={() => onChange(opt.value)}
                className="mt-1 accent-sky-500"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{opt.priceNote}</span>
              </span>
            </label>
          );
        })}
      </div>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-slate-400">{hint}</p> : null}
    </div>
  );
}
