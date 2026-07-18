import type { ArchivedDispatchRecipient } from '@/lib/clientPortalApi';

export type DispatchDisplayRecipient = {
  email?: string | null;
  phone?: string | null;
  notifyStatus?: string | null;
  notifyError?: string | null;
  notifyKind?: string | null;
  notifySentVia?: string | null;
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

function notifyKindLabel(kind: string | null | undefined): string {
  return kind === 'resend' ? '재발송' : '최초';
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

/** 이메일·휴대폰 채널별 간략 상태 (예: 이메일✓·문자✗) */
function buildChannelDetail(r: DispatchDisplayRecipient): string {
  const hasEmail = Boolean(r.email?.trim());
  const hasPhone = Boolean(r.phone?.trim());
  if (!hasEmail && !hasPhone) return '';

  const status = r.notifyStatus || 'not_sent';
  const via = parseSentViaFlags(r.notifySentVia);
  const failed = parseNotifyErrors(r.notifyError);
  const parts: string[] = [];

  if (hasEmail) {
    if (status === 'sent' && via.emailOk) parts.push('이메일✓');
    else if (failed.emailFailed || (status === 'partial' && !via.emailOk)) parts.push('이메일✗');
    else if (status === 'sent') parts.push('이메일✓');
    else if (status === 'pending') parts.push('이메일…');
    else if (status === 'not_sent') parts.push('이메일·');
    else parts.push('이메일?');
  }

  if (hasPhone) {
    const phoneLabel = phoneChannelLabel(via);
    const phoneOk = via.alimtalkOk || via.smsOk;
    if (status === 'sent' && phoneOk) parts.push(`${phoneLabel}✓`);
    else if (failed.phoneFailed || (status === 'partial' && !phoneOk)) parts.push(`${phoneLabel}✗`);
    else if (status === 'sent' && !hasEmail) parts.push(`${phoneLabel}✓`);
    else if (status === 'pending') parts.push(`${phoneLabel}…`);
    else if (status === 'not_sent' && !hasEmail) parts.push(`${phoneLabel}·`);
    else if (status === 'partial' || status === 'failed') parts.push(`${phoneLabel}✗`);
  }

  return parts.length ? ` (${parts.join('·')})` : '';
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
    case 'skipped':
      return { text: '발송 생략', className: 'text-slate-400' };
    case 'not_sent':
      return { text: '미발송', className: 'text-slate-500' };
    default:
      return { text: status || '—', className: 'text-slate-400' };
  }
}

export function dispatchStatusDisplay(
  r: DispatchDisplayRecipient,
): { text: string; className: string; title?: string } {
  const hasEmail = Boolean(r.email?.trim());
  const hasPhone = Boolean(r.phone?.trim());

  if (!hasEmail && !hasPhone) {
    return {
      text: '연락처 없음',
      className: 'text-red-400',
      title: '이메일·휴대폰 정보가 없어 발송할 수 없습니다.',
    };
  }

  const status = r.notifyStatus || 'not_sent';

  if (status === 'failed' || status === 'partial') {
    const kindPrefix = notifyKindLabel(r.notifyKind);
    const channelDetail = buildChannelDetail(r);
    return {
      text:
        status === 'partial'
          ? `${kindPrefix} 일부 실패${channelDetail}`
          : `${kindPrefix} 실패${channelDetail}`,
      className: 'text-red-400',
      title: notifyErrorHint(r.notifyError) || '발송에 실패했습니다.',
    };
  }

  if (status === 'skipped') {
    if (!hasEmail && hasPhone) {
      return {
        text: '발송 생략',
        className: 'text-amber-300',
        title: notifyErrorHint(r.notifyError) || '이메일 없음 · SMS만 등록됨',
      };
    }
    return {
      text: '발송 생략',
      className: 'text-slate-400',
      title: notifyErrorHint(r.notifyError),
    };
  }

  if (status === 'sent') {
    const kindPrefix = notifyKindLabel(r.notifyKind);
    const channelDetail = buildChannelDetail(r);
    if (!hasEmail && hasPhone) {
      return {
        text: `${kindPrefix} 완료${channelDetail || '(SMS)'}`,
        className: 'text-emerald-300',
        title: '이메일 없음 · SMS로 발송됨',
      };
    }
    if (hasEmail && !hasPhone) {
      return {
        text: `${kindPrefix} 완료${channelDetail || '(이메일)'}`,
        className: 'text-emerald-300',
        title: '이메일로 발송됨',
      };
    }
    const viaLabel = formatSentViaLabel(r.notifySentVia);
    return {
      text: channelDetail
        ? `${kindPrefix} 완료${channelDetail}`
        : viaLabel
          ? `${kindPrefix} 완료 (${viaLabel})`
          : `${kindPrefix} 완료`,
      className: 'text-emerald-300',
      title: kindPrefix === '재발송' ? '접속 정보 재발송 완료' : '최초 접속 정보 발송 완료',
    };
  }

  if (status === 'pending') {
    return {
      text: `${notifyKindLabel(r.notifyKind)} 예약`,
      className: 'text-amber-300',
      title: '발송 예약됨',
    };
  }

  if (status === 'not_sent' && !hasEmail) {
    return {
      text: '미발송',
      className: 'text-slate-500',
      title: '이메일 없음 · 휴대폰만 등록됨',
    };
  }

  return notifyLabel(status);
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
