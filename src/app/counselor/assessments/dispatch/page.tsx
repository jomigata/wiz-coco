'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** 코드발송현황 URL → 통합 진행현황으로 리다이렉트 */
export default function DispatchRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = (searchParams.get('assessmentId') || '').trim();
    const qs = id ? `?assessmentId=${encodeURIComponent(id)}` : '';
    router.replace(`/counselor/assessments/progress${qs}`);
  }, [router, searchParams]);

  return null;
}
