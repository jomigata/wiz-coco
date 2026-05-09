'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * App Router에서 라우트(URL)가 바뀔 때 짧게 블러 오버레이를 띄워 전환 체감 지연을 완화합니다.
 * (세그먼트별 Suspense/loading.tsx와 함께 쓰면 더 자연스럽습니다.)
 */
export default function RouteTransitionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams?.toString?.() ?? ''}`;

  const prevKeyRef = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (prevKeyRef.current === null) {
      prevKeyRef.current = routeKey;
      return;
    }
    if (prevKeyRef.current !== routeKey) {
      prevKeyRef.current = routeKey;
      setBusy(true);
      const id = window.setTimeout(() => setBusy(false), 320);
      return () => window.clearTimeout(id);
    }
  }, [routeKey]);

  return (
    <div className="relative min-h-0 flex-1">
      {children}
      {busy ? (
        <div
          className="pointer-events-auto fixed inset-x-0 bottom-0 top-16 z-[60] flex items-start justify-center bg-slate-950/25 px-4 pt-[18vh] backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <div className="rounded-xl border border-white/15 bg-[#0f172a]/80 px-5 py-3 text-center shadow-lg backdrop-blur-md">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            <p className="mt-2 text-xs font-medium text-slate-100">페이지 불러오는 중…</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
