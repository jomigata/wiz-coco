import type { ArchivedDispatchRecipient } from '@/lib/clientPortalApi';
import { CLIENT_PORTAL_EMAIL_NOTIFY_ENABLED } from '@/lib/clientPortalNotifyPolicy';
import { formatPhoneDisplay } from '@/lib/phoneFormat';

export type DispatchDisplayRecipient = {
  email?: string | null;
  phone?: string | null;
  notifyStatus?: string | null;
  notifyError?: string | null;
  notifyKind?: string | null;
  notifySentVia?: string | null;
  notifyEmailChannel?: string | null;
  notifyPhoneChannel?: string | null;
  notifyAt?: string | null;
  testStatus?: string | null;
  completedCount?: number | null;
  requiredCount?: number | null;
};

/** 발송성공·완료 진행현황 공통 색상 */
export const DISPATCH_SUCCESS_TEXT_CLASS = 'text-emerald-300';
export const RECIPIENT_PROGRESS_COMPLETE_CLASS = 'text-emerald-300';
export const RECIPIENT_PROGRESS_NOT_STARTED_CLASS = 'text-red-400';

export function isNotifyDispatchSuccess(notifyStatus?: string | null): boolean {
  const status = (notifyStatus || 'not_sent').trim();
  return status === 'sent' || status === 'partial';
}

function isRecipientProgressCompleted(input: {
  testStatus?: string | null;
  progressLabel?: string | null;
  completedCount?: number | null;
  requiredCount?: number | null;
  tests?: { status: string }[] | null;
}): boolean {
  const testStatus = (input.testStatus || '').trim();
  if (testStatus === 'completed') return true;
  if (input.progressLabel === 'completed') return true;
  const required = input.requiredCount ?? 0;
  const completed = input.completedCount ?? 0;
  if (required > 0 && completed >= required) return true;
  const testRows = input.tests ?? [];
  if (testRows.length > 0 && testRows.every((t) => t.status === 'completed')) return true;
  return false;
}

/** 이메일·휴대폰 연락처가 모두 있고, 마지막 발송에서 두 채널 모두 실패 */
export function isNotifyEmailAndPhoneBothFailed(input: {
  email?: string | null;
  phone?: string | null;
  notifyEmailChannel?: string | null;
  notifyPhoneChannel?: string | null;
}): boolean {
  const email = (input.email || '').trim();
  const phone = (input.phone || '').trim();
  if (!email || !phone) return false;
  const emailCh = (input.notifyEmailChannel || '').trim().toLowerCase();
  const phoneCh = (input.notifyPhoneChannel || '').trim().toLowerCase();
  return emailCh === 'failed' && phoneCh === 'failed';
}

/** 미실시 알림 실제 발송·과금 대상 (완료·양쪽 실패 제외) */
export function shouldSendRemindNotification(input: {
  notifyStatus?: string | null;
  testStatus?: string | null;
  progressLabel?: string | null;
  completedCount?: number | null;
  requiredCount?: number | null;
  email?: string | null;
  phone?: string | null;
  moveStatus?: string | null;
  tests?: { status: string }[] | null;
  notifyEmailChannel?: string | null;
  notifyPhoneChannel?: string | null;
}): boolean {
  if (input.moveStatus === 'moved_out') return false;
  const email = (input.email || '').trim();
  const phone = (input.phone || '').trim();
  if (!email && !phone) return false;
  if (isRecipientProgressCompleted(input)) return false;
  if (isNotifyEmailAndPhoneBothFailed(input)) return false;
  return true;
}

/** @deprecated use shouldSendRemindNotification */
export function canRemindIncompleteRecipient(input: Parameters<typeof shouldSendRemindNotification>[0]): boolean {
  return shouldSendRemindNotification(input);
}

export function recipientProgressDisplay(input: {
  testStatus?: string | null;
  completedCount?: number | null;
  requiredCount?: number | null;
}): { text: string; className: string } {
  const completed = input.completedCount ?? 0;
  const total = input.requiredCount ?? 0;
  const status = (input.testStatus || '').trim();

  if (status === 'completed' || (total > 0 && completed >= total)) {
    return {
      text: `완료 (${completed}/${total})`,
      className: `font-medium ${RECIPIENT_PROGRESS_COMPLETE_CLASS}`,
    };
  }
  if (status === 'in_progress' || (completed > 0 && total > 0 && completed < total)) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      text: `진행 ${pct}% (${completed}/${total})`,
      className: 'font-medium text-amber-300',
    };
  }
  if (total <= 0) {
    return { text: '검사 없음', className: 'font-medium text-slate-400' };
  }
  return {
    text: `미시작 (0/${total})`,
    className: `font-normal ${RECIPIENT_PROGRESS_NOT_STARTED_CLASS}`,
  };
}

