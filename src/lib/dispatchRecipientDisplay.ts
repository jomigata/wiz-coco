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
      className: 'font-medium text-sky-200',
    };
  }
  if (total <= 0) {
    return { text: '검사 없음', className: 'font-medium text-slate-400' };
  }
  return {
    text: `미시작 (0/${total})`,
    className: `font-medium ${RECIPIENT_PROGRESS_NOT_STARTED_CLASS}`,
  };
}

function notifyErrorHint(error: string | null | undefined): string | undefined {
  const err = (error || '').trim();
  if (!err) return undefined;
  if (err.includes('no_recipient')) return '이메일·휴대폰 정보가 없습니다.';
  if (err.includes('email_send_failed')) return '이메일 발송에 실패했습니다.';
  if (err.includes('phone_send_failed')) return '문자·알림톡 발송에 실패했습니다.';
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

export function formatRecipientContactLine(
  phone?: string | null,
  email?: string | null,
): string {
  const parts: string[] = [];
  const phoneText = formatPhoneDisplay((phone || '').trim());
  const emailText = (email || '').trim();
  if (phoneText) parts.push(phoneText);
  if (emailText) parts.push(emailText);
  return parts.length ? parts.join(' / ') : '—';
}

function emailChannelOutcome(
  status: string,
  via: ReturnType<typeof parseSentViaFlags>,
  failed: ReturnType<typeof parseNotifyErrors>,
): 'ok' | 'fail' | 'pending' | 'idle' {
  if (failed.emailFailed) return 'fail';
  if (status === 'sent') return via.emailOk ? 'ok' : 'ok';
  if (status === 'partial') {
    if (failed.phoneFailed && !failed.emailFailed) return 'ok';
    if (via.emailOk) return 'ok';
    return 'fail';
  }
  if (status === 'failed') return 'fail';
  if (status === 'pending' || status === 'sending') return 'pending';
  if (status === 'not_sent') return 'idle';
  return 'fail';
}

function phoneChannelOutcome(
  status: string,
  via: ReturnType<typeof parseSentViaFlags>,
  failed: ReturnType<typeof parseNotifyErrors>,
): 'ok' | 'fail' | 'pending' | 'idle' {
  const phoneOk = via.alimtalkOk || via.smsOk;
  if (failed.phoneFailed) return 'fail';
  if (status === 'sent') return phoneOk || !via.emailOk ? 'ok' : 'fail';
  if (status === 'partial') {
    if (failed.emailFailed && !failed.phoneFailed) return phoneOk ? 'ok' : 'fail';
    if (phoneOk) return 'ok';
    return 'fail';
  }
  if (status === 'failed') return 'fail';
  if (status === 'pending' || status === 'sending') return 'pending';
  if (status === 'not_sent') return 'idle';
  return 'fail';
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
  const label = kindPrefix ? `${kindPrefix}발송성공` : '발송성공';
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
  if ((r.notifyError || '').trim()) return 'failed';

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
  else pushChannelPart(parts, `${label}·`, false);
}

/** 이메일·휴대폰 채널별 간략 상태 (예: 이메일✓·문자…) */
function buildChannelDetailParts(r: DispatchDisplayRecipient): ChannelDetailPart[] {
  const hasEmail = Boolean(r.email?.trim());
  const hasPhone = Boolean(r.phone?.trim());
  if (!hasEmail && !hasPhone) return [];

  const status = resolveEffectiveNotifyStatus(r);
  const via = parseSentViaFlags(r.notifySentVia);
  const failed = parseNotifyErrors(r.notifyError);
  const terminal = isTerminalNotifyStatus(status);
  const parts: ChannelDetailPart[] = [];

  if (hasEmail) {
    const legacy = emailChannelOutcome(status, via, failed);
    let channelState = r.notifyEmailChannel;
    if (terminal && channelState === 'sending') channelState = undefined;
    pushChannelFromExplicitState(parts, '이메일', channelState, legacy);
  }

  if (hasPhone) {
    const phoneLabel = phoneChannelLabel(via);
    const legacy = phoneChannelOutcome(status, via, failed);
    let channelState = r.notifyPhoneChannel;
    if (terminal && channelState === 'sending') channelState = undefined;
    pushChannelFromExplicitState(parts, phoneLabel, channelState, legacy);
  }

  return parts;
}

function notifyLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'sent':
      return { text: '발송 성공', className: 'text-emerald-300' };
    case 'failed':
      return { text: '발송 실패', className: 'text-red-400' };
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

  if (!hasEmail && !hasPhone) {
    return statusView(
      '연락처 없음',
      [],
      'text-red-400',
      '이메일·휴대폰 정보가 없어 발송할 수 없습니다.',
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
      notifyErrorHint(r.notifyError) || 'Solapi·이메일 발송 결과를 확인하는 중입니다.',
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
      `${kindPrefix}발송실패`.trim(),
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
