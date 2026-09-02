/** 무료 검사코드(공개 claim) — @/lib/pointsCatalog 재export */
export {
  WON_PER_POINT,
  POINTS_PER_ASSESSMENT_CREDIT,
  POINTS_PER_CREDIT,
  POINTS_PER_AI_CREDIT,
  POINT_COST_PUBLIC_CLAIM_PHONE,
  POINT_COST_PUBLIC_CLAIM_EMAIL,
  PUBLIC_CLAIM_PHONE_POINT_COST,
  PUBLIC_CLAIM_PHONE_CREDIT_COST,
  assessmentCreditsToPoints,
  creditsToPoints,
  pointsToWon,
  formatPoints,
  type AiPointFeature,
} from '@/lib/pointsCatalog';

export type PublicClaimChannel = 'phone' | 'email';

export const PUBLIC_CLAIM_CHANNEL_PHONE: PublicClaimChannel = 'phone';
export const PUBLIC_CLAIM_CHANNEL_EMAIL: PublicClaimChannel = 'email';

import {
  POINT_COST_PUBLIC_CLAIM_PHONE,
  assessmentCreditsToPoints,
  formatPoints,
} from '@/lib/pointsCatalog';

export function normalizePublicClaimChannel(raw: unknown): PublicClaimChannel {
  const value = String(raw || '').trim().toLowerCase();
  return value === PUBLIC_CLAIM_CHANNEL_EMAIL ? PUBLIC_CLAIM_CHANNEL_EMAIL : PUBLIC_CLAIM_CHANNEL_PHONE;
}

export function phoneChannelAffordable(creditBalance: number): boolean {
  return assessmentCreditsToPoints(creditBalance) >= POINT_COST_PUBLIC_CLAIM_PHONE;
}

export function resolvePublicClaimChannelForCounselor(
  selected: PublicClaimChannel,
  creditBalance: number,
): PublicClaimChannel {
  if (selected === PUBLIC_CLAIM_CHANNEL_PHONE && !phoneChannelAffordable(creditBalance)) {
    return PUBLIC_CLAIM_CHANNEL_EMAIL;
  }
  return selected;
}

export const PUBLIC_CLAIM_CHANNEL_OPTIONS: {
  value: PublicClaimChannel;
  label: string;
  priceNote: string;
}[] = [
  {
    value: PUBLIC_CLAIM_CHANNEL_PHONE,
    label: '휴대폰(카톡/문자)',
    priceNote: `${formatPoints(POINT_COST_PUBLIC_CLAIM_PHONE)} 차감`,
  },
  {
    value: PUBLIC_CLAIM_CHANNEL_EMAIL,
    label: '이메일',
    priceNote: '무료',
  },
];

export function publicClaimContactLabel(channel: PublicClaimChannel): string {
  return channel === PUBLIC_CLAIM_CHANNEL_EMAIL ? '이메일' : '휴대폰번호';
}

export function publicClaimSuccessHint(channel: PublicClaimChannel): string {
  return channel === PUBLIC_CLAIM_CHANNEL_EMAIL
    ? '이메일을 확인해 주세요.'
    : '휴대폰 문자(알림톡)를 확인해 주세요.';
}
