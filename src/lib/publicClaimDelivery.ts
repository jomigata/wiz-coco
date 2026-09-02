/** 무료 검사코드(공개 claim) — 전송 채널·적립금 표기 */

export type PublicClaimChannel = 'phone' | 'email';

export const PUBLIC_CLAIM_CHANNEL_PHONE: PublicClaimChannel = 'phone';
export const PUBLIC_CLAIM_CHANNEL_EMAIL: PublicClaimChannel = 'email';

/** UI 표기 — 백엔드 크레딧 1건과 동일 */
export const PUBLIC_CLAIM_PHONE_POINTS = 100;

export const PUBLIC_CLAIM_PHONE_CREDIT_COST = 1;

export function normalizePublicClaimChannel(raw: unknown): PublicClaimChannel {
  const value = String(raw || '').trim().toLowerCase();
  return value === PUBLIC_CLAIM_CHANNEL_EMAIL ? PUBLIC_CLAIM_CHANNEL_EMAIL : PUBLIC_CLAIM_CHANNEL_PHONE;
}

export function phoneChannelAffordable(balance: number): boolean {
  return balance >= PUBLIC_CLAIM_PHONE_CREDIT_COST;
}

export function resolvePublicClaimChannelForCounselor(
  selected: PublicClaimChannel,
  balance: number,
): PublicClaimChannel {
  if (selected === PUBLIC_CLAIM_CHANNEL_PHONE && !phoneChannelAffordable(balance)) {
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
    priceNote: `적립금 ${PUBLIC_CLAIM_PHONE_POINTS}p 차감`,
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
