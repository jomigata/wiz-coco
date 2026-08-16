'use client';

import React from 'react';
import AuthLink from '@/components/auth/AuthLink';

type Props = {
  href: string;
  label: string;
};

/** 목록 상단 — 부모 메뉴로 돌아가기 화살표 */
export default function CounselorListBackLink({ href, label }: Props) {
  return (
    <AuthLink
      href={href}
      className="inline-flex shrink-0 items-center justify-center rounded-md border border-white/10 bg-slate-900/60 p-1.5 text-slate-300 transition-colors hover:border-sky-500/40 hover:bg-sky-950/40 hover:text-sky-200"
      title={label}
      aria-label={`${label}으로 이동`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </AuthLink>
  );
}