function notifyErrorHint(error: string | null | undefined): string | undefined {
  const err = (error || '').trim();
  if (!err) return undefined;
  if (err.includes('no_recipient')) {
    return CLIENT_PORTAL_EMAIL_NOTIFY_ENABLED
      ? '이메일·휴대폰 정보가 없습니다.'
      : '휴대폰(알림톡·문자) 번호가 없습니다.';
  }
  if (err.includes('email_send_failed')) return '이메일 발송에 실패했습니다.';
  if (err.includes('phone_send_failed')) return undefined;
  if (err.includes('sms_sender_equals_recipient') || err.includes('alimtalk_sender_equals_recipient')) {
    return '발신번호와 수신번호가 같으면 발송할 수 없습니다. 다른 휴대폰 번호를 등록해 주세요.';
  }
  if (err.includes('sms_not_configured') || err.includes('solapi_sms_not_configured')) {
    return '문자(SMS) 발송 설정이 되어 있지 않습니다. 관리자에게 문의해 주세요.';
  }
  if (err.includes('solapi_delivery_timeout')) return '문자 발송 결과 확인 시간이 초과되었습니다.';
  if (err.includes('solapi_delivery_failed') || err.includes('alimtalk_send_failed')) {
    return 'Solapi 알림톡·문자 발송이 거절되었습니다. Solapi 콘솔 발송 내역을 확인해 주세요.';
  }
  if (err.includes('invalid_phone')) return '휴대폰 번호 형식(11자리)을 확인해 주세요.';
  if (err.includes('alimtalk_confirm_timeout')) {
    return '알림톡 결과 확인 시간이 초과되어 문자 대체 발송을 시도했으나 실패했을 수 있습니다.';
  }
  return err;
}

function notifyKindPrefix(kind: string | null | undefined): string {
  if (kind === 'resend') return '재발송 ';
  if (kind === 'remind') return '미실시 알림 ';
  return '';
}

function parseNotifyErrors(error: string | null | undefined): {
  emailFailed: boolean;
  phoneFailed: boolean;
} {
  const err = (error || '').toLowerCase();
  return {
    emailFailed: err.includes('email_send_failed'),
    phoneFailed: err.includes('phone_send_failed'),
  };
}

function parseSentViaFlags(via: string | null | undefined): {
  emailOk: boolean;
  alimtalkOk: boolean;
  smsOk: boolean;
} {
  const v = (via || '').toLowerCase();
  return {
    emailOk: v.includes('email'),
    alimtalkOk: v.includes('alimtalk') || v.includes('kakao'),
    smsOk: v.includes('sms'),
  };
}

export function formatRecipientContactLine(phone?: string | null, _email?: string | null): string {
  const phoneText = formatPhoneDisplay((phone || '').trim());
  return phoneText || '—';
}

/** 발송현황 정렬 — 1차: 성공·재발송·실패·진행 등, 2·3차: 채널·성공/실패 */
export function compareDispatchStatusSort(
  a: DispatchDisplayRecipient,
  b: DispatchDisplayRecipient,
): number {
  return dispatchStatusSortKey(a).localeCompare(dispatchStatusSortKey(b), 'ko');
}

function dispatchStatusSortKey(r: DispatchDisplayRecipient): string {
  const view = dispatchStatusDisplay(r);
  const status = resolveEffectiveNotifyStatus(r);
  const kind = (r.notifyKind || '').trim();

  let tier1 = 50;
  if (status === 'sent' || status === 'partial') {
    const succeeded =
      view.className.includes('emerald') || anyChannelSucceeded(view.detailParts);
    if (succeeded) tier1 = kind === 'resend' ? 90 : 80;
    else tier1 = 35;
  } else if (status === 'failed') tier1 = 30;
  else if (status === 'sending' || status === 'pending') tier1 = 20;
  else if (status === 'not_sent') tier1 = 10;
  else if (status === 'skipped') tier1 = 5;

  const channelRank = (label: string): number => {
    if (label.startsWith('알림톡')) return 0;
    if (label.startsWith('문자') || label.startsWith('휴대폰')) return 1;
    if (label.startsWith('이메일')) return 2;
    return 9;
  };

  const tier23 = view.detailParts
    .map((part) => {
      const label = part.text.replace(/[✓✗…·]/g, '');
      const rank = String(channelRank(label)).padStart(2, '0');
      const outcome = part.text.includes('✗') ? '2' : part.text.includes('✓') ? '0' : '1';
      return `${rank}${outcome}${label}`;
    })
    .sort()
    .join('|');

  return `${String(tier1).padStart(3, '0')}|${tier23}|${view.mainText}`;
}

