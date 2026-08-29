'use client';

import React, { useEffect, useState } from 'react';
import { DISPATCH_ISSUING_NOTICE_BASE } from '@/lib/counselorDispatchSeed';

type Props = {
  active: boolean;
  className?: string;
};

export default function DispatchIssuingNoticeBanner({ active, className = '' }: Props) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!active) {
      setDotCount(1);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setDotCount((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 450);
    return () => window.clearInterval(timer);
  }, [active]);

  if (!active) return null;

  return (
    <span
      className={`rounded-md border border-amber-500/30 bg-amber-950/40 px-2 py-1 text-sm text-amber-200 ${className}`.trim()}
      aria-live="polite"
    >
      {DISPATCH_ISSUING_NOTICE_BASE}
      {'.'.repeat(dotCount)}
    </span>
  );
}
