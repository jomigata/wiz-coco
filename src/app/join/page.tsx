'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resetAllSessionsBeforePortalLinkEntry } from '@/lib/portalLinkEntryReset';

/** 검사코드 직접 입력 플로우 제거 — 나의코드 로그인(검사시작)으로 이동 */
export default function JoinRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void resetAllSessionsBeforePortalLinkEntry().then(() => {
      if (cancelled) return;
      router.replace('/portal/login/');
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 pt-24 flex justify-center">
      <p className="text-slate-400">검사시작 화면으로 이동 중…</p>
    </div>
  );
}
