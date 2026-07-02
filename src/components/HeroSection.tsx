'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readClientPortalSession } from '@/lib/clientPortalSession';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [examHref, setExamHref] = useState('/portal/login/');

  useEffect(() => {
    setIsVisible(true);
    const portal = readClientPortalSession();
    if (portal?.portalToken) setExamHref('/portal/');
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden">
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

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

      <div className="container relative z-10 py-28 md:py-36">
        <div
          className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <span className="px-4 py-1.5 bg-blue-400/20 text-blue-200 rounded-full text-sm font-medium mb-6 inline-block border border-blue-400/20">
            Wizcoco 심리검사
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
            나의코드로 시작하는
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
              마음 건강 검사
            </span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100/90 mb-10 leading-relaxed max-w-2xl mx-auto">
            안내 받으신 나의코드와 비밀번호를 입력하면
            <br className="hidden sm:block" />
            배정된 심리검사를 바로 진행할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={examHref}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/20 transition-all border border-blue-400/30"
            >
              <span aria-hidden>⭐</span>
              검사시작
            </Link>
            <Link
              href="/partners/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold text-white border border-white/25 hover:bg-white/10 transition-all"
            >
              상담사 · 기관 파트너
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
