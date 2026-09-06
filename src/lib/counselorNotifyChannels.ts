import { normalizeRecipientPhone } from '@/lib/phoneFormat';
import {
  POINT_COST_PORTAL_RECIPIENT,
  assessmentCreditsToPoints,
  formatPoints,
} from '@/lib/pointsCatalog';

export type NotifyChannelKey = 'email' | 'phone';

export type NotifyChannelSelection = {
  email: boolean;
  phone: boolean;
};

export type NotifyRecipientContact = {
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
};

export function defaultNotifyChannelSelection(
  recipients: NotifyRecipientContact[],
): NotifyChannelSelection {
  const hasEmail = recipients.some((r) => Boolean((r.email || '').trim()));
  const hasPhone = recipients.some((r) => Boolean(normalizeRecipientPhone(r.phone || '')));
  return {
    email: hasEmail,
    phone: hasPhone,
  };
}

export function notifyChannelsToPayload(selection: NotifyChannelSelection): NotifyChannelKey[] {
  const out: NotifyChannelKey[] = [];
  if (selection.email) out.push('email');
  if (selection.phone) out.push('phone');
  return out;
}

export function validateNotifyChannelSelection(
  selection: NotifyChannelSelection,
  recipients: NotifyRecipientContact[],
): string | null {
  if (!selection.email && !selection.phone) {
    return '이메일(무료) 또는 휴대폰(100포인트) 중 최소 1개를 선택해 주세요.';
  }
  if (selection.email) {
    const emailCount = recipients.filter((r) => (r.email || '').trim()).length;
    if (emailCount === 0) {
      return '선택한 내담자 중 이메일 주소가 있는 대상이 없습니다.';
    }
  }
  if (selection.phone) {
    const phoneCount = recipients.filter((r) => normalizeRecipientPhone(r.phone || '')).length;
    if (phoneCount === 0) {
      return '선택한 내담자 중 휴대폰 번호가 있는 대상이 없습니다.';
    }
  }
  return null;
}

export function countNotifyTargets(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
): { emailCount: number; phoneCount: number; recipientCount: number } {
  const emailCount = selection.email
    ? recipients.filter((r) => (r.email || '').trim()).length
    : 0;
  const phoneCount = selection.phone
    ? recipients.filter((r) => normalizeRecipientPhone(r.phone || '')).length
    : 0;
  return {
    emailCount,
    phoneCount,
    recipientCount: recipients.length,
  };
}

/** 휴대폰 채널 1건당 100포인트 (이메일 0) */
export function estimateNotifyPointCost(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
): number {
  const { phoneCount } = countNotifyTargets(recipients, selection);
  return phoneCount * POINT_COST_PORTAL_RECIPIENT;
}

export function formatNotifyPointSummary(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
  balancePoints: number,
): {
  usePoints: number;
  balanceAfter: number;
  summaryLines: string[];
} {
  const { emailCount, phoneCount, recipientCount } = countNotifyTargets(recipients, selection);
  const usePoints = estimateNotifyPointCost(recipients, selection);
  const balanceAfter = Math.max(0, balancePoints - usePoints);
  const summaryLines = [
    `대상 ${recipientCount}명`,
    selection.email ? `이메일 ${emailCount}건 (무료)` : null,
    selection.phone
      ? `휴대폰 ${phoneCount}건 (${formatPoints(POINT_COST_PORTAL_RECIPIENT)}/건)`
      : null,
    `사용 포인트 ${formatPoints(usePoints)} · 잔여 ${formatPoints(balanceAfter)}`,
  ].filter(Boolean) as string[];
  return { usePoints, balanceAfter, summaryLines };
}

export function creditsRequiredForNotify(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
): number {
  const points = estimateNotifyPointCost(recipients, selection);
  return Math.ceil(points / assessmentCreditsToPoints(1));
}
