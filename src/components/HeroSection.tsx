'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readClientPortalSession } from '@/lib/clientPortalSession';
import { portalLoginHref } from '@/lib/portalLoginIntent';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useCounselorProfessionalAccess } from '@/hooks/useCounselorProfessionalAccess';
import ProfessionalContentGate from '@/components/auth/ProfessionalContentGate';
import { homeSectionTones } from '@/components/home/homeSectionStyles';
import { wizButtonClasses } from '@/components/layout/wizDesignTokens';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [examHref, setExamHref] = useState('/portal/login/');
  const [resultsHref, setResultsHref] = useState(portalLoginHref('results'));
  const { isAuthenticated } = useAuthResolved();
  const { isApprovedCounselor } = useCounselorProfessionalAccess();

  useEffect(() => {
    setIsVisible(true);
    const portal = readClientPortalSession();
    if (portal?.portalToken) {
      setExamHref('/portal/');
      setResultsHref('/portal/?focus=results');
    }
  }, []);

  return (
    <section className={`relative min-h-[88vh] flex items-center overflow-hidden ${homeSectionTones.hero.section}`}>
      <div className={`absolute inset-0 ${homeSectionTones.hero.glow}`} />
      <div className={`absolute inset-0 ${homeSectionTones.hero.glowSecondary}`} />
      <div className="absolute inset-0 opacity-[0.4]">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="hero-grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#e2e8f0" strokeWidth="0.35" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="container relative z-10 py-20 md:py-28">
        <div
          className={`max-w-3xl mx-auto text-center transition-all duration-1000 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide text-blue-700 mb-8 border border-blue-200 bg-blue-50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
            WizCoCo Professional Assessment
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-semibold mb-6 leading-[1.15] text-slate-900 tracking-tight">
            나의코드로 시작하는
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-teal-500">
              전문 심리검사
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 mb-12 leading-relaxed max-w-xl mx-auto">
            {isAuthenticated
              ? isApprovedCounselor
                ? '배정된 검사를 진행하거나, 파트너·요금 안내를 아래에서 확인할 수 있습니다.'
                : '배정된 검사를 진행하거나, 상담사 승인 후 전문가 기능을 이용할 수 있습니다.'
              : '안내 받으신 검사 코드와 비밀번호만 입력하면, 별도 가입 없이 배정된 검사를 바로 진행할 수 있습니다.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center max-w-lg mx-auto">
            <Link href={examHref} className={wizButtonClasses.primary}>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-lg" aria-hidden>
                ✦
              </span>
              검사 시작
            </Link>
            <Link href={resultsHref} className={wizButtonClasses.secondary}>
              검사 결과 확인
            </Link>
          </div>

          <ProfessionalContentGate>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link
                href="/discover/mini-check/"
                className="text-sm text-violet-600 hover:text-violet-700 underline-offset-4 hover:underline"
              >
                무료 3분 체크 (Discover)
              </Link>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <Link
                href="/partners/"
                className="text-sm text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline"
              >
                파트너 · 요금 안내
              </Link>
            </div>
          </ProfessionalContentGate>
        </div>
      </div>

      <div className={`absolute bottom-0 inset-x-0 h-28 bg-gradient-to-b ${homeSectionTones.hero.bottomFade} pointer-events-none`} />
    </section>
  );
}
