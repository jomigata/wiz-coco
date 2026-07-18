'use client';

import { Suspense } from 'react';

export default function CounselorPageHeader() {
  return (
    <Suspense fallback={null}>
      <header className="shrink-0 border-b border-sky-400/20 bg-gradient-to-r from-sky-600/20 via-[#162b4a] to-[#0f172a] py-2 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6">
          <p className="text-xs text-sky-200/55">콘텐츠 상담 관리 시스템</p>
        </div>
      </header>
    </Suspense>
  );
}
