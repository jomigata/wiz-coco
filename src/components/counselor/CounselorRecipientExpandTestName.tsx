'use client';

import React from 'react';
import AuthLink from '@/components/auth/AuthLink';
import { buildCounselorPortalChatHref } from '@/lib/portalChatApi';

type Props = {
  portalId: string;
  testName: string;
  testId: string;
};

/** 펼침 행 검사 목록 — 검사명 앞 1:1 채팅(💬) 링크 */
export default function CounselorRecipientExpandTestName({ portalId, testName, testId }: Props) {
  const label = testName || testId;
  if (!portalId.trim()) {
    return <span>{label}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <AuthLink
        href={buildCounselorPortalChatHref(portalId)}
        className="inline-flex shrink-0 items-center justify-center text-base leading-none opacity-90 transition hover:opacity-100"
        title="1:1 채팅"
        aria-label={`${label} — 1:1 채팅`}
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden>💬</span>
      </AuthLink>
      <span>{label}</span>
    </span>
  );
}
