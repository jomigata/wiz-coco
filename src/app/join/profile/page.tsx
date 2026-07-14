'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 공유 검사코드 직접 입력·프로필 등록 플로우 제거 */
export default function JoinProfileRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/portal/login/');
  }, [router]);
  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 flex justify-center">
      <p className="text-slate-400">검사시작 화면으로 이동 중…</p>
    </div>
  );
}
