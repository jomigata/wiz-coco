"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { setAuthState, getAuthState, removeItem } from '@/utils/localStorageManager';

export default function Navigation() {
  const router = useRouter();
  const { user, loading, logout } = useFirebaseAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("/");
  // 통합 메뉴 상태 관리 - 하나의 메뉴만 열리도록
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 편의를 위한 개별 상태 계산
  const isDropdownOpen = activeMenu === 'user';
  const isTestDropdownOpen = activeMenu === 'test';
  const isCounselingDropdownOpen = activeMenu === 'counseling';
  const isUserMenuOpen = activeMenu === 'additional';

  // Firebase 사용자 정보를 기반으로 한 상태 계산
  const isLoggedIn = !!user && !loading;
  const userEmail = user?.email || "";
  const userName = user?.displayName || "";
  const userRole = user?.role || "user";

  // Firebase 인증 상태 디버깅 및 현재 경로 설정
  useEffect(() => {
    console.log('Navigation 컴포넌트 - Firebase 인증 상태:', {
      user: user,
      loading: loading,
      isLoggedIn: isLoggedIn,
      userEmail: userEmail,
      userName: userName,
      userRole: userRole
    });

    // 현재 경로에 따라 active 항목 설정
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setActiveItem(path);
    }
  }, [user, loading, isLoggedIn, userEmail, userName, userRole]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Firebase 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      console.log('Firebase 로그아웃 시작');
      
      // Firebase 로그아웃 실행
      const result = await logout();
      
      if (result.success) {
        console.log('Firebase 로그아웃 성공');
        
        // 로컬 스토리지 정리 (기존 인증 정보 제거 - 호환성 유지)
        removeItem('auth-state');
      removeItem('user');
      removeItem('userToken');
        removeItem('oktest-auth-state');
      
        // 쿠키 정리
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
        // 로그아웃 이벤트 발생 (다른 컴포넌트 호환성)
      const logoutEvent = new CustomEvent('login-status-changed', {
        detail: {
          isLoggedIn: false,
          timestamp: Date.now()
        },
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(logoutEvent);
      console.log('로그아웃 이벤트 발생됨');
      
        // 홈페이지로 이동
        console.log('홈으로 리다이렉트');
        router.push('/');
        } else {
        console.error('Firebase 로그아웃 실패:', result.error);
        // 실패해도 로컬 정리는 수행
        removeItem('auth-state');
        removeItem('user');
        removeItem('userToken');
        router.push('/');
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 오류 발생 시에도 로컬 정리 및 리다이렉트
      removeItem('auth-state');
      removeItem('user');
      removeItem('userToken');
      router.push('/');
    }
  };

  // 네비게이션 링크 클릭 핸들러
  const handleNavLinkClick = (href: string, e: React.MouseEvent) => {
    // 일반 네비게이션 링크는 기본 동작 유지
    setActiveItem(href);
  };

  // 인증 관련 링크 클릭 핸들러 (로그인/회원가입)
  const handleAuthLinkClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault(); // 기본 동작 방지
    
    if (href === "/register") {
      // 회원가입 경로 명시적으로 설정
      router.push("/register");
    } else {
      router.push(href); // 다른 경로는 그대로 유지
    }
  };

  // 마이페이지 하위 메뉴 항목 (로그인 후 사용 가능)
  const mypageSubMenuItems = [
    { name: "📊 검사 기록", href: "/mypage?tab=records", description: "나의 심리검사 결과 확인" },
    { name: "👤 기본 정보", href: "/mypage?tab=profile", description: "프로필 정보 수정" },
    { name: "💬 상담 예약", href: "/mypage/counseling", description: "전문가 상담 예약" },
    { name: "📋 삭제된 코드", href: "/mypage/deleted-codes", description: "삭제된 테스트 코드 복구" },
    { name: "⚙️ 설정", href: "/mypage/settings", description: "계정 및 알림 설정" }
  ];

  // 관리자 메뉴 항목
  const adminMenuItems = [
    { name: "📊 대시보드", href: "/admin/dashboard" },
    { name: "👥 사용자 관리", href: "/admin/users" },
    { name: "🏷️ 코드 관리", href: "/admin/test-codes" },
    { name: "📈 분석", href: "/admin/analytics" },
    { name: "🧠 MBTI 분석", href: "/admin/mbti-analysis" },
    { name: "💕 관계 분석", href: "/admin/relationship-analysis" },
    { name: "⚙️ 설정", href: "/admin/settings" },
  ];

  // 심리검사 하위 메뉴 항목 - 개선된 구조
  const testSubMenuItems = [
    { 
      category: "기본 검사",
      items: [
        { name: "🧠 MBTI 검사", href: "/tests", description: "16가지 성격 유형 검사", badge: "인기" },
        { name: "🔍 이고-오케이", href: "/tests/ego-ok", description: "자아 성숙도 검사", badge: "신규" },
        { name: "🌟 에니어그램", href: "/tests/enneagram", description: "9가지 성격 유형 분석" }
      ]
    },
    { 
      category: "고급 검사",
      items: [
        { name: "🎯 MBTI Pro", href: "/tests/mbti-pro", description: "고급 MBTI 분석", badge: "추천" },
        { name: "👥 그룹 MBTI", href: "/tests/group_mbti", description: "팀 호환성 검사" },
        { name: "💼 직업 적성", href: "/tests/career", description: "직업 적합성 검사" }
      ]
    }
  ];

  // 상담 서비스 메뉴
  const counselingMenuItems = [
    {
      category: "개인 상담",
      items: [
        { name: "💭 심리 상담", href: "/counseling/psychology", description: "전문 심리상담사와 1:1 상담", badge: "24시간" },
        { name: "🌱 성장 코칭", href: "/counseling/growth", description: "개인 성장을 위한 코칭" },
        { name: "💔 관계 상담", href: "/counseling/relationship", description: "인간관계 문제 해결" }
      ]
    },
    {
      category: "그룹 상담",
      items: [
        { name: "👨‍👩‍👧‍👦 가족 상담", href: "/counseling/family", description: "가족 관계 개선 상담" },
        { name: "💑 커플 상담", href: "/counseling/couple", description: "연인/부부 관계 상담" },
        { name: "🏢 직장 상담", href: "/counseling/workplace", description: "직장 내 스트레스 관리" }
      ]
    }
  ];

  // 사용자 맞춤 기능 메뉴
  const personalFeaturesMenu = [
    {
      category: "개인 관리",
      items: [
        { name: "📊 검사 기록", href: "/mypage?tab=records", description: "나의 심리검사 결과 모음" },
        { name: "📈 성장 리포트", href: "/progress", description: "개인 성장 분석 리포트" },
        { name: "🎯 목표 관리", href: "/goals", description: "개인 목표 설정 및 추적" }
      ]
    },
    {
      category: "학습 & 성장",
      items: [
        { name: "📚 학습 자료", href: "/learning", description: "심리학 교육 콘텐츠" },
        { name: "💡 맞춤 추천", href: "/recommendations", description: "AI 기반 상담 추천" },
        { name: "📅 일정 관리", href: "/calendar", description: "상담 예약 및 일정 관리" }
      ]
    }
  ];

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    <nav className="fixed top-0 inset-x-0 z-50 bg-indigo-900 border-b border-white py-4 shadow-sm">
      <div className="container max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:shadow-blue-500/30 transition-all duration-300 transform group-hover:scale-105">
            심
          </div>
          <span className="font-bold text-2xl tracking-tight text-white transition-colors duration-300">
            심리케어
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="flex space-x-1">
            {/* 로그인 전/후 공통 메뉴 */}
            <Link
              href="/"
              className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeItem === "/"
                  ? "text-white bg-blue-600"
                  : "text-gray-300 hover:text-white hover:bg-blue-800/50"
              }`}
              onClick={(e) => handleNavLinkClick("/", e)}
            >
              🏠 홈
            </Link>
            
            {/* 심리검사 드롭다운 메뉴 */}
                          <div className="relative">
              <Link
                href="/tests"
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center ${
                  activeItem === "/tests" || activeItem.startsWith("/tests/")
                    ? "text-white bg-blue-600"
                    : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                }`}
                onClick={(e) => handleNavLinkClick("/tests", e)}
                  onMouseEnter={() => setActiveMenu('test')}
                  onMouseLeave={() => setActiveMenu(null)}
              >
                🧠 심리검사
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-4 h-4 ml-1 transition-transform duration-200 ${isTestDropdownOpen ? "rotate-180" : ""}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>

                {/* 심리검사 메가 메뉴 - 고급 버전 */}
              {isTestDropdownOpen && (
                <div
                    className="absolute left-0 mt-4 py-8 w-96 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                    onMouseEnter={() => setActiveMenu('test')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    {/* 헤더 섹션 */}
                    <div className="relative px-8 pb-6 border-b border-gradient-to-r from-blue-500/30 to-indigo-500/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-t-2xl"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="relative group">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl group-hover:scale-105 transition-transform duration-300">
                            🧠
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-400 border-3 border-white rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white truncate">심리검사</h3>
                            <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-lg animate-pulse">
                              🧠 전문
                            </span>
                          </div>
                          <div className="text-sm text-blue-300 flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span className="truncate">정확한 심리 분석 도구</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 text-blue-400">
                              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                              <span>실시간</span>
                            </div>
                            <div className="flex items-center gap-1 text-indigo-300">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                              </svg>
                              <span>최신 검사 도구</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 통계 카드 */}
                    <div className="px-6 py-4 grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="text-lg font-bold text-blue-300">16</div>
                        <div className="text-xs text-blue-400">검사 종류</div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="text-lg font-bold text-indigo-300">5분</div>
                        <div className="text-xs text-indigo-400">평균 소요</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="text-lg font-bold text-purple-300">99%</div>
                        <div className="text-xs text-purple-400">정확도</div>
                      </div>
                    </div>

                    {/* 메뉴 항목들 - 고급 버전 */}
                    <div className="px-6 py-4 space-y-2">
                      {testSubMenuItems.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-xs font-bold text-blue-300 uppercase tracking-wide mb-2">
                            {category.category}
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                onClick={() => setActiveMenu(null)}
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  {item.name.includes('🧠') ? '🧠' : 
                                   item.name.includes('🔍') ? '🔍' : 
                                   item.name.includes('☀️') ? '☀️' : 
                                   item.name.includes('👥') ? '👥' : 
                                   item.name.includes('💼') ? '💼' : '📊'}
                                </div>
                                                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                     <span className="font-medium text-white truncate">{item.name}</span>
                                     {'badge' in item && item.badge && (
                                       <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                         item.badge === '인기' ? 'bg-red-500 text-white' :
                                         item.badge === '신규' ? 'bg-green-500 text-white' :
                                         'bg-orange-500 text-white'
                                       }`}>
                                         {item.badge}
                                       </span>
                                     )}
                                   </div>
                                   <div className="text-xs text-blue-300 truncate">{item.description}</div>
                                 </div>
                                <svg 
                                  className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
              )}
            </div>
            
              {/* 상담 프로그램 드롭다운 메뉴 */}
              <div className="relative">
                <Link
                  href="/counseling"
                  className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center ${
                    activeItem === "/counseling" || activeItem.startsWith("/counseling/")
                      ? "text-white bg-blue-600"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                  }`}
                  onClick={(e) => handleNavLinkClick("/counseling", e)}
                  onMouseEnter={() => setActiveMenu('counseling')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  💬 상담 프로그램
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${isCounselingDropdownOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                {/* 상담 프로그램 메가 메뉴 - 고급 버전 */}
                {isCounselingDropdownOpen && (
                  <div
                    className="absolute left-0 mt-4 py-8 w-96 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-pink-900/95 rounded-2xl shadow-2xl border border-purple-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                    onMouseEnter={() => setActiveMenu('counseling')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    {/* 헤더 섹션 */}
                    <div className="relative px-8 pb-6 border-b border-gradient-to-r from-purple-500/30 to-pink-500/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-t-2xl"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="relative group">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl group-hover:scale-105 transition-transform duration-300">
                            💬
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-400 border-3 border-white rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white truncate">상담 프로그램</h3>
                            <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg animate-pulse">
                              💬 전문
                            </span>
                          </div>
                          <div className="text-sm text-purple-300 flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                            </svg>
                            <span className="truncate">전문가와의 맞춤 상담</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 text-purple-400">
                              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                              <span>실시간</span>
                            </div>
                            <div className="flex items-center gap-1 text-pink-300">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                              </svg>
                              <span>1:1 전문 상담</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 통계 카드 */}
                    <div className="px-6 py-4 grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="text-lg font-bold text-purple-300">50+</div>
                        <div className="text-xs text-purple-400">전문가</div>
                      </div>
                      <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="text-lg font-bold text-pink-300">24/7</div>
                        <div className="text-xs text-pink-400">상담 가능</div>
                      </div>
                      <div className="bg-gradient-to-br from-rose-500/20 to-red-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="text-lg font-bold text-rose-300">98%</div>
                        <div className="text-xs text-rose-400">만족도</div>
                      </div>
                    </div>

                    {/* 메뉴 항목들 - 고급 버전 */}
                    <div className="px-6 py-4 space-y-2">
                      {counselingMenuItems.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-xs font-bold text-purple-300 uppercase tracking-wide mb-2">
                            {category.category}
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                onClick={() => setActiveMenu(null)}
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  {item.name.includes('💬') ? '💬' : 
                                   item.name.includes('👨‍⚕️') ? '👨‍⚕️' : 
                                   item.name.includes('👩‍⚕️') ? '👩‍⚕️' : 
                                   item.name.includes('📞') ? '📞' : 
                                   item.name.includes('🎯') ? '🎯' : '💭'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white truncate">{item.name}</span>
                                    {'badge' in item && item.badge && (
                                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                        item.badge === '인기' ? 'bg-red-500 text-white' :
                                        item.badge === '신규' ? 'bg-green-500 text-white' :
                                        'bg-orange-500 text-white'
                                      }`}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-purple-300 truncate">{item.description}</div>
                                </div>
                                <svg 
                                  className="w-4 h-4 text-purple-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 기타 공통 메뉴 항목들 */}
              {[
              { name: "👨‍⚕️ 전문가 소개", href: "/experts" },
              { name: "⭐ 고객 후기", href: "/reviews" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                  activeItem === item.href
                    ? "text-white bg-blue-600"
                    : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                }`}
                onClick={(e) => handleNavLinkClick(item.href, e)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* 로그인 후에만 표시되는 추가 기능 메뉴 */}
            {isLoggedIn && (
                              <div className="relative">
                <button
                  className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center ${
                    activeItem.startsWith("/learning") || activeItem.startsWith("/goals") || 
                    activeItem.startsWith("/calendar") || activeItem.startsWith("/recommendations") ||
                    activeItem.startsWith("/progress")
                      ? "text-white bg-green-600"
                      : "text-green-300 hover:text-white hover:bg-green-800/50"
                  }`}
                  onMouseEnter={() => setActiveMenu('additional')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  🎯 추가 기능
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                  {/* 추가 기능 메가 메뉴 - 고급 버전 */}
                {isUserMenuOpen && (
                  <div
                      className="absolute left-0 mt-4 py-8 w-96 bg-gradient-to-br from-slate-900/95 via-emerald-900/95 to-green-900/95 rounded-2xl shadow-2xl border border-emerald-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                    onMouseEnter={() => setActiveMenu('additional')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    {/* 헤더 섹션 */}
                    <div className="relative px-8 pb-6 border-b border-gradient-to-r from-emerald-500/30 to-green-500/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-green-600/10 rounded-t-2xl"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="relative group">
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl group-hover:scale-105 transition-transform duration-300">
                            🎯
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 border-3 border-white rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white truncate">추가 기능</h3>
                            <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full shadow-lg animate-pulse">
                              🎯 프리미엄
                            </span>
                          </div>
                          <div className="text-sm text-emerald-300 flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span className="truncate">개인 맞춤 고급 기능</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 text-emerald-400">
                              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                              <span>실시간</span>
                            </div>
                            <div className="flex items-center gap-1 text-green-300">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                              </svg>
                              <span>AI 기반 분석</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 통계 카드 */}
                    <div className="px-6 py-4 grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="text-lg font-bold text-emerald-300">10+</div>
                        <div className="text-xs text-emerald-400">고급 기능</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="text-lg font-bold text-green-300">AI</div>
                        <div className="text-xs text-green-400">지능형</div>
                      </div>
                      <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="text-lg font-bold text-teal-300">24/7</div>
                        <div className="text-xs text-teal-400">사용 가능</div>
                      </div>
                    </div>

                    {/* 메뉴 항목들 - 고급 버전 */}
                    <div className="px-6 py-4 space-y-2">
                      {personalFeaturesMenu.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wide mb-2">
                            {category.category}
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                onClick={() => setActiveMenu(null)}
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  {item.name.includes('📚') ? '📚' : 
                                   item.name.includes('🎯') ? '🎯' : 
                                   item.name.includes('📅') ? '📅' : 
                                   item.name.includes('📊') ? '📊' : 
                                   item.name.includes('🎨') ? '🎨' : '✨'}
                                </div>
                                                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                     <span className="font-medium text-white truncate">{item.name}</span>
                                     {'badge' in item && item.badge && (
                                       <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                         item.badge === '인기' ? 'bg-red-500 text-white' :
                                         item.badge === '신규' ? 'bg-green-500 text-white' :
                                         'bg-orange-500 text-white'
                                       }`}>
                                         {item.badge}
                                       </span>
                                     )}
                                   </div>
                                   <div className="text-xs text-emerald-300 truncate">{item.description}</div>
                                 </div>
                                <svg 
                                  className="w-4 h-4 text-emerald-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 관리자 메뉴 (관리자 권한이 있을 경우에만 표시) */}
            {isLoggedIn && userRole === "admin" && (
              <Link
                href="/admin"
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                  activeItem.startsWith("/admin")
                    ? "text-white bg-purple-600"
                    : "text-purple-300 hover:text-white hover:bg-purple-800/50"
                }`}
                onClick={(e) => handleNavLinkClick("/admin", e)}
              >
                ⚙️ 관리자
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 ml-6 pl-6 border-l border-indigo-800">
            {isLoggedIn ? (
              <>
                  {/* 사용자 정보 표시 - 최신 디자인 */}
                                     <div className="group flex items-center gap-4 bg-gradient-to-r from-emerald-900/40 to-blue-900/40 rounded-xl px-4 py-3 backdrop-blur-md border border-emerald-600/30 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setActiveMenu('user')}
                        onMouseLeave={() => setActiveMenu(null)}>
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                  </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-3 border-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white flex items-center gap-2 truncate">
                        <span className="truncate">{userName || "사용자"}</span>
                        {userRole === "admin" && (
                          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full animate-pulse">
                            ⚡ ADMIN
                          </span>
                        )}
                  </div>
                      <div className="text-xs text-emerald-300 flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                        <span className="truncate">{userEmail}</span>
                </div>

                    </div>
                                        {/* 드롭다운 화살표만 유지 */}
                    <div className="p-1">
                      <svg className={`w-4 h-4 text-emerald-300 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""} group-hover:text-white`} 
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>



                  {/* 마이페이지 메가 메뉴 */}
                  <div className="relative" ref={dropdownRef}>
                  {isDropdownOpen && (
                    <div
                        className="absolute right-0 mt-4 py-8 w-96 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-emerald-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                        onMouseEnter={() => setActiveMenu('user')}
                        onMouseLeave={() => setActiveMenu(null)}
                      >
                        {/* 사용자 정보 헤더 - 고급 버전 */}
                        <div className="relative px-8 pb-6 border-b border-gradient-to-r from-emerald-500/30 to-blue-500/30">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 rounded-t-2xl"></div>
                          <div className="relative flex items-center gap-4">
                            <div className="relative group">
                              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl group-hover:scale-105 transition-transform duration-300">
                                {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-3 border-white rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-white truncate">{userName || "사용자"}</h3>
                                {userRole === "admin" && (
                                  <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg animate-pulse">
                                    ⚡ ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-emerald-300 flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                </svg>
                                <span className="truncate">{userEmail}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1 text-green-400">
                                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                  <span>온라인</span>
                                </div>
                                <div className="flex items-center gap-1 text-blue-300">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                  </svg>
                                  <span>최근 활동: 방금 전</span>
                                </div>
                              </div>
                            </div>
                            <Link href="/mypage?tab=profile" 
                                  className="p-2 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-lg text-emerald-300 hover:text-white hover:bg-gradient-to-r hover:from-emerald-500/40 hover:to-blue-500/40 transition-all duration-300 group"
                                  onClick={() => setActiveMenu(null)}>
                              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                              </svg>
                            </Link>
                          </div>
                        </div>

                        {/* 빠른 통계 카드 */}
                        <div className="px-6 py-4 grid grid-cols-3 gap-3">
                          <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                            <div className="text-lg font-bold text-emerald-300">12</div>
                            <div className="text-xs text-emerald-400">완료된 검사</div>
                          </div>
                          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                            <div className="text-lg font-bold text-blue-300">3</div>
                            <div className="text-xs text-blue-400">예약된 상담</div>
                          </div>
                          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-3 text-center group hover:scale-105 transition-transform duration-300">
                            <div className="text-lg font-bold text-amber-300">85%</div>
                            <div className="text-xs text-amber-400">진행률</div>
                          </div>
                        </div>

                        {/* 메뉴 항목들 - 고급 버전 */}
                        <div className="px-6 py-4 space-y-2">
                          {/* 주요 메뉴 */}
                          <div className="space-y-1">
                            {[
                              { 
                                name: "📊 내 검사 결과", 
                                href: "/mypage?tab=records", 
                                description: "완료한 심리검사 결과 확인",
                                icon: "📊",
                                badge: "12개",
                                color: "from-blue-500/20 to-indigo-500/20"
                              },
                              { 
                                name: "👤 프로필 관리", 
                                href: "/mypage?tab=profile", 
                                description: "개인정보 및 계정 설정",
                                icon: "👤", 
                                color: "from-emerald-500/20 to-green-500/20"
                              },
                              { 
                                name: "💬 상담 예약", 
                                href: "/mypage/counseling", 
                                description: "전문가 상담 예약 및 관리",
                                icon: "💬",
                                badge: "3건",
                                color: "from-purple-500/20 to-pink-500/20"
                              },
                              { 
                                name: "📈 성장 트래킹", 
                                href: "/mypage/progress", 
                                description: "개인 성장 분석 및 리포트",
                                icon: "📈",
                                color: "from-orange-500/20 to-red-500/20"
                              },
                              { 
                                name: "⚙️ 설정", 
                                href: "/mypage/settings", 
                                description: "알림 및 환경 설정",
                                icon: "⚙️",
                                color: "from-gray-500/20 to-slate-500/20"
                              }
                            ].map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                                className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r ${item.color} rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                onClick={() => setActiveMenu(null)}
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white truncate">{item.name.replace(item.icon + " ", "")}</span>
                                    {item.badge && (
                                      <span className="px-2 py-0.5 text-xs bg-white/20 text-white rounded-full">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-300 truncate">{item.description}</div>
                                </div>
                                <svg 
                                  className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                        </Link>
                      ))}
                          </div>
                        </div>
                      
                        {/* 관리자 메뉴 (관리자 권한이 있을 경우에만 표시) */}
                      {userRole === "admin" && (
                          <div className="px-6 py-4 border-t border-gradient-to-r from-purple-500/30 to-pink-500/30">
                            <div className="mb-3 flex items-center gap-2">
                              <span className="text-purple-300 text-sm font-bold">⚡ 관리자 전용</span>
                              <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-pink-500/50"></div>
                          </div>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { name: "📊 대시보드", href: "/admin/dashboard", icon: "📊" },
                                { name: "👥 사용자", href: "/admin/users", icon: "👥" },
                                { name: "📈 분석", href: "/admin/analytics", icon: "📈" },
                                { name: "⚙️ 설정", href: "/admin/settings", icon: "⚙️" }
                              ].map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg text-sm text-purple-200 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/40 hover:to-pink-500/40 transition-all duration-300 group"
                                  onClick={() => setActiveMenu(null)}
                            >
                                  <span className="group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                                  <span className="font-medium">{item.name.replace(item.icon + " ", "")}</span>
                            </Link>
                          ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 하단 영역 */}
                        <div className="px-6 pt-4 pb-6 border-t border-gradient-to-r from-gray-500/30 to-slate-500/30">
                          {/* 빠른 액션 버튼들 */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <Link href="/mypage?tab=help" 
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg text-blue-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/40 hover:to-indigo-500/40 transition-all duration-300 group"
                                  onClick={() => setActiveMenu(null)}>
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                              </svg>
                              <span className="text-sm font-medium">도움말</span>
                            </Link>
                            <Link href="/mypage?tab=feedback" 
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg text-green-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/40 hover:to-emerald-500/40 transition-all duration-300 group"
                                  onClick={() => setActiveMenu(null)}>
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
                              </svg>
                              <span className="text-sm font-medium">피드백</span>
                            </Link>
                          </div>
                          
                          {/* 로그아웃 버튼 */}
                          <button 
                            className="w-full px-4 py-3 text-white bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 rounded-xl transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-red-500/30 hover:scale-105"
                        onClick={() => {
                              setActiveMenu(null);
                          handleLogout();
                        }}
                      >
                        <svg 
                              className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform duration-300" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                            <span className="font-semibold">안전하게 로그아웃</span>
                          </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* 로그인 전 메뉴 */}
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-lg font-medium text-sm text-blue-200 hover:text-white hover:bg-blue-800/50 transition-all duration-300"
                  onClick={(e) => handleAuthLinkClick("/login", e)}
                >
                  🔐 로그인
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-blue-600 rounded-lg text-white font-medium text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all duration-300"
                  onClick={(e) => handleAuthLinkClick("/register", e)}
                >
                  ✨ 회원가입
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                isMobileMenuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              }
            />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-indigo-900 border-t border-indigo-800/50 shadow-xl animate-fadeIn">
          <div className="container py-6 px-6 space-y-3">
            {/* 로그인 상태일 때 사용자 정보 표시 - 모바일 메뉴 상단에 배치 */}
            {isLoggedIn && (
              <div className="mb-4 px-4 py-3 bg-indigo-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {userName || userEmail.split('@')[0]}
                    </p>
                    <p className="text-sm text-blue-200">
                      {userRole === "admin" ? "관리자" : "일반 사용자"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 공통 메뉴 */}
            <Link
              href="/"
              className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeItem === "/"
                  ? "bg-blue-600 text-white"
                  : "text-blue-200 hover:bg-blue-800/50 hover:text-white"
              }`}
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                handleNavLinkClick("/", e);
              }}
            >
              🏠 홈
            </Link>
            
            {/* 모바일 심리검사 메뉴 */}
            <div>
              <Link
                href="/tests"
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeItem === "/tests"
                    ? "bg-blue-600 text-white"
                    : "text-blue-200 hover:bg-blue-800/50 hover:text-white"
                }`}
                onClick={(e) => {
                  handleNavLinkClick("/tests", e);
                }}
              >
                🧠 심리검사
              </Link>
              
              {/* 모바일에서는 항상 하위 메뉴 표시 */}
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-blue-600 pl-4">
                  {testSubMenuItems.map((category) =>
                    category.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      activeItem === item.href
                        ? "text-white font-medium"
                        : "text-blue-200 hover:text-white"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                    ))
                  )}
              </div>
            </div>
            
            {/* 공통 메뉴 항목들 */}
            {[
              { name: "💬 상담 프로그램", href: "/counseling" },
              { name: "👨‍⚕️ 전문가 소개", href: "/experts" },
              { name: "⭐ 고객 후기", href: "/reviews" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeItem === item.href
                    ? "bg-blue-600 text-white"
                    : "text-blue-200 hover:bg-blue-800/50 hover:text-white"
                }`}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleNavLinkClick(item.href, e);
                }}
              >
                {item.name}
              </Link>
            ))}
            
            {/* 로그인 후에만 표시되는 추가 기능 메뉴 */}
            {isLoggedIn && (
              <>
                <div className="px-4 py-2 text-sm font-medium text-green-300 border-l-2 border-green-600 pl-4">
                  🎯 추가 기능
                </div>
                <div className="ml-4 space-y-1 border-l-2 border-green-600 pl-4">
                    {personalFeaturesMenu.map((category) =>
                      category.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-green-200 hover:text-white transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                      ))
                    )}
                </div>
              </>
            )}
            
            {/* 모바일 관리자 메뉴 (관리자 권한이 있을 경우에만 표시) */}
            {isLoggedIn && userRole === "admin" && (
              <>
                <Link
                  href="/admin"
                  className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeItem.startsWith("/admin")
                      ? "bg-purple-600 text-white"
                      : "text-purple-300 hover:bg-purple-800/50 hover:text-white"
                  }`}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    handleNavLinkClick("/admin", e);
                  }}
                >
                  ⚙️ 관리자
                </Link>
                
                {/* 모바일 관리자 하위 메뉴 */}
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-purple-600 pl-4">
                  {adminMenuItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        activeItem === item.href
                          ? "text-white font-medium"
                        : "text-purple-300 hover:text-white"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* 로그인 상태일 때 마이페이지 하위 메뉴 표시 */}
            {isLoggedIn && (
              <>
                <div className="px-4 py-2 text-sm font-medium text-blue-300 border-l-2 border-blue-600 pl-4">
                  👤 마이페이지
                </div>
                <div className="ml-4 space-y-1 border-l-2 border-blue-600 pl-4">
                  {mypageSubMenuItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-blue-200 hover:text-white transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* 모바일에서 로그인/로그아웃 버튼 */}
            <div className="mt-6 pt-6 border-t border-indigo-800">
              {isLoggedIn ? (
                <button
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium bg-red-600/80 text-white hover:bg-red-700 transition-all duration-300 flex items-center justify-center"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h5a1 1 0 000-2H4V5h4a1 1 0 000-2H3zM13 7l3 3-3 3v-2H9a1 1 0 000-2h4V7z"
                      clipRule="evenodd" 
                    />
                  </svg>
                  로그아웃
                </button>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link
                    href="/login"
                    className="px-4 py-3 rounded-lg text-center text-sm font-medium text-white bg-blue-800/50 hover:bg-blue-700 transition-all duration-300"
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      handleAuthLinkClick("/login", e);
                    }}
                  >
                    🔐 로그인
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-3 rounded-lg text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300"
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      handleAuthLinkClick("/register", e);
                    }}
                  >
                    ✨ 회원가입
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
    </>
  );
}