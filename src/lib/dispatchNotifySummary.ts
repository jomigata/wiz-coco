export type DispatchChannelBucket = {
  attempted: number;
  success: number;
  failed: number;
};

export type DispatchChannelSummary = {
  email: DispatchChannelBucket;
  phone: DispatchChannelBucket;
};

export function formatDispatchChannelSummary(
  summary: DispatchChannelSummary | null | undefined,
): string {
  if (!summary) return '';
  const lines: string[] = [];
  if (summary.email.attempted > 0) {
    lines.push(`이메일 성공 ${summary.email.success} · 실패 ${summary.email.failed}`);
  }
  if (summary.phone.attempted > 0) {
    lines.push(`휴대폰 성공 ${summary.phone.success} · 실패 ${summary.phone.failed}`);
  }
  return lines.join('\n');
}

export function parseDispatchChannelSummary(raw: unknown): DispatchChannelSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const readBucket = (key: string): DispatchChannelBucket => {
    const b = o[key];
    if (!b || typeof b !== 'object') {
      return { attempted: 0, success: 0, failed: 0 };
    }
    const bucket = b as Record<string, unknown>;
    return {
      attempted: Number(bucket.attempted) || 0,
      success: Number(bucket.success) || 0,
      failed: Number(bucket.failed) || 0,
    };
  };
  return { email: readBucket('email'), phone: readBucket('phone') };
}
