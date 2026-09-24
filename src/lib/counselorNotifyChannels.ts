import { normalizeRecipientPhone } from '@/lib/phoneFormat';
import { isValidEmailAddress } from '@/lib/emailValidation';
import {
  POINT_COST_INITIAL_RECIPIENT_DISPATCH,
  POINT_COST_RESEND_PHONE,
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
  myCode?: string | null;
  groupName?: string | null;
  affiliation?: string | null;
  notifyStatus?: string | null;
  initialDispatchPointsCharged?: boolean;
  notifyResendSuccessCount?: number;
};

export function portalNeedsInitialCredentialCharge(r: NotifyRecipientContact): boolean {
  if (r.initialDispatchPointsCharged) return false;
  const status = (r.notifyStatus || 'not_sent').trim();
  return status !== 'sent' && status !== 'partial';
}

export function estimateResendRemindPointForRecipient(r: NotifyRecipientContact): number {
  const count = Math.max(0, Number(r.notifyResendSuccessCount) || 0);
  if (count >= 1) return POINT_COST_RESEND_PHONE;
  return 0;
}

export function estimateCredentialResendPointForRecipient(r: NotifyRecipientContact): number {
  if (portalNeedsInitialCredentialCharge(r)) {
    return POINT_COST_INITIAL_RECIPIENT_DISPATCH;
  }
  return estimateResendRemindPointForRecipient(r);
}

export function defaultNotifyChannelSelection(
  recipients: NotifyRecipientContact[],
): NotifyChannelSelection {
  const hasEmail = recipients.some((r) => isValidEmailAddress((r.email || '').trim()));
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
    return '이메일 또는 휴대폰(1포인트) 중 최소 1개를 선택해 주세요.';
  }
  if (selection.email) {
    const emailCount = recipients.filter((r) =>
      isValidEmailAddress((r.email || '').trim()),
    ).length;
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
    ? recipients.filter((r) => isValidEmailAddress((r.email || '').trim())).length
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

/** 최초 발송(내담자 1명) 성공 시 5포인트 · 재전송·미실시 알림은 1회 무료, 2회째부터 1포인트 */
export function estimateNotifyPointCost(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
  options?: { perRecipient?: boolean; resend?: boolean; remind?: boolean },
): number {
  if (options?.remind) {
    return recipients.reduce((sum, r) => sum + estimateResendRemindPointForRecipient(r), 0);
  }
  if (options?.resend) {
    return recipients.reduce((sum, r) => sum + estimateCredentialResendPointForRecipient(r), 0);
  }
  if (options?.perRecipient) {
    return recipients.length * POINT_COST_INITIAL_RECIPIENT_DISPATCH;
  }
  const { emailCount, phoneCount } = countNotifyTargets(recipients, selection);
  const notifyCount = Math.max(emailCount, phoneCount, 0);
  if (notifyCount === 0 && recipients.length > 0) {
    return recipients.length * POINT_COST_INITIAL_RECIPIENT_DISPATCH;
  }
  return notifyCount * POINT_COST_INITIAL_RECIPIENT_DISPATCH;
}

export function formatNotifyPointSummary(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
  balancePoints: number,
  options?: { perRecipient?: boolean; targetOnly?: boolean; resend?: boolean; remind?: boolean },
): {
  usePoints: number;
  balanceAfter: number;
  detailLines: string[];
  footerLine: string;
} {
  const { emailCount, phoneCount, recipientCount } = countNotifyTargets(recipients, selection);
  const usePoints = estimateNotifyPointCost(recipients, selection, options);
  const balanceAfter = Math.max(0, balancePoints - usePoints);
  const isResend = Boolean(options?.resend);
  const isRemind = Boolean(options?.remind);
  const detailLines = options?.targetOnly
    ? [`대상: ${recipientCount}명`]
    : [
        `대상: ${recipientCount}명`,
        selection.email ? `이메일 ${emailCount}건 (0포인트)` : null,
        selection.phone
          ? isResend || isRemind
            ? `휴대폰 ${phoneCount}건 (재전송 1회 무료 · 2회째 ${formatPoints(POINT_COST_RESEND_PHONE)})`
            : `발송 ${recipientCount}명 (${formatPoints(POINT_COST_INITIAL_RECIPIENT_DISPATCH)}/명, 성공 시)`
          : !isResend && !isRemind && recipientCount > 0
            ? `발송 ${recipientCount}명 (${formatPoints(POINT_COST_INITIAL_RECIPIENT_DISPATCH)}/명, 성공 시)`
            : isResend || isRemind
              ? `재전송·알림 1회 무료 · 2회째 ${formatPoints(POINT_COST_RESEND_PHONE)}/명 (성공 시)`
              : null,
      ].filter(Boolean) as string[];
  const footerLine = options?.perRecipient
    ? `최대 ${formatPoints(usePoints)} (발송 성공 시) / 잔여 ${formatPoints(balanceAfter)}`
    : isResend || isRemind
      ? `최대 ${formatPoints(usePoints)} (성공 시) / 잔여 ${formatPoints(balanceAfter)}`
      : `최대 ${formatPoints(usePoints)} (발송 성공 시) / 잔여 ${formatPoints(balanceAfter)}`;
  return { usePoints, balanceAfter, detailLines, footerLine };
}

export function creditsRequiredForNotify(
  recipients: NotifyRecipientContact[],
  selection: NotifyChannelSelection,
): number {
  const points = estimateNotifyPointCost(recipients, selection);
  return Math.ceil(points / assessmentCreditsToPoints(1));
}
