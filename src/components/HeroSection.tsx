'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden">
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
      
      <div className="container relative z-10 py-40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-20">
          <div className={`w-full md:w-1/2 mb-12 md:mb-0 text-center md:text-left transition-all duration-1000 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="px-5 py-1.5 bg-blue-400/20 text-blue-200 rounded-full text-sm font-medium mb-8 inline-block backdrop-blur-sm border border-blue-400/20">20년 전통의 심리 케어 전문가</span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight text-white">
              당신의 마음 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">건강을 위한</span> 전문가의 손길
            </h1>
            <p className="text-xl md:text-2xl text-blue-100/90 mb-12 leading-relaxed">
              과학적 진단과 체계적인 심리 케어 프로그램으로<br />
              더 나은 일상과 관계를 만들어 드립니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
              <Link href="/tests/mbti_pro">
                <button
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm border border-blue-400/30"
                >
                  무료 OK-MBTI 검사
                </button>
              </Link>
              <button
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-medium border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                onClick={() => console.log('자세히 알아보기')}
              >
                서비스 알아보기
              </button>
            </div>
            
            <div className="mt-16 flex items-center justify-center md:justify-start gap-8">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-indigo-900 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-xs shadow-lg transform hover:scale-105 transition-transform z-10" style={{ zIndex: 5-i }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                  </div>
                ))}
              </div>
              <div className="text-blue-100 flex flex-col">
                <span className="font-bold text-white text-2xl">2,000+</span>
                <span className="text-blue-200 text-sm">고객이 선택한 서비스</span>
              </div>
            </div>
          </div>
          
          <div className={`w-full md:w-1/2 flex justify-center transition-all duration-1000 delay-500 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="relative w-full max-w-lg aspect-square rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-filter"></div>
              <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-300/20 to-transparent"></div>
              <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-purple-500/40 to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 p-5 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500/30 rounded-full p-3 flex items-center justify-center backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-200">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white text-lg">심리 케어 프로그램</div>
                    <div className="text-sm text-blue-200">맞춤형 상담 진행 중</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 