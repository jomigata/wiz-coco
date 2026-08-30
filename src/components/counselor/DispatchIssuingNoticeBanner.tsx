'use client';

import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingMessage';
import { DISPATCH_ISSUING_NOTICE_BASE } from '@/lib/counselorDispatchSeed';

type Props = {
  active: boolean;
  className?: string;
};

export default function DispatchIssuingNoticeBanner({ active, className = '' }: Props) {
  if (!active) return null;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-950/40 px-2 py-1 text-sm text-amber-200 ${className}`.trim()}
      aria-live="polite"
    >
      <LoadingSpinner size="sm" className="border-amber-700/60 border-t-amber-300" />
      <span>{DISPATCH_ISSUING_NOTICE_BASE}</span>
    </span>
  );
}
