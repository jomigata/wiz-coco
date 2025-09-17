'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function CounselorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('상담사 대시보드');

  // 상담사 메뉴 카테고리 정의
  const counselorMenuCategories = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      href: '/counselor',
      subItems: []
    },
    {
      id: 'client-management',
      label: '내담자 & 상담 관리',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      subItems: [
        { id: 'client-list', label: '내담자 목록', href: '/counselor/clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'counseling-schedule', label: '상담 일정', href: '/counselor/schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'counseling-records', label: '상담 기록', href: '/counselor/sessions', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'treatment-plans', label: '치료 계획', href: '/counselor/treatment-plans', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }
      ]
    },
    {
      id: 'test-management',
      label: '심리검사 & 분석',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      subItems: [
        { id: 'test-results', label: '검사 결과 분석', href: '/counselor/test-results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'test-recommendations', label: '검사 추천', href: '/counselor/test-recommendations', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'test-codes', label: '검사 코드 관리', href: '/counselor/test-codes', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' }
      ]
    },
    {
      id: 'tools-resources',
      label: '상담 도구 & 자료',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      subItems: [
        { id: 'counseling-notes', label: '상담 노트', href: '/counselor/notes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'progress-tracking', label: '진행 상황', href: '/counselor/progress', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
        { id: 'resources', label: '상담 자료', href: '/counselor/resources', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' }
      ]
    }
  ];

  // 활성 섹션 결정 함수
  const getActiveSection = (path: string): string => {
    if (path === '/counselor') return 'dashboard';
    if (path.startsWith('/counselor/clients')) return 'client-list';
    if (path.startsWith('/counselor/schedule')) return 'counseling-schedule';
    if (path.startsWith('/counselor/sessions')) return 'counseling-records';
    if (path.startsWith('/counselor/treatment-plans')) return 'treatment-plans';
    if (path.startsWith('/counselor/test-results')) return 'test-results';
    if (path.startsWith('/counselor/test-recommendations')) return 'test-recommendations';
    if (path.startsWith('/counselor/test-codes')) return 'test-codes';
    if (path.startsWith('/counselor/notes')) return 'counseling-notes';
    if (path.startsWith('/counselor/progress')) return 'progress-tracking';
    if (path.startsWith('/counselor/resources')) return 'resources';
    return 'dashboard';
  };

  // 페이지 제목 결정 함수
  const getPageTitle = (path: string): string => {
    const titleMap: { [key: string]: string } = {
      '/counselor': '상담사 대시보드',
      '/counselor/clients': '내담자 목록',
      '/counselor/schedule': '상담 일정',
      '/counselor/sessions': '상담 기록',
      '/counselor/treatment-plans': '치료 계획',
      '/counselor/test-results': '검사 결과 분석',
      '/counselor/test-recommendations': '검사 추천',
      '/counselor/test-codes': '검사 코드 관리',
      '/counselor/notes': '상담 노트',
      '/counselor/progress': '진행 상황',
      '/counselor/resources': '상담 자료'
    };
    return titleMap[path] || '상담사 대시보드';
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
              <h1 className="text-xl font-bold text-white">상담사 메뉴</h1>
              <p className="text-sm text-gray-400">전문 상담 관리 시스템</p>
            </div>
          </div>

          {/* 메뉴 네비게이션 */}
          <nav
            className="space-y-2"
            role="navigation"
            aria-labelledby="counselor-menu-title"
          >
            {counselorMenuCategories.map((category, index) => (
              <div key={category.id} className="space-y-1">
                {/* 중분류 메뉴 - 대시보드는 클릭 가능, 나머지는 단순 표시 */}
                {category.id === 'dashboard' ? (
                  <button
                    onClick={() => handleMenuClick('dashboard', category.href || '/counselor')}
                    className={`w-full px-4 py-3 text-sm font-medium border-b border-gray-600/30 bg-gray-800/20 hover:bg-gray-700/30 transition-all duration-300 rounded-lg group ${
                      activeSection === 'dashboard' 
                        ? 'text-cyan-300 bg-slate-700/30' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg 
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
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
                  <div className="px-4 py-3 text-sm font-medium text-gray-400 border-b border-gray-600/30 bg-gray-800/20">
                    <div className="flex items-center">
                      <svg 
                        className="mr-3 h-5 w-5 flex-shrink-0" 
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
                        className={`w-full flex items-center px-6 py-3 text-sm transition-all duration-300 rounded-lg ml-4 transform hover:scale-[1.02] relative group ${
                          activeSection === subItem.id 
                            ? 'bg-gradient-to-r from-slate-800/90 to-slate-700/90 text-white shadow-lg shadow-slate-500/20 font-semibold border-l-4 border-cyan-400' 
                            : 'text-gray-300 hover:bg-slate-700/30 hover:text-white hover:shadow-md'
                        }`}
                        aria-current={activeSection === subItem.id ? 'page' : undefined}
                      >
                        {/* 좌우측 밝은 선 효과 (마우스 오버시) */}
                        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* 선택된 항목의 좌우측 선 (항상 표시) */}
                        {activeSection === subItem.id && (
                          <>
                            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500"></div>
                            <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500"></div>
                          </>
                        )}
                        
                        <svg 
                          className={`mr-3 h-4 w-4 flex-shrink-0 relative z-10 ${
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
                        <span className="truncate relative z-10">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col">
        {/* 상단 헤더 */}
        <header className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
                <p className="text-purple-100 text-sm mt-1">전문 상담 관리 시스템</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-purple-100">상담사</p>
                <p className="text-white font-medium">김상담</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">김</span>
              </div>
            </div>
          </div>
        </header>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
