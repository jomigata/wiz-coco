'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 예전 북마크 `/mypage/deleted-codes` → 마이페이지 삭제코드 탭으로 통합 (상단 바·레이아웃 유지) */
export default function DeletedCodesLegacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mypage?tab=deleted');
  }, [router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b1120] p-8 text-slate-300">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-500/40 border-t-transparent" />
        <p>마이페이지로 이동 중…</p>
      </div>
    </div>
  );
}
