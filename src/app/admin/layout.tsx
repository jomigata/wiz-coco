'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState(getActiveSection(pathname));
  
  // 단순화된 상태 관리 시스템
  const [currentPageTitle, setCurrentPageTitle] = useState<string>('');

  // 현재 경로에 따라 활성화된 메뉴 항목 결정 (통합 메뉴 구조)
  function getActiveSection(path: string) {
    if (path === '/admin') return 'dashboard';
    if (path.includes('/admin/system-dashboard')) return 'system-dashboard';
    if (path.includes('/admin/realtime-monitoring')) return 'realtime-monitoring';
    if (path.includes('/admin/notification-management')) return 'notification-management';
    if (path.includes('/admin/user-management')) return 'user-management';
    if (path.includes('/admin/counseling-management')) return 'counseling-management';
    if (path.includes('/admin/psychological-tests')) return 'psychological-tests';
    if (path.includes('/admin/content-management')) return 'content-management';
    if (path.includes('/admin/system-settings')) return 'system-settings';
    if (path.includes('/admin/data-management')) return 'data-management';
    if (path.includes('/admin/security-management')) return 'security-management';
    return 'dashboard';
  }

  // 현재 페이지 타이틀 설정 (통합 메뉴 구조)
  function getPageTitle(section: string) {
    const titleMap: { [key: string]: string } = {
      'dashboard': '대시보드',
      'system-dashboard': '시스템 대시보드',
      'realtime-monitoring': '실시간 모니터링',
      'notification-management': '알림 관리',
      'user-management': '사용자 관리',
      'counseling-management': '상담 관리',
      'psychological-tests': '심리검사 관리',
      'content-management': '콘텐츠 관리',
      'system-settings': '시스템 설정',
      'data-management': '데이터 관리',
      'security-management': '보안 관리'
    };
    return titleMap[section] || '관리자 페이지';
  }

  // 경로 변경 시 페이지 타이틀 업데이트
  useEffect(() => {
    const section = getActiveSection(pathname);
    setActiveSection(section);
    setCurrentPageTitle(getPageTitle(section));
  }, [pathname]);

  // 18명 전문가 팀이 설계한 통합 관리자 메뉴 구조 (중분류 3가지)
  const adminMenuCategories = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      href: '/admin',
      subItems: []
    },
    {
      id: 'dashboard-monitoring',
      label: '대시보드 & 모니터링',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      subItems: [
        { id: 'system-dashboard', label: '시스템 대시보드', href: '/admin/system-dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'realtime-monitoring', label: '실시간 모니터링', href: '/admin/realtime-monitoring', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: 'notification-management', label: '알림 관리', href: '/admin/notification-management', icon: 'M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17h8.172l-2.586-2.586a2 2 0 00-2.828 0L4.828 17z' }
      ]
    },
    {
      id: 'user-counseling-management',
      label: '사용자 & 상담 관리',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      subItems: [
        { id: 'user-management', label: '사용자 관리', href: '/admin/user-management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'counseling-management', label: '상담 관리', href: '/admin/counseling-management', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { id: 'psychological-tests', label: '심리검사 관리', href: '/admin/psychological-tests', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { id: 'content-management', label: '콘텐츠 관리', href: '/admin/content-management', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }
      ]
    },
    {
      id: 'system-security-management',
      label: '시스템 & 보안 관리',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      subItems: [
        { id: 'system-settings', label: '시스템 설정', href: '/admin/system-settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        { id: 'data-management', label: '데이터 관리', href: '/admin/data-management', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'security-management', label: '보안 관리', href: '/admin/security-management', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
      ]
    }
  ];

  // 단순화된 메뉴 핸들러
  const handleMenuClick = (itemId: string, href: string) => {
    setActiveSection(itemId);
    setCurrentPageTitle(getPageTitle(itemId));
    router.push(href);
  };

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">관리자 메뉴</h1>
                <p className="text-sm text-gray-400">전문 상담 관리 시스템</p>
              </div>
            </div>
            
            {/* 사이드바 메뉴 */}
            <nav
              className="space-y-1"
              role="navigation"
              aria-labelledby="admin-menu-title"
            >
              {adminMenuCategories.map((category, index) => (
                <div key={category.id} className="space-y-1">
                  {/* 중분류 메뉴 - 대시보드는 클릭 가능, 나머지는 단순 표시 */}
                  {category.id === 'dashboard' ? (
                    <button
                      onClick={() => handleMenuClick('dashboard', category.href || '/admin')}
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
                          
                          {/* 선택된 항목의 좌우측 선 (항상 표시) */}
                          {activeSection === subItem.id && (
                            <>
                              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500"></div>
                              <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500"></div>
                            </>
                          )}
                          
                          <svg 
                            className={`mr-3 h-5 w-5 flex-shrink-0 relative z-10 ${
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
                  <h1 className="text-2xl font-bold text-white">{currentPageTitle || '관리자 대시보드'}</h1>
                  <p className="text-purple-100 text-sm mt-1">전문 상담 관리 시스템</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-purple-100">관리자</p>
                  <p className="text-white font-medium">김관리</p>
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