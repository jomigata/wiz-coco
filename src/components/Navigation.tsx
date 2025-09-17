"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { removeItem } from '@/utils/localStorageManager';
import { shouldShowCounselorMenu, shouldShowAdminMenu } from '@/utils/roleUtils';

export default function Navigation() {
  const router = useRouter();
  const { user, loading, logout } = useFirebaseAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("/");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isDropdownOpen = activeMenu === 'user';
  const isTestDropdownOpen = activeMenu === 'test';
  const isCounselingDropdownOpen = activeMenu === 'counseling';
  const isUserMenuOpen = activeMenu === 'additional';
  const isAiMindAssistantOpen = activeMenu === 'ai-mind-assistant';
  const isCounselorMenuOpen = activeMenu === 'counselor';
  const isAdminMenuOpen = activeMenu === 'admin';

  const isLoggedIn = !!user && !loading;
  const userEmail = user?.email || "";
  const userName = user?.displayName || "";
  const userRole = user?.role || "user";

  // 기본 useEffect들
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setActiveItem(path);
    }
  }, [user, loading, isLoggedIn, userEmail, userName, userRole]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!activeMenu) return;
      const target = e.target as Element;
      const isInsideDropdown = target.closest('[data-dropdown-menu]');
      if (isInsideDropdown) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!activeMenu) return;
      const target = e.target as Element;
      const isInsideDropdown = target.closest('[data-dropdown-menu]');
      if (isInsideDropdown) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [activeMenu]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // 핸들러 함수들
  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        removeItem('auth-state');
        removeItem('user');
        removeItem('userToken');
        removeItem('oktest-auth-state');
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/');
      } else {
        removeItem('auth-state');
        removeItem('user');
        removeItem('userToken');
        router.push('/');
      }
    } catch (error) {
      removeItem('auth-state');
      removeItem('user');
      removeItem('userToken');
      router.push('/');
    }
  };

  const handleNavLinkClick = (href: string, e: React.MouseEvent) => {
    setActiveItem(href);
  };

  const handleAuthLinkClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (href === "/register") {
      router.push("/register");
    } else {
      router.push(href);
    }
  };

  // 메뉴 데이터
  const testSubMenuItems = [
    { 
      category: "기본 검사",
      items: [
        { name: "MBTI 검사", href: "/tests", description: "16가지 성격 유형 검사", badge: "인기", icon: "🧠" },
        { name: "이고-오케이", href: "/tests/ego-ok", description: "자아 성숙도 검사", badge: "신규", icon: "🔍" },
        { name: "에니어그램", href: "/tests/enneagram", description: "9가지 성격 유형 분석", icon: "🌟" }
      ]
    },
    { 
      category: "고급 검사",
      items: [
        { name: "MBTI Pro", href: "/tests/mbti-pro", description: "고급 MBTI 분석", badge: "추천", icon: "🎯" },
        { name: "그룹 MBTI", href: "/tests/group_mbti", description: "팀 호환성 검사", icon: "👥" },
        { name: "직업 적성", href: "/tests/career", description: "직업 적합성 검사", icon: "💼" }
      ]
    }
  ];

  const counselingMenuItems = [
    {
      category: "개인 상담",
      items: [
        { name: "심리 상담", href: "/counseling/psychology", description: "전문 심리상담사와 1:1 상담", badge: "24시간", icon: "💭" },
        { name: "성장 코칭", href: "/counseling/growth", description: "개인 성장을 위한 코칭", icon: "🌱" },
        { name: "관계 상담", href: "/counseling/relationship", description: "인간관계 문제 해결", icon: "💔" }
      ]
    },
    {
      category: "그룹 상담",
      items: [
        { name: "가족 상담", href: "/counseling/family", description: "가족 관계 개선 상담", icon: "👨‍👩‍👧‍👦" },
        { name: "커플 상담", href: "/counseling/couple", description: "연인/부부 관계 상담", icon: "💑" },
        { name: "직장 상담", href: "/counseling/workplace", description: "직장 내 스트레스 관리", icon: "🏢" }
      ]
    }
  ];

  const personalFeaturesMenu = [
    {
      category: "개인 관리",
      items: [
        { name: "검사 기록", href: "/mypage?tab=records", description: "나의 심리검사 결과 모음", icon: "📊" },
        { name: "성장 리포트", href: "/progress", description: "개인 성장 분석 리포트", icon: "📈" },
        { name: "목표 관리", href: "/goals", description: "개인 목표 설정 및 추적", icon: "🎯" }
      ]
    },
    {
      category: "학습 & 성장",
      items: [
        { name: "학습 자료", href: "/learning", description: "심리학 교육 콘텐츠", icon: "📚" },
        { name: "맞춤 추천", href: "/recommendations", description: "AI 기반 상담 추천", icon: "💡" },
        { name: "일정 관리", href: "/calendar", description: "상담 예약 및 일정 관리", icon: "📅" }
      ]
    }
  ];

  // 상담사 메뉴 데이터
  const counselorMenuItems = [
    {
      category: "내담자 관리",
      items: [
        { name: "내담자 목록", href: "/counselor/clients", description: "담당 내담자 관리", icon: "👥" },
        { name: "상담 일정", href: "/counselor/schedule", description: "상담 일정 관리", icon: "📅" },
        { name: "상담 기록", href: "/counselor/sessions", description: "상담 세션 기록", icon: "📝" }
      ]
    },
    {
      category: "심리검사 관리",
      items: [
        { name: "검사 결과 분석", href: "/counselor/test-results", description: "내담자 검사 결과 분석", icon: "📊" },
        { name: "검사 추천", href: "/counselor/test-recommendations", description: "맞춤 검사 추천", icon: "🎯" },
        { name: "검사 코드 관리", href: "/counselor/test-codes", description: "검사 코드 생성 및 관리", icon: "🔑" }
      ]
    },
    {
      category: "상담 도구",
      items: [
        { name: "상담 노트", href: "/counselor/notes", description: "상담 내용 기록", icon: "📋" },
        { name: "치료 계획", href: "/counselor/treatment-plans", description: "치료 계획 수립", icon: "📋" },
        { name: "진행 상황", href: "/counselor/progress", description: "치료 진행 상황 추적", icon: "📈" }
      ]
    }
  ];

  // 통합 관리자 메뉴 데이터 (탑메뉴와 사이드메뉴 일치)
  const adminMenuItems = [
    {
      category: "대시보드 & 모니터링",
      items: [
        { name: "시스템 대시보드", href: "/admin/system-dashboard", description: "전체 현황 한눈에 보기", icon: "📊" },
        { name: "실시간 모니터링", href: "/admin/realtime-monitoring", description: "활성 사용자, 상담 진행 상황", icon: "⚡" },
        { name: "알림 관리", href: "/admin/notification-management", description: "중요 알림 및 이벤트 관리", icon: "🔔" }
      ]
    },
    {
      category: "사용자 & 상담 관리",
      items: [
        { name: "사용자 관리", href: "/admin/user-management", description: "상담사/내담자 통합 관리", icon: "👥" },
        { name: "상담 관리", href: "/admin/counseling-management", description: "상담 일정, 진행 상황, 결과 관리", icon: "💭" },
        { name: "심리검사 관리", href: "/admin/psychological-tests", description: "검사 생성, 배포, 결과 분석", icon: "🧠" },
        { name: "콘텐츠 관리", href: "/admin/content-management", description: "상담 프로그램, 공지사항, 자료 관리", icon: "📚" }
      ]
    },
    {
      category: "시스템 & 보안 관리",
      items: [
        { name: "시스템 설정", href: "/admin/system-settings", description: "기본 설정, 권한 관리", icon: "⚙️" },
        { name: "데이터 관리", href: "/admin/data-management", description: "백업, 복원, 데이터 분석", icon: "💾" },
        { name: "보안 관리", href: "/admin/security-management", description: "보안 설정, 로그 관리, 접근 제어", icon: "🔐" }
      ]
    }
  ];

    const aiMindAssistantSubMenuItems = [
    { 
      category: "일일 체크",
      items: [
        { name: "오늘의 컨디션 체크", href: "/ai-mind-assistant/daily-mood", description: "수면/스트레스/우울/불안 등 통합 체크", icon: "📊" },
        { name: "오늘의 감정일기", href: "/ai-mind-assistant/emotion-diary", description: "AI가 분석하는 감정 변화", icon: "📝" }
      ]
    },
    { 
      category: "마음 SOS",
      items: [
        { name: "AI 긴급 마음진단", href: "/ai-mind-assistant/emergency-diagnosis", description: "1분 AI 솔루션", icon: "🚨", badge: "긴급" },
        { name: "AI 번아웃 체크", href: "/ai-mind-assistant/burnout-check", description: "번아웃 신호등 확인", icon: "🔥" }
      ]
    },
    { 
      category: "감정 분석 & 리포트",
      items: [
        { name: "AI 감정/스트레스 분석", href: "/ai-mind-assistant/emotion-report", description: "종합 감정 및 스트레스 분석 결과", icon: "📋" },
        { name: "AI 마음 컨디션 리포트", href: "/ai-mind-assistant/growth-level", description: "현재 마음 상태 종합 점검", icon: "🏆" }
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
      <nav className="fixed top-0 inset-x-0 z-50 bg-indigo-900 border-b border-white h-16 shadow-sm">
        <div className="container max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* 브랜드 텍스트 - 좌측 끝으로 이동 및 홈페이지 링크 연결 */}
          <Link href="/" className="flex flex-col items-center group" onClick={(e) => handleNavLinkClick("/", e)}>
            <span className="font-bold text-2xl tracking-tight text-white transition-colors duration-300 leading-tight group-hover:text-blue-300">
              심리케어
            </span>
            <span className="text-xs text-blue-200 font-medium whitespace-nowrap group-hover:text-blue-100">
              Psychological Care
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex space-x-1">
              
              {/* 심리검사 드롭다운 메뉴 */}
              <div className="relative">
                <Link
                  href="/tests"
                  className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
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

                                 {/* 심리검사 메가 메뉴 */}
                 {isTestDropdownOpen && (
                   <div
                     data-dropdown-menu="test"
                     className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                     onMouseEnter={() => setActiveMenu('test')}
                     onMouseLeave={() => setActiveMenu(null)}
                   >
                    <div 
                      className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900"
                      onWheel={(e) => {
                        e.stopPropagation();
                        const target = e.currentTarget;
                        const scrollTop = target.scrollTop;
                        const scrollHeight = target.scrollHeight;
                        const clientHeight = target.clientHeight;
                        
                        if ((scrollTop === 0 && e.deltaY < 0) || 
                            (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                          e.preventDefault();
                        }
                      }}
                      style={{
                        overscrollBehavior: 'contain',
                        scrollbarGutter: 'stable'
                      }}
                    >
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
                                  {item.icon || '📊'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white truncate">{item.name}</span>
                                    {'badge' in item && (item as any).badge && (
                                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                        (item as any).badge === '인기' ? 'bg-red-500 text-white' :
                                        (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                                        'bg-orange-500 text-white'
                                      }`}>
                                        {(item as any).badge}
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
                   className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
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

                                                                       {/* 상담 프로그램 메가 메뉴 */}
                   {isCounselingDropdownOpen && (
                     <div
                       data-dropdown-menu="counseling"
                       className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                       onMouseEnter={() => setActiveMenu('counseling')}
                       onMouseLeave={() => setActiveMenu(null)}
                     >
                      <div 
                        className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900"
                       onWheel={(e) => {
                         e.stopPropagation();
                         const target = e.currentTarget;
                         const scrollTop = target.scrollTop;
                         const scrollHeight = target.scrollHeight;
                         const clientHeight = target.clientHeight;
                         
                         if ((scrollTop === 0 && e.deltaY < 0) || 
                             (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                           e.preventDefault();
                         }
                       }}
                       style={{
                         overscrollBehavior: 'contain',
                         scrollbarGutter: 'stable'
                       }}
                     >
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
                                 className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                 onClick={() => setActiveMenu(null)}
                               >
                                 <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                   {item.icon || '💭'}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                     <span className="font-medium text-white truncate">{item.name}</span>
                                     {'badge' in item && (item as any).badge && (
                                       <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                         (item as any).badge === '24시간' ? 'bg-red-500 text-white' :
                                         (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                                         'bg-orange-500 text-white'
                                       }`}>
                                         {(item as any).badge}
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

               {/* 상담사 메뉴 - 인증된 상담사만 표시 */}
               {shouldShowCounselorMenu(userEmail) && (
                 <div className="relative">
                   <Link
                     href="/counselor"
                     className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                       activeItem === "/counselor" || activeItem.startsWith("/counselor/")
                         ? "text-white bg-green-600"
                         : "text-gray-300 hover:text-white hover:bg-green-800/50"
                     }`}
                     onClick={(e) => handleNavLinkClick("/counselor", e)}
                     onMouseEnter={() => setActiveMenu('counselor')}
                     onMouseLeave={() => setActiveMenu(null)}
                   >
                     👨‍⚕️ 상담사
                     <svg
                       xmlns="http://www.w3.org/2000/svg"
                       viewBox="0 0 20 20"
                       fill="currentColor"
                       className={`w-4 h-4 ml-1 transition-transform duration-200 ${isCounselorMenuOpen ? "rotate-180" : ""}`}
                     >
                       <path
                         fillRule="evenodd"
                         d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                         clipRule="evenodd"
                       />
                     </svg>
                   </Link>

                   {/* 상담사 메가 메뉴 */}
                   {isCounselorMenuOpen && (
                     <div
                       data-dropdown-menu="counselor"
                       className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-green-900/95 to-emerald-900/95 rounded-2xl shadow-2xl border border-green-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                       onMouseEnter={() => setActiveMenu('counselor')}
                       onMouseLeave={() => setActiveMenu(null)}
                     >
                       <div className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-900">
                         {counselorMenuItems.map((category) => (
                           <div key={category.category} className="mb-4 last:mb-0">
                             <div className="px-2 py-1 text-xs font-bold text-green-300 uppercase tracking-wide mb-2">
                               {category.category}
                             </div>
                             <div className="space-y-1">
                               {category.items.map((item) => (
                                 <Link
                                   key={item.name}
                                   href={item.href}
                                   className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                   onClick={() => setActiveMenu(null)}
                                 >
                                   <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                     {item.icon || '👨‍⚕️'}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <div className="flex items-center gap-2">
                                       <span className="font-medium text-white truncate">{item.name}</span>
                                       {'badge' in item && (item as any).badge && (
                                         <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                           (item as any).badge === '24시간' ? 'bg-red-500 text-white' :
                                           (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                                           'bg-orange-500 text-white'
                                         }`}>
                                           {(item as any).badge}
                                         </span>
                                       )}
                                     </div>
                                     <div className="text-xs text-green-300 truncate">{item.description}</div>
                                   </div>
                                   <svg 
                                     className="w-4 h-4 text-green-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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
               
               {/* AI 마음 비서 드롭다운 메뉴 */}
               <div className="relative">
                                   <Link
                    href="/ai-mind-assistant"
                    className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                      activeItem === "/ai-mind-assistant" || activeItem.startsWith("/ai-mind-assistant/")
                        ? "text-white bg-blue-600"
                        : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                    }`}
                    onClick={(e) => handleNavLinkClick("/ai-mind-assistant", e)}
                    onMouseEnter={() => setActiveMenu('ai-mind-assistant')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    🤖 나의 AI 비서
                   <svg
                     xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 20 20"
                     fill="currentColor"
                     className={`w-4 h-4 ml-1 transition-transform duration-200 ${isAiMindAssistantOpen ? "rotate-180" : ""}`}
                   >
                     <path
                       fillRule="evenodd"
                       d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                       clipRule="evenodd"
                     />
                   </svg>
                 </Link>

                                   {/* AI 마음 비서 메가 메뉴 */}
                  {isAiMindAssistantOpen && (
                    <div
                      data-dropdown-menu="ai-mind-assistant"
                      className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                      onMouseEnter={() => setActiveMenu('ai-mind-assistant')}
                      onMouseLeave={() => setActiveMenu(null)}
                    >
                     <div className="relative">
                       {/* 상단 화살표 가이드 */}
                       <div
                         className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                         style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                         ref={(el) => {
                           if (el) {
                             const checkScroll = () => {
                               const scrollableDiv = el.parentElement?.querySelector('.ai-mind-scrollable') as HTMLElement;
                               if (scrollableDiv) {
                                 const shouldShow = scrollableDiv.scrollTop > 0;
                                 el.style.opacity = shouldShow ? '1' : '0';
                               }
                             };
                             
                             const scrollableDiv = el.parentElement?.querySelector('.ai-mind-scrollable') as HTMLElement;
                             if (scrollableDiv) {
                               scrollableDiv.addEventListener('scroll', checkScroll);
                               checkScroll();
                               
                               return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                             }
                           }
                         }}
                       >
                         <div className="bg-gradient-to-b from-blue-600/90 to-blue-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-blue-400/50">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                           </svg>
                         </div>
                       </div>

                       {/* 하단 화살표 가이드 */}
                       <div
                         className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                         style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                         ref={(el) => {
                           if (el) {
                             const checkScroll = () => {
                               const scrollableDiv = el.parentElement?.querySelector('.ai-mind-scrollable') as HTMLElement;
                               if (scrollableDiv) {
                                 const shouldShow = scrollableDiv.scrollTop + scrollableDiv.clientHeight < scrollableDiv.scrollHeight;
                                 el.style.opacity = shouldShow ? '1' : '0';
                               }
                             };
                             
                             const scrollableDiv = el.parentElement?.querySelector('.ai-mind-scrollable') as HTMLElement;
                             if (scrollableDiv) {
                               scrollableDiv.addEventListener('scroll', checkScroll);
                               checkScroll();
                               
                               return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                             }
                           }
                         }}
                       >
                         <div className="bg-gradient-to-b from-blue-600/90 to-blue-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-blue-400/50">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                         </div>
                       </div>

                       {/* 스크롤 가능한 콘텐츠 */}
                       <div 
                         className="ai-mind-scrollable px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto auto-scroll-dropdown"
                         onWheel={(e) => {
                           e.stopPropagation();
                           const target = e.currentTarget;
                           const scrollTop = target.scrollTop;
                           const scrollHeight = target.scrollHeight;
                           const clientHeight = target.clientHeight;
                           
                           if ((scrollTop === 0 && e.deltaY < 0) || 
                               (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                             e.preventDefault();
                           }
                         }}
                         onMouseMove={(e) => {
                           const target = e.currentTarget;
                           const rect = target.getBoundingClientRect();
                           const mouseY = e.clientY - rect.top;
                           const height = rect.height;
                           
                           // 상단 20% 영역에서 자동 스크롤 다운
                           if (mouseY < height * 0.2) {
                             target.scrollTo({
                               top: target.scrollTop - 30,
                               behavior: 'smooth'
                             });
                           }
                           // 하단 20% 영역에서 자동 스크롤 업
                           else if (mouseY > height * 0.8) {
                             target.scrollTo({
                               top: target.scrollTop + 30,
                               behavior: 'smooth'
                             });
                           }
                         }}
                         style={{
                           overscrollBehavior: 'contain',
                           scrollbarGutter: 'stable'
                         }}
                       >
                         {aiMindAssistantSubMenuItems.map((category) => (
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
                                     {item.icon || '🤖'}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <div className="flex items-center gap-2">
                                       <span className="font-medium text-white truncate">{item.name}</span>
                                       {'badge' in item && (item as any).badge && (
                                         <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                           (item as any).badge === '긴급' ? 'bg-red-500 text-white' :
                                           (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                                           'bg-orange-500 text-white'
                                         }`}>
                                           {(item as any).badge}
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
                   </div>
                 )}
               </div>
               
               {/* 추가 기능 드롭다운 메뉴 */}
               <div className="relative">
                                   <Link
                    href="/features"
                    className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                      activeItem === "/features" || activeItem.startsWith("/features/")
                        ? "text-white bg-blue-600"
                        : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                    }`}
                    onClick={(e) => handleNavLinkClick("/features", e)}
                    onMouseEnter={() => setActiveMenu('additional')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    📚 나의 자료실
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
                 </Link>

                                   {/* 추가 기능 메가 메뉴 */}
                  {isUserMenuOpen && (
                    <div
                      data-dropdown-menu="additional"
                      className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-green-900/95 to-emerald-900/95 rounded-2xl shadow-2xl border border-green-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                      onMouseEnter={() => setActiveMenu('additional')}
                      onMouseLeave={() => setActiveMenu(null)}
                    >
                     <div 
                       className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-900"
                       onWheel={(e) => {
                         e.stopPropagation();
                         const target = e.currentTarget;
                         const scrollTop = target.scrollTop;
                         const scrollHeight = target.scrollHeight;
                         const clientHeight = target.clientHeight;
                         
                         if ((scrollTop === 0 && e.deltaY < 0) || 
                             (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                           e.preventDefault();
                         }
                       }}
                       style={{
                         overscrollBehavior: 'contain',
                         scrollbarGutter: 'stable'
                       }}
                     >
                       {personalFeaturesMenu.map((category) => (
                         <div key={category.category} className="mb-4 last:mb-0">
                           <div className="px-2 py-1 text-xs font-bold text-green-300 uppercase tracking-wide mb-2">
                             {category.category}
                           </div>
                           <div className="space-y-1">
                             {category.items.map((item) => (
                               <Link
                                 key={item.name}
                                 href={item.href}
                                 className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                 onClick={() => setActiveMenu(null)}
                               >
                                 <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                   {item.icon || '⚡'}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                     <span className="font-medium text-white truncate">{item.name}</span>
                                     {'badge' in item && (item as any).badge && (
                                       <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                         (item as any).badge === '인기' ? 'bg-red-500 text-white' :
                                         (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                                         'bg-orange-500 text-white'
                                       }`}>
                                         {(item as any).badge}
                                       </span>
                                     )}
                                   </div>
                                   <div className="text-xs text-green-300 truncate">{item.description}</div>
                                 </div>
                                 <svg 
                                   className="w-4 h-4 text-green-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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
               
               {/* 마이페이지 메가 메뉴 및 사용자 인증 */}
               <div className="flex items-center space-x-2">
                 {isLoggedIn ? (
                   <>
                     {/* 관리자 메뉴 - 관리자만 표시 */}
                     {shouldShowAdminMenu(userEmail) && (
                       <div className="relative">
                         <Link
                           href="/admin"
                           className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                             activeItem === "/admin" || activeItem.startsWith("/admin/")
                               ? "text-white bg-red-600"
                               : "text-gray-300 hover:text-white hover:bg-red-800/50"
                           }`}
                           onClick={(e) => handleNavLinkClick("/admin", e)}
                           onMouseEnter={() => setActiveMenu('admin')}
                           onMouseLeave={() => setActiveMenu(null)}
                         >
                           🔧 관리자
                           <svg
                             xmlns="http://www.w3.org/2000/svg"
                             viewBox="0 0 20 20"
                             fill="currentColor"
                             className={`w-4 h-4 ml-1 transition-transform duration-200 ${isAdminMenuOpen ? "rotate-180" : ""}`}
                           >
                             <path
                               fillRule="evenodd"
                               d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                               clipRule="evenodd"
                             />
                           </svg>
                         </Link>

                         {/* 관리자 메가 메뉴 */}
                         {isAdminMenuOpen && (
                           <div
                             data-dropdown-menu="admin"
                             className="absolute right-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-red-900/95 to-pink-900/95 rounded-2xl shadow-2xl border border-red-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                             onMouseEnter={() => setActiveMenu('admin')}
                             onMouseLeave={() => setActiveMenu(null)}
                           >
                             <div className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-red-900">
                               {adminMenuItems.map((category) => (
                                 <div key={category.category} className="mb-4 last:mb-0">
                                   <div className="px-2 py-1 text-xs font-bold text-red-300 uppercase tracking-wide mb-2">
                                     {category.category}
                                   </div>
                                   <div className="space-y-1">
                                     {category.items.map((item) => (
                                       <Link
                                         key={item.name}
                                         href={item.href}
                                         className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                         onClick={() => setActiveMenu(null)}
                                       >
                                         <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                           {item.icon || '🔧'}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                           <div className="flex items-center gap-2">
                                             <span className="font-medium text-white truncate">{item.name}</span>
                                             {'badge' in item && (item as any).badge && (
                                               <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                                 (item as any).badge === '24시간' ? 'bg-red-500 text-white' :
                                                 (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                                                 'bg-orange-500 text-white'
                                               }`}>
                                                 {(item as any).badge}
                                               </span>
                                             )}
                                           </div>
                                           <div className="text-xs text-red-300 truncate">{item.description}</div>
                                         </div>
                                         <svg 
                                           className="w-4 h-4 text-red-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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

                     {/* 마이페이지 드롭다운 메뉴 */}
                     <div className="relative">
                       <Link
                         href="/mypage"
                         className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                           activeItem === "/mypage" || activeItem.startsWith("/mypage/")
                             ? "text-white bg-blue-600"
                             : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                         }`}
                         onClick={(e) => handleNavLinkClick("/mypage", e)}
                         onMouseEnter={() => setActiveMenu('user')}
                         onMouseLeave={() => setActiveMenu(null)}
                       >
                         👤 마이페이지
                         <svg
                           xmlns="http://www.w3.org/2000/svg"
                           viewBox="0 0 20 20"
                           fill="currentColor"
                           className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                         >
                           <path
                             fillRule="evenodd"
                             d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                             clipRule="evenodd"
                           />
                         </svg>
                       </Link>

                                                                                               {/* 마이페이지 메가 메뉴 */}
                         {isDropdownOpen && (
                           <div
                             data-dropdown-menu="user"
                             className="absolute right-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-green-900/95 to-emerald-900/95 rounded-2xl shadow-2xl border border-green-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                             onMouseEnter={() => setActiveMenu('user')}
                             onMouseLeave={() => setActiveMenu(null)}
                           >
                           <div className="relative">
                             {/* 상단 화살표 가이드 */}
                             <div
                               className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                               style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                               ref={(el) => {
                                 if (el) {
                                   const checkScroll = () => {
                                     const scrollableDiv = el.parentElement?.querySelector('.mypage-scrollable') as HTMLElement;
                                     if (scrollableDiv) {
                                       const shouldShow = scrollableDiv.scrollTop > 0;
                                       el.style.opacity = shouldShow ? '1' : '0';
                                     }
                                   };
                                   
                                   const scrollableDiv = el.parentElement?.querySelector('.mypage-scrollable') as HTMLElement;
                                   if (scrollableDiv) {
                                     scrollableDiv.addEventListener('scroll', checkScroll);
                                     checkScroll();
                                     
                                     return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                                   }
                                 }
                               }}
                             >
                               <div className="bg-gradient-to-b from-green-600/90 to-green-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-green-400/50">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                 </svg>
                               </div>
                             </div>

                             {/* 하단 화살표 가이드 */}
                             <div
                               className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                               style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                               ref={(el) => {
                                 if (el) {
                                   const checkScroll = () => {
                                     const scrollableDiv = el.parentElement?.querySelector('.mypage-scrollable') as HTMLElement;
                                     if (scrollableDiv) {
                                       const shouldShow = scrollableDiv.scrollTop + scrollableDiv.clientHeight < scrollableDiv.scrollHeight;
                                       el.style.opacity = shouldShow ? '1' : '0';
                                     }
                                   };
                                   
                                   const scrollableDiv = el.parentElement?.querySelector('.mypage-scrollable') as HTMLElement;
                                   if (scrollableDiv) {
                                     scrollableDiv.addEventListener('scroll', checkScroll);
                                     checkScroll();
                                     
                                     return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                                   }
                                 }
                               }}
                             >
                               <div className="bg-gradient-to-b from-green-600/90 to-green-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-green-400/50">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                 </svg>
                               </div>
                             </div>

                             {/* 스크롤 가능한 콘텐츠 */}
                             <div 
                               className="mypage-scrollable px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto auto-scroll-dropdown"
                               onWheel={(e) => {
                                 e.stopPropagation();
                                 const target = e.currentTarget;
                                 const scrollTop = target.scrollTop;
                                 const scrollHeight = target.scrollHeight;
                                 const clientHeight = target.clientHeight;
                                 
                                 if ((scrollTop === 0 && e.deltaY < 0) || 
                                     (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                                   e.preventDefault();
                                 }
                               }}
                               onMouseMove={(e) => {
                                 const target = e.currentTarget;
                                 const rect = target.getBoundingClientRect();
                                 const mouseY = e.clientY - rect.top;
                                 const height = rect.height;
                                 
                                 // 상단 20% 영역에서 자동 스크롤 다운
                                 if (mouseY < height * 0.2) {
                                   target.scrollTo({
                                     top: target.scrollTop - 30,
                                     behavior: 'smooth'
                                   });
                                 }
                                 // 하단 20% 영역에서 자동 스크롤 업
                                 else if (mouseY > height * 0.8) {
                                   target.scrollTo({
                                     top: target.scrollTop + 30,
                                     behavior: 'smooth'
                                   });
                                 }
                               }}
                               style={{
                                 overscrollBehavior: 'contain',
                                 scrollbarGutter: 'stable'
                               }}
                             >
                                                               {/* 사용자 정보 헤더 */}
                                <div className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                      {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-white">{userName || '사용자'}</div>
                                      <div className="text-sm text-green-300">{userEmail}</div>
                                      <div className="text-xs text-green-400 capitalize">{userRole}</div>
                                    </div>
                                  </div>
                                </div>

                               {/* 마이페이지 메뉴 아이템들 */}
                               <div className="space-y-1">
                                 {[
                                   { name: "검사 기록", href: "/mypage?tab=records", description: "나의 심리검사 결과 확인", icon: "📊" },
                                   { name: "기본 정보", href: "/mypage?tab=profile", description: "프로필 정보 수정", icon: "👤" },
                                   { name: "상담 예약", href: "/mypage/counseling", description: "전문가 상담 예약", icon: "💬" },
                                   { name: "삭제된 코드", href: "/mypage/deleted-codes", description: "삭제된 테스트 코드 복구", icon: "📋" },
                                   { name: "설정", href: "/mypage/settings", description: "계정 및 알림 설정", icon: "⚙️" }
                                 ].map((item) => (
                                   <Link
                                     key={item.name}
                                     href={item.href}
                                     className="group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20"
                                     onClick={() => setActiveMenu(null)}
                                   >
                                     <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                       {item.icon}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <div className="font-medium text-white truncate">{item.name}</div>
                                       <div className="text-xs text-green-300 truncate">{item.description}</div>
                                     </div>
                                     <svg 
                                       className="w-4 h-4 text-green-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                                       fill="none" 
                                       stroke="currentColor" 
                                       viewBox="0 0 24 24"
                                     >
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                     </svg>
                                   </Link>
                                 ))}


                                                                   {/* 로그아웃 버튼 */}
                                  <div className="mt-4 pt-4 border-t border-green-500/30">
                                   <button
                                     onClick={handleLogout}
                                     className="w-full group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl hover:bg-gradient-to-r hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 border border-transparent hover:border-red-500/30 text-left"
                                   >
                                     <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                       🚪
                                     </div>
                                     <div className="flex-1">
                                       <div className="font-medium text-white">로그아웃</div>
                                       <div className="text-xs text-red-300">안전하게 로그아웃</div>
                                     </div>
                                     <svg 
                                       className="w-4 h-4 text-red-300 group-hover:text-white transition-all duration-300"
                                       fill="none" 
                                       stroke="currentColor" 
                                       viewBox="0 0 24 24"
                                     >
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                     </svg>
                                   </button>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   </>
                 ) : (
                   <>
                     {/* 로그인/회원가입 버튼 */}
                     <Link
                       href="/login"
                       className="px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 text-gray-300 hover:text-white hover:bg-blue-800/50"
                       onClick={(e) => handleAuthLinkClick("/login", e)}
                     >
                       🔑 로그인
                     </Link>
                     <Link
                       href="/register"
                       className="px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700"
                       onClick={(e) => handleAuthLinkClick("/register", e)}
                     >
                       ✨ 회원가입
                     </Link>
                   </>
                 )}
               </div>
             </div>
           </div>
         </div>

         {/* 모바일 메뉴 버튼 */}
         <div className="md:hidden">
           <button
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="p-2 text-gray-300 hover:text-white hover:bg-blue-800/50 rounded-lg transition-all duration-300"
           >
             <svg
               className="w-6 h-6"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
             >
               {isMobileMenuOpen ? (
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={2}
                   d="M6 18L18 6M6 6l12 12"
                 />
               ) : (
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={2}
                   d="M4 6h16M4 12h16M4 18h16"
                 />
               )}
             </svg>
           </button>
         </div>
       </nav>

       {/* 모바일 메뉴 오버레이 */}
       {isMobileMenuOpen && (
         <>
           {/* 배경 오버레이 */}
           <div 
             className="fixed inset-0 bg-black/50 z-40 md:hidden"
             onClick={() => setIsMobileMenuOpen(false)}
           />
           
           {/* 모바일 메뉴 */}
           <div className="fixed inset-x-0 top-16 z-50 md:hidden bg-gradient-to-b from-indigo-900 to-indigo-800 border-b border-white/20 shadow-2xl">
             <div className="px-6 py-4 space-y-2 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900">

               {/* 심리검사 */}
               <div className="space-y-2">
                 <div className="px-4 py-2 text-sm font-semibold text-blue-300 uppercase tracking-wide">
                   🧠 심리검사
                 </div>
                 {testSubMenuItems.map((category) => (
                   <div key={category.category} className="ml-4 space-y-1">
                     <div className="px-2 py-1 text-xs font-medium text-blue-400 uppercase tracking-wide">
                       {category.category}
                     </div>
                     {category.items.map((item) => (
                       <Link
                         key={item.name}
                         href={item.href}
                         className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                         onClick={() => setIsMobileMenuOpen(false)}
                       >
                         <div className="flex items-center gap-2">
                           <span>{item.icon}</span>
                           <span>{item.name}</span>
                           {'badge' in item && (item as any).badge && (
                             <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                               (item as any).badge === '인기' ? 'bg-red-500 text-white' :
                               (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                               'bg-orange-500 text-white'
                             }`}>
                               {(item as any).badge}
                             </span>
                           )}
                         </div>
                         <div className="text-xs text-blue-300 ml-6 mt-1">{item.description}</div>
                       </Link>
                     ))}
                   </div>
                 ))}
               </div>

               {/* 상담 프로그램 */}
               <div className="space-y-2">
                 <div className="px-4 py-2 text-sm font-semibold text-purple-300 uppercase tracking-wide">
                   💬 상담 프로그램
                 </div>
                 {counselingMenuItems.map((category) => (
                   <div key={category.category} className="ml-4 space-y-1">
                     <div className="px-2 py-1 text-xs font-medium text-purple-400 uppercase tracking-wide">
                       {category.category}
                     </div>
                     {category.items.map((item) => (
                       <Link
                         key={item.name}
                         href={item.href}
                         className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-purple-800/30 rounded-lg transition-all duration-300"
                         onClick={() => setIsMobileMenuOpen(false)}
                       >
                         <div className="flex items-center gap-2">
                           <span>{item.icon}</span>
                           <span>{item.name}</span>
                           {'badge' in item && (item as any).badge && (
                             <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                               (item as any).badge === '24시간' ? 'bg-red-500 text-white' :
                               (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                               'bg-orange-500 text-white'
                             }`}>
                               {(item as any).badge}
                             </span>
                           )}
                         </div>
                         <div className="text-xs text-purple-300 ml-6 mt-1">{item.description}</div>
                       </Link>
                     ))}
                   </div>
                 ))}
               </div>

               {/* AI 마음 비서 */}
               <div className="space-y-2">
                                   <div className="px-4 py-2 text-sm font-semibold text-blue-300 uppercase tracking-wide">
                    🤖 나의 AI 비서
                  </div>
                 {aiMindAssistantSubMenuItems.map((category) => (
                   <div key={category.category} className="ml-4 space-y-1">
                     <div className="px-2 py-1 text-xs font-medium text-blue-400 uppercase tracking-wide">
                       {category.category}
                     </div>
                     {category.items.map((item) => (
                       <Link
                         key={item.name}
                         href={item.href}
                         className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                         onClick={() => setIsMobileMenuOpen(false)}
                       >
                         <div className="flex items-center gap-2">
                           <span>{item.icon}</span>
                           <span>{item.name}</span>
                           {'badge' in item && (item as any).badge && (
                             <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                               (item as any).badge === '긴급' ? 'bg-red-500 text-white' :
                               (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                               'bg-orange-500 text-white'
                             }`}>
                               {(item as any).badge}
                             </span>
                           )}
                         </div>
                         <div className="text-xs text-blue-300 ml-6 mt-1">{item.description}</div>
                       </Link>
                     ))}
                   </div>
                 ))}
               </div>

               {/* 추가 기능 */}
               <div className="space-y-2">
                                   <div className="px-4 py-2 text-sm font-semibold text-green-300 uppercase tracking-wide">
                    📚 나의 자료실
                  </div>
                 {personalFeaturesMenu.map((category) => (
                   <div key={category.category} className="ml-4 space-y-1">
                     <div className="px-2 py-1 text-xs font-medium text-green-400 uppercase tracking-wide">
                       {category.category}
                     </div>
                     {category.items.map((item) => (
                       <Link
                         key={item.name}
                         href={item.href}
                         className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-green-800/30 rounded-lg transition-all duration-300"
                         onClick={() => setIsMobileMenuOpen(false)}
                       >
                         <div className="flex items-center gap-2">
                           <span>{item.icon}</span>
                           <span>{item.name}</span>
                         </div>
                         <div className="text-xs text-green-300 ml-6 mt-1">{item.description}</div>
                       </Link>
                     ))}
                   </div>
                 ))}
               </div>

               {/* 사용자 메뉴 */}
               {isLoggedIn ? (
                 <div className="space-y-2 pt-4 border-t border-white/20">
                   <div className="px-4 py-2 text-sm font-semibold text-indigo-300 uppercase tracking-wide">
                     👤 마이페이지
                   </div>
                   <Link
                     href="/mypage"
                     className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-indigo-800/30 rounded-lg transition-all duration-300"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     📊 검사 기록
                   </Link>
                   <Link
                     href="/mypage?tab=profile"
                     className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-indigo-800/30 rounded-lg transition-all duration-300"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     👤 기본 정보
                   </Link>
                   <Link
                     href="/mypage/counseling"
                     className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-indigo-800/30 rounded-lg transition-all duration-300"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     💬 상담 예약
                   </Link>
                   <button
                     onClick={() => {
                       setIsMobileMenuOpen(false);
                       handleLogout();
                     }}
                     className="w-full text-left px-4 py-2 text-sm text-red-300 hover:text-red-100 hover:bg-red-800/30 rounded-lg transition-all duration-300"
                   >
                     🚪 로그아웃
                   </button>
                 </div>
               ) : (
                 <div className="space-y-2 pt-4 border-t border-white/20">
                   <Link
                     href="/login"
                     className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     🔑 로그인
                   </Link>
                   <Link
                     href="/register"
                     className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     ✨ 회원가입
                   </Link>
                 </div>
               )}
             </div>
           </div>
         </>
       )}
     </>
   );
 }
