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

export type PublicClaimChannel = 'phone' | 'email' | 'phone_email';

export const PUBLIC_CLAIM_CHANNEL_PHONE: PublicClaimChannel = 'phone';
export const PUBLIC_CLAIM_CHANNEL_EMAIL: PublicClaimChannel = 'email';
export const PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL: PublicClaimChannel = 'phone_email';

import {
  PUBLIC_CLAIM_PHONE_MIN_BALANCE_POINTS,
  assessmentCreditsToPoints,
} from '@/lib/pointsCatalog';

export function normalizePublicClaimChannel(raw: unknown): PublicClaimChannel {
  const value = String(raw || '').trim().toLowerCase();
  if (value === PUBLIC_CLAIM_CHANNEL_EMAIL) return PUBLIC_CLAIM_CHANNEL_EMAIL;
  if (value === PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL || value === 'phone+email') {
    return PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL;
  }
  return PUBLIC_CLAIM_CHANNEL_PHONE;
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
    value: PUBLIC_CLAIM_CHANNEL_EMAIL,
    label: '이메일',
    priceNote: '내담자가 이메일을 입력하면 자동 발송',
  },
  {
    value: PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL,
    label: '휴대폰+이메일',
    priceNote: '휴대폰·이메일 모두 있으면 둘 다 자동 발송 (휴대폰 1포인트/명)',
  },
];

export function publicClaimContactLabel(channel: PublicClaimChannel): string {
  if (channel === PUBLIC_CLAIM_CHANNEL_EMAIL) return '이메일';
  if (channel === PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL) return '휴대폰·이메일';
  return '휴대폰번호';
}

export function publicClaimSuccessHint(channel: PublicClaimChannel): string {
  if (channel === PUBLIC_CLAIM_CHANNEL_EMAIL) {
    return '이메일로 코드/비밀번호 발송하였습니다.';
  }
  if (channel === PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL) {
    return '휴대폰·이메일로 코드/비밀번호를 발송하였습니다.';
  }
  return '휴대폰 문자(알림톡)으로 코드/비밀번호 발송하였습니다.';
}
