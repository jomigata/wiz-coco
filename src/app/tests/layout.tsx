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

  // 심리검사 메뉴 카테고리 정의
  const testMenuCategories = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      href: '/tests',
      subItems: []
    },
    {
      id: 'personality-tests',
      label: '성격 및 기질 검사',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      subItems: [
        { id: 'mbti', label: 'MBTI 성격유형검사', href: '/tests/mbti', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { id: 'enneagram', label: '에니어그램 검사', href: '/tests/enneagram', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
        { id: 'big-five', label: '빅파이브 성격검사', href: '/tests/big-five', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'tci', label: '기질검사 (TCI)', href: '/tests/tci', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z' }
      ]
    },
    {
      id: 'emotion-tests',
      label: '감정 및 스트레스 검사',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      subItems: [
        { id: 'depression', label: '우울증 자가진단', href: '/tests/depression', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { id: 'anxiety', label: '불안장애 검사', href: '/tests/anxiety', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { id: 'stress', label: '스트레스 반응척도', href: '/tests/stress', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: 'emotion-regulation', label: '감정조절곤란척도', href: '/tests/emotion-regulation', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' }
      ]
    }
  ];

  // 활성 섹션 결정 함수
  const getActiveSection = (path: string): string => {
    if (path === '/tests') return 'dashboard';
    if (path.startsWith('/tests/mbti')) return 'mbti';
    if (path.startsWith('/tests/enneagram')) return 'enneagram';
    if (path.startsWith('/tests/big-five')) return 'big-five';
    if (path.startsWith('/tests/tci')) return 'tci';
    if (path.startsWith('/tests/depression')) return 'depression';
    if (path.startsWith('/tests/anxiety')) return 'anxiety';
    if (path.startsWith('/tests/stress')) return 'stress';
    if (path.startsWith('/tests/emotion-regulation')) return 'emotion-regulation';
    return 'dashboard';
  };

  // 페이지 제목 결정 함수
  const getPageTitle = (path: string): string => {
    const titleMap: { [key: string]: string } = {
      '/tests': '심리검사 대시보드',
      '/tests/mbti': 'MBTI 성격유형검사',
      '/tests/enneagram': '에니어그램 검사',
      '/tests/big-five': '빅파이브 성격검사',
      '/tests/tci': '기질검사 (TCI)',
      '/tests/depression': '우울증 자가진단',
      '/tests/anxiety': '불안장애 검사',
      '/tests/stress': '스트레스 반응척도',
      '/tests/emotion-regulation': '감정조절곤란척도'
    };
    return titleMap[path] || '심리검사 대시보드';
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
        <div className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
          <div className="p-6">
            {/* 로고 및 제목 */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">심리검사 메뉴</h1>
                <p className="text-sm text-gray-400">전문 심리검사 시스템</p>
              </div>
            </div>

            {/* 메뉴 네비게이션 */}
            <nav className="space-y-2" role="navigation" aria-labelledby="test-menu-title">
              {testMenuCategories.map((category, index) => (
                <div key={category.id} className="space-y-1">
                  {/* 중분류 메뉴 - 대시보드는 클릭 가능, 나머지는 단순 표시 */}
                  {category.id === 'dashboard' ? (
                    <button
                      onClick={() => handleMenuClick('dashboard', category.href || '/tests')}
                      className={`w-full px-4 py-3 text-base font-medium border-b border-gray-600/30 bg-gray-800/20 hover:bg-gray-700/30 transition-all duration-300 rounded-lg group ${
                        activeSection === 'dashboard' 
                          ? 'text-cyan-300 bg-slate-700/30' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg 
                          className={`mr-3 h-6 w-6 flex-shrink-0 ${
                            activeSection === 'dashboard' ? 'text-cyan-300' : 'text-gray-400 group-hover:text-cyan-300'
                          }`}
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                        </svg>
                        <span className="truncate font-semibold">{category.label}</span>
                      </div>
                    </button>
                  ) : (
                    <div className="px-4 py-3 text-base font-medium text-gray-400 border-b border-gray-600/30 bg-gray-800/20">
                      <div className="flex items-center">
                        <svg 
                          className="mr-3 h-6 w-6 flex-shrink-0" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                        </svg>
                        <span className="truncate font-semibold">{category.label}</span>
                      </div>
                    </div>
                  )}

                  {/* 소분류 메뉴 - 항상 펼쳐진 상태, 고급스러운 선택 효과 */}
                  {category.subItems.length > 0 && (
                    <div className="space-y-1 pb-2">
                      {category.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleMenuClick(subItem.id, subItem.href)}
                          className={`w-full flex items-center px-6 py-3 text-base transition-all duration-300 rounded-lg ml-4 transform hover:scale-[1.02] relative group ${
                            activeSection === subItem.id 
                              ? 'bg-gradient-to-r from-slate-800/90 to-slate-700/90 text-white shadow-lg shadow-slate-500/20 font-semibold border-l-4 border-cyan-400' 
                              : 'text-gray-300 hover:bg-slate-700/30 hover:text-white hover:shadow-md'
                          }`}
                          aria-current={activeSection === subItem.id ? 'page' : undefined}
                        >
                          {/* 좌우측 밝은 선 효과 (마우스 오버시) */}
                          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <svg 
                            className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-300 ${
                              activeSection === subItem.id ? 'text-cyan-300' : 'text-gray-400 group-hover:text-cyan-300'
                            }`}
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={subItem.icon} />
                          </svg>
                          <span className="truncate">{subItem.label}</span>

                          {/* 활성 상태일 때 우측 화살표 */}
                          {activeSection === subItem.id && (
                            <svg 
                              className="ml-auto h-4 w-4 text-cyan-300 animate-pulse" 
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      ))}
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
                <p className="text-slate-400 mt-1">전문 심리검사를 효율적으로 관리하세요</p>
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
