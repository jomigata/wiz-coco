import type { ArchivedDispatchRecipient } from '@/lib/clientPortalApi';
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
  if (err.includes('no_recipient')) return '이메일·휴대폰 정보가 없습니다.';
  if (err.includes('email_send_failed')) return '이메일 발송에 실패했습니다.';
  if (err.includes('phone_send_failed')) return '문자·알림톡 발송에 실패했습니다.';
  if (err.includes('sms_sender_equals_recipient') || err.includes('alimtalk_sender_equals_recipient')) {
    return '발신번호와 수신번호가 같으면 발송할 수 없습니다. 다른 휴대폰 번호를 등록해 주세요.';
  }
  if (err.includes('sms_not_configured') || err.includes('solapi_sms_not_configured')) {
    return '문자(SMS) 발송 설정이 되어 있지 않습니다. 관리자에게 문의해 주세요.';
  }
  if (err.includes('solapi_delivery_timeout')) return '문자 발송 결과 확인 시간이 초과되었습니다.';
  return err;
}

function formatSentViaLabel(via: string | null | undefined): string {
  const v = (via || '').trim().toLowerCase();
  if (!v) return '';
  if (v.includes('email') && v.includes('sms')) return '이메일·SMS';
  if (v.includes('alimtalk')) return '알림톡';
  if (v.includes('sms')) return 'SMS';
  if (v.includes('email')) return '이메일';
  return via || '';
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

function phoneChannelLabel(flags: ReturnType<typeof parseSentViaFlags>): string {
  if (flags.alimtalkOk) return '알림톡';
  if (flags.smsOk) return '문자';
  return '휴대폰';
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

function isTerminalNotifyStatus(status: string): boolean {
  return status === 'sent' || status === 'partial' || status === 'failed';
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

function pushChannelPart(parts: ChannelDetailPart[], text: string, failed: boolean): void {
  parts.push({ text, failed });
}

function pushChannelFromExplicitState(
  parts: ChannelDetailPart[],
  label: string,
  channelState: string | null | undefined,
  legacyOutcome: 'ok' | 'fail' | 'pending' | 'idle',
): void {
  const state = (channelState || '').trim().toLowerCase();
  if (state === 'sent') {
    pushChannelPart(parts, `${label}✓`, false);
    return;
  }
  if (state === 'failed') {
    pushChannelPart(parts, `${label}✗`, true);
    return;
  }
  if (state === 'sending') {
    pushChannelPart(parts, `${label}…`, false);
    return;
  }
  if (legacyOutcome === 'ok') pushChannelPart(parts, `${label}✓`, false);
  else if (legacyOutcome === 'fail') pushChannelPart(parts, `${label}✗`, true);
  else if (legacyOutcome === 'pending') pushChannelPart(parts, `${label}…`, false);
  // idle — 한 번도 발송 시도하지 않은 채널은 표시하지 않음
}

function emailLegacyOutcome(
  r: DispatchDisplayRecipient,
  status: string,
  via: ReturnType<typeof parseSentViaFlags>,
  failed: ReturnType<typeof parseNotifyErrors>,
): 'ok' | 'fail' | 'pending' | 'idle' {
  const ch = (r.notifyEmailChannel || '').trim().toLowerCase();
  if (failed.emailFailed) return 'fail';
  if (ch === 'sent' || via.emailOk) return 'ok';
  if (ch === 'failed') return 'fail';
  if (status === 'sending' || ch === 'sending') return 'pending';
  return 'idle';
}

function phoneLegacyOutcome(
  r: DispatchDisplayRecipient,
  status: string,
  via: ReturnType<typeof parseSentViaFlags>,
  failed: ReturnType<typeof parseNotifyErrors>,
): 'ok' | 'fail' | 'pending' | 'idle' {
  const ch = (r.notifyPhoneChannel || '').trim().toLowerCase();
  const phoneOk = via.alimtalkOk || via.smsOk;
  if (failed.phoneFailed) return 'fail';
  if (ch === 'sent' || phoneOk) return 'ok';
  if (ch === 'failed') return 'fail';
  if (status === 'sending' || ch === 'sending') return 'pending';
  return 'idle';
}

function channelWasAttempted(
  explicit: string | null | undefined,
  legacy: 'ok' | 'fail' | 'pending' | 'idle',
): boolean {
  const ch = (explicit || '').trim().toLowerCase();
  if (ch === 'sent' || ch === 'failed' || ch === 'sending') return true;
  return legacy !== 'idle';
}

function appendPhoneChannelParts(
  parts: ChannelDetailPart[],
  r: DispatchDisplayRecipient,
  status: string,
  via: ReturnType<typeof parseSentViaFlags>,
  failed: ReturnType<typeof parseNotifyErrors>,
  terminal: boolean,
): void {
  const legacy = phoneLegacyOutcome(r, status, via, failed);
  if (!channelWasAttempted(r.notifyPhoneChannel, legacy)) return;

  const showAlimtalk =
    via.alimtalkOk ||
    (r.notifySentVia || '').toLowerCase().includes('kakao') ||
    (r.notifySentVia || '').toLowerCase().includes('alimtalk');
  const showSms =
    via.smsOk ||
    (r.notifySentVia || '').toLowerCase().includes('sms') ||
    failed.phoneFailed;

  if (showAlimtalk) {
    let channelState = r.notifyPhoneChannel;
    if (terminal && channelState === 'sending') channelState = undefined;
    pushChannelFromExplicitState(parts, '알림톡', channelState, legacy);
    return;
  }
  if (showSms) {
    let channelState = r.notifyPhoneChannel;
    if (terminal && channelState === 'sending') channelState = undefined;
    pushChannelFromExplicitState(parts, '문자', channelState, legacy);
    return;
  }
  const phoneLabel = phoneChannelLabel(via);
  let channelState = r.notifyPhoneChannel;
  if (terminal && channelState === 'sending') channelState = undefined;
  pushChannelFromExplicitState(parts, phoneLabel, channelState, legacy);
}

function buildChannelDetailParts(r: DispatchDisplayRecipient): ChannelDetailPart[] {
  const hasPhone = Boolean(r.phone?.trim());
  const hasEmail = Boolean(r.email?.trim());
  if (!hasPhone && !hasEmail) return [];

  const status = resolveEffectiveNotifyStatus(r);
  const via = parseSentViaFlags(r.notifySentVia);
  const failed = parseNotifyErrors(r.notifyError);
  const terminal = isTerminalNotifyStatus(status);
  const parts: ChannelDetailPart[] = [];

  if (hasEmail) {
    const emailLegacy = emailLegacyOutcome(r, status, via, failed);
    if (channelWasAttempted(r.notifyEmailChannel, emailLegacy)) {
      let emailState = r.notifyEmailChannel;
      if (terminal && emailState === 'sending') emailState = undefined;
      pushChannelFromExplicitState(parts, '이메일', emailState, emailLegacy);
    }
  }

  if (hasPhone) {
    appendPhoneChannelParts(parts, r, status, via, failed, terminal);
  }

  return parts;
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
        return statusView('실패', detailParts, 'text-red-400', notifyErrorHint(r.notifyError));
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
    const detailParts = buildChannelDetailParts(r);
    return statusView(
      `${kindPrefix}발송중`.trim(),
      detailParts,
      'text-amber-300',
      notifyErrorHint(r.notifyError) || 'Solapi 발송 결과를 확인하는 중입니다.',
    );
  }

  if (status === 'partial' || status === 'sent' || status === 'failed') {
    const kindPrefix = notifyKindPrefix(r.notifyKind);
    let detailParts = buildChannelDetailParts(r);
    const succeeded = status === 'sent' || status === 'partial' || anyChannelSucceeded(detailParts);

    if (succeeded) {
      if (!detailParts.length && status === 'sent') {
        if (!hasEmail && hasPhone) {
          detailParts = [{ text: 'SMS', failed: false }];
        } else if (hasEmail && !hasPhone) {
          detailParts = [{ text: '이메일', failed: false }];
        } else {
          const viaLabel = formatSentViaLabel(r.notifySentVia);
          if (viaLabel) detailParts = [{ text: viaLabel, failed: false }];
        }
      }

      let title = kindPrefix.includes('재발송') ? '접속 정보 재발송 완료' : '접속 정보 발송 완료';
      if (!hasEmail && hasPhone) title = '이메일 없음 · SMS로 발송됨';
      else if (hasEmail && !hasPhone) title = '이메일로 발송됨';
      else if (status === 'partial') title = notifyErrorHint(r.notifyError) || '일부 채널만 발송되었습니다.';

      const mainText = dispatchSuccessLabel(kindPrefix);

      return statusView(
        mainText,
        detailParts,
        DISPATCH_SUCCESS_TEXT_CLASS,
        title,
      );
    }

    return statusView(
      `${kindPrefix}실패`.trim() || '실패',
      detailParts,
      'text-red-400',
      notifyErrorHint(r.notifyError) || '발송에 실패했습니다.',
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
