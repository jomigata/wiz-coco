'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LegacyProgressRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const assessmentId = (searchParams.get('assessmentId') || '').trim();
    if (assessmentId) {
      const params = new URLSearchParams(searchParams.toString());
      router.replace(`/counselor/assessments/progress?${params.toString()}`);
      return;
    }
    router.replace('/counselor/assessments');
  }, [router, searchParams]);

  return <p className="py-8 text-center text-sm text-slate-500">이동 중…</p>;
}

/** @deprecated 기존 URL 호환용 리다이렉트 */
export default function ProgressPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-sm text-slate-500">이동 중…</p>}>
      <LegacyProgressRedirect />
    </Suspense>
  );
}
