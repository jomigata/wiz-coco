'use client';

import React, { useEffect, useState } from 'react';
import {
  fetchNotificationChannelStatus,
  type NotificationChannelStatus,
} from '@/lib/notificationApi';

function ChannelBadge({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
      }`}
    >
      <p className="font-medium">{label}</p>
      <p className="text-xs opacity-80">{ok ? '설정됨' : '미설정'}</p>
      {detail ? <p className="mt-1 text-[11px] opacity-70">{detail}</p> : null}
    </div>
  );
}

export default function NotificationChannelStatus() {
  const [status, setStatus] = useState<NotificationChannelStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotificationChannelStatus()
      .then(setStatus)
      .catch((e) => setError(e instanceof Error ? e.message : '조회 실패'));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        알림 채널 상태를 불러오지 못했습니다: {error}
      </div>
    );
  }

  if (!status) {
    return <p className="text-sm text-slate-500">알림 채널 확인 중…</p>;
  }

  const smsProviders = status.sms.providers.length
    ? status.sms.providers.join(', ')
    : undefined;
  const alimtalkDetail = status.kakaoAlimtalk.configured
    ? `검사·케어 템플릿 ${status.kakaoAlimtalk.templates.testReminder ? '✓' : '—'} / ${status.kakaoAlimtalk.templates.careAssignment ? '✓' : '—'}`
    : 'Solapi pfId·템플릿 Secret 필요';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white mb-3">알림 채널 상태</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ChannelBadge
          label="이메일 (SMTP)"
          ok={status.email.configured}
          detail={status.email.configured ? status.email.provider : 'SMTP Secrets 필요'}
        />
        <ChannelBadge
          label="SMS"
          ok={status.sms.configured}
          detail={smsProviders}
        />
        <ChannelBadge
          label="카카오 알림톡"
          ok={status.kakaoAlimtalk.configured}
          detail={alimtalkDetail}
        />
      </div>
      <p className="mt-3 text-[11px] text-slate-500">
        자동 리마인더: cohort 매일 09:00 · 개별 월 12:00 · 케어 마감 매일 13:00 (KST)
      </p>
    </div>
  );
}
