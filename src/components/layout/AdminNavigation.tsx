'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // 스크롤 감지 효과
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 모바일 메뉴 토글
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 활성 링크 확인 함수
  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && pathname && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-gray-900 shadow-md py-2' : 'bg-gray-900/80 backdrop-blur-sm py-4'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* 로고 */}
            <Link href="/admin" className="flex items-center gap-2">
              <span className="flex items-center justify-center h-8 w-8 rounded-md bg-indigo-600 text-white font-bold">A</span>
              <span className="text-white font-semibold text-xl">관리자 페이지</span>
            </Link>

            {/* 데스크탑 메뉴 */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin') && pathname === '/admin'
                    ? 'bg-indigo-700 text-white'
                    : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
                }`}
              >
                대시보드
              </Link>
              <Link
                href="/admin/test-prefix"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/test-prefix')
                    ? 'bg-indigo-700 text-white'
                    : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
                }`}
              >
                접두사 관리
              </Link>
              <Link
                href="/admin/test-codes"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/test-codes')
                    ? 'bg-indigo-700 text-white'
                    : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
                }`}
              >
                코드 관리
              </Link>
              <Link
                href="/admin/client"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/client')
                    ? 'bg-indigo-700 text-white'
                    : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
                }`}
              >
                사용자 관리
              </Link>
              <Link
                href="/admin/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'bg-indigo-700 text-white'
                    : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
                }`}
              >
                통계
              </Link>
              
              {/* 구분선 */}
              <div className="h-6 w-px bg-gray-600 mx-2"></div>
              
              {/* 사이트로 돌아가기 버튼 */}
              <Link
                href="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                사이트로 돌아가기
              </Link>
            </nav>

            {/* 모바일 메뉴 버튼 */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              onClick={toggleMenu}
            >
              <span className="sr-only">메뉴 열기/닫기</span>
              <svg
                className={`h-6 w-6 ${isMenuOpen ? 'hidden' : 'block'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`h-6 w-6 ${isMenuOpen ? 'block' : 'hidden'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 드롭다운 */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        <div className="relative bg-gray-900 h-full w-64 pt-16 px-4 overflow-y-auto">
          <nav className="flex flex-col space-y-1 mt-4">
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin') && pathname === '/admin'
                  ? 'bg-indigo-700 text-white'
                  : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              대시보드
            </Link>
            <Link
              href="/admin/test-prefix"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin/test-prefix')
                  ? 'bg-indigo-700 text-white'
                  : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              접두사 관리
            </Link>
            <Link
              href="/admin/test-codes"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin/test-codes')
                  ? 'bg-indigo-700 text-white'
                  : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              코드 관리
            </Link>
            <Link
              href="/admin/client"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin/client')
                  ? 'bg-indigo-700 text-white'
                  : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              사용자 관리
            </Link>
            <Link
              href="/admin/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin/dashboard')
                  ? 'bg-indigo-700 text-white'
                  : 'text-gray-300 hover:bg-indigo-700/50 hover:text-white'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              통계
            </Link>
            
            {/* 구분선 */}
            <div className="h-px w-full bg-gray-700 my-2"></div>
            
            {/* 사이트로 돌아가기 버튼 */}
            <Link
              href="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              사이트로 돌아가기
            </Link>
          </nav>
        </div>
        {/* 백드롭 */}
        <div
          className={`absolute inset-0 -z-10 bg-black/50 transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMenuOpen(false)}
        ></div>
      </div>
      
      {/* 네비게이션 높이만큼 여백 추가 */}
      <div className="h-16"></div>
    </>
  );
} 