export type ChannelDetailPart = { text: string; failed: boolean };

export type DispatchStatusView = {
  mainText: string;
  detailParts: ChannelDetailPart[];
  /** 전체 한 줄 (정렬·접근성용) */
  text: string;
  className: string;
  title?: string;
};

function anyChannelSucceeded(parts: ChannelDetailPart[]): boolean {
  return parts.some((p) => !p.failed && p.text.endsWith('✓'));
}

function dispatchSuccessLabel(kindPrefix: string): string {
  const label = kindPrefix ? `${kindPrefix}성공` : '성공';
  return label.trim();
}

function composeStatusText(mainText: string, detailParts: ChannelDetailPart[]): string {
  if (!detailParts.length) return mainText;
  return `${mainText} (${detailParts.map((p) => p.text).join('·')})`;
}

function resolveEffectiveNotifyStatus(r: DispatchDisplayRecipient): string {
  let status = (r.notifyStatus || 'not_sent').trim();
  if (status !== 'sending') return status;

  const via = parseSentViaFlags(r.notifySentVia);
  if (via.emailOk || via.alimtalkOk || via.smsOk) return 'sent';
  // 알림톡→SMS 단계에서 중간 오류 문자열이 있어도 status가 sending이면 실패로 바꾸지 않음

  const notifyAt = (r.notifyAt || '').trim();
  if (notifyAt) {
    const age = Date.now() - new Date(notifyAt).getTime();
    if (!Number.isNaN(age) && age >= 120_000) {
      return (r.notifyError || '').trim() ? 'failed' : 'sent';
    }
  }

  return status;
}

type SubChannelOutcome = 'ok' | 'fail' | 'pending' | 'skip';

function phoneNotifyWasAttempted(r: DispatchDisplayRecipient, status: string): boolean {
  const phoneCh = (r.notifyPhoneChannel || '').trim().toLowerCase();
  return (
    status === 'sent' ||
    status === 'partial' ||
    status === 'failed' ||
    status === 'sending' ||
    Boolean((r.notifyAt || '').trim()) ||
    phoneCh === 'sent' ||
    phoneCh === 'failed' ||
    phoneCh === 'sending'
  );
}

function resolveEmailSubChannel(
  r: DispatchDisplayRecipient,
  status: string,
  via: ReturnType<typeof parseSentViaFlags>,
  failed: ReturnType<typeof parseNotifyErrors>,
): SubChannelOutcome {
  if (!r.email?.trim()) return 'skip';
  const emailCh = (r.notifyEmailChannel || '').trim().toLowerCase();
  const attempted =
    status === 'sent' ||
    status === 'partial' ||
    status === 'failed' ||
    status === 'sending' ||
    emailCh === 'sent' ||
    emailCh === 'failed' ||
    emailCh === 'sending' ||
    via.emailOk;
  if (!attempted) return 'skip';
  if (status === 'sending' || emailCh === 'sending') return 'pending';
  if (via.emailOk || emailCh === 'sent') return 'ok';
  if (failed.emailFailed || emailCh === 'failed' || status === 'failed') return 'fail';
  return 'skip';
}

/** 휴대 발송: 알림톡 선시도 → 실패 시 문자. 성공 채널만 ✓, 전부 실패 시 ✗만 표기. */
function resolvePhoneSubChannels(
  r: DispatchDisplayRecipient,
  status: string,
  via: ReturnType<typeof parseSentViaFlags>,
): { alimtalk: SubChannelOutcome; sms: SubChannelOutcome } {
  if (!r.phone?.trim()) return { alimtalk: 'skip', sms: 'skip' };
  if (!phoneNotifyWasAttempted(r, status)) return { alimtalk: 'skip', sms: 'skip' };

  const phoneCh = (r.notifyPhoneChannel || '').trim().toLowerCase();
  if (status === 'sending' || phoneCh === 'sending') {
    return { alimtalk: 'pending', sms: 'pending' };
  }

  if (via.alimtalkOk) {
    return { alimtalk: 'ok', sms: 'skip' };
  }
  if (via.smsOk) {
    return { alimtalk: 'fail', sms: 'ok' };
  }
  if (status === 'failed' || phoneCh === 'failed') {
    return { alimtalk: 'fail', sms: 'fail' };
  }
  if ((status === 'sent' || status === 'partial') && phoneCh === 'sent') {
    return { alimtalk: 'ok', sms: 'skip' };
  }
  return { alimtalk: 'skip', sms: 'skip' };
}

