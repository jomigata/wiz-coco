/** 내담자 포털 발송 — 이메일 채널 UI·payload 비활성(기본). 롤백: NEXT_PUBLIC_CLIENT_PORTAL_NOTIFY_EMAIL=true */
export const CLIENT_PORTAL_EMAIL_NOTIFY_ENABLED =
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_NOTIFY_EMAIL === 'true';

export function clientPortalNotifyUsesPhoneOnly(): boolean {
  return !CLIENT_PORTAL_EMAIL_NOTIFY_ENABLED;
}
