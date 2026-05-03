'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DeletedCodesContent } from './components';

// 로딩 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b1120] p-8 text-slate-300">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-500/40 border-t-transparent" />
        <p>로딩 중...</p>
      </div>
    </div>
  );
}

// 클라이언트 컴포넌트 - useSearchParams 사용
function DeletedCodesPage() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';
  
  return <DeletedCodesContent isEmbedded={isEmbedded} />;
}

// Next.js 페이지 컴포넌트
export default function DeletedCodesPageWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DeletedCodesPage />
    </Suspense>
  );
} 