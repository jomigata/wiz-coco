'use client';

import MbtiProResult from '@/components/tests/MbtiProResult';
import { Suspense } from 'react';
import Navigation from '@/components/Navigation';

export default function MbtiProResultPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Suspense fallback={
        <main className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden min-h-screen pt-16 pb-12">
          {/* Background pattern */}
          <div className="absolute inset-0 z-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="container mx-auto max-w-4xl py-6 relative z-10">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
              <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-blue-200">결과를 불러오는 중입니다...</p>
            </div>
          </div>
        </main>
      }>
        <MbtiProResult />
      </Suspense>
    </div>
  );
} 