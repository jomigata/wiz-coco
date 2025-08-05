"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setAuthState, getAuthState, removeItem } from '@/utils/localStorageManager';

export default function Navigation() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("/");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [isCounselingDropdownOpen, setIsCounselingDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const testDropdownRef = useRef<HTMLDivElement>(null);
  const counselingDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 인증 상태 확인 함수
  useEffect(() => {
    console.log('Navigation 컴포넌트 - 로그인 상태 확인 시작');
    
    const checkAuthStatus = async () => {
      try {
        // 로컬 임시 인증 상태 확인 (빠른 응답)
        const authState = getAuthState();
        if (authState && authState.isLoggedIn && authState.userBasicInfo) {
          console.log('로컬 임시 인증 상태 확인됨');
          setIsLoggedIn(true);
          setUserEmail(authState.userBasicInfo.email || authState.userBasicInfo.id || "");
          setUserName(authState.userBasicInfo.name || "");
          setUserRole(authState.userBasicInfo.role || "user");
          return; // 로컬 상태가 있으면 서버 호출 없이 종료
        }
        
        // 로컬 임시 인증 상태가 없는 경우에만 서버 API 호출
        console.log('로컬 임시 인증 상태 없음 - 서버 API 확인');
        try {
          console.log('서버 API 인증 상태 확인 요청');
          const response = await fetch('/api/simple-login', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('서버 API 인증 상태 응답:', data);
            
            if (data.isLoggedIn && data.user) {
              console.log('서버 API에서 로그인 상태 확인됨:', data.user);
              setIsLoggedIn(true);
              setUserEmail(data.user.email || data.user.id || "");
              setUserName(data.user.name || "");
              setUserRole(data.user.role || "user");
              
              // 임시 인증 상태 저장
              setAuthState(true, data.user);
              return;
            }
          }
        } catch (apiError) {
          console.warn("서버 API 호출 오류:", apiError);
        }
        
        // 모든 인증 확인 실패 시 로그아웃 상태로 설정
        setIsLoggedIn(false);
        setUserEmail("");
        setUserName("");
        setUserRole("");
      } catch (error) {
        console.error("인증 상태 확인 오류:", error);
      }
    };

    // 초기 상태 설정 (한 번만)
    checkAuthStatus();

    // 현재 경로에 따라 active 항목 설정
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setActiveItem(path);
      
      // 로그인 상태 변경 이벤트 리스너 등록
      const handleLoginStatusChange = (event: Event | CustomEvent) => {
        console.log('로그인 상태 변경 이벤트 감지', event);
        
        // CustomEvent인 경우 detail 속성에서 정보 활용
        if (event instanceof CustomEvent && event.detail) {
          console.log('커스텀 이벤트 감지:', event.detail);
          const { isLoggedIn, user } = event.detail;
          
          // 로그아웃 이벤트인 경우
          if (isLoggedIn === false) {
            console.log('로그아웃 이벤트 감지됨');
            setIsLoggedIn(false);
            setUserEmail("");
            setUserName("");
            setUserRole("");
            return;
          }
          
          // 로그인 이벤트인 경우
          if (isLoggedIn && user) {
            console.log('커스텀 이벤트에서 사용자 정보 추출:', user);
            setIsLoggedIn(true);
            setUserEmail(user.email || user.id || "");
            setUserName(user.name || "");
            setUserRole(user.role || "user");
            console.log('커스텀 이벤트로부터 로그인 상태 업데이트 완료');
            return;
          }
        }
        
        // 일반 이벤트인 경우에는 API 호출하지 않고 무시
        console.log('일반 이벤트 무시됨');
      };

      // 사용자 이름 업데이트 이벤트 리스너
      const handleUserNameUpdate = (event: Event | CustomEvent) => {
        console.log('사용자 이름 업데이트 이벤트 감지');
        
        if (event instanceof CustomEvent && event.detail) {
          const { name } = event.detail;
          if (name) {
            setUserName(name);
            console.log('네비게이션 컴포넌트에서 사용자 이름 업데이트됨:', name);
          }
        }
      };
      
      window.addEventListener('login-status-changed', handleLoginStatusChange);
      window.addEventListener('user-name-updated', handleUserNameUpdate);
      
      return () => {
        window.removeEventListener('login-status-changed', handleLoginStatusChange);
        window.removeEventListener('user-name-updated', handleUserNameUpdate);
      };
    }
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }

      if (
        testDropdownRef.current &&
        !testDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTestDropdownOpen(false);
      }

      if (
        counselingDropdownRef.current &&
        !counselingDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCounselingDropdownOpen(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      console.log('로그아웃 시작');
      
      // 임시 인증 상태 제거
      removeItem('auth-state');
      
      // 다른 인증 정보 제거
      removeItem('user');
      removeItem('userToken');
      
      // 쿠키 삭제를 위해 만료일을 과거로 설정
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // 상태 업데이트
      setIsLoggedIn(false);
      setUserEmail("");
      setUserName("");
      setUserRole("");
      
      // 다른 컴포넌트에 로그아웃 알림 (CustomEvent 사용)
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
      
      // 서버에 로그아웃 요청
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('서버 로그아웃 성공');
        } else {
          console.warn('서버 로그아웃 요청은 실패했지만, 로컬 로그아웃은 완료됨');
        }
      } catch (apiError) {
        console.error('서버 로그아웃 요청 오류:', apiError);
      }
      
      // 추가 안전장치: 짧은 대기 후 임시 인증 상태 재확인
      setTimeout(() => {
        const authState = getAuthState();
        if (authState && authState.isLoggedIn) {
          console.log('로그아웃 후에도 임시 인증 상태가 유지됨 - 강제 로그아웃 실행');
          removeItem('oktest-auth-state');
          setIsLoggedIn(false);
        }
      }, 100);
      
      // 홈으로 리다이렉트
      console.log('홈으로 리다이렉트');
      router.push("/");
    } catch (error) {
      console.error("로그아웃 처리 오류:", error);
      
      // 오류가 발생해도 로컬에서는 로그아웃 처리
      removeItem('user');
      removeItem('userToken');
      
      // 쿠키 삭제
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      setIsLoggedIn(false);
      setUserEmail("");
      setUserName("");
      setUserRole("");
      
      // 홈으로 리다이렉트
      router.push("/");
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
              <div className="relative" ref={testDropdownRef}>
                <Link
                  href="/tests"
                  className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center ${
                    activeItem === "/tests" || activeItem.startsWith("/tests/")
                      ? "text-white bg-blue-600"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                  }`}
                  onClick={(e) => handleNavLinkClick("/tests", e)}
                  onMouseEnter={() => setIsTestDropdownOpen(true)}
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

                {/* 심리검사 메가 메뉴 */}
                {isTestDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 py-6 w-96 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl shadow-2xl border border-indigo-600/50 z-10 animate-fadeIn backdrop-blur-sm"
                    onMouseLeave={() => setIsTestDropdownOpen(false)}
                  >
                    {testSubMenuItems.map((category) => (
                      <div key={category.category} className="mb-6 last:mb-0">
                        <div className="px-6 py-2 text-xs font-bold text-indigo-300 uppercase tracking-wide border-b border-indigo-700/50 mb-3">
                          {category.category}
                        </div>
                        <div className="grid grid-cols-1 gap-1 px-4">
                          {category.items.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="group relative block px-4 py-3 text-sm text-blue-200 hover:bg-gradient-to-r hover:from-blue-800/70 hover:to-blue-700/70 hover:text-white transition-all duration-300 rounded-lg"
                              onClick={() => setIsTestDropdownOpen(false)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {item.name}
                                    {item.badge && (
                                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                        item.badge === '인기' ? 'bg-red-500 text-white' :
                                        item.badge === '신규' ? 'bg-green-500 text-white' :
                                        'bg-orange-500 text-white'
                                      }`}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-blue-300 mt-1 group-hover:text-blue-100">
                                    {item.description}
                                  </div>
                                </div>
                                <svg 
                                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 상담 프로그램 드롭다운 메뉴 */}
              <div className="relative" ref={counselingDropdownRef}>
                <Link
                  href="/counseling"
                  className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center ${
                    activeItem === "/counseling" || activeItem.startsWith("/counseling/")
                      ? "text-white bg-blue-600"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                  }`}
                  onClick={(e) => handleNavLinkClick("/counseling", e)}
                  onMouseEnter={() => setIsCounselingDropdownOpen(true)}
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

                {/* 상담 프로그램 메가 메뉴 */}
                {isCounselingDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 py-6 w-96 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl shadow-2xl border border-indigo-600/50 z-10 animate-fadeIn backdrop-blur-sm"
                    onMouseLeave={() => setIsCounselingDropdownOpen(false)}
                  >
                    {counselingMenuItems.map((category) => (
                      <div key={category.category} className="mb-6 last:mb-0">
                        <div className="px-6 py-2 text-xs font-bold text-indigo-300 uppercase tracking-wide border-b border-indigo-700/50 mb-3">
                          {category.category}
                        </div>
                        <div className="grid grid-cols-1 gap-1 px-4">
                          {category.items.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="group relative block px-4 py-3 text-sm text-purple-200 hover:bg-gradient-to-r hover:from-purple-800/70 hover:to-purple-700/70 hover:text-white transition-all duration-300 rounded-lg"
                              onClick={() => setIsCounselingDropdownOpen(false)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {item.name}
                                    {item.badge && (
                                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500 text-white">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-purple-300 mt-1 group-hover:text-purple-100">
                                    {item.description}
                                  </div>
                                </div>
                                <svg 
                                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
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
                <div className="relative" ref={userMenuRef}>
                  <button
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center ${
                      activeItem.startsWith("/learning") || activeItem.startsWith("/goals") || 
                      activeItem.startsWith("/calendar") || activeItem.startsWith("/recommendations") ||
                      activeItem.startsWith("/progress")
                        ? "text-white bg-green-600"
                        : "text-green-300 hover:text-white hover:bg-green-800/50"
                    }`}
                    onMouseEnter={() => setIsUserMenuOpen(true)}
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

                  {/* 추가 기능 메가 메뉴 */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute left-0 mt-2 py-6 w-96 bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-xl shadow-2xl border border-emerald-600/50 z-10 animate-fadeIn backdrop-blur-sm"
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                      {personalFeaturesMenu.map((category) => (
                        <div key={category.category} className="mb-6 last:mb-0">
                          <div className="px-6 py-2 text-xs font-bold text-emerald-300 uppercase tracking-wide border-b border-emerald-700/50 mb-3">
                            {category.category}
                          </div>
                          <div className="grid grid-cols-1 gap-1 px-4">
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="group relative block px-4 py-3 text-sm text-emerald-200 hover:bg-gradient-to-r hover:from-emerald-800/70 hover:to-emerald-700/70 hover:text-white transition-all duration-300 rounded-lg"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-xs text-emerald-300 mt-1 group-hover:text-emerald-100">
                                      {item.description}
                                    </div>
                                  </div>
                                  <svg 
                                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
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
                  {/* 사용자 정보 표시 - 개선된 디자인 */}
                  <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg px-3 py-2 backdrop-blur-sm border border-blue-700/30">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        {userName || userEmail.split('@')[0]}
                        {userRole === "admin" && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-purple-500 text-white rounded-full">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-blue-200 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        온라인
                      </div>
                    </div>
                  </div>

                  {/* 마이페이지 드롭다운 */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white font-medium text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center group"
                      onMouseEnter={() => setIsDropdownOpen(true)}
                    >
                      <span className="mr-2">👤</span>
                      <span>마이페이지</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`w-4 h-4 ml-2 transition-transform duration-200 group-hover:scale-110 ${isDropdownOpen ? "rotate-180" : ""}`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* 마이페이지 메가 메뉴 */}
                    {isDropdownOpen && (
                      <div
                        className="absolute right-0 mt-2 py-6 w-80 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl shadow-2xl border border-indigo-600/50 z-10 animate-fadeIn backdrop-blur-sm"
                        onMouseLeave={() => setIsDropdownOpen(false)}
                      >
                        {/* 사용자 정보 헤더 */}
                        <div className="px-6 pb-4 border-b border-indigo-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                              {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-medium">{userName || userEmail.split('@')[0]}</div>
                              <div className="text-sm text-blue-200">{userEmail}</div>
                            </div>
                          </div>
                        </div>

                        {/* 메뉴 항목들 */}
                        <div className="py-4">
                          {mypageSubMenuItems.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="group block px-6 py-3 text-sm text-blue-200 hover:bg-gradient-to-r hover:from-blue-800/70 hover:to-blue-700/70 hover:text-white transition-all duration-300"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-xs text-blue-300 mt-1 group-hover:text-blue-100">{item.description}</div>
                                </div>
                                <svg 
                                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </Link>
                          ))}
                        
                          {/* 관리자 메뉴 항목 (관리자 권한이 있을 경우에만 표시) */}
                          {userRole === "admin" && (
                            <>
                              <div className="my-2 border-t border-indigo-700"></div>
                              <div className="px-4 py-2 text-xs font-medium text-purple-300 uppercase tracking-wide">
                                관리자 메뉴
                              </div>
                              {adminMenuItems.map((item) => (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className="block px-4 py-2 text-sm text-purple-300 hover:bg-purple-800/50 hover:text-white transition-colors"
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </>
                          )}
                        
                          <div className="mt-4 pt-4 border-t border-indigo-700/50 px-6">
                            <button 
                              className="w-full px-4 py-3 text-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-red-500/20"
                              onClick={() => {
                                setIsDropdownOpen(false);
                                handleLogout();
                              }}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" 
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
                          </div>
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