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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* 최상단 사이트 네비게이션 - z-index 50 */}
      <div className="relative z-50">
        <Navigation />
      </div>
      
      {/* 전체 레이아웃 - 네비게이션 바 아래 전체 화면 사용 */}
      <div className="flex h-screen pt-20">
        {/* 좌측 사이드바 - 고정, z-index 40 */}
        <aside 
          className="w-64 bg-gray-800/40 backdrop-blur-sm border-r border-white/10 flex-shrink-0 fixed left-0 top-20 h-[calc(100vh-5rem)] overflow-y-auto z-40 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
          role="navigation"
          aria-label="관리자 메뉴"
        >
          <div className="p-4 pb-8">
            <h2 
              className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2"
              id="admin-menu-title"
            >
              관리자 메뉴
            </h2>
            
             <nav
               className="space-y-2"
               role="navigation"
               aria-labelledby="admin-menu-title"
             >
              {adminMenuCategories.map((category, index) => (
                <div key={category.id} className="space-y-1">
                  {/* 중분류 메뉴 - 호버 기능 완전 제거, 단순 표시만 */}
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

                  {/* 소분류 메뉴 - 항상 펼쳐진 상태, 선택된 항목 강력한 강조 */}
                  {category.subItems.length > 0 && (
                    <div className="space-y-1 pb-2">
                      {category.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleMenuClick(subItem.id, subItem.href)}
                          className={`w-full flex items-center px-6 py-3 text-sm transition-all duration-300 rounded-lg ml-4 transform hover:scale-[1.02] ${
                            activeSection === subItem.id 
                              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-indigo-500/40 font-bold border-l-4 border-white' 
                              : 'text-gray-300 hover:bg-indigo-600/20 hover:text-white hover:shadow-md'
                          }`}
                          aria-current={activeSection === subItem.id ? 'page' : undefined}
                        >
                          <svg 
                            className={`mr-3 h-4 w-4 flex-shrink-0 ${
                              activeSection === subItem.id ? 'text-white' : 'text-gray-400'
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
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>
        
        {/* 메인 콘텐츠 영역 - 전체 화면 사용, 좌측 여백만 적용 */}
        <main 
          className="flex-1 ml-64 h-[calc(100vh-5rem)] overflow-auto relative z-10"
          role="main"
          aria-label="관리자 콘텐츠"
        >
          {/* 현재 페이지 타이틀 표시 */}
          {currentPageTitle && (
            <div className="sticky top-0 z-20 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-sm border-b border-white/10 px-6 py-4">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3">📋</span>
                {currentPageTitle}
              </h1>
            </div>
          )}
          
          {/* 컨텐츠 영역을 전체 화면에 맞게 확장 */}
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 