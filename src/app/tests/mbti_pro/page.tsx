'use client';

import MbtiProTest from '@/components/tests/MbtiProTest';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function MbtiProTestContent() {
  return <MbtiProTest isLoggedIn={true} />;
}

export default function MbtiProPage() {
  const router = useRouter();
  
  // 로그인 체크 제거 - 모든 사용자가 검사 가능하도록 수정

  // 바로 심리검사 표시 (로그인 체크 없음)
  return (
    <div className="bg-emerald-950 min-h-screen h-full overflow-y-auto">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-lg">로딩 중...</div>
        </div>
      }>
        <MbtiProTestContent />
      </Suspense>
    </div>
  );
} 