function subChannelPart(label: string, outcome: SubChannelOutcome, mode: 'success' | 'failure' | 'pending'): ChannelDetailPart | null {
  if (outcome === 'skip') return null;
  if (mode === 'pending') {
    if (outcome === 'pending') return { text: `${label}…`, failed: false };
    return null;
  }
  if (mode === 'success') {
    if (outcome === 'ok') return { text: `${label}✓`, failed: false };
    return null;
  }
  if (outcome === 'fail') return { text: `${label}✗`, failed: true };
  return null;
}

function buildTerminalNotifyChannelParts(r: DispatchDisplayRecipient): {
  success: ChannelDetailPart[];
  failure: ChannelDetailPart[];
  pending: ChannelDetailPart[];
} {
  const status = resolveEffectiveNotifyStatus(r);
  const via = parseSentViaFlags(r.notifySentVia);
  const failed = parseNotifyErrors(r.notifyError);
  const success: ChannelDetailPart[] = [];
  const failure: ChannelDetailPart[] = [];
  const pending: ChannelDetailPart[] = [];

  const emailOutcome = resolveEmailSubChannel(r, status, via, failed);
  const push = (label: string, outcome: SubChannelOutcome) => {
    const okPart = subChannelPart(label, outcome, 'success');
    const failPart = subChannelPart(label, outcome, 'failure');
    const pendPart = subChannelPart(label, outcome, 'pending');
    if (okPart) success.push(okPart);
    if (failPart) failure.push(failPart);
    if (pendPart) pending.push(pendPart);
  };

  push('이메일', emailOutcome);

  const phone = resolvePhoneSubChannels(r, status, via);
  push('알림톡', phone.alimtalk);
  push('문자', phone.sms);

  return { success, failure, pending };
}

function buildChannelDetailParts(r: DispatchDisplayRecipient): ChannelDetailPart[] {
  const { success, failure, pending } = buildTerminalNotifyChannelParts(r);
  if (success.length > 0) return success;
  if (pending.length > 0) return pending;
  return failure;
}

function notifyLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'sent':
      return { text: '발송 성공', className: 'text-emerald-300' };
    case 'failed':
      return { text: '실패', className: 'text-red-400' };
    case 'partial':
      return { text: '일부 발송 실패', className: 'text-amber-300' };
    case 'pending':
      return { text: '발송 대기', className: 'text-amber-300' };
    case 'sending':
      return { text: '발송중', className: 'text-amber-300' };
    case 'skipped':
      return { text: '발송 생략', className: 'text-slate-400' };
    case 'not_sent':
      return { text: '미발송', className: 'text-slate-500' };
    default:
      return { text: status || '—', className: 'text-slate-400' };
  }
}

function statusView(
  mainText: string,
  detailParts: ChannelDetailPart[],
  className: string,
  title?: string,
): DispatchStatusView {
  return {
    mainText,
    detailParts,
    text: composeStatusText(mainText, detailParts),
    className,
    title,
  };
}

