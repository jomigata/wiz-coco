'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 레거시 삭제코드 페이지 → 마이페이지 검사기록 탭 */
export default function LegacyDeletedCodesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/mypage?tab=records');
  }, [router]);
  return null;
}
