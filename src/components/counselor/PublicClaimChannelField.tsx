'use client';

import React, { useMemo } from 'react';
import {
  PUBLIC_CLAIM_CHANNEL_OPTIONS,
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
  allowedChannels?: PublicClaimChannel[];
};

export default function PublicClaimChannelField({
  value,
  onChange,
  disabled = false,
  className = '',
  label = '코드전송 방법',
  hintOverride,
  allowedChannels,
}: Props) {
  const options = useMemo(() => {
    if (!allowedChannels?.length) return PUBLIC_CLAIM_CHANNEL_OPTIONS;
    const allowed = new Set(allowedChannels);
    return PUBLIC_CLAIM_CHANNEL_OPTIONS.filter((opt) => allowed.has(opt.value));
  }, [allowedChannels]);

  const hint =
    hintOverride !== undefined
      ? hintOverride
      : '내담자가 무료 검사코드 받기에서 연락처를 입력하면 선택한 방법으로 나의코드·비밀번호가 발송됩니다.';

  return (
    <div className={className}>
      <p className={FIELD_LABEL}>
        {label} <span className="text-red-400">*</span>
      </p>
      <div className="space-y-2">
        {options.map((opt) => {
          const active = normalizePublicClaimChannel(value) === opt.value;
          return (
            <label
              key={opt.value}
              className={`${OPTION_BASE} ${active ? OPTION_ACTIVE : OPTION_IDLE} ${
                disabled ? 'cursor-not-allowed opacity-55' : ''
              }`}
            >
              <input
                type="radio"
                name="public_claim_channel"
                value={opt.value}
                checked={active}
                disabled={disabled}
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
