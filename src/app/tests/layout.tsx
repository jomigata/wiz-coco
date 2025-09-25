'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('심리검사 대시보드');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // AI CoCo 심리검사 메뉴 카테고리 정의 (상담사 중심 v7.0)
  const testMenuCategories = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      href: '/tests',
      subItems: []
    },
    {
      id: 'personal-growth',
      label: '개인 심리 및 성장',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      subItems: [
        { id: 'personality-temperament', label: '성격 및 기질 탐색', href: '/tests/personality-temperament', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { id: 'identity-values', label: '자아정체감 및 가치관', href: '/tests/identity-values', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
        { id: 'potential-development', label: '잠재력 및 역량 개발', href: '/tests/potential-development', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: 'life-meaning', label: '삶의 의미 및 실존적 문제', href: '/tests/life-meaning', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' }
      ]
    },
    {
      id: 'relationships-social',
      label: '대인관계 및 사회적응',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      subItems: [
        { id: 'family-relations', label: '가족 관계', href: '/tests/family-relations', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { id: 'romantic-relations', label: '연인 및 부부 관계', href: '/tests/romantic-relations', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { id: 'friend-colleague', label: '친구 및 동료 관계', href: '/tests/friend-colleague', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { id: 'social-communication', label: '사회적 기술 및 소통', href: '/tests/social-communication', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
      ]
    },
    {
      id: 'emotional-mental',
      label: '정서 문제 및 정신 건강',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      subItems: [
        { id: 'depression-mood', label: '우울 및 기분 문제', href: '/tests/depression-mood', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { id: 'anxiety-stress', label: '불안 및 스트레스', href: '/tests/anxiety-stress', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { id: 'trauma-crisis', label: '외상 및 위기 개입', href: '/tests/trauma-crisis', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { id: 'addiction-impulse', label: '중독 및 충동 조절 문제', href: '/tests/addiction-impulse', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
        { id: 'self-esteem', label: '자존감 및 자기 문제', href: '/tests/self-esteem', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
      ]
    },
    {
      id: 'reality-life',
      label: '현실 문제 및 생활 관리',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0V4a2 2 0 00-2-2H10a2 2 0 00-2 2v2',
      subItems: [
        { id: 'career-work', label: '진로 및 직업 문제', href: '/tests/career-work', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0V4a2 2 0 00-2-2H10a2 2 0 00-2 2v2' },
        { id: 'economic-finance', label: '경제 및 재정 문제', href: '/tests/economic-finance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'health-body', label: '건강 및 신체 문제', href: '/tests/health-body', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { id: 'legal-admin', label: '법률 및 행정 문제', href: '/tests/legal-admin', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { id: 'daily-management', label: '일상생활 및 자기 관리', href: '/tests/daily-management', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4' }
      ]
    },
    {
      id: 'culture-environment',
      label: '문화 및 환경 적응',
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      subItems: [
        { id: 'multicultural', label: '다문화 적응', href: '/tests/multicultural', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'digital-adaptation', label: '디지털 환경 적응', href: '/tests/digital-adaptation', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { id: 'lifecycle-adaptation', label: '생애주기별 적응', href: '/tests/lifecycle-adaptation', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'social-environment', label: '특정 사회·환경 문제', href: '/tests/social-environment', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }
      ]
    }
  ];

  // 활성 섹션 결정 함수 (상담사 중심 v7.0)
  const getActiveSection = (path: string): string => {
    if (path === '/tests') return 'dashboard';
    
    // 개인 심리 및 성장
    if (path.startsWith('/tests/personality-temperament')) return 'personality-temperament';
    if (path.startsWith('/tests/identity-values')) return 'identity-values';
    if (path.startsWith('/tests/potential-development')) return 'potential-development';
    if (path.startsWith('/tests/life-meaning')) return 'life-meaning';
    
    // 대인관계 및 사회적응
    if (path.startsWith('/tests/family-relations')) return 'family-relations';
    if (path.startsWith('/tests/romantic-relations')) return 'romantic-relations';
    if (path.startsWith('/tests/friend-colleague')) return 'friend-colleague';
    if (path.startsWith('/tests/social-communication')) return 'social-communication';
    
    // 정서 문제 및 정신 건강
    if (path.startsWith('/tests/depression-mood')) return 'depression-mood';
    if (path.startsWith('/tests/anxiety-stress')) return 'anxiety-stress';
    if (path.startsWith('/tests/trauma-crisis')) return 'trauma-crisis';
    if (path.startsWith('/tests/addiction-impulse')) return 'addiction-impulse';
    if (path.startsWith('/tests/self-esteem')) return 'self-esteem';
    
    // 현실 문제 및 생활 관리
    if (path.startsWith('/tests/career-work')) return 'career-work';
    if (path.startsWith('/tests/economic-finance')) return 'economic-finance';
    if (path.startsWith('/tests/health-body')) return 'health-body';
    if (path.startsWith('/tests/legal-admin')) return 'legal-admin';
    if (path.startsWith('/tests/daily-management')) return 'daily-management';
    
    // 문화 및 환경 적응
    if (path.startsWith('/tests/multicultural')) return 'multicultural';
    if (path.startsWith('/tests/digital-adaptation')) return 'digital-adaptation';
    if (path.startsWith('/tests/lifecycle-adaptation')) return 'lifecycle-adaptation';
    if (path.startsWith('/tests/social-environment')) return 'social-environment';
    
    return 'dashboard';
  };

  // 페이지 제목 결정 함수 (상담사 중심 v7.0)
  const getPageTitle = (path: string): string => {
    const titleMap: { [key: string]: string } = {
      '/tests': 'AI CoCo 심리검사 대시보드',
      
      // 개인 심리 및 성장
      '/tests/personality-temperament': '성격 및 기질 탐색',
      '/tests/identity-values': '자아정체감 및 가치관',
      '/tests/potential-development': '잠재력 및 역량 개발',
      '/tests/life-meaning': '삶의 의미 및 실존적 문제',
      
      // 대인관계 및 사회적응
      '/tests/family-relations': '가족 관계',
      '/tests/romantic-relations': '연인 및 부부 관계',
      '/tests/friend-colleague': '친구 및 동료 관계',
      '/tests/social-communication': '사회적 기술 및 소통',
      
      // 정서 문제 및 정신 건강
      '/tests/depression-mood': '우울 및 기분 문제',
      '/tests/anxiety-stress': '불안 및 스트레스',
      '/tests/trauma-crisis': '외상 및 위기 개입',
      '/tests/addiction-impulse': '중독 및 충동 조절 문제',
      '/tests/self-esteem': '자존감 및 자기 문제',
      
      // 현실 문제 및 생활 관리
      '/tests/career-work': '진로 및 직업 문제',
      '/tests/economic-finance': '경제 및 재정 문제',
      '/tests/health-body': '건강 및 신체 문제',
      '/tests/legal-admin': '법률 및 행정 문제',
      '/tests/daily-management': '일상생활 및 자기 관리',
      
      // 문화 및 환경 적응
      '/tests/multicultural': '다문화 적응',
      '/tests/digital-adaptation': '디지털 환경 적응',
      '/tests/lifecycle-adaptation': '생애주기별 적응',
      '/tests/social-environment': '특정 사회·환경 문제'
    };
    return titleMap[path] || 'AI CoCo 심리검사 대시보드';
  };

  // 메뉴 클릭 핸들러
  const handleMenuClick = (sectionId: string, href: string) => {
    setActiveSection(sectionId);
    setPageTitle(getPageTitle(href));
    router.push(href);
  };

  // 경로 변경 시 활성 섹션 업데이트
  useEffect(() => {
    const currentSection = getActiveSection(pathname);
    const currentTitle = getPageTitle(pathname);
    setActiveSection(currentSection);
    setPageTitle(currentTitle);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 상단 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex pt-16">
        {/* 사이드바 */}
        <div className="relative w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
          <div className="p-6">
            {/* 로고 및 제목 */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI CoCo 메뉴</h1>
                <p className="text-sm text-gray-400">AI 심리분석 솔루션</p>
              </div>
            </div>

            {/* 메뉴 네비게이션 - 호버 팝업 방식 */}
            <nav className="space-y-3" role="navigation" aria-labelledby="test-menu-title">
              {testMenuCategories.map((category, index) => (
                <div key={category.id} className="relative">
                  {/* 중분류 메뉴 */}
                  {category.id === 'dashboard' ? (
                    <button
                      onClick={() => handleMenuClick('dashboard', category.href || '/tests')}
                      className={`w-full px-4 py-4 text-base font-semibold rounded-xl transition-all duration-300 group ${
                        activeSection === 'dashboard' 
                          ? 'text-white bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/30' 
                          : 'text-gray-300 bg-slate-800/50 hover:bg-slate-700/70 hover:text-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg 
                          className={`mr-3 h-6 w-6 flex-shrink-0 ${
                            activeSection === 'dashboard' ? 'text-white' : 'text-gray-400 group-hover:text-cyan-300'
                          }`}
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                        </svg>
                        <span className="truncate">{category.label}</span>
                      </div>
                    </button>
                  ) : (
                    <div
                      className={`w-full px-4 py-4 text-base font-semibold rounded-xl transition-all duration-300 cursor-pointer group ${
                        hoveredCategory === category.id
                          ? 'text-white bg-gradient-to-r from-slate-700 to-slate-600 shadow-lg'
                          : 'text-gray-300 bg-slate-800/50 hover:bg-slate-700/70 hover:text-white hover:shadow-md'
                      }`}
                      onMouseEnter={() => setHoveredCategory(category.id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg 
                            className={`mr-3 h-6 w-6 flex-shrink-0 transition-colors duration-300 ${
                              hoveredCategory === category.id ? 'text-white' : 'text-gray-400 group-hover:text-cyan-300'
                            }`}
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                          </svg>
                          <span className="truncate">{category.label}</span>
                        </div>
                        
                        {/* 우측 화살표 아이콘 */}
                        <svg 
                          className={`h-5 w-5 transition-all duration-300 ${
                            hoveredCategory === category.id 
                              ? 'text-white transform translate-x-1' 
                              : 'text-gray-500 group-hover:text-cyan-300'
                          }`}
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* 소분류 팝업 메뉴 */}
                  {category.subItems.length > 0 && hoveredCategory === category.id && (
                    <div 
                      className="absolute left-full top-0 ml-4 w-72 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-600/50 backdrop-blur-sm z-50 animate-in slide-in-from-left-2 duration-200"
                      onMouseEnter={() => setHoveredCategory(category.id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      {/* 팝업 헤더 */}
                      <div className="px-4 py-3 border-b border-slate-600/50">
                        <h3 className="text-sm font-semibold text-cyan-400 flex items-center">
                          <svg 
                            className="mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                          </svg>
                          {category.label}
                        </h3>
                      </div>
                      
                      {/* 소분류 목록 */}
                      <div className="p-2 space-y-1">
                        {category.subItems.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              handleMenuClick(subItem.id, subItem.href);
                              setHoveredCategory(null);
                            }}
                            className={`w-full flex items-center px-3 py-3 text-sm transition-all duration-200 rounded-lg group ${
                              activeSection === subItem.id 
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                                : 'text-gray-300 hover:bg-slate-700/70 hover:text-white'
                            }`}
                          >
                            <svg 
                              className={`mr-3 h-4 w-4 flex-shrink-0 transition-colors duration-200 ${
                                activeSection === subItem.id ? 'text-white' : 'text-gray-400 group-hover:text-cyan-300'
                              }`}
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={subItem.icon} />
                            </svg>
                            <span className="truncate leading-tight">{subItem.label}</span>
                            
                            {/* 활성 상태 표시 */}
                            {activeSection === subItem.id && (
                              <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {/* 페이지 헤더 */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{pageTitle}</h2>
                <p className="text-slate-400 mt-1">AI 기반 심리분석 솔루션으로 내담자를 지원하세요</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200 shadow-lg">
                  새 검사 시작
                </button>
              </div>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
