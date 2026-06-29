'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { buildPortalProgressReturnUrl } from '@/lib/portalReturnPath';

function DashboardRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const expand = (searchParams.get('expand') || '').trim();
    router.replace(buildPortalProgressReturnUrl(expand || undefined));
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 flex justify-center">
        <p className="text-slate-400">내 검사실로 이동 중…</p>
      </div>
    </div>
  );
}

/** @deprecated 검사실은 내 검사실(/portal)로 통합 — 기존 URL 호환용 리다이렉트 */
export default function JoinDashboardRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 pt-24 flex justify-center">
          <p className="text-slate-400">내 검사실로 이동 중…</p>
        </div>
      }
    >
      <DashboardRedirectContent />
    </Suspense>
  );
}
