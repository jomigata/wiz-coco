"use client";

import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import { useEffect, useState } from 'react';

export default function TestsPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    setIsVisible(true);
    
    // 로그인 상태 확인
    const checkLoginStatus = async () => {
      try {
        // 인증 상태 확인 API 호출
        const response = await fetch('/api/auth/status', {
          method: 'GET',
          credentials: 'include' // 쿠키 포함
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(data.isLoggedIn);
          
          if (data.isLoggedIn && data.user) {
            setUserId(data.user.id || null);
          }
        } else {
          setIsLoggedIn(false);
          setUserId(null);
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);
        setIsLoggedIn(false);
        setUserId(null);
      }
    };
    
    checkLoginStatus();
  }, []);

  return (
    <>
      <Navigation />
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
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* 심리검사 목록 섹션 */}
        <section className="relative z-10 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <p className="text-blue-200 mb-16 max-w-2xl mx-auto text-center" style={{ letterSpacing: "-0.02em", lineHeight: "1.6" }}>
                최신 심리학 기반 검사와 맞춤형 솔루션으로 자신을 이해하고 더 나은 내일을 만들어 보세요.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* 개인용 MBTI 카드 */}
                <Link href="/tests/mbti" className="block transition-transform hover:scale-[1.02]">
                  <div className="h-full rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm shadow-lg border border-white/20">
                    <div className="p-6 text-center">
                      <h2 className="text-3xl font-bold text-white">개인용 MBTI</h2>
                    </div>
                    <div className="p-6 border-t border-white/20">
                      <h3 className="text-xl font-bold text-white mb-3">개인용 MBTI</h3>
                      <p className="text-blue-200 mb-4">
                        나의 성격유형을 파악하고 장단점을 이해하여 더 나은 관계와 성장을 도모하세요
                      </p>
                      <p className="text-sm text-blue-300">소요시간: 15-20분 • 93문항</p>
                    </div>
                  </div>
                </Link>

                {/* 전문가용 MBTI 카드 */}
                <Link href="/tests/mbti_pro" className="block transition-transform hover:scale-[1.02]">
                  <div className="h-full rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm shadow-lg border border-white/20">
                    <div className="p-6 text-center">
                      <h2 className="text-3xl font-bold text-white">전문가용 MBTI</h2>
                    </div>
                    <div className="p-6 border-t border-white/20">
                      <h3 className="text-xl font-bold text-white mb-3">전문가용 MBTI</h3>
                      <p className="text-blue-200 mb-4">
                        전문가의 해석과 함께 심층적인 성격유형 분석을 통해 자신의 성장 가능성을 발견하세요
                      </p>
                      <p className="text-sm text-blue-300">소요시간: 5-10분 • 20문항</p>
                    </div>
                  </div>
                </Link>

                {/* 그룹형 MBTI 카드 */}
                <Link href="/tests/mbti_pro" className="block transition-transform hover:scale-[1.02]">
                  <div className="h-full rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm shadow-lg border border-white/20">
                    <div className="p-6 text-center">
                      <h2 className="text-3xl font-bold text-white">그룹형 MBTI</h2>
                    </div>
                    <div className="p-6 border-t border-white/20">
                      <h3 className="text-xl font-bold text-white mb-3">그룹형 MBTI</h3>
                      <p className="text-blue-200 mb-4">
                        팀원들의 MBTI 유형을 분석하고 팀 내 소통과 협업을 향상시키세요
                      </p>
                      <p className="text-sm text-blue-300">소요시간: 5-10분 • 팀 분석 및 보고서</p>
                    </div>
                  </div>
                </Link>

                {/* 인사이드 MBTI 카드 */}
                <Link href="/tests/inside-mbti" className="block transition-transform hover:scale-[1.02]">
                  <div className="h-full rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm shadow-lg border border-white/20">
                    <div className="p-6 text-center">
                      <h2 className="text-3xl font-bold text-white">인사이드 MBTI</h2>
                    </div>
                    <div className="p-6 border-t border-white/20">
                      <h3 className="text-xl font-bold text-white mb-3">인사이드 MBTI</h3>
                      <p className="text-blue-200 mb-4">
                        두 사람의 MBTI 유형을 비교하여 관계 역학과 상호작용 패턴을 심층적으로 분석해 보세요
                      </p>
                      <p className="text-sm text-blue-300">소요시간: 5-10분 • 관계 분석 및 조언</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
