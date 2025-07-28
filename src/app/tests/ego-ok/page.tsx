'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EgoOkTestPage() {
  const router = useRouter();
  
  // 로그인 체크 제거 - 모든 사용자가 검사 가능하도록 수정

  return (
    <>
      <Navigation />
      
      <div className="bg-orange-950 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-6">
              Ego-OK 검사
            </h1>
            <p className="text-orange-200 mb-8 text-lg">
              아직 개발 중인 검사입니다. 곧 서비스할 예정입니다.
            </p>
            
            <div className="bg-orange-900/30 p-8 rounded-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                준비 중인 기능
              </h2>
              <p className="text-orange-200 mb-6">
                Ego-OK 검사는 현재 개발 중이며, 곧 서비스할 예정입니다.
                다른 검사들을 먼저 이용해보세요.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/tests/mbti"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                >
                  개인용 MBTI 검사
                </Link>
                <Link 
                  href="/tests/mbti_pro"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                >
                  전문가용 MBTI 검사
                </Link>
                <Link 
                  href="/tests/inside-mbti"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Inside MBTI 검사
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 