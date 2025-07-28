'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function CounselingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 pb-16">
      <Navigation />
      
      <div className="pt-32 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-10">
          <Link 
            href="/mypage" 
            className="text-blue-300 hover:text-blue-200 transition flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            마이페이지로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-white mt-6">상담 예약</h1>
          <p className="text-blue-200 mt-2">심리 상담 예약을 관리할 수 있습니다.</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">내 상담 예약</h2>
          <p className="text-blue-200 mb-8">현재 개발 중입니다. 곧 상담 예약 기능이 추가될 예정입니다.</p>
          
          <div className="flex justify-center">
            <Link 
              href="/counseling" 
              className="px-5 py-2.5 bg-blue-600 rounded-lg text-white font-medium text-sm shadow-md hover:bg-blue-700 transition-colors"
            >
              상담 프로그램 보기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 