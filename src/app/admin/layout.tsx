'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState(getActiveSection(pathname));

  // 현재 경로에 따라 활성화된 메뉴 항목 결정
  function getActiveSection(path: string) {
    if (path === '/admin') return 'dashboard';
    if (path.includes('/admin/test-codes')) return 'test-codes';
    if (path.includes('/admin/test-prefix')) return 'test-prefix';
    if (path.includes('/admin/client')) return 'client';
    if (path.includes('/admin/verification')) return 'verification';
    if (path.includes('/admin/dashboard')) return 'dashboard-stats';
    if (path.includes('/admin/analytics')) return 'analytics';
    if (path.includes('/admin/mbti-analysis')) return 'mbti-analysis';
    if (path.includes('/admin/relationship-analysis')) return 'relationship-analysis';
    if (path.includes('/admin/deleted-codes')) return 'deleted-codes';
    if (path.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  }

  // 사이드 메뉴 항목 - 모든 11개 메뉴
  const sideMenuItems = [
    { id: 'dashboard', label: '대시보드', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', href: '/admin' },
    { id: 'test-codes', label: '코드 관리', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', href: '/admin/test-codes' },
    { id: 'test-prefix', label: '접두사 관리', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', href: '/admin/test-prefix' },
    { id: 'client', label: '사용자 관리', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', href: '/admin/client' },
    { id: 'verification', label: '인증 관리', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', href: '/admin/verification' },
    { id: 'dashboard-stats', label: '통계', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', href: '/admin/dashboard' },
    { id: 'analytics', label: '데이터 분석', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', href: '/admin/analytics' },
    { id: 'mbti-analysis', label: 'MBTI 분석', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', href: '/admin/mbti-analysis' },
    { id: 'relationship-analysis', label: '관계성 분석', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', href: '/admin/relationship-analysis' },
    { id: 'deleted-codes', label: '삭제된 코드', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', href: '/admin/deleted-codes' },
    { id: 'settings', label: '시스템 설정', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', href: '/admin/settings' },
  ];

  // 메뉴 항목 클릭 핸들러
  const handleMenuClick = (itemId: string, href: string) => {
    setActiveSection(itemId);
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
              {sideMenuItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id, item.href)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-gray-300 hover:bg-gradient-to-r hover:from-indigo-600/30 hover:to-indigo-700/30 hover:text-white hover:shadow-md'
                  }`}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                  title={item.label}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <svg 
                    className="mr-3 h-5 w-5 flex-shrink-0" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  <span className="truncate">{item.label}</span>
                </button>
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
          {/* 컨텐츠 영역을 전체 화면에 맞게 확장 */}
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 