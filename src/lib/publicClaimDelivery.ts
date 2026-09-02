/** 무료 검사코드(공개 claim) — 전송 채널·포인트 표기 */

export type PublicClaimChannel = 'phone' | 'email';

export const PUBLIC_CLAIM_CHANNEL_PHONE: PublicClaimChannel = 'phone';
export const PUBLIC_CLAIM_CHANNEL_EMAIL: PublicClaimChannel = 'email';

/** 1포인트 = 10원 */
export const WON_PER_POINT = 10;

/** 검사 크레딧 1건 = 10포인트 (= 100원) */
export const POINTS_PER_CREDIT = 10;

/** 휴대폰(카톡/문자) 공개 claim 1건 — 10포인트 (= 크레딧 1건) */
export const PUBLIC_CLAIM_PHONE_POINT_COST = 10;

/** @deprecated PUBLIC_CLAIM_PHONE_POINT_COST 사용 */
export const PUBLIC_CLAIM_PHONE_POINTS = PUBLIC_CLAIM_PHONE_POINT_COST;

export const PUBLIC_CLAIM_PHONE_CREDIT_COST = 1;

export function creditsToPoints(credits: number): number {
  const n = Number.isFinite(credits) ? credits : 0;
  return Math.max(0, Math.round(n * POINTS_PER_CREDIT));
}

export function pointsToWon(points: number): number {
  const n = Number.isFinite(points) ? points : 0;
  return Math.max(0, Math.round(n * WON_PER_POINT));
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString('ko-KR')}포인트`;
}

export function normalizePublicClaimChannel(raw: unknown): PublicClaimChannel {
  const value = String(raw || '').trim().toLowerCase();
  return value === PUBLIC_CLAIM_CHANNEL_EMAIL ? PUBLIC_CLAIM_CHANNEL_EMAIL : PUBLIC_CLAIM_CHANNEL_PHONE;
}

export function phoneChannelAffordable(creditBalance: number): boolean {
  return creditsToPoints(creditBalance) >= PUBLIC_CLAIM_PHONE_POINT_COST;
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
    priceNote: `${formatPoints(PUBLIC_CLAIM_PHONE_POINT_COST)} 차감`,
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
