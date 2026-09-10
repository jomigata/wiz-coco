import { normalizeRecipientPhone } from '@/lib/phoneFormat';
import {
  POINT_COST_PORTAL_RECIPIENT,
  assessmentCreditsToPoints,
  formatPoints,
} from '@/lib/pointsCatalog';

export type NotifyChannelKey = 'phone';

export type NotifyChannelSelection = {
  phone: boolean;
};

export type NotifyRecipientContact = {
  displayName?: string | null;
  phone?: string | null;
};

export function defaultNotifyChannelSelection(
  recipients: NotifyRecipientContact[],
): NotifyChannelSelection {
  const hasPhone = recipients.some((r) => Boolean(normalizeRecipientPhone(r.phone || '')));
  return { phone: hasPhone };
}

export function notifyChannelsToPayload(selection: NotifyChannelSelection): NotifyChannelKey[] {
  return selection.phone ? ['phone'] : [];
}

export function validateNotifyChannelSelection(
  selection: NotifyChannelSelection,
  recipients: NotifyRecipientContact[],
): string | null {
  if (!selection.phone) {
    return '휴대폰 발송을 선택해 주세요.';
  }
  const phoneCount = recipients.filter((r) => normalizeRecipientPhone(r.phone || '')).length;
  if (phoneCount === 0) {
    return '선택한 내담자 중 휴대폰 번호가 있는 대상이 없습니다.';
  }
  return null;
}

export function countNotifyTargets(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
): { phoneCount: number; recipientCount: number } {
  const phoneCount = selection.phone
    ? recipients.filter((r) => normalizeRecipientPhone(r.phone || '')).length
    : 0;
  return { phoneCount, recipientCount: recipients.length };
}

/** 휴대폰 채널 1건당 1포인트 */
export function estimateNotifyPointCost(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
  options?: { perRecipient?: boolean },
): number {
  if (options?.perRecipient) {
    return recipients.length * POINT_COST_PORTAL_RECIPIENT;
  }
  const { phoneCount } = countNotifyTargets(recipients, selection);
  return phoneCount * POINT_COST_PORTAL_RECIPIENT;
}

export function formatNotifyPointSummary(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
  balancePoints: number,
  options?: { perRecipient?: boolean; targetOnly?: boolean },
): {
  usePoints: number;
  balanceAfter: number;
  detailLines: string[];
  footerLine: string;
} {
  const { phoneCount, recipientCount } = countNotifyTargets(recipients, selection);
  const usePoints = estimateNotifyPointCost(recipients, selection, options);
  const balanceAfter = Math.max(0, balancePoints - usePoints);
  const detailLines = options?.targetOnly
    ? [`대상 ${recipientCount}명`]
    : [
        `대상 ${recipientCount}명`,
        selection.phone
          ? `휴대폰 ${phoneCount}건 (${formatPoints(POINT_COST_PORTAL_RECIPIENT)}/건)`
          : null,
      ].filter(Boolean) as string[];
  const footerLine = options?.perRecipient
    ? `총 추가 ${recipientCount}명 / ${formatPoints(usePoints)} 차감 / 잔여 ${formatPoints(balanceAfter)}`
    : `사용 ${formatPoints(usePoints)} / 잔여 ${formatPoints(balanceAfter)}`;
  return { usePoints, balanceAfter, detailLines, footerLine };
}

export function creditsRequiredForNotify(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
): number {
  const points = estimateNotifyPointCost(recipients, selection);
  return Math.ceil(points / assessmentCreditsToPoints(1));
}
