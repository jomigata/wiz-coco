/** 공개 claim(검사코드 받기) — @/lib/pointsCatalog 재export */
export {
  WON_PER_POINT,
  POINTS_PER_ASSESSMENT_CREDIT,
  POINTS_PER_CREDIT,
  POINTS_PER_AI_CREDIT,
  POINT_COST_PUBLIC_CLAIM_PHONE,
  PUBLIC_CLAIM_PHONE_POINT_COST,
  PUBLIC_CLAIM_PHONE_CREDIT_COST,
  PUBLIC_CLAIM_PHONE_MIN_BALANCE_POINTS,
  assessmentCreditsToPoints,
  creditsToPoints,
  pointsToWon,
  formatPoints,
  type AiPointFeature,
} from '@/lib/pointsCatalog';

/** 휴대폰(SMS·알림톡) 전용 */
export type PublicClaimChannel = 'phone';

export const PUBLIC_CLAIM_CHANNEL_PHONE: PublicClaimChannel = 'phone';

import {
  PUBLIC_CLAIM_PHONE_MIN_BALANCE_POINTS,
  assessmentCreditsToPoints,
} from '@/lib/pointsCatalog';

export function normalizePublicClaimChannel(_raw?: unknown): PublicClaimChannel {
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
  _selected: PublicClaimChannel,
  _creditBalance: number,
): PublicClaimChannel {
  return PUBLIC_CLAIM_CHANNEL_PHONE;
}

export const PUBLIC_CLAIM_CHANNEL_OPTIONS: {
  value: PublicClaimChannel;
  label: string;
  priceNote: string;
}[] = [
  {
    value: PUBLIC_CLAIM_CHANNEL_PHONE,
    label: '휴대폰',
    priceNote: '내담자가 휴대폰 번호를 입력하면 문자(알림톡)로 자동 발송',
  },
];

export function publicClaimContactLabel(_channel?: PublicClaimChannel): string {
  return '휴대폰번호';
}

export function publicClaimSuccessHint(_channel?: PublicClaimChannel): string {
  return '휴대폰 문자(알림톡)으로 코드/비밀번호 발송하였습니다.';
}
