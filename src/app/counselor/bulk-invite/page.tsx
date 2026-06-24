'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 레거시 경로 → 개별 발급 검사코드 생성으로 이동 */
export default function BulkInviteRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/counselor/assessments/new');
  }, [router]);
  return <p className="text-slate-400 py-12 text-center">개별 발급 화면으로 이동 중…</p>;
}
