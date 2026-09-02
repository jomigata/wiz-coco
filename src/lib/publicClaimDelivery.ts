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
  PUBLIC_CLAIM_PHONE_MIN_BALANCE_POINTS,
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
  PUBLIC_CLAIM_PHONE_MIN_BALANCE_POINTS,
  assessmentCreditsToPoints,
  formatPoints,
} from '@/lib/pointsCatalog';

export function normalizePublicClaimChannel(raw: unknown): PublicClaimChannel {
  const value = String(raw || '').trim().toLowerCase();
  return value === PUBLIC_CLAIM_CHANNEL_EMAIL ? PUBLIC_CLAIM_CHANNEL_EMAIL : PUBLIC_CLAIM_CHANNEL_PHONE;
}

export function phoneChannelAffordable(creditBalance: number): boolean {
  return assessmentCreditsToPoints(creditBalance) >= PUBLIC_CLAIM_PHONE_MIN_BALANCE_POINTS;
}

/** 내담자 claim(다음 화면) 시 휴대폰 발송 가능 여부 */
export function phoneChannelAvailableAtClaim(creditBalance: number): boolean {
  return phoneChannelAffordable(creditBalance);
}

export function resolvePublicClaimChannelForCounselor(
  selected: PublicClaimChannel,
  _creditBalance: number,
): PublicClaimChannel {
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
