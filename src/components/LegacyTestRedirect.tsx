'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 레거시 standalone 검사 → 포털 상담코드 검사실 */
export default function LegacyTestRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/portal/');
  }, [router]);
  return null;
}
