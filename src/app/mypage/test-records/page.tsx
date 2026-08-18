'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 레거시 `/mypage/test-records` → 마이페이지 검사기록 탭 */
export default function LegacyTestRecordsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/mypage?tab=records');
  }, [router]);
  return null;
}
