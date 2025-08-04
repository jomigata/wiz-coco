'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DeletedCodesContent } from './components';

// 로딩 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-blue-200">로딩 중...</p>
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