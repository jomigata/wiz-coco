'use client';

import React from 'react';
import {
  normalizePublicClaimChannel,
  PUBLIC_CLAIM_CHANNEL_EMAIL,
  PUBLIC_CLAIM_CHANNEL_PHONE,
  PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL,
} from '@/lib/publicClaimDelivery';

type Props = {
  channel?: string | null;
  className?: string;
};

/** 상담코드 목록 — 휴대폰(녹색)·이메일(노랑)·기호(흰색) */
export default function PublicClaimChannelLabel({ channel, className = '' }: Props) {
  const c = normalizePublicClaimChannel(channel);
  if (c === PUBLIC_CLAIM_CHANNEL_EMAIL) {
    return (
      <span className={className}>
        <span className="font-medium text-yellow-300">이메일</span>
      </span>
    );
  }
  if (c === PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL) {
    return (
      <span className={`font-medium text-white ${className}`}>
        <span className="text-emerald-400">휴대폰</span>
        <span>+</span>
        <span className="text-yellow-300">이메일</span>
      </span>
    );
  }
  return (
    <span className={className}>
      <span className="font-medium text-emerald-400">휴대폰</span>
    </span>
  );
}
