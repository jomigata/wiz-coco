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

  // 현재 경로에 따라 활성화된 메뉴 항목 결정
  function getActiveSection(path: string) {
    if (path === '/admin') return 'dashboard';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/counselor-verification')) return 'counselor-verification';
    if (path.includes('/admin/permissions')) return 'permissions';
    if (path.includes('/admin/user-analytics')) return 'user-analytics';
    if (path.includes('/admin/dashboard')) return 'admin-dashboard';
    if (path.includes('/admin/test-codes')) return 'test-codes';
    if (path.includes('/admin/test-prefix')) return 'test-prefix';
    if (path.includes('/admin/analytics')) return 'data-analytics';
    if (path.includes('/admin/mbti-analysis')) return 'mbti-analysis';
    if (path.includes('/admin/tests')) return 'tests';
    if (path.includes('/admin/counseling-programs')) return 'counseling-programs';
    if (path.includes('/admin/notices')) return 'notices';
    if (path.includes('/admin/relationship-analysis')) return 'relationship-analysis';
    if (path.includes('/admin/deleted-codes')) return 'deleted-codes';
    if (path.includes('/admin/security')) return 'security';
    if (path.includes('/admin/email-config')) return 'email-config';
    if (path.includes('/admin/notification')) return 'notification';
    if (path.includes('/admin/backup')) return 'backup';
    if (path.includes('/admin/settings')) return 'settings';
    if (path.includes('/admin/logs')) return 'logs';
    return 'dashboard';
  }

  // 현재 페이지 타이틀 설정
  function getPageTitle(section: string) {
    const titleMap: { [key: string]: string } = {
      'dashboard': '대시보드',
      'users': '전체 사용자',
      'counselor-verification': '상담사 인증',
      'permissions': '권한 관리',
      'user-analytics': '사용자 분석',
      'admin-dashboard': '시스템 대시보드',
      'test-codes': '검사 코드 관리',
      'test-prefix': '접두사 관리',
      'data-analytics': '데이터 분석',
      'mbti-analysis': 'MBTI 분석',
      'tests': '심리검사 관리',
      'counseling-programs': '상담 프로그램',
      'notices': '공지사항',
      'relationship-analysis': '관계성 분석',
      'deleted-codes': '삭제된 코드',
      'security': '보안 설정',
      'email-config': '이메일 설정',
      'notification': '알림 설정',
      'backup': '백업 관리',
      'settings': '사이트 설정',
      'logs': '로그 관리'
    };
    return titleMap[section] || '관리자 페이지';
  }

  // 경로 변경 시 페이지 타이틀 업데이트
  useEffect(() => {
    const section = getActiveSection(pathname);
    setActiveSection(section);
    setCurrentPageTitle(getPageTitle(section));
  }, [pathname]);

  // 중분류-소분류 메뉴 구조 (정리된 버전 - 각 중분류당 4-5개 소분류 제한)
  const adminMenuCategories = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      href: '/admin',
      subItems: []
    },
    {
      id: 'user-management',
      label: '사용자 관리',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      subItems: [
        { id: 'users', label: '전체 사용자', href: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'counselor-verification', label: '상담사 인증', href: '/admin/counselor-verification', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { id: 'permissions', label: '권한 관리', href: '/admin/permissions', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { id: 'user-analytics', label: '사용자 분석', href: '/admin/user-analytics', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
      ]
    },
    {
      id: 'system-management',
      label: '시스템 관리',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      subItems: [
        { id: 'admin-dashboard', label: '시스템 대시보드', href: '/admin/dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'test-codes', label: '검사 코드 관리', href: '/admin/test-codes', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
        { id: 'test-prefix', label: '접두사 관리', href: '/admin/test-prefix', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
        { id: 'data-analytics', label: '데이터 분석', href: '/admin/analytics', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'mbti-analysis', label: 'MBTI 분석', href: '/admin/mbti-analysis', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }
      ]
    },
    {
      id: 'content-management',
      label: '콘텐츠 관리',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      subItems: [
        { id: 'tests', label: '심리검사 관리', href: '/admin/tests', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { id: 'counseling-programs', label: '상담 프로그램', href: '/admin/counseling-programs', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { id: 'notices', label: '공지사항', href: '/admin/notices', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
        { id: 'relationship-analysis', label: '관계성 분석', href: '/admin/relationship-analysis', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'deleted-codes', label: '삭제된 코드', href: '/admin/deleted-codes', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' }
      ]
    },
    {
      id: 'security-management',
      label: '보안 관리',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      subItems: [
        { id: 'security', label: '보안 설정', href: '/admin/security', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { id: 'email-config', label: '이메일 설정', href: '/admin/email-config', icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { id: 'notification', label: '알림 설정', href: '/admin/notification', icon: 'M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 17h8.172l-2.586-2.586a2 2 0 00-2.828 0L4.828 17z' },
        { id: 'backup', label: '백업 관리', href: '/admin/backup', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' }
      ]
    },
    {
      id: 'system-settings',
      label: '시스템 설정',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      subItems: [
        { id: 'settings', label: '사이트 설정', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        { id: 'logs', label: '로그 관리', href: '/admin/logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }
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
                  {/* 중분류 메뉴 - 호버 기능 제거, 단순 표시만 */}
                  <div className="px-4 py-2 text-sm font-medium text-gray-400 border-b border-gray-600/30">
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
                      <span className="truncate">{category.label}</span>
                    </div>
                  </div>

                  {/* 소분류 메뉴 - 항상 펼쳐진 상태, 선택된 항목 강조 */}
                  {category.subItems.length > 0 && (
                    <div className="space-y-1">
                      {category.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleMenuClick(subItem.id, subItem.href)}
                          className={`w-full flex items-center px-6 py-3 text-sm transition-all duration-200 rounded-lg ml-4 transform hover:scale-[1.02] ${
                            activeSection === subItem.id 
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 font-semibold' 
                              : 'text-gray-300 hover:bg-indigo-600/30 hover:text-white'
                          }`}
                          aria-current={activeSection === subItem.id ? 'page' : undefined}
                        >
                          <svg 
                            className="mr-3 h-4 w-4 flex-shrink-0" 
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