export function dispatchStatusDisplay(r: DispatchDisplayRecipient): DispatchStatusView {
  const hasEmail = Boolean(r.email?.trim());
  const hasPhone = Boolean(r.phone?.trim());

  if (!hasPhone) {
    if (hasEmail) {
      const status = resolveEffectiveNotifyStatus(r);
      const detailParts = buildChannelDetailParts(r);
      if (status === 'sent' || status === 'partial') {
        return statusView(dispatchSuccessLabel(''), detailParts, DISPATCH_SUCCESS_TEXT_CLASS);
      }
      if (status === 'failed') {
        const channels = buildTerminalNotifyChannelParts(r);
        const failParts = channels.failure.length > 0 ? channels.failure : buildChannelDetailParts(r);
        return statusView('실패', failParts, 'text-red-400', notifyErrorHint(r.notifyError));
      }
      if (status === 'sending') {
        const kindPrefix = notifyKindPrefix(r.notifyKind);
        return statusView(
          `${kindPrefix}발송중`.trim() || '발송중',
          detailParts,
          'text-amber-300',
          notifyErrorHint(r.notifyError) || '발송 결과를 확인하는 중입니다.',
        );
      }
      if (status === 'pending' || status === 'not_sent') {
        return statusView('미발송', detailParts, 'text-slate-400');
      }
      if (status === 'skipped') {
        return statusView('발송 생략', detailParts, 'text-slate-400', notifyErrorHint(r.notifyError));
      }
    }
    return statusView(
      '연락처 없음',
      [],
      'text-red-400',
      '휴대폰·이메일 정보가 없어 발송할 수 없습니다.',
    );
  }

  const status = resolveEffectiveNotifyStatus(r);

  if (status === 'sending') {
    const kindPrefix = notifyKindPrefix(r.notifyKind);
    const channels = buildTerminalNotifyChannelParts(r);
    const detailParts = channels.pending.length > 0 ? channels.pending : buildChannelDetailParts(r);
    return statusView(
      `${kindPrefix}발송중`.trim(),
      detailParts,
      'text-amber-300',
    );
  }

  if (status === 'partial' || status === 'sent' || status === 'failed') {
    const kindPrefix = notifyKindPrefix(r.notifyKind);
    const via = parseSentViaFlags(r.notifySentVia);
    const channels = buildTerminalNotifyChannelParts(r);
    const anyDelivered = via.emailOk || via.alimtalkOk || via.smsOk || channels.success.length > 0;

    if (anyDelivered || channels.success.length > 0) {
      const parts =
        channels.success.length > 0
          ? channels.success
          : buildChannelDetailParts(r);
      return statusView(
        dispatchSuccessLabel(kindPrefix),
        parts,
        DISPATCH_SUCCESS_TEXT_CLASS,
        notifyErrorHint(r.notifyError),
      );
    }

    const failParts = channels.failure.length > 0 ? channels.failure : buildChannelDetailParts(r);
    return statusView(
      `${kindPrefix}실패`.trim() || '실패',
      failParts,
      'text-red-400',
      notifyErrorHint(r.notifyError),
    );
  }

  if (status === 'skipped') {
    if (!hasEmail && hasPhone) {
      return statusView(
        '발송 생략',
        [],
        'text-amber-300',
        notifyErrorHint(r.notifyError) || '이메일 없음 · SMS만 등록됨',
      );
    }
    return statusView('발송 생략', [], 'text-slate-400', notifyErrorHint(r.notifyError));
  }

  if (status === 'pending') {
    return statusView(
      `${notifyKindPrefix(r.notifyKind)}예약`.trim(),
      [],
      'text-amber-300',
      '발송 예약됨',
    );
  }

  if (status === 'not_sent' && !hasEmail) {
    return statusView('미발송', [], 'text-slate-500', '이메일 없음 · 휴대폰만 등록됨');
  }

  const fallback = notifyLabel(status);
  return statusView(fallback.text, [], fallback.className);
}

export function testSummary(r: DispatchDisplayRecipient): { text: string; className: string } {
  return recipientProgressDisplay({
    testStatus: r.testStatus,
    completedCount: r.completedCount,
    requiredCount: r.requiredCount,
  });
}

export function formatNotifyDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

export type RecipientSortKey =
  | 'displayName'
  | 'email'
  | 'phone'
  | 'myCode'
  | 'notifyAt'
  | 'notifyStatus'
  | 'testStatus'
  | 'archivedAt';

export type SortDirection = 'asc' | 'desc';

function testStatusOrder(status: string | null | undefined): number {
  if (status === 'completed') return 2;
  if (status === 'in_progress') return 1;
  return 0;
}

export function compareArchivedRecipients(
  a: ArchivedDispatchRecipient,
  b: ArchivedDispatchRecipient,
  key: RecipientSortKey,
  dir: SortDirection,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'displayName':
      return mult * (a.displayName || '').localeCompare(b.displayName || '', 'ko');
    case 'email':
      return mult * (a.email || '').localeCompare(b.email || '', 'ko');
    case 'phone':
      return mult * (a.phone || '').localeCompare(b.phone || '', 'ko');
    case 'myCode':
      return mult * (a.myCode || '').localeCompare(b.myCode || '', 'ko');
    case 'notifyAt': {
      const ta = a.notifyAt ? new Date(a.notifyAt).getTime() : 0;
      const tb = b.notifyAt ? new Date(b.notifyAt).getTime() : 0;
      return mult * (ta - tb);
    }
    case 'archivedAt': {
      const ta = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
      const tb = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
      return mult * (ta - tb);
    }
    case 'notifyStatus':
      return mult * (a.notifyStatus || '').localeCompare(b.notifyStatus || '', 'ko');
    case 'testStatus':
      return mult * (testStatusOrder(a.testStatus) - testStatusOrder(b.testStatus));
    default:
      return 0;
  }
}
