'use client';

import { useEffect } from 'react';

/** 이전 Google 로그인 전용 URL — 로그인 페이지로 통합 */
export default function GoogleLoginLegacyRedirectPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/login/');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex items-center justify-center">
      <p className="text-emerald-300 text-sm">로그인 페이지로 이동 중…</p>
    </div>
  );
}
