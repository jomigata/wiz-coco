'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 레거시 메뉴 href → 이고-오케이그램 검사 */
export default function MbtiAnalysisRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/tests/ego-ok/');
  }, [router]);
  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center">
      <p className="text-emerald-200 text-sm">이고-오케이그램 검사로 이동 중…</p>
    </div>
  );
}
