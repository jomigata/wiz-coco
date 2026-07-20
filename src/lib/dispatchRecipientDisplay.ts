import type { ArchivedDispatchRecipient } from '@/lib/clientPortalApi';

export type DispatchDisplayRecipient = {
  email?: string | null;
  phone?: string | null;
  notifyStatus?: string | null;
  notifyError?: string | null;
  notifyKind?: string | null;
  notifySentVia?: string | null;
  notifyEmailChannel?: string | null;
  notifyPhoneChannel?: string | null;
  testStatus?: string | null;
  completedCount?: number | null;
  requiredCount?: number | null;
};

function notifyErrorHint(error: string | null | undefined): string | undefined {
  const err = (error || '').trim();
  if (!err) return undefined;
  if (err.includes('no_recipient')) return '이메일·휴대폰 정보가 없습니다.';
  if (err.includes('email_send_failed')) return '이메일 발송에 실패했습니다.';
  if (err.includes('phone_send_failed')) return '문자·알림톡 발송에 실패했습니다.';
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
  return kind === 'resend' ? '재발송 ' : '';
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

function composeStatusText(mainText: string, detailParts: ChannelDetailPart[]): string {
  if (!detailParts.length) return mainText;
  return `${mainText} (${detailParts.map((p) => p.text).join('·')})`;
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

  const status = r.notifyStatus || 'not_sent';
  const via = parseSentViaFlags(r.notifySentVia);
  const failed = parseNotifyErrors(r.notifyError);
  const parts: ChannelDetailPart[] = [];

  if (hasEmail) {
    const legacy = emailChannelOutcome(status, via, failed);
    pushChannelFromExplicitState(parts, '이메일', r.notifyEmailChannel, legacy);
  }

  if (hasPhone) {
    const phoneLabel = phoneChannelLabel(via);
    const legacy = phoneChannelOutcome(status, via, failed);
    pushChannelFromExplicitState(parts, phoneLabel, r.notifyPhoneChannel, legacy);
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

  const status = r.notifyStatus || 'not_sent';

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

  if (status === 'partial') {
    const kindPrefix = notifyKindPrefix(r.notifyKind);
    const detailParts = buildChannelDetailParts(r);
    const mainLabel = kindPrefix ? `${kindPrefix}성공` : '발송 성공';
    return statusView(
      mainLabel,
      detailParts,
      'text-emerald-300',
      notifyErrorHint(r.notifyError) || '일부 채널만 발송되었습니다.',
    );
  }

  if (status === 'failed') {
    const kindPrefix = notifyKindPrefix(r.notifyKind);
    const detailParts = buildChannelDetailParts(r);
    return statusView(
      `${kindPrefix}실패`.trim(),
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

  if (status === 'sent') {
    const kindPrefix = notifyKindPrefix(r.notifyKind);
    const detailParts = buildChannelDetailParts(r);
    if (!hasEmail && hasPhone) {
      const parts = detailParts.length ? detailParts : [{ text: 'SMS', failed: false }];
      return statusView(
        `${kindPrefix}완료`.trim(),
        parts,
        'text-emerald-300',
        '이메일 없음 · SMS로 발송됨',
      );
    }
    if (hasEmail && !hasPhone) {
      const parts = detailParts.length ? detailParts : [{ text: '이메일', failed: false }];
      return statusView(
        `${kindPrefix}완료`.trim(),
        parts,
        'text-emerald-300',
        '이메일로 발송됨',
      );
    }
    const viaLabel = formatSentViaLabel(r.notifySentVia);
    if (detailParts.length) {
      return statusView(
        `${kindPrefix}완료`.trim(),
        detailParts,
        'text-emerald-300',
        kindPrefix.includes('재발송') ? '접속 정보 재발송 완료' : '접속 정보 발송 완료',
      );
    }
    if (viaLabel) {
      return statusView(
        `${kindPrefix}완료`.trim(),
        [{ text: viaLabel, failed: false }],
        'text-emerald-300',
        kindPrefix.includes('재발송') ? '접속 정보 재발송 완료' : '접속 정보 발송 완료',
      );
    }
    return statusView(
      `${kindPrefix}완료`.trim(),
      [],
      'text-emerald-300',
      kindPrefix.includes('재발송') ? '접속 정보 재발송 완료' : '접속 정보 발송 완료',
    );
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
  if (r.testStatus === 'completed') {
    return { text: '검사 완료', className: 'text-emerald-300' };
  }
  if (r.testStatus === 'in_progress') {
    return {
      text: `${r.completedCount ?? 0}/${r.requiredCount ?? 0}`,
      className: 'text-amber-300',
    };
  }
  return { text: '미실시', className: 'text-slate-500' };
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
